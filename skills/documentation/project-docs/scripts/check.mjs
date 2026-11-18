#!/usr/bin/env node
import { existsSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { findChrome } from './lib/cdp.mjs';
import { checkDiagrams, findArchify } from './lib/diagrams.mjs';
import { checkEvidence, citationLabel, evidenceEntries, lines, parsePin, repin } from './lib/evidence.mjs';
import { checkLinks } from './lib/links.mjs';
import { checkPrivacy, privateTermsPath } from './lib/privacy.mjs';
import { git, isShallow, projectVersion, readWorking, resolveCommit, showFile } from './lib/repo.mjs';
import { checkStructure } from './lib/structure.mjs';

// The review date is the person's calendar day, so it comes from local time and not from UTC.
function localDay(now = new Date()) {
  const two = (value) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`;
}

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function parseArgs(args) {
  const options = { repo: process.cwd(), json: false, repin: false, reviewed: false, preflight: false };
  const values = new Map([['--repo', 'repo'], ['--private-terms', 'privateTermsFile'], ['--date', 'date']]);
  const flags = new Map([['--json', 'json'], ['--repin', 'repin'], ['--reviewed', 'reviewed'], ['--preflight', 'preflight']]);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (flags.has(arg)) options[flags.get(arg)] = true;
    else if (values.has(arg)) {
      const value = args[++index];
      if (!value || value.startsWith('--')) fail('bad-usage', `Expected a value after ${arg}; received ${value ?? 'end of arguments'}.`);
      options[values.get(arg)] = value;
    } else fail('bad-usage', `Expected --repo, --json, --private-terms, --repin, --reviewed, --date or --preflight; received ${arg}.`);
  }
  if (options.date && (!/^\d{4}-\d{2}-\d{2}$/.test(options.date) || !Number.isFinite(Date.parse(options.date)) || new Date(options.date).toISOString().slice(0, 10) !== options.date)) fail('bad-usage', `Expected a valid YYYY-MM-DD date; received ${options.date}.`);
  if ((options.date || options.reviewed) && !options.repin) fail('bad-usage', 'Expected --repin with --date or --reviewed; received an option without --repin.');
  if (options.preflight && options.repin) fail('bad-usage', 'Expected either --preflight or --repin; received both.');
  options.repo = resolve(options.repo);
  return options;
}

function isOlder(pinVersion, currentVersion) {
  const parse = (value) => /^v?\d+(?:\.\d+){1,3}$/.test(value) ? value.replace(/^v/, '').split('.').map(Number) : null;
  const before = parse(pinVersion);
  const after = parse(currentVersion);
  if (!before || !after) return false;
  for (let index = 0; index < Math.max(before.length, after.length); index += 1) {
    if ((before[index] ?? 0) !== (after[index] ?? 0)) return (before[index] ?? 0) < (after[index] ?? 0);
  }
  return false;
}

function inspect(repo, privateTermsFile) {
  const markdown = readWorking(repo, 'ARCHITECTURE.md');
  const pin = markdown === null ? null : parsePin(markdown);
  const entries = markdown === null ? [] : evidenceEntries(repo, markdown);
  const version = projectVersion(repo);
  const findings = [
    ...checkStructure(repo),
    ...(markdown === null ? [] : checkEvidence(repo, markdown)),
    ...checkDiagrams(repo), ...checkLinks(repo), ...checkPrivacy(repo, { privateTermsFile }),
  ];
  if (pin?.version && version && isOlder(pin.version, version)) findings.push({ group: 'version', level: 'warning', code: 'version-behind', file: 'ARCHITECTURE.md', message: `Expected documentation of project version ${version}; received pinned version ${pin.version}.` });
  const citations = { ok: 0, moved: 0, stale: 0 };
  for (const entry of entries) citations[entry.status] += 1;
  return {
    repo, state: markdown === null ? 'missing' : 'documented', head: resolveCommit(repo, 'HEAD'), project_version: version,
    pin, findings, summary: { errors: findings.filter((finding) => finding.level === 'error').length, warnings: findings.filter((finding) => finding.level === 'warning').length, citations },
  };
}

function preflight(repo, inGit, privateTermsFile) {
  return {
    git: inGit, branch: inGit ? git(repo, ['branch', '--show-current'])?.trim() || null : null,
    dirty: inGit && Boolean(git(repo, ['status', '--porcelain'])?.trim()),
    shallow: inGit && isShallow(repo), readme: readWorking(repo, 'README.md') !== null,
    architecture: readWorking(repo, 'ARCHITECTURE.md') !== null, project_version: projectVersion(repo),
    chrome: findChrome({ env: process.env, platform: process.platform }).path,
    archify: findArchify(resolve(import.meta.dirname, '..'), process.env), node: process.versions.node,
    private_terms: privateTermsPath(privateTermsFile),
  };
}

function refresh(repo, options, result) {
  const markdown = readWorking(repo, 'ARCHITECTURE.md');
  if (!markdown || !result.pin || !result.head) return result;
  const entries = evidenceEntries(repo, markdown);
  const errors = entries.filter((entry) => entry.code && entry.status !== 'moved');
  if (errors.some((entry) => !options.reviewed || entry.code === 'self-citation')) return result;
  const citedFiles = [...new Set(entries.map((entry) => entry.cited.path))];
  const dirty = citedFiles.length ? git(repo, ['status', '--porcelain', '--untracked-files=all', '--', ...citedFiles]) : '';
  if (dirty === null) fail('dirty-cited-files', 'Expected a readable git status for cited files; received a failed status command.');
  if (dirty.trim()) fail('dirty-cited-files', 'Expected every cited file to be committed before repinning; received uncommitted changes in cited files.');
  const accepted = [];
  for (const entry of entries) {
    const range = entry.movedTo ?? [entry.cited.start, entry.cited.end];
    const atHead = showFile(repo, result.head, entry.cited.path);
    if (atHead === null || range[0] < 1 || range[1] < range[0] || range[1] > lines(atHead).length) {
      const problem = { group: 'evidence', level: 'error', code: atHead === null ? 'missing-at-pin' : 'out-of-range', file: 'ARCHITECTURE.md', section: entry.section, cited: entry.cited, message: `${citationLabel(entry.cited)}: Expected an existing file and range at HEAD; received ${atHead === null ? 'no file' : 'a range outside 1-' + lines(atHead).length}.` };
      return { ...result, findings: [...result.findings, problem], summary: { ...result.summary, errors: result.summary.errors + 1 } };
    }
    if (entry.status === 'stale') accepted.push({ section: entry.section, path: entry.cited.path, start: entry.cited.start, end: entry.cited.end });
  }
  const metadata = {
    commit: git(repo, ['rev-parse', '--short', 'HEAD']).trim(), date: options.date ?? localDay(), version: result.project_version ?? result.pin.version,
    moved: entries.filter((entry) => entry.status === 'moved').map((entry) => ({ section: entry.section, path: entry.cited.path, from: [entry.cited.start, entry.cited.end], to: entry.movedTo })),
    accepted,
  };
  const updated = repin(repo, markdown, { head: metadata.commit, date: metadata.date, version: metadata.version });
  writeFileSync(join(repo, 'ARCHITECTURE.md'), updated);
  return { ...inspect(repo, options.privateTermsFile), repin: metadata };
}

function print(result, json) {
  if (json) process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  else if (result.error) process.stderr.write(`${result.error.code}: ${result.error.message}\n`);
  else if (!result.findings) process.stdout.write(Object.entries(result).map(([key, value]) => `${key}: ${value}`).join('\n') + '\n');
  else {
    process.stdout.write(`${result.state}: ${result.summary.errors} errors, ${result.summary.warnings} warnings\n`);
    for (const finding of result.findings) process.stdout.write(`${finding.level} ${finding.group}/${finding.code} ${finding.file}${finding.line ? ':' + finding.line : ''}: ${finding.message}\n`);
  }
}

function main() {
  const args = process.argv.slice(2);
  try {
    const options = parseArgs(args);
    if (!existsSync(options.repo) || !statSync(options.repo).isDirectory()) fail('not-a-directory', `Expected a repository directory; received a missing or non-directory path: ${options.repo}.`);
    const inGit = git(options.repo, ['rev-parse', '--is-inside-work-tree'])?.trim() === 'true';
    if (options.preflight) { print(preflight(options.repo, inGit, options.privateTermsFile), options.json); return; }
    if (!inGit) fail('not-a-git-repo', `Expected a git working repository; received a directory outside git: ${options.repo}.`);
    let result = inspect(options.repo, options.privateTermsFile);
    if (options.repin) result = refresh(options.repo, options, result);
    print(result, options.json);
    process.exitCode = result.summary.errors ? 1 : 0;
  } catch (error) {
    print({ error: { code: error.code === 'pin-unknown' || ['not-a-directory', 'not-a-git-repo', 'dirty-cited-files', 'bad-usage'].includes(error.code) ? error.code : 'bad-usage', message: error.message.startsWith('Expected') ? error.message : `Expected readable repository files and available local tools; received ${error.code ?? error.name}.` } }, args.includes('--json'));
    process.exitCode = 2;
  }
}

main();
