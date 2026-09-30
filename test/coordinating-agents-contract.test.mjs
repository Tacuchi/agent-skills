import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const offer = join(root, 'skills', 'orchestration', 'coordinating-agents');
const skill = readFileSync(join(offer, 'SKILL.md'), 'utf8');
const adapters = ['dorothy.md', 'herdr.md', 'orca.md', 'teamctl.md'];
const reference = (name) => readFileSync(join(offer, 'references', name), 'utf8');
const HARNESS = /\baw\b|\.workflow\/|Workline|scratchpad|\/Users\/|w\d+:p\w+|OPENCODE_CONFIG/;

test('an isolated install keeps identity, license, history, adapters and standalone scope', (t) => {
  const fixture = mkdtempSync(join(tmpdir(), 'coordinating-agents-only-'));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  const target = join(fixture, 'skills', 'coordinating-agents');
  cpSync(offer, target, { recursive: true });
  assert.deepEqual(readdirSync(join(fixture, 'skills')), ['coordinating-agents']);
  assert.match(skill, /^---\nname: coordinating-agents\ndescription: "[^"]+"\n---/);
  assert.match(skill, /If the orchestrator's interface is missing.*do not attribute started tasks or results/s);
  assert.deepEqual(readdirSync(join(target, 'references')).sort(), adapters);
  for (const [, href] of skill.matchAll(/\]\(([^)]+)\)/g)) {
    const linked = resolve(target, href);
    const within = relative(target, linked);
    assert.ok(!isAbsolute(href) && within && !within.startsWith('..'), `link inside the offer: ${href}`);
    assert.ok(existsSync(linked), `existing link: ${href}`);
  }
  for (const name of adapters) assert.ok(skill.includes(`](references/${name})`), `${name}: reachable from SKILL.md`);
  for (const text of [skill, ...adapters.map(reference)]) assert.doesNotMatch(text, HARNESS);
  assert.match(readFileSync(join(target, 'LICENSE'), 'utf8'), /MIT License[\s\S]*Tacuchi/);
  assert.match(readFileSync(join(target, 'CHANGELOG.md'), 'utf8'), /## \[1\.0\.0\][\s\S]*herdr-coordination/);
  const version = /^## \[(\d+\.\d+\.\d+)\]/m.exec(readFileSync(join(target, 'CHANGELOG.md'), 'utf8'))[1];
  assert.ok(readFileSync(join(target, 'RELEASE_NOTES.md'), 'utf8').includes(`skill/coordinating-agents/v${version}`));
});

test('invented traces do not turn a state, a send or a pending change into a success', () => {
  const table = Object.fromEntries(
    [...skill.matchAll(/^\| `(working|blocked|idle|done|unknown)` \| ([^|]+) \|$/gm)]
      .map(([, state, action]) => [state, action]),
  );
  const transcripts = [
    { state: 'working', output: 'Running tests', required: /Wait|read progress/, prohibited: /declar/ },
    { state: 'blocked', output: 'Allow writing? Yes / No', required: /person.*wait for a specific authorization/, prohibited: /approve automatically/ },
    { state: 'idle', output: 'Which file do I review?', required: /Read the output.*question/, prohibited: /conclude without reading/ },
    { state: 'done', output: 'I reviewed the module; tests are missing', required: /verify the deliverable\/tests.*even when the reported outcome is a success/, prohibited: /declar\w* .*without verif/ },
    { state: 'unknown', output: 'Session not detected after restart', required: /review detection.*uncertain.*do not repeat or declare success/, prohibited: /declare success without reviewing/ },
  ];
  assert.deepEqual(Object.keys(table).sort(), transcripts.map(({ state }) => state).sort());
  for (const { state, required, prohibited } of transcripts) {
    assert.match(table[state], required, `${state}: conservative action`);
    assert.doesNotMatch(table[state], prohibited, `${state}: no inferred conclusion`);
  }
  assert.match(skill, /may match the end of another task if the agent was already working/);
  assert.match(skill, /If receipt is uncertain, inspect before resending/);
  assert.match(skill, /after identifying the instance and the last task/);
  assert.match(skill, /wait for it to update, read the screen again/);
  assert.match(skill, /send to one handle only, never to the old and the new one both/);
  assert.match(skill, /send only when the review screen shows every answer/);
  assert.match(skill, /the installed help wins/);
});

