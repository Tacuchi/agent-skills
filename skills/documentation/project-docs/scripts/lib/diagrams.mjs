import { existsSync, readFileSync } from 'node:fs';
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
  const links = data.components.flatMap((component) => [component.href, ...(Array.isArray(component.drilldowns) ? component.drilldowns.map((entry) => entry?.href) : [])]);
  return {
    revision: data.meta.repository.revision, citations,
    feedbackLinks: data.meta.feedback_links, parentHref: pageName(data.meta.parentHref), links: links.map(pageName).filter(Boolean),
  };
}

// Archify accepts `page.html`, `page.html?x` and `page.html#x`; only the file name says which page opens.
function pageName(href) {
  return typeof href === 'string' ? href.split(/[?#]/)[0] : null;
}

// The two pages of the format link to each other: the system box of the context opens the
// containers, and the containers page offers Back to the context.
function linkFindings(sources) {
  const context = sources.get('docs/architecture/context');
  const containers = sources.get('docs/architecture/containers');
  if (!context || !containers) return [];
  const findings = [];
  if (!context.links.includes('containers.html')) {
    findings.push(finding('diagram-unlinked', 'docs/architecture/context.archify.json',
      'Expected the system box to link to containers.html with href; received no such link.', { level: 'warning' }));
  }
  if (containers.parentHref !== 'context.html') {
    findings.push(finding('diagram-unlinked', 'docs/architecture/containers.archify.json',
      `Expected meta.parentHref "context.html"; received ${JSON.stringify(containers.parentHref ?? null)}.`, { level: 'warning' }));
  }
  return findings;
}

export function checkDiagrams(repo) {
  const findings = [];
  const sources = new Map();
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
    sources.set(base, data);
    if (data.feedbackLinks !== false) {
      findings.push(finding('diagram-feedback-links', file,
        `Expected meta.feedback_links false; received ${JSON.stringify(data.feedbackLinks ?? null)}. The page footer would carry Archify's feedback and star links.`, { level: 'warning' }));
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
  return [...findings, ...linkFindings(sources)];
}

export function findArchify(skillDir, env = process.env) {
  const home = env.HOME || env.USERPROFILE || homedir();
  const roots = [env.ARCHIFY_HOME, join(dirname(skillDir), 'archify'),
    ...['.claude/skills', '.agents/skills', '.codex/skills', '.gemini/config/skills'].map((path) => join(home, path, 'archify'))];
  return roots.filter(Boolean).map((root) => join(root, 'bin/archify.mjs')).find((path) => existsSync(path)) ?? null;
}

// The version comes from the package.json next to bin/, so a renamed folder still reports it.
export function archifyVersion(command) {
  if (!command) return null;
  try {
    const version = JSON.parse(readFileSync(join(dirname(dirname(command)), 'package.json'), 'utf8')).version;
    return typeof version === 'string' ? version : null;
  } catch {
    return null;
  }
}
