import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const offers = [
  ['design', 'ui-authoring'],
  ['architecture', 'system-diagrams'],
  ['data', 'sql-authoring'],
];

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
  return { fixture, target, skill: readFileSync(join(target, 'SKILL.md'), 'utf8') };
}

test('cada oferta se adquiere sola con sus enlaces, titular, historia y licencia', async (t) => {
  for (const [domain, slug] of offers) {
    await t.test(slug, (caseT) => {
      const { fixture, target, skill } = copyOffer(caseT, domain, slug);
      assert.deepEqual(readdirSync(fixture), [slug]);
      assert.match(skill, new RegExp(`^---\nname: ${slug}\ndescription: .+\n---`, 'm'));
      assert.doesNotMatch(skill, /\baw\b|\.workflow\/|skills\/(?:design\/ui-authoring|architecture\/system-diagrams|data\/sql-authoring)\/SKILL\.md/);
      for (const [, link] of skill.matchAll(/\]\((assets\/[^)]+)\)/g)) {
        assert.ok(existsSync(join(target, link)), `${slug}: enlace local ${link}`);
        assert.equal(resolve(target, link).startsWith(`${target}/`), true);
      }
      assert.match(readFileSync(join(target, 'LICENSE'), 'utf8'), /MIT License[\s\S]*Tacuchi/);
      assert.match(readFileSync(join(target, 'CHANGELOG.md'), 'utf8'), /1\.0\.0/);
      assert.match(readFileSync(join(target, 'RELEASE_NOTES.md'), 'utf8'), new RegExp(`skill/${slug}/v1\\.0\\.0`));
    });
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
