import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const offers = [
  ['design', 'ui-authoring'],
  ['architecture', 'system-diagrams'],
  ['data', 'sql-authoring'],
];
const referenceBySlug = {
  'ui-authoring': 'recorridos-y-pantallas.md',
  'system-diagrams': 'c4-y-motores.md',
  'sql-authoring': 'dialecto-y-migraciones.md',
};

function copyOffer(t, domain, slug) {
  const fixture = mkdtempSync(join(tmpdir(), `${slug}-isolated-`));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  const source = join(root, 'skills', domain, slug);
  const target = join(fixture, slug);
  mkdirSync(target);
  for (const name of ['SKILL.md', 'CHANGELOG.md', 'RELEASE_NOTES.md', 'LICENSE']) {
    copyFileSync(join(source, name), join(target, name));
  }
  mkdirSync(join(target, 'assets'));
  for (const name of readdirSync(join(source, 'assets'))) {
    copyFileSync(join(source, 'assets', name), join(target, 'assets', name));
  }
  if (existsSync(join(source, 'references'))) {
    mkdirSync(join(target, 'references'));
    for (const name of readdirSync(join(source, 'references'))) {
      copyFileSync(join(source, 'references', name), join(target, 'references', name));
    }
  }
  return { fixture, target, skill: readFileSync(join(target, 'SKILL.md'), 'utf8') };
}

function checkLocalLinks(markdown, location, target) {
  let links = 0;
  for (const [, href] of markdown.matchAll(/\]\(([^)]+)\)/g)) {
    if (/^[a-z]+:\/\//i.test(href)) continue;
    const path = href.split('#', 1)[0];
    assert.ok(path && !isAbsolute(path), `enlace local relativo: ${href}`);
    const linked = resolve(location, path);
    const within = relative(target, linked);
    assert.ok(within && !within.startsWith('..') && !isAbsolute(within), `enlace dentro de la oferta: ${href}`);
    assert.ok(existsSync(linked), `enlace existente: ${href}`);
    links++;
  }
  return links;
}

test('cada oferta se adquiere sola con sus enlaces, titular, historia y licencia', async (t) => {
  for (const [domain, slug] of offers) {
    await t.test(slug, (caseT) => {
      const { fixture, target, skill } = copyOffer(caseT, domain, slug);
      assert.deepEqual(readdirSync(fixture), [slug]);
      assert.match(skill, new RegExp(`^---\nname: ${slug}\ndescription: .+\n---`, 'm'));
      assert.doesNotMatch(skill, /\baw\b|\.workflow\/|skills\/(?:design\/ui-authoring|architecture\/system-diagrams|data\/sql-authoring)\/SKILL\.md/);
      const reference = referenceBySlug[slug];
      assert.deepEqual(readdirSync(join(target, 'references')), [reference]);
      assert.ok(skill.includes(`](references/${reference})`), `${slug}: referencia alcanzable desde SKILL.md`);
      assert.ok(checkLocalLinks(skill, target, target) >= 2, `${slug}: enlaces locales verificados`);
      const details = readFileSync(join(target, 'references', reference), 'utf8');
      assert.doesNotMatch(details, /\bWorkline\b|\baw\b|\.workflow\/|docs\/(?:designs|diagrams|scripts)\/|\bQTC\b/i);
      checkLocalLinks(details, join(target, 'references'), target);
      assert.match(readFileSync(join(target, 'LICENSE'), 'utf8'), /MIT License[\s\S]*Tacuchi/);
      assert.match(readFileSync(join(target, 'CHANGELOG.md'), 'utf8'), /## \[1\.1\.0\][\s\S]*## \[1\.0\.0\]/);
      assert.match(readFileSync(join(target, 'RELEASE_NOTES.md'), 'utf8'), new RegExp(`skill/${slug}/v1\\.1\\.0`));
    });
  }
});

test('las referencias contienen técnica concreta de cada dominio y conservan sus límites', (t) => {
  const ui = copyOffer(t, ...offers[0]);
  const diagrams = copyOffer(t, ...offers[1]);
  const sql = copyOffer(t, ...offers[2]);
  const uiDetails = readFileSync(join(ui.target, 'references', referenceBySlug['ui-authoring']), 'utf8');
  const c4Details = readFileSync(join(diagrams.target, 'references', referenceBySlug['system-diagrams']), 'utf8');
  const sqlDetails = readFileSync(join(sql.target, 'references', referenceBySlug['sql-authoring']), 'utf8');
  assert.match(uiDetails, /recorrido[\s\S]*pantalla[\s\S]*estado/i);
  assert.match(uiDetails, /foco[\s\S]*teclado|teclado[\s\S]*foco/i);
  assert.match(c4Details, /C4Context[\s\S]*C4Container[\s\S]*C4Component/);
  assert.match(c4Details, /Structurizr DSL[\s\S]*workspace\s+"/);
  assert.match(c4Details, /mermaid\.ink[\s\S]*consentimiento explícito/i);
  assert.match(sqlDetails, /PostgreSQL[\s\S]*MySQL[\s\S]*SQLite/);
  assert.match(sqlDetails, /rollback[\s\S]*dependencias[\s\S]*bloqueos/i);
  assert.match(sqlDetails, /Nunca ejecutes DML\/DDL por \*\*ningún canal\*\*/);
});

test('tres rutas y nombres propios no colisionan al adquirir una oferta en hosts aislados', (t) => {
  const fixture = mkdtempSync(join(tmpdir(), 'skills-hosts-'));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  for (const host of ['claude', 'codex', 'oz', 'crush']) {
    const targetRoot = join(fixture, host, 'skills');
    mkdirSync(targetRoot, { recursive: true });
    for (const [domain, slug] of offers) {
      const target = join(targetRoot, slug);
      mkdirSync(target);
      copyFileSync(join(root, 'skills', domain, slug, 'SKILL.md'), join(target, 'SKILL.md'));
      assert.match(readFileSync(join(target, 'SKILL.md'), 'utf8'), new RegExp(`^name: ${slug}$`, 'm'));
    }
    assert.deepEqual(readdirSync(targetRoot).sort(), offers.map(([, slug]) => slug).sort());
    assert.equal(existsSync(join(targetRoot, 'w')), false);
    assert.equal(existsSync(join(targetRoot, 'design')), false);
  }
});

test('la UI exige destino aprobado y protege fuentes sensibles; los diagramas no envían datos por defecto; SQL no ejecuta mutaciones por ningún canal', (t) => {
  const ui = copyOffer(t, ...offers[0]).skill;
  const diagrams = copyOffer(t, ...offers[1]).skill;
  const sql = copyOffer(t, ...offers[2]).skill;
  assert.match(ui, /ruta de salida antes de crear o modificar/);
  assert.match(ui, /si no hay destino aprobado.*conversación/i);
  assert.match(ui, /no publiques ni copies datos personales, secretos/);
  assert.match(ui, /foco.*etiquetas.*contraste/);
  assert.match(diagrams, /No envíes código, datos ni el diagrama a renderizadores, APIs o enlaces externos sin consentimiento explícito/);
  assert.match(diagrams, /Si no existe, entrega la fuente legible.*no uses un servicio remoto como fallback/s);
  assert.match(diagrams, /fuentes concretas.*aristas/);
  assert.match(sql, /No ejecutes DML ni DDL por \*\*ningún canal\*\*: shell, MCP, driver, cliente, consola, migrador/);
  assert.match(sql, /script de avance y un reverso/);
  assert.match(sql, /No interpolar entradas.*parámetros/);
});
