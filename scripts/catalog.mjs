import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, lstatSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const OWN_SOURCE = 'https://github.com/Tacuchi/agent-skills';
const SLUG = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const TAG = /^skill\/([a-z][a-z0-9]*(?:-[a-z0-9]+)*)\/v\d+\.\d+\.\d+$/;
const START = '<!-- catalog:start -->';
const END = '<!-- catalog:end -->';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function text(value, label) {
  assert(typeof value === 'string' && value.trim() === value && value.length > 0 && !/[\r\n]/.test(value), `${label}: required single-line text`);
  return value;
}

function url(value, label) {
  text(value, label);
  const parsed = new URL(value);
  assert(parsed.protocol === 'https:' && !parsed.username && !parsed.password, `${label}: an HTTPS URL without credentials is required`);
  return value;
}

function git(root, args) {
  try {
    return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

function inside(root, path) {
  assert(typeof path === 'string' && path.length > 0 && !path.startsWith('/') && !path.includes('\\') && !path.split('/').some((part) => part === '.' || part === '..' || !part), `invalid path: ${path}`);
  const absolute = resolve(root, path);
  assert(absolute.startsWith(resolve(root) + sep), `path outside the repository: ${path}`);
  return absolute;
}

function file(root, path, label) {
  const absolute = inside(root, path);
  assert(existsSync(absolute) && readFileSync(absolute, 'utf8').trim().length > 0, `${label}: missing ${path}`);
}

function skillFrontmatter(content, label) {
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(content)?.[1];
  assert(frontmatter && ['name', 'description'].every((key) => {
    const value = new RegExp(`^${key}:[ \t]*(.+)$`, 'm').exec(frontmatter)?.[1].trim();
    return value && value !== "''" && value !== '""';
  }), `${label}: SKILL.md has no frontmatter with name and description`);
  // A plain scalar with `: ` or ` #` is invalid or truncated YAML: strict installers skip the skill.
  const plain = [...frontmatter.matchAll(/^[\w-]+:[ \t]*([^'"|>\s].*)$/gm)].find(([, value]) => /: |\s#/.test(value));
  assert(!plain, `${label}: SKILL.md has invalid YAML frontmatter; quote "${plain?.[0].split(':')[0]}"`);
}

function immutableEvidence(entry) {
  const evidence = new URL(entry.data_permissions.evidence_url);
  const source = new URL(entry.source_url);
  const path = decodeURIComponent(evidence.pathname);
  const commit = /\/(?:blob|tree)\/[a-f0-9]{40}(?:\/|$)|\/commit\/[a-f0-9]{40}(?:\/|$)/.test(path);
  const offerTag = TAG.test(entry.ref) || /^v\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(entry.ref);
  const tagged = offerTag && evidence.origin === source.origin && path.startsWith(`${source.pathname.replace(/\/$/, '')}/blob/${entry.ref}/`);
  assert(commit || tagged, `${entry.id}: evidence must be anchored to an immutable ref (commit SHA or the offer's tag)`);
}

function validateEntry(root, entry, ids, slugs) {
  assert(entry && typeof entry === 'object' && !Array.isArray(entry), 'invalid entry');
  const id = text(entry.id, 'id');
  assert(SLUG.test(id) && !ids.has(id), `${id}: duplicate or invalid id`);
  ids.add(id);
  text(entry.name, `${id}: name`);
  assert(SLUG.test(entry.domain), `${id}: invalid domain`);
  assert(['own', 'external'].includes(entry.type), `${id}: invalid type`);
  assert(['active', 'retired'].includes(entry.status), `${id}: invalid status`);
  url(entry.source_url, `${id}: source`);
  const path = entry.path;
  assert(typeof path === 'string' && path.endsWith('/SKILL.md') && !path.includes('\\') && !path.startsWith('/') && !path.split('/').some((part) => part === '.' || part === '..' || !part), `${id}: invalid individual skill path`);
  text(entry.ref, `${id}: ref`);
  text(entry.lifecycle_owner, `${id}: lifecycle owner`);
  const info = entry.data_permissions;
  assert(info && typeof info === 'object' && !Array.isArray(info), `${id}: data/permissions are required`);
  assert(['verified', 'unverified'].includes(info.status), `${id}: invalid data/permissions status`);
  text(info.summary, `${id}: data/permissions`);
  if (info.status === 'verified') {
    url(info.evidence_url, `${id}: verification provenance`);
    immutableEvidence(entry);
  } else {
    assert(info.summary === 'not verified' && info.evidence_url === undefined, `${id}: an unverified entry cannot claim evidence`);
  }
  if (entry.status === 'retired') text(entry.retirement_reason, `${id}: retirement reason`);
  else assert(entry.retirement_reason === undefined, `${id}: an active offer has no retirement reason`);

  if (entry.type === 'external') {
    assert(entry.source_url.replace(/\.git\/?$/, '').replace(/\/$/, '') !== OWN_SOURCE && entry.lifecycle_owner.toLowerCase() !== 'tacuchi', `${id}: false upstream attribution`);
    assert(/^(?:[a-f0-9]{7,40}|v\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?)$/.test(entry.ref), `${id}: an external ref must be a commit or a fixed version`);
    assert(!('license' in entry) && !('changelog' in entry) && !('release_notes' in entry), `${id}: an external entry has no local release or license`);
    return;
  }

  assert(/^skills\/[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*\/SKILL\.md$/.test(path), `${id}: invalid own path`);
  const [, domain, slug] = path.split('/');
  assert(domain === entry.domain && SLUG.test(domain) && SLUG.test(slug), `${id}: path and domain contradict each other`);
  assert(entry.source_url === OWN_SOURCE && entry.lifecycle_owner === 'Tacuchi', `${id}: wrong own source or owner`);
  assert(!slugs.has(slug), `${id}: own slug duplicated across domains`);
  slugs.add(slug);
  const match = TAG.exec(entry.ref);
  assert(match && match[1] === slug, `${id}: an own skill/<slug>/vX.Y.Z tag is required`);
  const base = `skills/${domain}/${slug}`;
  assert(path === `${base}/SKILL.md`, `${id}: contradictory own path`);
  assert(entry.license === 'root' || entry.license === `${base}/LICENSE`, `${id}: the applicable license must be root or its own`);
  assert(entry.changelog === `${base}/CHANGELOG.md` && entry.release_notes === `${base}/RELEASE_NOTES.md`, `${id}: individual changelog and release notes are required`);
  const files = [path, entry.changelog, entry.release_notes, entry.license === 'root' ? 'LICENSE' : entry.license];
  if (entry.status === 'active') {
    for (const item of files) {
      if (item === path) {
        const absolute = inside(root, path);
        assert(existsSync(absolute) && lstatSync(absolute).isFile(), `${id}: ${path} must be a regular file in the checkout`);
      }
      file(root, item, id);
    }
  }
  assert(git(root, ['rev-parse', '--verify', `refs/tags/${entry.ref}^{commit}`]), `${id}: tag ${entry.ref} does not exist`);
  assert(/^100644 blob [a-f0-9]+\t/.test(git(root, ['ls-tree', entry.ref, '--', path]) ?? ''), `${id}: tag ${entry.ref} requires ${path} as a 100644 blob`);
  for (const item of files) {
    assert(git(root, ['show', `${entry.ref}:${item}`]), `${id}: tag ${entry.ref} does not contain ${item} with content`);
  }
  skillFrontmatter(git(root, ['show', `${entry.ref}:${path}`]), `${id}: tag ${entry.ref} ${path}`);
}

function markdown(value) {
  return String(value).replaceAll('|', '\\|').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function rows(entries, retired) {
  if (!entries.length) return retired ? 'No retired offers.' : 'No active offers.';
  const headings = '| Skill | Domain | Type | Source | Path | Ref | Lifecycle | Data/permissions |' + (retired ? ' Reason |' : '');
  const separator = '| --- | --- | --- | --- | --- | --- | --- | --- |' + (retired ? ' --- |' : '');
  return [headings, separator, ...entries.map((entry) => {
    const info = entry.data_permissions;
    const evidence = info.status === 'verified' ? ` (${info.evidence_url})` : '';
    const fields = [entry.name, entry.domain, entry.type, entry.source_url, entry.path, entry.ref, entry.lifecycle_owner, `${info.summary}${evidence}`];
    if (retired) fields.push(entry.retirement_reason);
    return `| ${fields.map(markdown).join(' | ')} |`;
  })].join('\n');
}

export function render(index) {
  return `${START}\nIndex revision: **${index.revision}** (schema ${index.schema_version}).\n\n### Active offers\n\n${rows(index.entries.filter((entry) => entry.status === 'active'), false)}\n\n### Retired offers\n\n${rows(index.entries.filter((entry) => entry.status === 'retired'), true)}\n${END}`;
}

export function checkCatalog(root, { check = true } = {}) {
  assert(git(root, ['rev-parse', '--verify', 'HEAD']), 'could not read HEAD to compare the revision');
  const index = JSON.parse(readFileSync(join(root, 'catalog/index.json'), 'utf8'));
  assert(index.schema_version === 1 && Number.isSafeInteger(index.revision) && index.revision >= 1 && Array.isArray(index.entries), 'invalid schema, revision or entries');
  const ids = new Set();
  const slugs = new Set();
  for (const entry of index.entries) validateEntry(root, entry, ids, slugs);

  const current = git(root, ['show', 'HEAD:catalog/index.json']);
  const previous = current !== null && JSON.stringify(JSON.parse(current)) === JSON.stringify(index)
    ? git(root, ['show', 'HEAD^:catalog/index.json'])
    : current;
  if (previous !== null) {
    const baseline = JSON.parse(previous);
    const changed = JSON.stringify({ schema_version: baseline.schema_version, entries: baseline.entries }) !== JSON.stringify({ schema_version: index.schema_version, entries: index.entries });
    assert(index.revision >= baseline.revision && (!changed || index.revision > baseline.revision), 'editorial change without a revision increment');
  }

  const readmePath = join(root, 'README.md');
  const readme = readFileSync(readmePath, 'utf8');
  const blocks = readme.match(/<!-- catalog:start -->[\s\S]*?<!-- catalog:end -->/g);
  assert(blocks?.length === 1, 'README must contain a single catalog block');
  const expected = render(index);
  if (check) assert(blocks[0] === expected, 'README does not match catalog/index.json');
  else if (blocks[0] !== expected) writeFileSync(readmePath, readme.replace(blocks[0], expected));
  return index;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    checkCatalog(resolve(fileURLToPath(new URL('..', import.meta.url))), { check: process.argv.includes('--check') });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