test('permission, quota, commit, publication, irreversibility and wider access go back to the person', () => {
  const reserved = ['permission', 'quota/resources', 'commit', 'publication', 'irreversible', 'wider access'];
  const boundary = skill.slice(skill.indexOf('- A request for permission'), skill.indexOf('\n\n## Observable cycle'));
  for (const effect of reserved) assert.ok(boundary.includes(effect), `${effect}: human boundary`);
  assert.match(boundary, /verbatim to the person/);
  assert.match(boundary, /permission-skipping flag, an autonomy level above the default or a remote placement is wider access/);
  assert.match(boundary, /explicit written answer to \*\*that\*\* request/);
  assert.match(boundary, /Relay only the option they authorized, then check its receipt/);
  assert.match(boundary, /general authorization given earlier .* is not the answer to \*\*that\*\* request/);
  assert.match(boundary, /if the host blocks sending .* do not look for another way; .*let them answer in the orchestrator's own interface/);
  assert.match(boundary, /do not choose or press keys on their behalf/);
  assert.match(skill, /Do not send keys, prompts or replies to answer until you receive the explicit choice/);
  assert.match(skill, /if receipt is not confirmed, keep the question pending/);
  assert.match(skill, /With the written answer "No", relay "No", read the output again/);
});

test('each adapter maps its states onto the five, defers to the installed help and keeps its traps', () => {
  for (const name of adapters) {
    const text = reference(name);
    for (const state of ['working', 'blocked', 'idle', 'done', 'unknown']) assert.ok(text.includes(`\`${state}\``), `${name}: maps ${state}`);
    assert.match(text, /wins over this file|version-matched guides/, `${name}: installed help first`);
    assert.match(text, /Checked against/, `${name}: states its provenance`);
    assert.match(text, /explain the precondition and stop|report its exact error and stop/, `${name}: stops without the interface`);
  }
  const herdr = reference('herdr.md');
  assert.match(herdr, /`herdr agent prompt` rejects sends to an agent that is already blocked/);
  assert.match(herdr, /the first cut goes at 1\/N, the next at 1\/\(N-1\)/);
  assert.match(herdr, /Check the layout with `herdr pane layout` and fix it with `herdr pane resize/);
  assert.match(herdr, /`herdr pane zoom <id>`, and undo the zoom afterwards/);
  assert.match(herdr, /it does not identify the turn/);
  const orca = reference('orca.md');
  assert.match(orca, /report the value from `launch\.effective`, never from the requested arguments/);
  assert.match(orca, /`--retry-request <id>` instead of resending/);
  assert.match(orca, /never send to the old and the new one both/);
  assert.match(orca, /never run it there/);
  assert.match(orca, /`--on <environment>` sends work to another machine: that is wider access/);
  const teamctl = reference('teamctl.md');
  assert.match(teamctl, /Treat every agent as `unknown` until/);
  assert.match(teamctl, /`teamctl approve <id>` is the person's answer to \*\*that\*\* request/);
  assert.match(teamctl, /`--fresh` discards the agent's conversation, so treat it as irreversible/);
  assert.match(teamctl, /Raising either one is wider access/);
  const dorothy = reference('dorothy.md');
  assert.match(dorothy, /Pass `skipPermissions: false` unless the person explicitly authorized/);
  assert.match(dorothy, /`send_message` auto-starts an idle agent: it is a new instruction, never a status probe/);
});

test('fixtures of eight host families acquire only coordinating-agents and read its metadata without a harness', (t) => {
  const fixture = mkdtempSync(join(tmpdir(), 'coordinating-agents-host-matrix-'));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  const hosts = new Map([
    ['claude', '.claude/skills'], ['codex', '.codex/skills'], ['warp', '.warp/skills'],
    ['oz', '.agents/skills'], ['gemini/agy', '.gemini/skills'], ['opencode', '.agents/skills'],
    ['crush', '.config/crush/skills'], ['kimi', '.kimi-code/skills'],
  ]);
  for (const [host, location] of hosts) {
    const skills = join(fixture, host, location);
    const target = join(skills, 'coordinating-agents');
    mkdirSync(skills, { recursive: true });
    cpSync(offer, target, { recursive: true });
    assert.deepEqual(readdirSync(skills), ['coordinating-agents'], `${host}: no sibling offers`);
    const installed = readFileSync(join(target, 'SKILL.md'), 'utf8');
    assert.match(installed, /^name: coordinating-agents$/m, `${host}: selection by name`);
    assert.match(installed, /^description: .+orchestrator.+Herdr.+Orca.+teamctl.+Dorothy.+$/m, `${host}: selection by description`);
    assert.deepEqual(readdirSync(join(target, 'references')).sort(), adapters, `${host}: adapters travel with the skill`);
    assert.doesNotMatch(installed, HARNESS);
  }
});
