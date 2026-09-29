import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { checkCatalog, render } from '../scripts/catalog.mjs';

function git(root, ...args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function write(root, path, content) {
  const absolute = join(root, path);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, content);
}

function own(domain, slug) {
  const base = `skills/${domain}/${slug}`;
  return {
    id: slug, name: `Skill ${slug}`, domain, type: 'own',
    source_url: 'https://github.com/Tacuchi/agent-skills',
    path: `${base}/SKILL.md`, ref: `skill/${slug}/v1.0.0`,
    lifecycle_owner: 'Tacuchi', status: 'active',
    data_permissions: { status: 'unverified', summary: 'no verificados' },
    license: 'root', changelog: `${base}/CHANGELOG.md`, release_notes: `${base}/RELEASE_NOTES.md`,
  };
}

const external = () => ({
  id: 'upstream', name: 'Skill upstream', domain: 'testing', type: 'external',
  source_url: 'https://github.com/other/skills', path: 'packages/quality/SKILL.md',
  ref: 'v2.3.0', lifecycle_owner: 'Other Maintainers', status: 'active',
  data_permissions: { status: 'unverified', summary: 'no verificados' },
});

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'catalog-fixture-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  git(root, 'init', '-q');
  git(root, 'config', 'user.name', 'Fixture');
  git(root, 'config', 'user.email', 'fixture@example.test');
  write(root, 'LICENSE', 'MIT fixture\n');
  const index = { schema_version: 1, revision: 1, entries: [] };
  write(root, 'catalog/index.json', JSON.stringify(index));
  write(root, 'README.md', `# Fixture\n\n${render(index)}\n`);
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'base');
  return {
    root,
    publish(next) {
      write(root, 'catalog/index.json', JSON.stringify(next));
      write(root, 'README.md', `# Fixture\n\n${render(next)}\n`);
    },
    tagged(entry) {
      const base = dirname(entry.path);
      write(root, entry.path, `---\nname: ${entry.id}\ndescription: ${entry.name}\n---\n\n# ${entry.name}\n`);
      write(root, `${base}/CHANGELOG.md`, '## v1.0.0\n');
      write(root, `${base}/RELEASE_NOTES.md`, 'Notes v1.0.0\n');
      git(root, 'add', '.');
      git(root, 'commit', '-qm', `fixture ${entry.id}`);
      git(root, 'tag', entry.ref);
    },
  };
}

test('the empty catalog is revision 1 and creates no offers', (t) => {
  const f = fixture(t);
  assert.deepEqual(checkCatalog(f.root).entries, []);
});

test('two own offers in different domains and one external keep independent refs and owners', (t) => {
  const f = fixture(t);
  const a = own('programming', 'alpha');
  const b = own('testing', 'beta');
  f.tagged(a);
  f.tagged(b);
  const index = { schema_version: 1, revision: 2, entries: [a, b, external()] };
  f.publish(index);
  assert.deepEqual(checkCatalog(f.root).entries, index.entries);
  const readme = readFileSync(join(f.root, 'README.md'), 'utf8');
  assert.match(readme, /skills\/programming\/alpha\/SKILL\.md/);
  assert.match(readme, /skills\/testing\/beta\/SKILL\.md/);
  assert.match(readme, /Other Maintainers/);
  assert.match(readme, /Index revision: \*\*2\*\*/);
});

test('a retirement keeps its reason and visible ref, without changing copies on a host', (t) => {
  const f = fixture(t);
  const copy = join(f.root, 'host-copy.txt');
  writeFileSync(copy, 'installed bytes');
  const retired = { ...external(), status: 'retired', retirement_reason: 'Upstream maintenance ended' };
  f.publish({ schema_version: 1, revision: 2, entries: [retired] });
  checkCatalog(f.root);
  const readme = readFileSync(join(f.root, 'README.md'), 'utf8');
  assert.match(readme, /No active offers/);
  assert.match(readme, /Upstream maintenance ended/);
  assert.match(readme, /v2\.3\.0/);
  assert.equal(readFileSync(copy, 'utf8'), 'installed bytes');
});

