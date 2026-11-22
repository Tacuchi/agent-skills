import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { architecture, completeRepo, makeRepo, runCheck, source } from './project-docs-helpers.mjs';

const codes = (result) => result.json.findings.map((finding) => finding.code);
const read = (repo, path = 'ARCHITECTURE.md') => readFileSync(join(repo.dir, path), 'utf8');
const setRows = (repo, rows) => repo.write('ARCHITECTURE.md', architecture({ commit: repo.pin, rows }));

function addDiagram(repo, revision = repo.pin, { name = 'context', meta = {}, component = {} } = {}) {
  repo.write(`docs/architecture/${name}.archify.json`, JSON.stringify({
    meta: { repository: { revision }, feedback_links: false, ...meta },
    components: [{ id: 'service', sources: [{ path: 'src/a.js', line: 1, end_line: 3 }], ...component }],
  }));
  repo.write(`docs/architecture/${name}.svg`, '<svg/>');
  repo.write(`docs/architecture/${name}.html`, '<html></html>');
}

test('unchanged citations are ok and the exit code is 0', (t) => {
  const result = runCheck(completeRepo(t).dir);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.deepEqual(result.json.summary.citations, { ok: 1, moved: 0, stale: 0 });
  assert.equal(result.json.state, 'documented');
});

test('a changed cited line is stale and names section, file and lines', (t) => {
  const repo = completeRepo(t);
  repo.write('src/a.js', source.replace('a2', 'changed'));
  const result = runCheck(repo.dir);
  assert.equal(result.status, 1);
  const finding = result.json.findings.find((item) => item.code === 'stale');
  assert.equal(finding.group, 'evidence');
  assert.equal(finding.section, '3. Blocks');
  assert.deepEqual(finding.cited, { path: 'src/a.js', start: 1, end: 3 });
  assert.match(finding.message, /src\/a.js:1-3/);
});

test('a cited block that moved is a warning with its new range', (t) => {
  const repo = completeRepo(t);
  repo.write('src/a.js', 'prefix1\nprefix2\nprefix3\n' + source);
  const result = runCheck(repo.dir);
  assert.equal(result.status, 0);
  const finding = result.json.findings.find((item) => item.code === 'moved');
  assert.equal(finding.level, 'warning');
  assert.deepEqual(finding.moved_to, [4, 6]);
});

test('a block that moved and appears twice is stale', (t) => {
  const repo = completeRepo(t);
  repo.write('src/a.js', 'prefix\n' + source + 'a1\na2\na3\n');
  assert.ok(codes(runCheck(repo.dir)).includes('stale'));
});

test('CRLF in the working tree does not make a citation stale', (t) => {
  const repo = completeRepo(t);
  repo.write('src/a.js', source.replaceAll('\n', '\r\n'));
  assert.equal(runCheck(repo.dir).status, 0);
});

test('deleted file, file missing at the pin and range past the end each have a code', (t) => {
  const repo = completeRepo(t);
  rmSync(join(repo.dir, 'src/a.js'));
  assert.ok(codes(runCheck(repo.dir)).includes('stale'));
  setRows(repo, '| 3. Blocks | `src/none.js:1-2`, `src/a.js:5-9` |');
  const result = runCheck(repo.dir);
  assert.ok(codes(result).includes('missing-at-pin'));
  assert.ok(codes(result).includes('out-of-range'));
});

test('citing the documentation set is a self-citation', (t) => {
  const repo = completeRepo(t);
  setRows(repo, '| 3. Blocks | `README.md:1-2`, `docs/guide.md:3` |');
  assert.equal(codes(runCheck(repo.dir)).filter((code) => code === 'self-citation').length, 2);
});

test('prose in an evidence cell and single-line citations are read correctly', async (t) => {
  const repo = completeRepo(t);
  setRows(repo, '| 3. Blocks | `src/a.js:2`. A search in `src/` found none |');
  const result = runCheck(repo.dir);
  assert.equal(result.status, 0);
  assert.equal(result.json.summary.citations.ok, 1);
  const { parseAppendix } = await import('../skills/documentation/project-docs/scripts/lib/evidence.mjs');
  assert.deepEqual(parseAppendix(read(repo))[0].citations, [{ path: 'src/a.js', start: 2, end: 2 }]);
});

