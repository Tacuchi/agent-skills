#!/usr/bin/env node
import { statSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { gh, lastGoodBefore, confirmToken } from './lib/gh.mjs';
import { parseYaml } from './lib/yaml.mjs';
import { kindOf, triggersOf } from './lib/workflows.mjs';

const USAGE = 'usage: node ops.mjs <status|deploy|rollback> --repo <path> [--json] [--ref <branch-or-tag>] [--run <id>] [--confirm <token>]';
const RUN_FIELDS = 'databaseId,workflowDatabaseId,workflowName,headSha,status,conclusion,createdAt,updatedAt,url,event,attempt';
class ExitError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
function invalid(expected, actual) { throw new ExitError(2, `expected ${expected}, got ${actual}`); }

function parseArgs(argv) {
  const [action, ...rest] = argv;
  if (!['status', 'deploy', 'rollback'].includes(action)) invalid(`status, deploy or rollback; ${USAGE}`, JSON.stringify(action ?? null));
  const options = { action, json: false };
  for (let index = 0; index < rest.length; index++) {
    const flag = rest[index];
    if (flag === '--json') { options.json = true; continue; }
    if (!['--repo', '--ref', '--run', '--confirm'].includes(flag)) invalid(`a supported option; ${USAGE}`, JSON.stringify(flag));
    const key = flag.slice(2);
    if (options[key] !== undefined) invalid(`one ${flag} value`, 'a duplicate');
    const value = rest[++index];
    if (!value || value.startsWith('--')) invalid(`a value after ${flag}`, JSON.stringify(value ?? null));
    options[key] = value;
  }
  if (!options.repo) invalid('--repo <existing directory>', 'no --repo');
  options.repo = resolve(options.repo);
  let directory = false;
  try { directory = statSync(options.repo).isDirectory(); }
  catch (error) { invalid('an existing repository directory', `${options.repo}: ${error.code}`); }
  if (!directory) invalid('a repository directory', options.repo);
  const allowed = action === 'status' ? [] : action === 'deploy' ? ['ref', 'confirm'] : ['run', 'confirm'];
  for (const key of ['ref', 'run', 'confirm']) if (options[key] !== undefined && !allowed.includes(key)) invalid(`options for ${action}; ${USAGE}`, `--${key}`);
  if (options.run && !/^[1-9]\d*$/.test(options.run)) invalid('--run <positive run ID>', JSON.stringify(options.run));
  if (options.ref && /^[a-f0-9]{7,40}$/i.test(options.ref)) invalid('--ref <branch or tag>; use rollback --run <id> for an older commit', JSON.stringify(options.ref));
  return options;
}

function client(cwd) {
  const execute = async (args) => {
    const result = await gh(args, { cwd, env: { ...process.env, GH_REPO: '' } });
    if (!result.ok) throw new ExitError(2, result.message);
    return result.stdout;
  };
  return { execute, async json(args) {
    const text = await execute(args);
    try { return JSON.parse(text); }
    catch { invalid(`JSON from gh ${args.slice(0, 2).join(' ')}`, JSON.stringify(text.slice(0, 200))); }
  } };
}

async function repositoryInfo(api) {
  const info = await api.json(['repo', 'view', '--json', 'nameWithOwner,defaultBranchRef']);
  if (!/^[\w.-]+\/[\w.-]+$/.test(info?.nameWithOwner) || typeof info?.defaultBranchRef?.name !== 'string') {
    invalid('repository JSON with nameWithOwner and defaultBranchRef.name', JSON.stringify(info));
  }
  return info;
}

async function remoteSha(api, repo, ref) {
  const sha = (await api.execute(['api', `repos/${repo}/commits/${encodeURIComponent(ref)}`, '--jq', '.sha'])).trim();
  if (!/^[a-f0-9]{40}$/i.test(sha)) invalid(`a 40-character commit hash for ${ref}`, JSON.stringify(sha));
  return sha;
}

async function workflowData(api, repo, path, ref) {
  const content = (await api.execute(['api', `repos/${repo}/contents/${path}?ref=${encodeURIComponent(ref)}`, '--jq', '.content'])).trim();
  if (!content || !/^[A-Za-z0-9+/=\s]+$/.test(content)) invalid(`base64 workflow content for ${path}`, JSON.stringify(content.slice(0, 80)));
  try {
    const data = parseYaml(Buffer.from(content, 'base64').toString('utf8'));
    if (!data || typeof data !== 'object' || Array.isArray(data)) invalid(`a workflow map in ${path}`, JSON.stringify(data));
    return data;
  } catch (error) {
    throw new ExitError(2, `expected readable YAML in ${path}, got ${error.message}${error.line ? ` at line ${error.line}` : ''}`);
  }
}

async function deploymentWorkflows(api, repo, ref) {
  const list = await api.json(['workflow', 'list', '--repo', repo, '--json', 'id,name,path,state']);
  if (!Array.isArray(list)) invalid('an array of workflows', JSON.stringify(list));
  const deployments = [];
  for (const item of list) {
    if (!Number.isSafeInteger(item.id) || !/^\.github\/workflows\/[^/]+\.ya?ml$/.test(item.path)) invalid('workflow entries with an ID and a workflow YAML path', JSON.stringify(item));
    const data = await workflowData(api, repo, item.path, ref);
    if (kindOf(data) === 'deploy') deployments.push({ ...item, data });
  }
  return deployments;
}

function validateRun(run) {
  if (!run || !Number.isSafeInteger(run.databaseId) || !Number.isSafeInteger(run.workflowDatabaseId) || !Number.isSafeInteger(run.attempt)
    || typeof run.workflowName !== 'string' || !/^[a-f0-9]{40}$/i.test(run.headSha)
    || typeof run.status !== 'string' || typeof run.conclusion !== 'string'
    || !Number.isFinite(Date.parse(run.createdAt)) || !Number.isFinite(Date.parse(run.updatedAt))
    || !/^https:\/\/[^/]+\/[^/]+\/[^/]+\/actions\/runs\/\d+$/.test(run.url)) {
    invalid('run JSON with ID, workflow ID/name, attempt, commit, status, conclusion, timestamps and URL', JSON.stringify(run));
  }
  return run;
}

async function listRuns(api, repo) {
  const runs = await api.json(['run', 'list', '--repo', repo, '--limit', '100', '--json', RUN_FIELDS]);
  if (!Array.isArray(runs)) invalid('an array of runs', JSON.stringify(runs));
  return runs.map(validateRun);
}

function deployedRun(runs, workflows) {
  const ids = new Set(workflows.map((workflow) => workflow.id));
  return runs.filter((run) => ids.has(run.workflowDatabaseId) && run.conclusion === 'success')
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0] ?? null;
}

