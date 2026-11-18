import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

export function git(repo, args) {
  const result = spawnSync('git', ['-C', repo, ...args], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (result.error) throw result.error;
  return result.status === 0 ? result.stdout : null;
}

export function resolveCommit(repo, revision) {
  if (typeof revision !== 'string' || !revision || revision.startsWith('-')) return null;
  return git(repo, ['rev-parse', '--verify', '--quiet', `${revision}^{commit}`])?.trim() || null;
}

export function repositoryPath(repo, path) {
  const target = resolve(repo, path);
  const local = relative(resolve(repo), target);
  if (isAbsolute(local) || local === '..' || local.startsWith(`..${sep}`)) return null;
  return target;
}

export function showFile(repo, commit, path) {
  if (!repositoryPath(repo, path)) return null;
  return git(repo, ['show', `${commit}:${path.replaceAll('\\', '/')}`]);
}

export function readWorking(repo, path) {
  const target = repositoryPath(repo, path);
  if (!target) return null;
  try {
    if (!repositoryPath(realpathSync(repo), realpathSync(target))) return null;
    if (!statSync(target).isFile()) return null;
    return readFileSync(target, 'utf8');
  } catch (error) {
    if (['ENOENT', 'ENOTDIR'].includes(error.code)) return null;
    throw error;
  }
}

export function listFiles(repo, directory, recursive = false) {
  const target = repositoryPath(repo, directory);
  if (!target) return [];
  let entries;
  try {
    entries = readdirSync(target, { withFileTypes: true });
  } catch (error) {
    if (['ENOENT', 'ENOTDIR'].includes(error.code)) return [];
    throw error;
  }
  return entries.sort((a, b) => a.name.localeCompare(b.name)).flatMap((entry) => {
    const path = join(directory, entry.name).split(sep).join('/');
    if (entry.isDirectory()) return recursive ? listFiles(repo, path, true) : [];
    return entry.isFile() ? [path] : [];
  });
}

export function documentationFiles(repo, { privacy = false } = {}) {
  const docs = listFiles(repo, 'docs', privacy);
  const decisions = privacy ? [] : listFiles(repo, 'docs/decisions');
  return ['README.md', 'ARCHITECTURE.md', ...docs.filter((p) => p.endsWith('.md') || (privacy && /^docs\/architecture\/[^/]+\.(json|svg|html)$/.test(p))), ...decisions.filter((p) => p.endsWith('.md'))]
    .filter((path) => readWorking(repo, path) !== null);
}

export function isShallow(repo) {
  return git(repo, ['rev-parse', '--is-shallow-repository'])?.trim() === 'true';
}

function projectXmlVersion(xml) {
  let depth = 0;
  let isVersion = false;
  for (const token of xml.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<[^>]+>|[^<]+/g)) {
    const value = token[0];
    if (value.startsWith('<?') || value.startsWith('<!')) continue;
    if (value.startsWith('</')) {
      depth -= 1;
      isVersion = false;
    } else if (value.startsWith('<')) {
      isVersion = depth === 1 && /^<version\s*>$/.test(value);
      if (!value.endsWith('/>')) depth += 1;
    } else if (isVersion && value.trim()) return value.trim();
  }
  return null;
}

function tomlVersion(text, sections) {
  let section = '';
  for (const line of text.split(/\r?\n/)) {
    const heading = line.match(/^\s*\[([^\]]+)\]/);
    if (heading) section = heading[1];
    const version = line.match(/^\s*version\s*=\s*["']([^"']+)["']/);
    if (sections.includes(section) && version) return version[1];
  }
  return null;
}

export function projectVersion(repo) {
  const packageText = readWorking(repo, 'package.json');
  if (packageText !== null) {
    let data;
    try { data = JSON.parse(packageText); }
    catch { throw new Error('Expected valid JSON in package.json; received invalid JSON.'); }
    if (typeof data?.version === 'string' && data.version) return data.version;
  }
  const pom = readWorking(repo, 'pom.xml');
  if (pom !== null) {
    const version = projectXmlVersion(pom);
    if (version) return version;
  }
  for (const name of ['build.gradle', 'build.gradle.kts']) {
    const text = readWorking(repo, name);
    const version = text?.match(/^\s*version\s*(?:=\s*)?["']([^"']+)["']/m)?.[1];
    if (version) return version;
  }
  for (const [name, sections] of [['pyproject.toml', ['project', 'tool.poetry']], ['Cargo.toml', ['package']]]) {
    const text = readWorking(repo, name);
    if (text !== null) {
      const version = tomlVersion(text, sections);
      if (version) return version;
    }
  }
  // Only a tag that is a bare version names the whole project: `skill/x/v1.0.0`
  // or `x@1.0.0` names one part of it.
  const tag = git(repo, ['describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*', '--match', '[0-9]*'])?.trim();
  return tag && /^v?\d+(\.\d+)*([-+][0-9A-Za-z.-]+)?$/.test(tag) ? tag.replace(/^v/, '') : null;
}