test('a path with spaces is cited and checked', (t) => {
  const repo = completeRepo(t);
  repo.write('src/my file.js', source);
  repo.pin = repo.commit('Add source with spaces');
  setRows(repo, '| 3. Blocks | `src/my file.js:1-2` |');
  assert.equal(runCheck(repo.dir).status, 0);
});

test('an unknown pin commit exits 2 and names the commit and the fix', (t) => {
  const repo = completeRepo(t);
  repo.write('ARCHITECTURE.md', architecture({ commit: '0123abc' }));
  const result = runCheck(repo.dir);
  assert.equal(result.status, 2);
  assert.equal(result.json.error.code, 'pin-unknown');
  assert.match(result.json.error.message, /0123abc/);
  assert.match(result.json.error.message, /git fetch --unshallow/);
});

test('a folder that is not a git repository exits 2; a repo path with spaces works', (t) => {
  const repo = completeRepo(t);
  assert.match(repo.dir, /my repo$/);
  assert.equal(runCheck(repo.dir).status, 0);
  mkdirSync(join(repo.dir, 'plain'));
  // A nested directory is still a repository, so remove the fixture metadata.
  rmSync(join(repo.dir, '.git'), { recursive: true });
  const result = runCheck(repo.dir);
  assert.equal(result.status, 2);
  assert.equal(result.json.error.code, 'not-a-git-repo');
});

test('a Spanish document is parsed the same way', (t) => {
  const repo = completeRepo(t);
  repo.write('ARCHITECTURE.md', read(repo)
    .replace(/Reviewed on .*\n/, `Revisado el 2026-01-02 contra la versi\u00f3n 1.0.0 (commit \`${repo.pin}\`).\n`)
    .replace('## Appendix: evidence', '## Anexo: evidencia'));
  const result = runCheck(repo.dir);
  assert.equal(result.status, 0);
  assert.equal(result.json.pin.version, '1.0.0');
});

test('structure: a complete repo has no findings and exits 0', (t) => {
  const result = runCheck(completeRepo(t).dir);
  assert.equal(result.status, 0);
  assert.deepEqual(result.json.findings, []);
});

