import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { citationLabel, inspectCitation } from './evidence.mjs';
import { listFiles, readWorking, resolveCommit } from './repo.mjs';

function finding(code, file, message, extra = {}) {
  return { group: 'diagrams', level: 'error', code, file, message, ...extra };
}

function parseSource(text) {
  let data;
  try { data = JSON.parse(text); }
  catch { return { error: 'Expected a valid JSON object; received invalid JSON.' }; }
  if (!data || typeof data !== 'object' || !Array.isArray(data.components) || typeof data.meta?.repository?.revision !== 'string' || !data.meta.repository.revision) {
    return { error: 'Expected components[] and meta.repository.revision as a nonempty string; received missing or invalid fields.' };
  }
  const citations = [];
  for (const component of data.components) {
    if (!component || typeof component !== 'object' || (component.sources !== undefined && !Array.isArray(component.sources))) return { error: 'Expected component objects with optional sources arrays; received an invalid component.' };
    for (const source of component.sources ?? []) {
      if (!source || typeof source.path !== 'string' || !source.path || !Number.isInteger(source.line) || source.line < 1 || (source.end_line !== undefined && (!Number.isInteger(source.end_line) || source.end_line < source.line))) {
        return { error: 'Expected sources with a nonempty path, positive integer line and optional end_line at least line; received an invalid source.' };
      }
      citations.push({ section: String(component.id ?? 'component'), cited: { path: source.path, start: source.line, end: source.end_line ?? source.line } });
    }
  }
  return { revision: data.meta.repository.revision, citations };
}

export function checkDiagrams(repo) {
  const findings = [];
  for (const file of listFiles(repo, 'docs/architecture').filter((path) => path.endsWith('.archify.json'))) {
    const base = file.slice(0, -'.archify.json'.length);
    for (const extension of ['svg', 'html']) {
      if (readWorking(repo, `${base}.${extension}`) === null) findings.push(finding('diagram-missing-file', file, `Expected companion ${base}.${extension}; received no file.`));
    }
    const data = parseSource(readWorking(repo, file));
    if (data.error) {
      findings.push(finding('diagram-bad-source', file, data.error));
      continue;
    }
    const commit = resolveCommit(repo, data.revision);
    if (!commit) {
      findings.push(finding('diagram-pin-unknown', file, `Expected a locally available diagram revision; received ${data.revision}. Fetch the missing history (git fetch --unshallow for a shallow clone).`));
      continue;
    }
    for (const { section, cited } of data.citations) {
      const result = inspectCitation(repo, commit, cited);
      if (result.status === 'ok') continue;
      const code = result.code === 'self-citation' ? 'diagram-self-citation'
        : result.status === 'moved' ? 'diagram-source-moved' : 'diagram-source-stale';
      findings.push(finding(code, file,
        `${citationLabel(cited)}: ${result.detail}`, {
          level: result.status === 'moved' ? 'warning' : 'error', section, cited,
          ...(result.movedTo ? { moved_to: result.movedTo } : {}),
        }));
    }
  }
  return findings;
}

export function findArchify(skillDir, env = process.env) {
  const home = env.HOME || env.USERPROFILE || homedir();
  const roots = [env.ARCHIFY_HOME, join(dirname(skillDir), 'archify'),
    ...['.claude/skills', '.agents/skills', '.codex/skills', '.gemini/config/skills'].map((path) => join(home, path, 'archify'))];
  return roots.filter(Boolean).map((root) => join(root, 'bin/archify.mjs')).find((path) => existsSync(path)) ?? null;
}
