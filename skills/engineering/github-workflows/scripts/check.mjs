#!/usr/bin/env node
import { statSync } from 'node:fs';
import { resolve } from 'node:path';
import { deployFindings, docsPushRuns, generalFindings, kindOf, readWorkflows, triggersOf } from './lib/workflows.mjs';

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function parseArgs(args) {
  const options = { repo: process.cwd(), json: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--json') options.json = true;
    else if (args[i] === '--repo') {
      const value = args[++i];
      if (!value || value.startsWith('--')) fail('bad-usage', 'Expected a repository path after --repo; received no path.');
      options.repo = resolve(value);
    } else fail('bad-usage', `Expected --repo <path> or --json; received ${args[i]}.`);
  }
  return options;
}

function check(repo) {
  let stat;
  try { stat = statSync(repo); }
  catch (error) { fail('not-a-directory', `Expected a readable repository directory; received filesystem error ${error.code}.`); }
  if (!stat.isDirectory()) fail('not-a-directory', 'Expected a repository directory; received a non-directory path.');
  const workflows = readWorkflows(repo);
  const findings = workflows.flatMap((workflow) => [...generalFindings(workflow), ...deployFindings(workflow)]);
  return {
    repo, state: workflows.length ? 'workflows' : 'none',
    workflows: workflows.map((workflow) => {
      const triggers = workflow.data ? triggersOf(workflow.data) : {};
      return { file: workflow.file, name: workflow.data?.name ?? workflow.file.split('/').at(-1), kind: workflow.data ? kindOf(workflow.data) : 'other', triggers, docs_push_runs: docsPushRuns(triggers) };
    }),
    findings, summary: { errors: findings.filter((item) => item.level === 'error').length, warnings: findings.filter((item) => item.level === 'warning').length },
  };
}

function printReport(result) {
  if (result.state === 'none') console.log(`No workflows in ${result.repo}.`);
  for (const workflow of result.workflows) console.log(`${workflow.file}: ${workflow.name} (${workflow.kind}); triggers: ${Object.keys(workflow.triggers).join(', ') || 'unreadable'}; documentation push: ${workflow.docs_push_runs ? 'runs' : 'excluded'}.`);
  for (const item of result.findings) console.log(`${item.level} ${item.code} ${item.file}:${item.line}: ${item.message}`);
  console.log(`${result.summary.errors} errors, ${result.summary.warnings} warnings.`);
}

let options;
try {
  options = parseArgs(process.argv.slice(2));
  const result = check(options.repo);
  if (options.json) console.log(JSON.stringify(result, null, 2));
  else printReport(result);
  process.exitCode = result.summary.errors ? 1 : 0;
} catch (error) {
  const result = { error: { code: error.code ?? 'check-failed', message: error.message } };
  if (options?.json || process.argv.includes('--json')) console.log(JSON.stringify(result));
  else console.error(result.error.message);
  process.exitCode = 2;
}