test('structure: each missing or malformed piece has its own code', async (t) => {
  const cases = [
    ['missing-readme', (r) => rmSync(join(r.dir, 'README.md'))],
    ['missing-architecture', (r) => rmSync(join(r.dir, 'ARCHITECTURE.md'))],
    ['bad-header', (r) => r.write('ARCHITECTURE.md', read(r).replace(/\(commit `[^`]+`\)/, ''))],
    ['bad-sections', (r) => r.write('ARCHITECTURE.md', read(r).replace('## 3. Section', '## 4. Section'))],
    ['missing-appendix', (r) => r.write('ARCHITECTURE.md', read(r).split('## Appendix')[0])],
    ['bad-decision-name', (r) => r.write('docs/decisions/1-foo.md', '---\nstatus: accepted\ndate: 2026-01-02\n---\n')],
    ['bad-decision-front-matter', (r) => r.write('docs/decisions/0002-invalid.md', '---\ndate: 2026-01-02\n---\n')],
    ['readme-no-architecture-link', (r) => r.write('README.md', read(r, 'README.md').replace('[Architecture](ARCHITECTURE.md)', 'Overview'))],
    ['readme-short-description', (r) => r.write('README.md', read(r, 'README.md').replace('A useful example.', 'x'.repeat(130)))],
    ['readme-order', (r) => r.write('README.md', read(r, 'README.md').replace('## Install', '## License').replace(/## License\n$/, '## Install\n'))],
  ];
  for (const [code, mutate] of cases) await t.test(code, (t) => {
    const repo = completeRepo(t);
    mutate(repo);
    const result = runCheck(repo.dir);
    assert.equal(result.status, 1, result.stdout);
    assert.ok(codes(result).includes(code), result.stdout);
    if (code === 'missing-architecture') assert.equal(result.json.state, 'missing');
  });
});

test('structure: the header needs a version only when the project declares one', (t) => {
  const repo = completeRepo(t);
  repo.write('ARCHITECTURE.md', read(repo).replace(/Reviewed on .*\n/, `Reviewed on 2026-01-02 against commit \`${repo.pin}\`.\n`));
  assert.deepEqual(codes(runCheck(repo.dir)), ['bad-header']);
  rmSync(join(repo.dir, 'package.json'));
  const result = runCheck(repo.dir);
  assert.equal(result.status, 0, result.stdout);
  assert.equal(result.json.project_version, null);
  assert.equal(result.json.pin.version, null);
});

test('structure: README order is recognized in English and Spanish; unknown headings only warn', (t) => {
  const repo = completeRepo(t);
  const original = read(repo, 'README.md');
  repo.write('README.md', original.replace('## Install', '## Instalaci\u00f3n').replace('## Usage', '## Uso').replace('## Contributing', '## Contribuciones').replace('## License', '## Licencia'));
  assert.equal(runCheck(repo.dir).status, 0);
  repo.write('README.md', original.replace(/^## .+$/gm, '## Custom'));
  const result = runCheck(repo.dir);
  assert.equal(result.status, 0);
  assert.equal(result.json.findings.find((f) => f.code === 'readme-sections-unrecognized').level, 'warning');
});

test('links: missing file, missing heading, repeated headings, external links and code fences', (t) => {
  const repo = completeRepo(t);
  const original = read(repo, 'README.md');
  repo.write('README.md', original + '\n[x](docs/none.md)\n[x](ARCHITECTURE.md#nope)\n');
  assert.deepEqual(runCheck(repo.dir).json.findings.filter((f) => f.group === 'links').map((f) => f.code), ['broken-link', 'broken-anchor']);
  repo.write('README.md', original + '\n## Notes\n\n## Notes\n\n[x](#notes-1)\n[x](https://example.invalid/no)\n[x](mailto:example@example.invalid)\n```md\n[x](missing.md)\n```\n~~~md\n[x](missing.md)\n~~~\n');
  assert.equal(runCheck(repo.dir).status, 0);
});

test('version: a header behind the project version warns and still exits 0', (t) => {
  const repo = completeRepo(t);
  repo.write('package.json', '{"version":"1.1.0"}');
  let result = runCheck(repo.dir);
  assert.equal(result.status, 0);
  assert.equal(result.json.findings.find((f) => f.code === 'version-behind').level, 'warning');
  rmSync(join(repo.dir, 'package.json'));
  repo.git('tag', 'v2.0.0');
  result = runCheck(repo.dir);
  assert.equal(result.json.project_version, '2.0.0');
});

test('version: a tag that names one part of the repository is not the project version', (t) => {
  const repo = completeRepo(t);
  repo.write('ARCHITECTURE.md', read(repo, 'ARCHITECTURE.md').replace(/ against version [^ ]+ \(/, ' ('));
  rmSync(join(repo.dir, 'package.json'));
  repo.git('tag', 'skill/demo/v3.0.0');
  let result = runCheck(repo.dir);
  assert.equal(result.json.project_version, null);
  assert.equal(result.status, 0);
  repo.git('tag', 'v1.2.0');
  repo.git('tag', 'demo@9.9.9');
  result = runCheck(repo.dir);
  assert.equal(result.json.project_version, '1.2.0');
});

test('privacy: home paths, secret patterns and private terms are errors that never print the match', (t) => {
  const repo = completeRepo(t);
  const token = 'ghp_' + 'A'.repeat(36);
  repo.write('README.md', read(repo, 'README.md') + `\n/Users/jane/x\n${token}\nAcme-Internal\n`);
  repo.write('terms.txt', '# Private terms\nacme-internal\n');
  const result = runCheck(repo.dir, '--private-terms', join(repo.dir, 'terms.txt'));
  assert.equal(result.status, 1);
  assert.deepEqual(result.json.findings.filter((f) => f.group === 'privacy').map((f) => f.code).sort(), ['local-path', 'private-term', 'secret-pattern']);
  for (const value of ['jane', token, 'acme-internal']) assert.ok(!result.stdout.toLowerCase().includes(value.toLowerCase()));
});

test('privacy: ~/ and $HOME paths are allowed; the default terms file is read from HOME', (t) => {
  const repo = completeRepo(t);
  const original = read(repo, 'README.md') + '\n~/example $HOME/example\n';
  repo.write('README.md', original);
  assert.equal(runCheck(repo.dir).status, 0);
  repo.write('.fixture-home/.config/agent-skills/project-docs/private-terms.txt', 'internal-example\n');
  repo.write('README.md', original + 'INTERNAL-EXAMPLE\n');
  assert.ok(codes(runCheck(repo.dir)).includes('private-term'));
});

test('diagrams: a source without its svg or html is diagram-missing-file', (t) => {
  const repo = completeRepo(t);
  addDiagram(repo);
  rmSync(join(repo.dir, 'docs/architecture/context.svg'));
  rmSync(join(repo.dir, 'docs/architecture/context.html'));
  const result = runCheck(repo.dir);
  assert.equal(result.status, 1);
  assert.equal(codes(result).filter((c) => c === 'diagram-missing-file').length, 2);
});

test('diagrams: sources are classified against the diagram revision', (t) => {
  const repo = completeRepo(t);
  addDiagram(repo);
  assert.equal(runCheck(repo.dir).status, 0);
  repo.write('src/a.js', source.replace('a2', 'changed'));
  let result = runCheck(repo.dir);
  assert.equal(result.status, 1);
  assert.equal(result.json.findings.find((f) => f.code === 'diagram-source-stale').level, 'error');
  repo.write('src/a.js', 'prefix\n' + source);
  result = runCheck(repo.dir);
  assert.equal(result.status, 0);
  const moved = result.json.findings.find((f) => f.code === 'diagram-source-moved');
  assert.equal(moved.level, 'warning');
  assert.deepEqual(moved.moved_to, [2, 4]);
});

test('diagrams: a source that keeps the Archify footer is a diagram-feedback-links warning', (t) => {
  const repo = completeRepo(t);
  addDiagram(repo, repo.pin, { meta: { feedback_links: undefined } });
  let result = runCheck(repo.dir);
  assert.equal(result.status, 0, result.stdout);
  const finding = result.json.findings.find((f) => f.code === 'diagram-feedback-links');
  assert.equal(finding.level, 'warning');
  assert.equal(finding.file, 'docs/architecture/context.archify.json');
  addDiagram(repo, repo.pin, { meta: { feedback_links: true } });
  assert.ok(codes(runCheck(repo.dir)).includes('diagram-feedback-links'));
  addDiagram(repo);
  result = runCheck(repo.dir);
  assert.equal(codes(result).includes('diagram-feedback-links'), false);
});

test('diagrams: context and containers that do not link to each other are diagram-unlinked warnings', (t) => {
  const repo = completeRepo(t);
  addDiagram(repo);
  assert.equal(codes(runCheck(repo.dir)).includes('diagram-unlinked'), false, 'one diagram alone needs no link');
  addDiagram(repo, repo.pin, { name: 'containers' });
  let result = runCheck(repo.dir);
  assert.equal(result.status, 0, result.stdout);
  const unlinked = result.json.findings.filter((f) => f.code === 'diagram-unlinked');
  assert.deepEqual(unlinked.map((f) => [f.file, f.level]), [
    ['docs/architecture/context.archify.json', 'warning'],
    ['docs/architecture/containers.archify.json', 'warning'],
  ]);
  addDiagram(repo, repo.pin, { component: { href: 'containers.html#top' } });
  addDiagram(repo, repo.pin, { name: 'containers', meta: { parentHref: 'context.html?from=containers' } });
  assert.equal(codes(runCheck(repo.dir)).includes('diagram-unlinked'), false);
  addDiagram(repo, repo.pin, { component: { drilldowns: [{ href: 'containers.html', label: 'Containers' }] } });
  assert.equal(codes(runCheck(repo.dir)).includes('diagram-unlinked'), false, 'drilldowns count as a link');
  addDiagram(repo, repo.pin, { component: { href: 'other.html' } });
  assert.deepEqual(runCheck(repo.dir).json.findings.filter((f) => f.code === 'diagram-unlinked').map((f) => f.file), ['docs/architecture/context.archify.json']);
});

test('diagrams: invalid JSON or an unknown revision is reported, not thrown', (t) => {
  const repo = completeRepo(t);
  addDiagram(repo);
  repo.write('docs/architecture/context.archify.json', '{');
  let result = runCheck(repo.dir);
  assert.equal(result.status, 1);
  assert.ok(codes(result).includes('diagram-bad-source'));
  assert.equal(result.stderr, '');
  addDiagram(repo, '0123abc');
  result = runCheck(repo.dir);
  assert.equal(result.status, 1);
  assert.ok(codes(result).includes('diagram-pin-unknown'));
  assert.equal(result.stderr, '');
});

test('--repin moves the pin to HEAD, rewrites moved ranges and nothing else', (t) => {
  const repo = completeRepo(t);
  addDiagram(repo);
  repo.write('src/a.js', 'prefix1\nprefix2\nprefix3\n' + source);
  repo.write('package.json', '{"version":"1.2.0"}');
  const head = repo.commit('Move source');
  const diagram = read(repo, 'docs/architecture/context.archify.json');
  const result = runCheck(repo.dir, '--repin', '--date', '2026-03-04');
  assert.equal(result.status, 0, result.stdout);
  assert.match(read(repo), new RegExp('`' + head.slice(0, 7) + '`'));
  assert.match(read(repo), /2026-03-04/);
  assert.match(read(repo), /version 1\.2\.0/);
  assert.match(read(repo), /src\/a.js:4-6/);
  assert.equal(read(repo, 'docs/architecture/context.archify.json'), diagram);
  assert.equal(repo.git('status', '--porcelain'), 'M ARCHITECTURE.md');
  assert.equal(result.json.repin.commit, head.slice(0, 7));
  assert.deepEqual(result.json.repin.moved, [{ section: '3. Blocks', path: 'src/a.js', from: [1, 3], to: [4, 6] }]);
  assert.equal(result.json.summary.citations.moved, 0);
  assert.equal(runCheck(repo.dir).json.summary.citations.moved, 0);
});

test('--repin refuses while a citation is stale or a cited file is dirty', (t) => {
  const repo = completeRepo(t);
  const original = read(repo);
  repo.write('src/a.js', source.replace('a2', 'changed'));
  assert.equal(runCheck(repo.dir, '--repin').status, 1);
  assert.equal(read(repo), original);
  repo.write('src/a.js', 'prefix\n' + source);
  const result = runCheck(repo.dir, '--repin');
  assert.equal(result.status, 2);
  assert.equal(result.json.error.code, 'dirty-cited-files');
  assert.equal(read(repo), original);
});

test('with --reviewed, --repin accepts stale citations as they stand at HEAD and lists them', (t) => {
  const repo = completeRepo(t);
  repo.write('src/a.js', source.replace('a2', 'changed'));
  repo.commit('Change source');
  const result = runCheck(repo.dir, '--repin', '--reviewed');
  assert.equal(result.status, 0, result.stdout);
  assert.deepEqual(result.json.repin.accepted, [{ section: '3. Blocks', path: 'src/a.js', start: 1, end: 3 }]);
  assert.equal(runCheck(repo.dir).status, 0);
});

test('--reviewed refuses missing or out-of-range HEAD citations and dirty files', async (t) => {
  for (const kind of ['missing', 'range', 'dirty']) await t.test(kind, (t) => {
    const repo = completeRepo(t);
    const original = read(repo);
    if (kind === 'missing') rmSync(join(repo.dir, 'src/a.js'));
    else repo.write('src/a.js', kind === 'range' ? 'changed\n' : source.replace('a2', 'changed'));
    if (kind !== 'dirty') repo.commit('Change source');
    const result = runCheck(repo.dir, '--repin', '--reviewed');
    assert.equal(result.status, kind === 'dirty' ? 2 : 1);
    assert.equal(read(repo), original);
  });
});

test('--preflight reports the facts the commands branch on', (t) => {
  const repo = makeRepo(t);
  let result = runCheck(repo.dir, '--preflight');
  assert.equal(result.status, 0);
  assert.equal(result.json.git, true);
  assert.equal(result.json.architecture, false);
  assert.equal(result.json.readme, false);
  assert.equal(result.json.dirty, false);
  assert.equal(result.json.shallow, false);
  assert.ok(typeof result.json.chrome === 'string' || result.json.chrome === null);
  assert.ok(typeof result.json.archify === 'string' || result.json.archify === null);
  assert.ok(typeof result.json.archify_version === 'string' || result.json.archify_version === null);
  assert.equal(result.json.node, process.versions.node);
  assert.ok('branch' in result.json && 'project_version' in result.json);
  rmSync(join(repo.dir, '.git'), { recursive: true });
  result = runCheck(repo.dir, '--preflight');
  assert.equal(result.status, 0);
  assert.equal(result.json.git, false);
});

test('--preflight reads the Archify version from the package next to its command', (t) => {
  const repo = makeRepo(t);
  const home = join(repo.dir, '.fixture-home', '.agents', 'skills', 'archify');
  mkdirSync(join(home, 'bin'), { recursive: true });
  writeFileSync(join(home, 'bin', 'archify.mjs'), '');
  let result = runCheck(repo.dir, '--preflight');
  assert.equal(result.json.archify, join(home, 'bin', 'archify.mjs'));
  assert.equal(result.json.archify_version, null, 'no package.json gives no version');
  writeFileSync(join(home, 'package.json'), JSON.stringify({ name: 'archify', version: '3.3.0' }));
  result = runCheck(repo.dir, '--preflight');
  assert.equal(result.json.archify_version, '3.3.0');
});

test('invalid flags and a non-directory repository have structured usage errors', (t) => {
  const repo = completeRepo(t);
  for (const args of [['--nope'], ['--date', '2026-01-02'], ['--reviewed'], ['--repin', '--date', '2026-02-30']]) {
    const result = runCheck(repo.dir, ...args);
    assert.equal(result.status, 2);
    assert.equal(result.json.error.code, 'bad-usage');
  }
  const result = runCheck(join(repo.dir, 'absent'));
  assert.equal(result.status, 2);
  assert.equal(result.json.error.code, 'not-a-directory');
  assert.equal(existsSync(join(repo.dir, 'absent')), false);
});

test('diagrams: documentation sources are diagram-self-citation errors even when unchanged', (t) => {
  const repo = completeRepo(t);
  addDiagram(repo);
  repo.write('docs/architecture/context.archify.json', JSON.stringify({
    meta: { repository: { revision: repo.pin }, feedback_links: false },
    components: [{ id: 'overview', sources: [{ path: 'README.md', line: 1, end_line: 3 }] }],
  }));
  const result = runCheck(repo.dir);
  assert.equal(result.status, 1, result.stdout);
  const findings = result.json.findings.filter((f) => f.group === 'diagrams');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].code, 'diagram-self-citation');
  assert.equal(findings[0].level, 'error');
  assert.deepEqual(findings[0].cited, { path: 'README.md', start: 1, end: 3 });
});

test('--reviewed accepts new files and rewritten ranges valid only at HEAD', async (t) => {
  for (const kind of ['new-file', 'new-range']) await t.test(kind, (t) => {
    const repo = completeRepo(t);
    if (kind === 'new-file') {
      repo.write('src/new.js', source);
      setRows(repo, '| 3. Blocks | `src/new.js:1-3` |');
    } else {
      repo.write('src/a.js', source + 'a7\na8\na9\n');
      setRows(repo, '| 3. Blocks | `src/a.js:7-9` |');
    }
    repo.commit('Extend source');
    const original = read(repo);
    const plain = runCheck(repo.dir, '--repin');
    assert.equal(plain.status, 1);
    assert.ok(codes(plain).includes(kind === 'new-file' ? 'missing-at-pin' : 'out-of-range'));
    assert.equal(read(repo), original);
    const reviewed = runCheck(repo.dir, '--repin', '--reviewed');
    assert.equal(reviewed.status, 0, reviewed.stdout);
    assert.deepEqual(reviewed.json.repin.accepted, [{ section: '3. Blocks', path: kind === 'new-file' ? 'src/new.js' : 'src/a.js', start: kind === 'new-file' ? 1 : 7, end: kind === 'new-file' ? 3 : 9 }]);
    assert.equal(runCheck(repo.dir).status, 0);
  });
});

test('--repin without --date writes the local day, not the UTC day', (t) => {
  // At any instant one of these two zones is on a different calendar day than UTC.
  const previous = process.env.TZ;
  t.after(() => (previous === undefined ? delete process.env.TZ : (process.env.TZ = previous)));
  for (const zone of ['Pacific/Kiritimati', 'Etc/GMT+12']) {
    const repo = completeRepo(t);
    process.env.TZ = zone;
    const result = runCheck(repo.dir, '--repin');
    const local = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    assert.equal(result.status, 0, result.stdout);
    assert.equal(result.json.repin.date, local, zone);
  }
});

test('--preflight says which private terms list is in use, or that there is none', (t) => {
  const repo = makeRepo(t);
  assert.equal(runCheck(repo.dir, '--preflight').json.private_terms, null);
  const fallback = join(repo.dir, '.fixture-home', '.config', 'agent-skills', 'project-docs', 'private-terms.txt');
  repo.write('.fixture-home/.config/agent-skills/project-docs/private-terms.txt', 'acme-internal\n');
  assert.equal(runCheck(repo.dir, '--preflight').json.private_terms, fallback);
  repo.write('terms.txt', 'acme-internal\n');
  assert.equal(runCheck(repo.dir, '--preflight', '--private-terms', join(repo.dir, 'terms.txt')).json.private_terms, join(repo.dir, 'terms.txt'));
});

test('evidence: a row with more than five citations warns and still exits 0', (t) => {
  const repo = completeRepo(t);
  const row = (count) => `| 3. Blocks | ${Array.from({ length: count }, (_, i) => `\`src/a.js:${i + 1}\``).join(', ')} |`;
  repo.write('ARCHITECTURE.md', architecture({ commit: repo.pin, rows: row(5) }));
  assert.deepEqual(runCheck(repo.dir).json.findings, []);
  repo.write('ARCHITECTURE.md', architecture({ commit: repo.pin, rows: row(6) }));
  const result = runCheck(repo.dir);
  assert.equal(result.status, 0);
  const finding = result.json.findings.find((f) => f.code === 'too-many-citations');
  assert.equal(finding.level, 'warning');
  assert.match(finding.message, /3\. Blocks: Expected at most 5 citations in a row; received 6\./);
});

test('evidence: a citation that covers a version or revision line warns, because it goes stale at every release', (t) => {
  const repo = makeRepo(t, {
    'src/a.js': source,
    'catalog.json': '{\n  "schema": 1,\n  "revision": 7,\n  "entries": []\n}\n',
    'pom.xml': '<project>\n  <version>1.0.0</version>\n  <name>x</name>\n</project>\n',
    'LICENSE': 'MIT\n',
    'README.md': '# Example\n\n> A useful example.\n\n[Architecture](ARCHITECTURE.md)\n\n## Install\n\n## Usage\n\n## Contributing\n\n## License\n',
    'docs/decisions/0001-use-modules.md': '---\nstatus: accepted\ndate: 2026-01-02\n---\n\n# Use modules\n',
  });
  const pin = repo.commit('Create source');
  repo.write('ARCHITECTURE.md', architecture({ commit: pin, rows: '| 3. Blocks | `catalog.json:2`, `catalog.json:4`, `pom.xml:3` |' }));
  assert.deepEqual(runCheck(repo.dir).json.findings.filter((f) => f.code === 'volatile-citation'), []);
  repo.write('ARCHITECTURE.md', architecture({ commit: pin, rows: '| 3. Blocks | `catalog.json:1-4`, `pom.xml:1-3` |' }));
  const result = runCheck(repo.dir);
  assert.equal(result.status, 0);
  const found = result.json.findings.filter((f) => f.code === 'volatile-citation');
  assert.deepEqual(found.map((f) => f.level), ['warning', 'warning']);
  assert.match(found[0].message, /catalog\.json:1-4 \(3\. Blocks\): Expected a range without a version or revision line; received one at line 3\./);
});

test('--preflight says which preferences file is in use, or that there is none', (t) => {
  const repo = completeRepo(t);
  assert.equal(runCheck(repo.dir, '--preflight').json.preferences, null);
  const file = join(repo.dir, '.fixture-home', '.config/agent-skills/project-docs/preferences.md');
  repo.write('.fixture-home/.config/agent-skills/project-docs/preferences.md', '# Preferences\n');
  assert.equal(runCheck(repo.dir, '--preflight').json.preferences, file);
});

test('budget: a long document, a long table and a missing summary warn and still exit 0', (t) => {
  const repo = completeRepo(t);
  const withSummary = read(repo, 'ARCHITECTURE.md');
  assert.deepEqual(runCheck(repo.dir).json.findings, []);

  repo.write('ARCHITECTURE.md', withSummary.replace('In short:\n\n- It does one thing.\n\n', ''));
  let result = runCheck(repo.dir);
  assert.equal(result.status, 0);
  assert.deepEqual(result.json.findings.map((f) => [f.code, f.level]), [['no-summary', 'warning']]);

  const table = (rows) => `| Block | Role |\n|---|---|\n${Array.from({ length: rows }, (_, i) => `| b${i} | r${i} |`).join('\n')}\n`;
  repo.write('ARCHITECTURE.md', withSummary.replace('## 3. Section\n\nDescription.\n', `## 3. Section\n\n${table(7)}`));
  assert.deepEqual(runCheck(repo.dir).json.findings, []);
  repo.write('ARCHITECTURE.md', withSummary.replace('## 3. Section\n\nDescription.\n', `## 3. Section\n\n${table(8)}`));
  result = runCheck(repo.dir);
  assert.equal(result.status, 0);
  assert.match(result.json.findings.find((f) => f.code === 'long-table').message, /3\. Section: Expected at most 7 rows in a table; received 8\./);

  repo.write('ARCHITECTURE.md', withSummary.replace('## 4. Section\n\nDescription.\n', `## 4. Section\n\n${'word '.repeat(1500)}\n`));
  result = runCheck(repo.dir);
  assert.equal(result.status, 0);
  const over = result.json.findings.find((f) => f.code === 'over-budget');
  assert.equal(over.level, 'warning');
  assert.match(over.message, /Expected at most 1500 words before the appendix; received 15\d\d\./);
});

test('guides: a line citation inside a guide warns, because only the appendix is verified', (t) => {
  const repo = completeRepo(t);
  repo.write('docs/setup.md', '# Setup\n\nThe port is `127.0.0.1:8080` and the file is `src/a.js`.\n');
  assert.deepEqual(runCheck(repo.dir).json.findings, []);
  repo.write('docs/setup.md', '# Setup\n\nSee `src/a.js:1-3` and `src/a.js:5`.\n');
  const result = runCheck(repo.dir);
  assert.equal(result.status, 0);
  const found = result.json.findings.filter((f) => f.code === 'guide-citation');
  assert.equal(found.length, 1);
  assert.equal(found[0].level, 'warning');
  assert.equal(found[0].file, 'docs/setup.md');
  assert.match(found[0].message, /Expected no line citations in a guide; received 2\./);
});
