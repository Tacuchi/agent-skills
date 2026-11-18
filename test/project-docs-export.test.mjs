import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { findChrome } from '../skills/documentation/project-docs/scripts/lib/cdp.mjs';

const root = resolve(import.meta.dirname, '..');
const script = join(root, 'skills/documentation/project-docs/scripts/export-svg.mjs');
const fixture = join(root, 'test/fixtures/project-docs/viewer.html');
const chrome = findChrome({}).path;

function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), 'project-docs-export-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function run(args, env = process.env) {
  return spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', env, timeout: 60000 });
}

test('findChrome honors the explicit path and CHROME_PATH, and lists what it tried', (t) => {
  const dir = tempDir(t);
  const fake = join(dir, 'chrome');
  writeFileSync(fake, '');

  assert.equal(findChrome({ explicit: fake, env: {}, platform: 'linux' }).path, fake);
  assert.equal(findChrome({ explicit: join(dir, 'missing'), env: { CHROME_PATH: fake }, platform: 'linux' }).path, fake);

  const none = findChrome({ explicit: join(dir, 'missing'), env: { CHROME_PATH: '' }, platform: 'plan9' });
  assert.equal(none.path, null);
  assert.ok(none.tried.length > 0);
  assert.deepEqual(none.tried, [join(dir, 'missing')]);
});

test('export writes the SVG the viewer offers and reports external requests', { skip: !chrome }, (t) => {
  const out = join(tempDir(t), 'out.svg');
  const result = run([fixture, out, '--chrome', chrome]);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(readFileSync(out, 'utf8').startsWith('<svg'));
  const json = JSON.parse(result.stdout);
  assert.equal(json.svg, out);
  assert.equal(json.bytes, readFileSync(out).length);
  assert.equal(json.generator, 'fixture viewer 1.0.0');
  assert.deepEqual(json.external_requests, []);
});

test('a page without the export button exits 1 and names the selector', { skip: !chrome }, (t) => {
  const dir = tempDir(t);
  const page = join(dir, 'empty.html');
  writeFileSync(page, '<!doctype html><title>empty</title><p>no viewer here</p>');
  const result = run([page, '--chrome', chrome]);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /#btn-export/);
  assert.equal(result.stdout, '');
});

test('no Chrome exits 2 and lists the paths tried', () => {
  const result = run([fixture, '--chrome', '/nonexistent/chrome'], { ...process.env, CHROME_PATH: '' });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /\/nonexistent\/chrome/);
  assert.match(result.stderr, /CHROME_PATH/);
});

test('a missing page or a bad option exits 2 with the expected shape', (t) => {
  const missing = run([join(tempDir(t), 'missing.html')]);
  assert.equal(missing.status, 2);
  assert.match(missing.stderr, /expected an existing HTML file/);
  const bad = run([fixture, '--timeout', 'soon']);
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /positive integer.*"soon"/);
});
