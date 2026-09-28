import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
  id: 'upstream', name: 'Skill upstream', domain: 'pruebas', type: 'external',
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
      write(root, entry.path, `# ${entry.name}\n`);
      write(root, `${base}/CHANGELOG.md`, '## v1.0.0\n');
      write(root, `${base}/RELEASE_NOTES.md`, 'Notas v1.0.0\n');
      git(root, 'add', '.');
      git(root, 'commit', '-qm', `fixture ${entry.id}`);
      git(root, 'tag', entry.ref);
    },
  };
}

test('el catálogo vacío corresponde a revisión 1 y no crea ofertas', (t) => {
  const f = fixture(t);
  assert.deepEqual(checkCatalog(f.root).entries, []);
});

test('dos propias por dominio y una externa conservan refs y propietarios independientes', (t) => {
  const f = fixture(t);
  const a = own('programacion', 'alpha');
  const b = own('pruebas', 'beta');
  f.tagged(a);
  f.tagged(b);
  const index = { schema_version: 1, revision: 2, entries: [a, b, external()] };
  f.publish(index);
  assert.deepEqual(checkCatalog(f.root).entries, index.entries);
  const readme = readFileSync(join(f.root, 'README.md'), 'utf8');
  assert.match(readme, /skills\/programacion\/alpha\/SKILL\.md/);
  assert.match(readme, /skills\/pruebas\/beta\/SKILL\.md/);
  assert.match(readme, /Other Maintainers/);
  assert.match(readme, /Revisión del índice: \*\*2\*\*/);
});

test('retiro conserva motivo y ref visible, sin modificar copias en un host', (t) => {
  const f = fixture(t);
  const copy = join(f.root, 'host-copy.txt');
  writeFileSync(copy, 'bytes instalados');
  const retired = { ...external(), status: 'retired', retirement_reason: 'Mantenimiento upstream finalizado' };
  f.publish({ schema_version: 1, revision: 2, entries: [retired] });
  checkCatalog(f.root);
  const readme = readFileSync(join(f.root, 'README.md'), 'utf8');
  assert.match(readme, /No hay ofertas vigentes/);
  assert.match(readme, /Mantenimiento upstream finalizado/);
  assert.match(readme, /v2\.3\.0/);
  assert.equal(readFileSync(copy, 'utf8'), 'bytes instalados');
});

test('una propia retirada conserva el tag histórico aunque se retire su directorio local', (t) => {
  const f = fixture(t);
  const entry = own('programacion', 'alpha');
  f.tagged(entry);
  rmSync(join(f.root, dirname(entry.path)), { recursive: true });
  f.publish({ schema_version: 1, revision: 2, entries: [{ ...entry, status: 'retired', retirement_reason: 'Sustituida' }] });
  assert.match(readFileSync(join(f.root, 'README.md'), 'utf8'), /Sustituida/);
  assert.equal(checkCatalog(f.root).entries[0].ref, entry.ref);
});

test('la comprobación tras el commit compara la revisión con el padre', (t) => {
  const f = fixture(t);
  f.publish({ schema_version: 1, revision: 1, entries: [external()] });
  write(f.root, 'catalog/index.json', JSON.stringify({ schema_version: 1, revision: 1, entries: [external()] }, null, 4));
  git(f.root, 'add', '.');
  git(f.root, 'commit', '-qm', 'oferta sin revisión');
  assert.throws(() => checkCatalog(f.root), /incremento de revision/);
});

test('rechaza contradicciones editoriales y refs inválidas con fallos concretos', async (t) => {
  const cases = [
    ['revisión sin bump', (f, entry, index) => { index.revision = 1; }, /incremento de revision/],
    ['README desfasado', (f) => write(f.root, 'README.md', `# Fixture\n\n${render({ schema_version: 1, revision: 1, entries: [] })}\n`), /README no coincide/],
    ['tag inexistente', (f, entry) => { entry.ref = 'skill/alpha/v9.0.0'; }, /tag .* inexistente/],
    ['árbol etiquetado incompleto', (f, entry) => {
      git(f.root, 'tag', '-d', entry.ref);
      git(f.root, 'rm', '-q', entry.release_notes);
      git(f.root, 'commit', '-qm', 'sin notas');
      git(f.root, 'tag', entry.ref);
      write(f.root, entry.release_notes, 'nota local');
    }, /no contiene .*RELEASE_NOTES/],
    ['licencia ausente', (f, entry) => { entry.license = undefined; }, /licencia aplicable/],
    ['archivo de licencia ausente', (f, entry) => { entry.license = `skills/programacion/alpha/LICENSE`; }, /falta .*LICENSE/],
    ['historial ausente', (f, entry) => { entry.changelog = undefined; }, /historial y notas/],
    ['atribución propia falsa', (f, entry) => { entry.lifecycle_owner = 'Otro'; }, /responsable propio/],
    ['verificación sin evidencia', (f, entry) => { entry.data_permissions = { status: 'verified', summary: 'sin permisos' }; }, /procedencia de verificación/],
    ['evidencia contradictoria', (f, entry) => { entry.data_permissions = { status: 'unverified', summary: 'permisos revisados' }; }, /no verificados/],
    ['retiro sin motivo', (f, entry) => { entry.status = 'retired'; }, /motivo de retiro/],
  ];
  for (const [name, mutate, error] of cases) {
    await t.test(name, (caseT) => {
      const f = fixture(caseT);
      const entry = own('programacion', 'alpha');
      f.tagged(entry);
      const index = { schema_version: 1, revision: 2, entries: [entry] };
      mutate(f, entry, index);
      if (name !== 'README desfasado') f.publish(index);
      else {
        f.publish(index);
        mutate(f, entry, index);
      }
      assert.throws(() => checkCatalog(f.root), error);
    });
  }
});

test('una referencia externa no se apropia del lifecycle ni acepta ref móvil', (t) => {
  const f = fixture(t);
  const upstream = external();
  upstream.lifecycle_owner = 'Tacuchi';
  f.publish({ schema_version: 1, revision: 2, entries: [upstream] });
  assert.throws(() => checkCatalog(f.root), /falsa atribución upstream/);
  upstream.lifecycle_owner = 'Other Maintainers';
  upstream.ref = 'main';
  f.publish({ schema_version: 1, revision: 2, entries: [upstream] });
  assert.throws(() => checkCatalog(f.root), /ref externa/);
});

test('una afirmación verificada requiere procedencia HTTPS', (t) => {
  const f = fixture(t);
  const upstream = external();
  upstream.data_permissions = { status: 'verified', summary: 'sin acceso a red', evidence_url: 'https://github.com/other/skills/blob/v2.3.0/SKILL.md' };
  f.publish({ schema_version: 1, revision: 2, entries: [upstream] });
  assert.match(render(checkCatalog(f.root)), /sin acceso a red/);
});
