import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const offer = join(root, 'skills', 'orchestration', 'coordinating-agents');
const index = JSON.parse(readFileSync(join(root, 'catalog', 'index.json'), 'utf8'));
const version = /^## \[(\d+\.\d+\.\d+)\]/m.exec(readFileSync(join(offer, 'CHANGELOG.md'), 'utf8'))[1];
const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();

test('the coordinating-agents row points to the tag of its latest version, whose tree is the checkout', () => {
  const entry = index.entries.find(({ id }) => id === 'coordinating-agents');
  assert.ok(entry, 'coordinating-agents has a catalog row');
  assert.equal(entry.path, 'skills/orchestration/coordinating-agents/SKILL.md');
  assert.equal(entry.ref, `skill/coordinating-agents/v${version}`);
  assert.equal(entry.type, 'own');
  assert.equal(entry.status, 'active');
  assert.equal(entry.data_permissions.status, 'unverified');
  assert.doesNotThrow(() => git('merge-base', '--is-ancestor', entry.ref, 'HEAD'));
  const files = ['SKILL.md', 'LICENSE', 'CHANGELOG.md', 'RELEASE_NOTES.md', ...readdirSync(join(offer, 'references')).map((name) => `references/${name}`)];
  for (const file of files) {
    assert.equal(git('show', `${entry.ref}:skills/orchestration/coordinating-agents/${file}`), readFileSync(join(offer, file), 'utf8').trim());
  }
});

test('herdr-coordination is retired in favor of coordinating-agents and keeps its historical tag', () => {
  const entry = index.entries.find(({ id }) => id === 'herdr-coordination');
  assert.ok(entry, 'herdr-coordination keeps its catalog row');
  assert.equal(entry.status, 'retired');
  assert.match(entry.retirement_reason, /coordinating-agents/);
  assert.equal(entry.ref, 'skill/herdr-coordination/v2.0.0');
  assert.equal(existsSync(join(root, 'skills', 'orchestration', 'herdr-coordination')), false, 'no local directory for the retired offer');
  assert.match(git('show', `${entry.ref}:${entry.path}`), /^name: herdr-coordination$/m);
});
