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
  'ui-authoring': 'journeys-and-screens.md',
  'system-diagrams': 'c4-and-engines.md',
  'sql-authoring': 'dialect-and-migrations.md',
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
    assert.ok(path && !isAbsolute(path), `relative local link: ${href}`);
    const linked = resolve(location, path);
    const within = relative(target, linked);
    assert.ok(within && !within.startsWith('..') && !isAbsolute(within), `link inside the offer: ${href}`);
    assert.ok(existsSync(linked), `existing link: ${href}`);
    links++;
  }
  return links;
}

test('each offer is acquired alone with its links, owner, history and license', async (t) => {
  for (const [domain, slug] of offers) {
    await t.test(slug, (caseT) => {
      const { fixture, target, skill } = copyOffer(caseT, domain, slug);
      assert.deepEqual(readdirSync(fixture), [slug]);
      assert.match(skill, new RegExp(`^---\nname: ${slug}\ndescription: .+\n---`, 'm'));
      assert.doesNotMatch(skill, /\baw\b|\.workflow\/|skills\/(?:design\/ui-authoring|architecture\/system-diagrams|data\/sql-authoring)\/SKILL\.md/);
      const reference = referenceBySlug[slug];
      assert.deepEqual(readdirSync(join(target, 'references')), [reference]);
      assert.ok(skill.includes(`](references/${reference})`), `${slug}: reference reachable from SKILL.md`);
      assert.ok(checkLocalLinks(skill, target, target) >= 2, `${slug}: local links checked`);
      const details = readFileSync(join(target, 'references', reference), 'utf8');
      assert.doesNotMatch(details, /\bWorkline\b|\baw\b|\.workflow\/|docs\/(?:designs|diagrams|scripts)\/|\bQTC\b/i);
      checkLocalLinks(details, join(target, 'references'), target);
      assert.match(readFileSync(join(target, 'LICENSE'), 'utf8'), /MIT License[\s\S]*Tacuchi/);
      const changelog = readFileSync(join(target, 'CHANGELOG.md'), 'utf8');
      assert.match(changelog, /## \[2\.0\.0\][\s\S]*## \[1\.1\.0\][\s\S]*## \[1\.0\.0\]/);
      const notes = readFileSync(join(target, 'RELEASE_NOTES.md'), 'utf8');
      assert.match(notes, new RegExp(`^# ${slug} 2\\.0\\.0$`, 'm'));
      assert.match(notes, new RegExp(`skill/${slug}/v2\\.0\\.0`));
    });
  }
});

test('the references hold concrete technique for each domain and keep their limits', (t) => {
  const ui = copyOffer(t, ...offers[0]);
  const diagrams = copyOffer(t, ...offers[1]);
  const sql = copyOffer(t, ...offers[2]);
  const uiDetails = readFileSync(join(ui.target, 'references', referenceBySlug['ui-authoring']), 'utf8');
  const c4Details = readFileSync(join(diagrams.target, 'references', referenceBySlug['system-diagrams']), 'utf8');
  const sqlDetails = readFileSync(join(sql.target, 'references', referenceBySlug['sql-authoring']), 'utf8');
  assert.match(uiDetails, /journey[\s\S]*screen[\s\S]*state/i);
  assert.match(uiDetails, /focus[\s\S]*keyboard|keyboard[\s\S]*focus/i);
  assert.match(c4Details, /C4Context[\s\S]*C4Container[\s\S]*C4Component/);
  assert.match(c4Details, /Structurizr DSL[\s\S]*workspace\s+"/);
  assert.match(c4Details, /mermaid\.ink[\s\S]*explicit consent/i);
  assert.match(sqlDetails, /PostgreSQL[\s\S]*MySQL[\s\S]*SQLite/);
  assert.match(sqlDetails, /rollback[\s\S]*dependencies[\s\S]*locks/i);
  assert.match(sqlDetails, /Never run DML\/DDL through \*\*any channel\*\*/);
});

test('three paths and own names do not collide when one offer is acquired in isolated hosts', (t) => {
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

test('the UI needs an approved destination and protects sensitive sources; diagrams send no data by default; SQL runs no mutation through any channel', (t) => {
  const ui = copyOffer(t, ...offers[0]).skill;
  const diagrams = copyOffer(t, ...offers[1]).skill;
  const sql = copyOffer(t, ...offers[2]).skill;
  assert.match(ui, /Agree on the output path before creating or changing files/);
  assert.match(ui, /With no approved destination, present the draft in the conversation/);
  assert.match(ui, /do not publish or copy personal data, secrets/);
  assert.match(ui, /focus.*labels.*contrast/);
  assert.match(diagrams, /Do not send code, data or the diagram to renderers, APIs or external links without explicit consent/);
  assert.match(diagrams, /If none exists, deliver the readable source.*do not use a remote service as a fallback/s);
  assert.match(diagrams, /concrete sources for important edges/);
  assert.match(sql, /Do not run DML or DDL through \*\*any channel\*\*: shell, MCP, driver, client, console, migrator/);
  assert.match(sql, /forward script and a rollback/);
  assert.match(sql, /Do not interpolate inputs.*parameters/);
});

test('sql-authoring 2.0.0 carries the generic PostgreSQL rules without a universal transaction or a naming layer', (t) => {
  const { target, skill } = copyOffer(t, ...offers[2]);
  const details = readFileSync(join(target, 'references', referenceBySlug['sql-authoring']), 'utf8');
  const at = details.indexOf('\n## PostgreSQL\n');
  assert.notEqual(at, -1, 'PostgreSQL section present');
  const postgres = details.slice(at);
  for (const rule of [
    /WARNING: IRREVERSIBLE/, /Never widen a role that already has what it needs/,
    /The empty set is a failure, not a no-op/, /`parse_sql` does not look inside a `DO` block/,
  ]) assert.match(postgres, rule);
  assert.match(postgres, /never override them: every script is still delivered, never run/);
  for (const text of [skill, details]) {
    assert.doesNotMatch(text, /^\s*BEGIN;/m, 'no mandatory BEGIN line');
    assert.doesNotMatch(text, /`BEGIN;` at the top/i);
    assert.doesNotMatch(text, /\b(?:esq|tb|seq|fn|sp)_[a-z]|tb_maestra/, 'no naming prefixes of another catalog');
  }
  assert.match(details, /Do not add a universal `BEGIN\/COMMIT`/);
  assert.match(skill, /Do not run DML or DDL through \*\*any channel\*\*/);
  assert.match(details, /this skill does not run mutations, not even to test them/);
  const entry = /## \[2\.0\.0\][\s\S]*?(?=\n## \[)/.exec(readFileSync(join(target, 'CHANGELOG.md'), 'utf8'))[0];
  assert.match(entry, /PostgreSQL rules/);
  assert.match(readFileSync(join(target, 'RELEASE_NOTES.md'), 'utf8'), /generic PostgreSQL rules/);
});
