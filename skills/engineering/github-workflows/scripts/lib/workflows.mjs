import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseYaml, YamlUnreadable } from './yaml.mjs';

const listOf = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const jobsOf = (data) => Object.entries(data.jobs ?? {});
const stepsOf = (job) => job.steps ?? [];
const isMap = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const sourceLine = (workflow, pattern) => Math.max(1, workflow.text.split('\n').findIndex((line) => pattern.test(line)) + 1);

function validateWorkflow(data) {
  if (!isMap(data.jobs) || !['string', 'object'].includes(typeof data.on) || data.on === null) throw new YamlUnreadable(1, 'a workflow without an event and a jobs mapping');
  for (const [, job] of jobsOf(data)) {
    if (!isMap(job) || (job.steps !== undefined && (!Array.isArray(job.steps) || job.steps.some((step) => !isMap(step))))) throw new YamlUnreadable(1, 'a job without a mapping or a step without a mapping');
  }
  for (const event of Object.values(triggersOf(data))) {
    if (event === true) continue;
    for (const patterns of [event.branches, event.paths, event.pathsIgnore]) {
      if (patterns.some((pattern) => typeof pattern !== 'string')) throw new YamlUnreadable(1, 'a trigger filter without a list of strings');
    }
  }
}

export function readWorkflows(repo) {
  const directory = join(repo, '.github', 'workflows');
  let entries;
  try { entries = readdirSync(directory, { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  return entries.filter((entry) => /\.ya?ml$/i.test(entry.name)).sort((a, b) => a.name.localeCompare(b.name, 'en')).map((entry) => {
    const file = `.github/workflows/${entry.name}`;
    let text = '';
    try {
      text = readFileSync(join(repo, file), 'utf8');
      const data = parseYaml(text);
      validateWorkflow(data);
      return { file, text, data };
    } catch (error) {
      if (!(error instanceof YamlUnreadable) && !error.code) throw error;
      return { file, text, data: null, unreadable: { line: error.line ?? 1, message: error instanceof YamlUnreadable ? error.message : `Expected a readable workflow file; received filesystem error ${error.code}.` } };
    }
  });
}

export function triggersOf(data) {
  const events = typeof data.on === 'string' ? { [data.on]: null } : Array.isArray(data.on) ? Object.fromEntries(data.on.map((name) => [name, null])) : data.on ?? {};
  const result = {};
  for (const [name, config] of Object.entries(events)) {
    result[name] = ['push', 'pull_request', 'pull_request_target'].includes(name)
      ? { branches: listOf(config?.branches), paths: listOf(config?.paths), pathsIgnore: listOf(config?.['paths-ignore']) }
      : true;
  }
  return result;
}

function buildsImage(step) {
  return (/docker\/build-push-action@/.test(step.uses ?? '') && [true, 'true'].includes(step.with?.push)) || /\bdocker\s+(?:buildx\s+build[^\n]*--push|push)\b/.test(step.run ?? '');
}

function deploys(step) {
  return /(?:\bcurl\b[\s\S]*(?:\/deploy\b|\/redeploy\b)|\bkubectl\s+(?:apply|rollout)|\b(?:flyctl|fly|vercel|netlify|wrangler)\s+deploy\b|\bgh\s+workflow\s+run\b)/i.test(step.run ?? '') || /(?:deploy|ssh-action)@/.test(step.uses ?? '');
}

function tests(job, id = '') {
  return /(?:^|[-_ ])tests?(?:$|[-_ ])/.test(`${id} ${job.name ?? ''}`) || stepsOf(job).some((step) => /(?:\b(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?(?:test|lint|typecheck|check)\b|\b(?:pytest|shellcheck|eslint|ruff|mypy)\b|\bnode\s+--test\b|\b(?:go|cargo|dotnet)\s+test\b|\b(?:mvnw|gradlew)\b[^\n]*\btest\b)/.test(step.run ?? ''));
}

export function kindOf(data) {
  const triggers = triggersOf(data);
  if (triggers.release) return 'publish';
  if (jobsOf(data).some(([, job]) => stepsOf(job).some((step) => buildsImage(step) || (triggers.push && deploys(step))))) return 'deploy';
  if (jobsOf(data).some(([id, job]) => tests(job, id))) return 'tests';
  return 'other';
}

// Product traversal checks every possible path, including ordered negative patterns.
function globMachine(pattern) {
  const tokens = [];
  for (let i = 0; i < pattern.length; i += 1) {
    const char = pattern[i];
    if (char === '*') {
      const all = pattern[i + 1] === '*';
      if (all) i += 1;
      tokens.push({ star: true, all, optionalSlash: all && pattern[i + 1] === '/' });
    } else if (char === '?') tokens.push({ any: true });
    else if (char === '[') {
      const end = pattern.indexOf(']', i + 1);
      if (end < 0) return null;
      let body = pattern.slice(i + 1, end);
      if (body.startsWith('!')) body = '^' + body.slice(1);
      try { tokens.push({ chars: new RegExp(`^[${body}]$`) }); }
      catch { return null; }
      i = end;
    } else if (char === '\\') tokens.push({ literal: pattern[++i] ?? '\\' });
    else if ('+(){}'.includes(char)) return null;
    else tokens.push({ literal: char });
  }
  const closure = (states) => {
    const result = new Set(states);
    for (const state of result) {
      if (!tokens[state]?.star) continue;
      result.add(state + 1);
      if (tokens[state].optionalSlash) result.add(state + 2);
    }
    return [...result].sort((a, b) => a - b);
  };
  return {
    start: closure([0]),
    accepts: (states) => states.includes(tokens.length),
    move: (states, char) => closure(states.flatMap((state) => {
      const token = tokens[state];
      if (!token) return [];
      if (token.star) return token.all || char !== '/' ? [state] : [];
      return (token.any ? char !== '/' : token.chars ? token.chars.test(char) : token.literal === char) ? [state + 1] : [];
    })),
  };
}

export function docsPushRuns(triggers) {
  if (!triggers.push) return false;
  const { paths = [], pathsIgnore = [] } = triggers.push;
  const filters = [...paths, ...pathsIgnore];
  // Unrecognized glob syntax is conservative: it cannot establish exclusion.
  const machines = filters.map((pattern) => globMachine(pattern.replace(/^!/, '')));
  if (machines.some((machine) => !machine)) return true;
  const alphabet = [...new Set([...filters.join(''), ...'docs/README.mdARCHITECTURE.mdxyz0123456789-_'])];
  const selected = (matches, patterns, initial) => patterns.reduce((value, pattern, i) => matches[i] ? !pattern.startsWith('!') : value, initial);
  for (const documentation of ['docs/**', 'README.md', 'ARCHITECTURE.md']) {
    const all = [globMachine(documentation), ...machines];
    const queue = [all.map((machine) => machine.start)];
    const seen = new Set();
    for (let i = 0; i < queue.length; i += 1) {
      const states = queue[i];
      const key = JSON.stringify(states);
      if (seen.has(key)) continue;
      seen.add(key);
      if (all[0].accepts(states[0])) {
        const matches = machines.map((machine, j) => machine.accepts(states[j + 1]));
        if (selected(matches.slice(0, paths.length), paths, paths.length === 0) && !selected(matches.slice(paths.length), pathsIgnore, false)) return true;
      }
      for (const char of alphabet) {
        const next = all.map((machine, j) => machine.move(states[j], char));
        if (next[0].length) queue.push(next);
      }
    }
  }
  return false;
}

function finding(workflow, level, code, pattern, message) {
  return { level, code, file: workflow.file, line: sourceLine(workflow, pattern), message };
}

function writes(job) {
  return stepsOf(job).some((step) => buildsImage(step) || deploys(step) || /(?:\b(?:npm|pnpm|yarn|uv|twine)\s+publish\b|\bgit\s+push\b|\bgh\s+(?:release|api)\b)/.test(step.run ?? '') || /(?:action-gh-release|release-action|npm-publish|publish-action|upload-pages-artifact|deploy-pages)@/.test(step.uses ?? ''));
}

function secretLines(workflow) {
  const sensitiveKey = /(?:^|[_-])(?:token|password|passwd|secret|api[_-]?key|private[_-]?key)(?:$|[_-])/i;
  const literalSecret = (value) => typeof value === 'string' && value && !/\$|^<[^>]+>$/.test(value);
  const lines = [];
  function inspect(value) {
    if (!value || typeof value !== 'object') return;
    for (const [key, nested] of Object.entries(value)) {
      if (['env', 'with'].includes(key) && isMap(nested)) {
        for (const [name, secret] of Object.entries(nested)) {
          if (!sensitiveKey.test(name) || !literalSecret(secret)) continue;
          const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          lines.push(sourceLine(workflow, new RegExp(`^\\s*${escaped}\\s*:`)));
        }
      }
      inspect(nested);
    }
  }
  inspect(workflow.data);
  return lines.concat(workflow.text.split('\n').flatMap((line, i) => {
    if (/^\s*#/.test(line)) return [];
    if (/(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[A-Z0-9]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/.test(line)) return [i + 1];
    const pair = /^\s*(?:export\s+)?([\w-]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (!pair || !sensitiveKey.test(pair[1])) return [];
    const value = pair[2].replace(/\s+#.*$/, '').replace(/^['"]|['"]$/g, '');
    return value && !/\$|^<[^>]+>$|^(?:true|false|null|~)$/.test(value) ? [i + 1] : [];
  }));
}

export function generalFindings(workflow) {
  if (workflow.unreadable) return [{ level: 'error', code: 'unreadable', file: workflow.file, ...workflow.unreadable }];
  const result = [];
  const kind = kindOf(workflow.data);
  if (docsPushRuns(triggersOf(workflow.data)) && ['deploy', 'publish', 'tests'].includes(kind)) result.push(finding(workflow, kind === 'tests' ? 'warning' : 'error', 'docs-trigger', /^\s*(?:['"]?on['"]?|push):/, 'Expected a push filter excluding docs/**, README.md and ARCHITECTURE.md; received a trigger that includes documentation.'));
  for (const line of new Set(secretLines(workflow))) result.push({ level: 'error', code: 'inline-secret', file: workflow.file, line, message: 'Expected a secret reference; received an inline credential (value redacted).' });
  for (const [id, job] of jobsOf(workflow.data)) {
    if (writes(job) && workflow.data.permissions === undefined && job.permissions === undefined) result.push(finding(workflow, 'warning', 'no-permissions', new RegExp(`^\\s*${id}:`), 'Expected an explicit permissions block for a writing job; received no workflow or job permissions.'));
  }
  return result;
}

function dependsOn(jobs, id, target, visited = new Set()) {
  if (visited.has(id)) return false;
  visited.add(id);
  return listOf(jobs[id]?.needs).some((need) => need === target || dependsOn(jobs, need, target, visited));
}

function healthCheck(step) {
  const script = step.run ?? '';
  if (step['continue-on-error'] || /\|\|\s*(?:true|:)|\bexit\s+0\s*$/m.test(script) && !/\bexit\s+[1-9]/.test(script)) return false;
  const queries = /\b(?:curl|wget)\b/.test(script) && /(?:health|status|http_code|redirect_url)/i.test(`${step.name ?? ''} ${script}`);
  const fails = /\bexit\s+[1-9]|\bcurl\b[^\n]*(?:\s-[a-zA-Z]*f[a-zA-Z]*\b|--fail\b)|\bwget\b|\bjq\s+-e\b/.test(script);
  // Polling must fail explicitly after exhausting its attempts.
  return queries && fails && (!/\b(?:for|while|until)\b/.test(script) || /\bexit\s+[1-9]/.test(script));
}

function secretRefs(value) {
  return [...String(value ?? '').matchAll(/\bsecrets\.([A-Za-z_][\w]*)/g)].map((match) => match[1]);
}

function secretGuard(data, job, step) {
  const environment = { ...data.env, ...job.env, ...step.env };
  const usage = JSON.stringify({ run: step.run, with: step.with });
  const inherited = Object.entries(environment).flatMap(([name, value]) => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:\\$\\{?${escaped}\\b|\\benv\\.${escaped}\\b)`).test(usage) ? secretRefs(value) : [];
  });
  const required = [...new Set([...secretRefs(JSON.stringify({ env: step.env, run: step.run, with: step.with })), ...inherited])];
  if (!required.length) return true;
  let condition = String(step.if ?? job.if ?? '');
  condition = condition.replace(/\benv\.([A-Za-z_][\w]*)\s*==\s*['"]true['"]/g, (_, name) => `(${environment[name] ?? ''})`);
  if (condition.includes('||') || /!(?!=)|==\s*(?:false|['"]false['"])/.test(condition)) return false;
  return required.every((name) => {
    const reference = `secrets\\.${name}`;
    return new RegExp(`\\b${reference}\\s*!=\\s*(?:''|"")`).test(condition) || new RegExp(`(?:''|"")\\s*!=\\s*${reference}\\b`).test(condition);
  });
}

export function deployFindings(workflow) {
  if (!workflow.data || kindOf(workflow.data) !== 'deploy') return [];
  const data = workflow.data;
  const result = [];
  const add = (level, code, pattern, message) => result.push(finding(workflow, level, code, pattern, message));
  const jobs = jobsOf(data);
  const writing = jobs.filter(([, job]) => stepsOf(job).some((step) => buildsImage(step) || deploys(step)));
  const concurrency = writing.map(([, job]) => data.concurrency ?? job.concurrency);
  if (concurrency.some((value) => !value || (isMap(value) && !value.group))) add('error', 'no-concurrency', /^\s*jobs:/, 'Expected a concurrency group for every deployment job; received a deployment without a group.');
  if (concurrency.some((value) => value?.['cancel-in-progress'] === true || value?.['cancel-in-progress'] === 'true')) add('error', 'cancels-in-progress', /^\s*cancel-in-progress:/, 'Expected cancel-in-progress: false; received cancel-in-progress: true.');
  const testJobs = jobs.filter(([id, job]) => tests(job, id));
  for (const [id, job] of writing) {
    const steps = stepsOf(job);
    const build = steps.findIndex(buildsImage);
    if (build < 0) continue;
    const earlierTests = tests({ steps: steps.slice(0, build) });
    if (testJobs.length && !earlierTests && !testJobs.some(([testId]) => testId !== id && dependsOn(data.jobs, id, testId))) add('error', 'build-before-tests', /docker\/build-push-action@|\bdocker\s+(?:build|push)/, 'Expected image building to depend on a test job or follow a test step; received image building without preceding tests.');
    const imageSteps = steps.filter(buildsImage);
    const immutable = imageSteps.every((step) => /\$\{\{\s*github\.sha\s*\}\}/.test(String(step.with?.tags ?? step.run ?? '')));
    if (!immutable) add('error', 'mutable-tag', /^\s*tags:|\bdocker\s+push/, 'Expected an image tag containing ${{ github.sha }}; received image tags without the commit hash.');
  }
  for (const [id, job] of writing) {
    const steps = stepsOf(job);
    for (let index = 0; index < steps.length; index += 1) {
      const step = steps[index];
      if (!deploys(step)) continue;
      const after = steps.slice(index + 1).some(healthCheck) || jobs.some(([nextId, nextJob]) => nextId !== id && dependsOn(data.jobs, nextId, id) && stepsOf(nextJob).some(healthCheck));
      if (!after) add('error', 'no-health-check', /\/deploy\b|\/redeploy\b|\b(?:kubectl|flyctl|vercel|wrangler)\b/, 'Expected a failing health or status check after deployment; received no subsequent health check that can fail.');
      if (!secretGuard(data, job, step)) add('warning', 'fails-without-secrets', /\/deploy\b|\/redeploy\b|\b(?:kubectl|flyctl|vercel|wrangler)\b/, 'Expected a deployment condition checking the required secrets are present; received no matching secret-presence guard.');
    }
  }
  if (!triggersOf(data).workflow_dispatch) add('warning', 'no-manual-trigger', /^\s*(?:['"]?on['"]?):/, 'Expected workflow_dispatch for a manual deployment; received triggers without workflow_dispatch.');
  return result;
}
