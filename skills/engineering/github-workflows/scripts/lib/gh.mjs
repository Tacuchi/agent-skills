import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';

export function gh(args, { cwd, env = process.env } = {}) {
  return new Promise((resolve) => {
    const child = spawn('gh', args, { cwd, env: { ...env, GH_PROMPT_DISABLED: '1', GH_PAGER: 'cat' }, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8').on('data', (chunk) => { stdout += chunk; });
    child.stderr.setEncoding('utf8').on('data', (chunk) => { stderr += chunk; });
    child.once('error', (error) => resolve({ ok: false, code: error.code === 'ENOENT' ? 'missing' : 'failed',
      message: `expected an executable gh command, got ${error.code}: ${error.message}` }));
    child.once('close', (status, signal) => {
      if (status === 0) return resolve({ ok: true, stdout });
      const detail = stderr.trim() || stdout.trim() || `signal ${signal}`;
      const unauthenticated = /not logged|not authenticated|authentication|gh auth login|HTTP 401|bad credentials/i.test(detail);
      resolve({ ok: false, code: unauthenticated ? 'unauthenticated' : 'failed',
        message: `expected gh ${args.slice(0, 2).join(' ')} to succeed, got exit ${status}: ${detail}` });
    });
  });
}

export function lastGoodBefore(runs, runId) {
  const idOf = (run) => run.databaseId ?? run.id;
  const workflowOf = (run) => run.workflowDatabaseId ?? run.workflow;
  const timeOf = (run) => Date.parse(run.createdAt ?? run.created);
  const current = runs.find((run) => String(idOf(run)) === String(runId));
  if (!current) return null;
  return runs.filter((run) => run.conclusion === 'success' && workflowOf(run) === workflowOf(current)
    && timeOf(run) < timeOf(current)).sort((a, b) => timeOf(b) - timeOf(a))[0] ?? null;
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}

export function confirmToken(plan) {
  return createHash('sha256').update(JSON.stringify(canonical(plan))).digest('hex').slice(0, 24);
}