async function failedStep(api, repo, runs) {
  const run = runs.filter((item) => item.conclusion === 'failure').sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0];
  if (!run) return null;
  const result = await api.json(['run', 'view', String(run.databaseId), '--repo', repo, '--json', 'jobs']);
  if (!Array.isArray(result?.jobs)) invalid('run JSON with a jobs array', JSON.stringify(result));
  const job = result.jobs.find((item) => item.conclusion === 'failure');
  const step = job?.steps?.find((item) => item.conclusion === 'failure');
  const logs = await api.execute(['run', 'view', String(run.databaseId), '--repo', repo, '--log-failed']);
  const excerpt = logs.split('\n').filter((line) => {
    const fields = line.split('\t');
    return fields[0] === job?.name && fields[1] === step?.name;
  }).map((line) => line.split('\t').slice(2).join('\t')).slice(-12).join('\n').slice(-3000);
  return { run: run.databaseId, job: job?.name ?? null, step: step?.name ?? null, excerpt };
}

async function status(api, info) {
  const repo = info.nameWithOwner;
  const runs = await listRuns(api, repo);
  const workflows = await deploymentWorkflows(api, repo, info.defaultBranchRef.name);
  const deployed = deployedRun(runs, workflows);
  return { runs: runs.map((run) => ({ id: run.databaseId, workflow: run.workflowName, sha: run.headSha,
    status: run.status, conclusion: run.conclusion, created: run.createdAt, url: run.url })),
    deployed: deployed ? { sha: deployed.headSha, run: deployed.databaseId } : null,
    failed: await failedStep(api, repo, runs) };
}

function restartNames(data) {
  return Object.entries(data.jobs ?? {}).flatMap(([name, job]) => {
    const steps = (job.steps ?? []).filter((step) => /deploy|restart/i.test(`${step.name ?? ''} ${step.run ?? ''} ${step.uses ?? ''}`));
    return steps.map((step) => step.name ?? job.name ?? name);
  });
}

async function makePlan(api, options, info) {
  const repo = info.nameWithOwner;
  const ref = options.ref ?? info.defaultBranchRef.name;
  const sha = options.action === 'deploy' ? await remoteSha(api, repo, ref) : null;
  const workflows = await deploymentWorkflows(api, repo, sha ?? ref);
  if (workflows.length !== 1) invalid('one deployment workflow', `${workflows.length}; available: ${workflows.map((item) => item.path).join(', ') || 'none'}`);
  const workflow = workflows[0];
  if (options.action === 'deploy') {
    if (!triggersOf(workflow.data).workflow_dispatch) invalid(`workflow_dispatch in ${workflow.path}`, 'no manual trigger');
    return { action: 'deploy', repo, workflow: workflow.path, ref, sha, restarts: restartNames(workflow.data) };
  }
  const runs = await listRuns(api, repo);
  const deployed = deployedRun(runs, workflows);
  const target = options.run ? runs.find((run) => String(run.databaseId) === options.run)
    ?? validateRun(await api.json(['run', 'view', options.run, '--repo', repo, '--json', RUN_FIELDS]))
    : deployed ? lastGoodBefore(runs, deployed.databaseId) : null;
  if (!target) invalid('an earlier successful deployment run in the recent history', 'none; use --run <id> to select a known run');
  if (target.workflowDatabaseId !== workflow.id || target.conclusion !== 'success') invalid(`a successful run of ${workflow.path}`, `run ${target.databaseId} of workflow ${target.workflowDatabaseId} with conclusion ${target.conclusion}`);
  const data = await workflowData(api, repo, workflow.path, target.headSha);
  return { action: 'rollback', repo, workflow: workflow.path, sha: target.headSha, run: target.databaseId, restarts: restartNames(data) };
}

