import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const offer = join(root, 'skills', 'orchestration', 'herdr-coordination');
const skill = readFileSync(join(offer, 'SKILL.md'), 'utf8');
const version = /^## \[(\d+\.\d+\.\d+)\]/m.exec(readFileSync(join(offer, 'CHANGELOG.md'), 'utf8'))[1];
const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();

test('an isolated install keeps identity, license, history and standalone scope', (t) => {
  const fixture = mkdtempSync(join(tmpdir(), 'herdr-only-'));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  const target = join(fixture, 'skills', 'herdr-coordination');
  mkdirSync(target, { recursive: true });
  for (const file of ['SKILL.md', 'LICENSE', 'CHANGELOG.md', 'RELEASE_NOTES.md']) {
    copyFileSync(join(offer, file), join(target, file));
  }
  assert.deepEqual(readdirSync(join(fixture, 'skills')), ['herdr-coordination']);
  assert.match(skill, /^---\nname: herdr-coordination\ndescription: "[^"]+"\n---/);
  assert.doesNotMatch(skill, /\baw\b|\.workflow\/|Workline|scratchpad|\/Users\/|w\d+:p\w+|OPENCODE_CONFIG/);
  assert.match(skill, /If `herdr` is missing.*do not attribute started tasks or results/s);
  assert.match(readFileSync(join(target, 'LICENSE'), 'utf8'), /MIT License[\s\S]*Tacuchi/);
  assert.match(readFileSync(join(target, 'CHANGELOG.md'), 'utf8'), /## \[1\.0\.0\]/);
  assert.ok(readFileSync(join(target, 'RELEASE_NOTES.md'), 'utf8').includes(`skill/herdr-coordination/v${version}`));
});

test('invented traces do not turn a state, a send or a pending change into a success', () => {
  const table = Object.fromEntries(
    [...skill.matchAll(/^\| `(working|blocked|idle|done|unknown)` \| ([^|]+) \|$/gm)]
      .map(([, state, action]) => [state, action]),
  );
  const transcripts = [
    { state: 'working', output: 'Running tests', required: /Wait|read progress/, prohibited: /declar/ },
    { state: 'blocked', output: 'Allow writing? Yes / No', required: /person.*wait for a specific authorization/, prohibited: /approve automatically/ },
    { state: 'idle', output: 'Which file do I review?', required: /Read the pane.*question/, prohibited: /conclude without reading/ },
    { state: 'done', output: 'I reviewed the module; tests are missing', required: /verify the deliverable\/tests/, prohibited: /declar\w* .*without verif/ },
    { state: 'unknown', output: 'Session not detected after restart', required: /review detection.*uncertain.*do not repeat or declare success/, prohibited: /declare success without reviewing/ },
  ];
  assert.deepEqual(Object.keys(table).sort(), transcripts.map(({ state }) => state).sort());
  for (const { state, required, prohibited } of transcripts) {
    assert.match(table[state], required, `${state}: conservative action`);
    assert.doesNotMatch(table[state], prohibited, `${state}: no inferred conclusion`);
  }
  assert.match(skill, /if the agent was already working, it may match the end of another task/);
  assert.match(skill, /If receipt is uncertain, inspect before resending/);
  assert.match(skill, /after identifying the instance and the last task/);
  assert.match(skill, /wait for it to update, read the screen again/);
  assert.match(skill, /Check the layout with `herdr pane layout` and fix it with `herdr pane resize/);
  assert.match(skill, /send only when the review screen shows every answer/);
});

test('permission, quota, commit, publication and irreversibility go back to the person', () => {
  const reserved = ['permission', 'quota/resources', 'commit', 'publication', 'irreversible'];
  const boundary = skill.slice(skill.indexOf('- A request for permission'), skill.indexOf('\n\n## Observable cycle'));
  for (const effect of reserved) assert.ok(boundary.includes(effect), `${effect}: human boundary`);
  assert.match(boundary, /verbatim to the person/);
  assert.match(boundary, /explicit written answer to \*\*that\*\* request/);
  assert.match(boundary, /Relay only the option they authorized, then check its receipt/);
  assert.match(boundary, /general authorization given earlier .* is not the answer to \*\*that\*\* request/);
  assert.match(boundary, /if the host blocks sending .* do not look for another way; .*let them answer in their pane/);
  assert.match(skill, /Do not run `herdr agent send-keys`.*until you receive the explicit choice/);
  assert.match(skill, /`herdr agent prompt` rejects sends to an agent that is already blocked/);
  assert.match(skill, /if receipt is not confirmed, keep the question pending/);
  assert.match(boundary, /do not choose or press keys on their behalf/);
  assert.match(skill, /With the written answer "No", relay "No", read the screen again/);
});

test('the Herdr row points to an existing tag of this offer on the working branch', () => {
  const current = JSON.parse(readFileSync(join(root, 'catalog', 'index.json'), 'utf8'));
  assert.deepEqual(current.entries.map(({ id }) => id), ['ui-authoring', 'system-diagrams', 'sql-authoring', 'herdr-coordination']);
  const entry = current.entries.at(-1);
  assert.equal(entry.id, 'herdr-coordination');
  assert.equal(entry.path, 'skills/orchestration/herdr-coordination/SKILL.md');
  assert.match(entry.ref, /^skill\/herdr-coordination\/v\d+\.\d+\.\d+$/);
  assert.equal(entry.type, 'own');
  assert.equal(entry.data_permissions.status, 'unverified');
  assert.doesNotThrow(() => git('merge-base', '--is-ancestor', entry.ref, 'HEAD'));
  assert.match(git('show', `${entry.ref}:${entry.path}`), /^name: herdr-coordination$/m);
});

test('fixtures of eight host families acquire only Herdr and read its metadata without a harness', (t) => {
  const fixture = mkdtempSync(join(tmpdir(), 'herdr-host-matrix-'));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  const hosts = new Map([
    ['claude', '.claude/skills'], ['codex', '.codex/skills'], ['warp', '.warp/skills'],
    ['oz', '.agents/skills'], ['gemini/agy', '.gemini/skills'], ['opencode', '.agents/skills'],
    ['crush', '.config/crush/skills'], ['kimi', '.kimi-code/skills'],
  ]);
  for (const [host, location] of hosts) {
    const skills = join(fixture, host, location);
    const target = join(skills, 'herdr-coordination');
    mkdirSync(target, { recursive: true });
    copyFileSync(join(offer, 'SKILL.md'), join(target, 'SKILL.md'));
    assert.deepEqual(readdirSync(skills), ['herdr-coordination'], `${host}: no sibling offers`);
    const installed = readFileSync(join(target, 'SKILL.md'), 'utf8');
    assert.match(installed, /^name: herdr-coordination$/m, `${host}: selection by name`);
    assert.match(installed, /^description: .+Herdr.+$/m, `${host}: selection by description`);
    assert.doesNotMatch(installed, /\baw\b|\.workflow\/|Workline/);
  }
});