test('a retired own offer keeps its historical tag even when its local directory is removed', (t) => {
  const f = fixture(t);
  const entry = own('programming', 'alpha');
  f.tagged(entry);
  rmSync(join(f.root, dirname(entry.path)), { recursive: true });
  f.publish({ schema_version: 1, revision: 2, entries: [{ ...entry, status: 'retired', retirement_reason: 'Superseded' }] });
  assert.match(readFileSync(join(f.root, 'README.md'), 'utf8'), /Superseded/);
  assert.equal(checkCatalog(f.root).entries[0].ref, entry.ref);
});

test('rejects a symlinked SKILL.md in the checkout even when the tag has a regular file', (t) => {
  const f = fixture(t);
  const entry = own('programming', 'alpha');
  f.tagged(entry);
  rmSync(join(f.root, entry.path));
  symlinkSync('CHANGELOG.md', join(f.root, entry.path));
  f.publish({ schema_version: 1, revision: 2, entries: [entry] });
  assert.throws(() => checkCatalog(f.root), /SKILL\.md.*regular file/);
});

test('rejects a symlinked SKILL.md in the tag even when the checkout has a regular file', (t) => {
  const f = fixture(t);
  const entry = own('programming', 'alpha');
  f.tagged(entry);
  git(f.root, 'tag', '-d', entry.ref);
  rmSync(join(f.root, entry.path));
  symlinkSync('CHANGELOG.md', join(f.root, entry.path));
  git(f.root, 'add', '.');
  git(f.root, 'commit', '-qm', 'skill symlinked in tag');
  git(f.root, 'tag', entry.ref);
  rmSync(join(f.root, entry.path));
  write(f.root, entry.path, `---\nname: alpha\ndescription: Skill alpha\n---\n`);
  f.publish({ schema_version: 1, revision: 2, entries: [entry] });
  assert.throws(() => checkCatalog(f.root), /tag .*SKILL\.md.*100644 blob/);
});

test('rejects a SKILL.md without name and description in the tag', (t) => {
  const f = fixture(t);
  const entry = own('programming', 'alpha');
  f.tagged(entry);
  git(f.root, 'tag', '-d', entry.ref);
  write(f.root, entry.path, '# Skill without frontmatter\n');
  git(f.root, 'add', '.');
  git(f.root, 'commit', '-qm', 'skill without frontmatter');
  git(f.root, 'tag', entry.ref);
  write(f.root, entry.path, `---\nname: alpha\ndescription: Skill alpha\n---\n`);
  f.publish({ schema_version: 1, revision: 2, entries: [entry] });
  assert.throws(() => checkCatalog(f.root), /tag .*SKILL\.md.*frontmatter/);
});

test('rejects a SKILL.md with a plain scalar that is not valid YAML in the tag', (t) => {
  const f = fixture(t);
  const entry = own('programming', 'alpha');
  f.tagged(entry);
  git(f.root, 'tag', '-d', entry.ref);
  write(f.root, entry.path, `---\nname: alpha\ndescription: Coordinates agents: delegates tasks\n---\n`);
  git(f.root, 'add', '.');
  git(f.root, 'commit', '-qm', 'skill with invalid yaml');
  git(f.root, 'tag', entry.ref);
  f.publish({ schema_version: 1, revision: 2, entries: [entry] });
  assert.throws(() => checkCatalog(f.root), /tag .*SKILL\.md.*invalid YAML.*description/);
});

test('the check after the commit compares the revision with the parent', (t) => {
  const f = fixture(t);
  f.publish({ schema_version: 1, revision: 1, entries: [external()] });
  write(f.root, 'catalog/index.json', JSON.stringify({ schema_version: 1, revision: 1, entries: [external()] }, null, 4));
  git(f.root, 'add', '.');
  git(f.root, 'commit', '-qm', 'offer without revision');
  assert.throws(() => checkCatalog(f.root), /revision increment/);
});