async function findDispatched(api, plan, before, output) {
  const id = output.match(/https:\/\/[^\s]+\/actions\/runs\/(\d+)/)?.[1];
  if (id) return validateRun(await api.json(['run', 'view', id, '--repo', plan.repo, '--json', RUN_FIELDS]));
  const known = new Set(before.map((run) => run.databaseId));
  for (let attempt = 0; attempt < 20; attempt++) {
    const runs = await listRuns(api, plan.repo);
    const candidates = runs.filter((run) => !known.has(run.databaseId) && run.event === 'workflow_dispatch');
    // Match the workflow by its path through its registered ID, never just a shared commit.
    const workflows = await api.json(['workflow', 'list', '--repo', plan.repo, '--json', 'id,name,path,state']);
    if (!Array.isArray(workflows)) invalid('an array of workflows after dispatch', JSON.stringify(workflows));
    const workflowId = workflows.find((item) => item.path === plan.workflow)?.id;
    const matching = candidates.filter((run) => run.workflowDatabaseId === workflowId);
    if (matching.length > 1) invalid('one new manual workflow run', `${matching.length}: ${matching.map((run) => run.url).join(', ')}`);
    if (matching.length === 1) return matching[0];
    await delay(1000);
  }
  invalid(`a new manual run of ${plan.workflow} after dispatch`, 'none within 20 checks');
}

async function executePlan(api, plan) {
  let run;
  if (plan.action === 'deploy') {
    const before = await listRuns(api, plan.repo);
    const current = await remoteSha(api, plan.repo, plan.ref);
    if (current !== plan.sha) invalid(`the confirmed commit ${plan.sha} for ${plan.ref}`, `stale remote head ${current}; request a new plan`);
    const output = await api.execute(['workflow', 'run', plan.workflow, '--repo', plan.repo, '--ref', plan.ref]);
    run = await findDispatched(api, plan, before, output);
  } else {
    const previous = validateRun(await api.json(['run', 'view', String(plan.run), '--repo', plan.repo, '--json', RUN_FIELDS]));
    await api.execute(['run', 'rerun', String(plan.run), '--repo', plan.repo]);
    run = await waitForAttempt(api, plan, previous.attempt);
  }
  if (run.headSha !== plan.sha) throw new ExitError(1, `expected dispatched commit ${plan.sha}, got ${run.headSha}; inspect ${run.url}`);
  await api.execute(['run', 'watch', String(run.databaseId), '--repo', plan.repo]);
  const finished = validateRun(await api.json(['run', 'view', String(run.databaseId), '--repo', plan.repo, '--json', RUN_FIELDS]));
  if (finished.headSha !== plan.sha || finished.databaseId !== run.databaseId || finished.attempt < run.attempt) {
    throw new ExitError(1, `expected commit ${plan.sha}, run ${run.databaseId} and attempt ${run.attempt}, got commit ${finished.headSha}, run ${finished.databaseId} and attempt ${finished.attempt}; inspect ${finished.url}`);
  }
  if (finished.status !== 'completed') invalid('a completed run after watching', `${finished.status}: ${finished.url}`);
  return { plan, run: finished.databaseId, conclusion: finished.conclusion, url: finished.url };
}

async function waitForAttempt(api, plan, previous) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const run = validateRun(await api.json(['run', 'view', String(plan.run), '--repo', plan.repo, '--json', RUN_FIELDS]));
    if (run.attempt > previous) return run;
    await delay(1000);
  }
  invalid(`a new attempt of run ${plan.run} after attempt ${previous}`, 'none within 20 checks');
}

function print(result, json) {
  if (json) { process.stdout.write(JSON.stringify(result) + '\n'); return; }
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const api = client(options.repo);
  const info = await repositoryInfo(api);
  if (options.action === 'status') { print(await status(api, info), options.json); return 0; }
  const plan = await makePlan(api, options, info);
  const confirm = confirmToken(plan);
  if (!options.confirm) { print({ plan, confirm }, options.json); return 3; }
  if (options.confirm !== confirm) invalid('a confirmation token matching the current plan', 'a wrong or stale token that does not match; run without --confirm to request a new plan');
  const result = await executePlan(api, plan);
  print(result, options.json);
  return result.conclusion === 'success' ? 0 : 1;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().then((code) => { process.exitCode = code; }).catch((error) => {
    process.stderr.write(`ops: ${error instanceof ExitError ? error.message : `expected a successful operation, got ${error.message}`}\n`);
    process.exitCode = error instanceof ExitError ? error.code : 2;
  });
}