test('rejects editorial contradictions and invalid refs with concrete failures', async (t) => {
  const cases = [
    ['revision without bump', (f, entry, index) => { index.revision = 1; }, /revision increment/],
    ['stale README', (f) => write(f.root, 'README.md', `# Fixture\n\n${render({ schema_version: 1, revision: 1, entries: [] })}\n`), /README does not match/],
    ['missing tag', (f, entry) => { entry.ref = 'skill/alpha/v9.0.0'; }, /tag .* does not exist/],
    ['incomplete tagged tree', (f, entry) => {
      git(f.root, 'tag', '-d', entry.ref);
      git(f.root, 'rm', '-q', entry.release_notes);
      git(f.root, 'commit', '-qm', 'no notes');
      git(f.root, 'tag', entry.ref);
      write(f.root, entry.release_notes, 'local note');
    }, /does not contain .*RELEASE_NOTES/],
    ['missing license', (f, entry) => { entry.license = undefined; }, /applicable license/],
    ['missing license file', (f, entry) => { entry.license = `skills/programming/alpha/LICENSE`; }, /missing .*LICENSE/],
    ['missing changelog', (f, entry) => { entry.changelog = undefined; }, /changelog and release notes/],
    ['false own attribution', (f, entry) => { entry.lifecycle_owner = 'Someone else'; }, /own source or owner/],
    ['verification without evidence', (f, entry) => { entry.data_permissions = { status: 'verified', summary: 'no permissions' }; }, /verification provenance/],
    ['contradictory evidence', (f, entry) => { entry.data_permissions = { status: 'unverified', summary: 'permissions reviewed' }; }, /unverified entry cannot claim evidence/],
    ['retirement without reason', (f, entry) => { entry.status = 'retired'; }, /retirement reason/],
  ];
  for (const [name, mutate, error] of cases) {
    await t.test(name, (caseT) => {
      const f = fixture(caseT);
      const entry = own('programming', 'alpha');
      f.tagged(entry);
      const index = { schema_version: 1, revision: 2, entries: [entry] };
      mutate(f, entry, index);
      if (name !== 'stale README') f.publish(index);
      else {
        f.publish(index);
        mutate(f, entry, index);
      }
      assert.throws(() => checkCatalog(f.root), error);
    });
  }
});

test('an external reference does not take over the lifecycle or accept a moving ref', (t) => {
  const f = fixture(t);
  const upstream = external();
  upstream.lifecycle_owner = 'Tacuchi';
  f.publish({ schema_version: 1, revision: 2, entries: [upstream] });
  assert.throws(() => checkCatalog(f.root), /false upstream attribution/);
  upstream.lifecycle_owner = 'Other Maintainers';
  upstream.ref = 'main';
  f.publish({ schema_version: 1, revision: 2, entries: [upstream] });
  assert.throws(() => checkCatalog(f.root), /external ref/);
});

test('a verified claim needs evidence anchored to the commit or tag of the offer', (t) => {
  const f = fixture(t);
  const upstream = external();
  upstream.data_permissions = { status: 'verified', summary: 'no network access', evidence_url: `https://github.com/other/skills/blob/${'a'.repeat(40)}/SKILL.md` };
  f.publish({ schema_version: 1, revision: 2, entries: [upstream] });
  assert.match(render(checkCatalog(f.root)), /no network access/);
  upstream.data_permissions.evidence_url = 'https://github.com/other/skills/blob/main/SKILL.md';
  f.publish({ schema_version: 1, revision: 2, entries: [upstream] });
  assert.throws(() => checkCatalog(f.root), /evidence.*immutable ref/);
  upstream.data_permissions.evidence_url = 'https://example.com/info';
  f.publish({ schema_version: 1, revision: 2, entries: [upstream] });
  assert.throws(() => checkCatalog(f.root), /evidence.*immutable ref/);
  upstream.ref = 'abcdef0';
  upstream.data_permissions.evidence_url = 'https://github.com/other/skills/blob/abcdef0/SKILL.md';
  f.publish({ schema_version: 1, revision: 2, entries: [upstream] });
  assert.throws(() => checkCatalog(f.root), /evidence.*immutable ref/);
});

test('an own offer can anchor its evidence to its individual tag', (t) => {
  const f = fixture(t);
  const entry = own('programming', 'alpha');
  f.tagged(entry);
  entry.data_permissions = { status: 'verified', summary: 'no network access', evidence_url: `https://github.com/Tacuchi/agent-skills/blob/${entry.ref}/skills/programming/alpha/SKILL.md` };
  f.publish({ schema_version: 1, revision: 2, entries: [entry] });
  assert.equal(checkCatalog(f.root).entries[0].id, 'alpha');
});
