import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const offer = join(root, 'skills', 'orchestration', 'master');
const skill = readFileSync(join(offer, 'SKILL.md'), 'utf8');
const references = ['launch.md', 'layouts.md', 'profile.md'];
const reference = (name) => readFileSync(join(offer, 'references', name), 'utf8');
const HARNESS = /\baw\b|\.workflow\/|Workline|scratchpad|\/Users\/|w\d+:p\w+|OPENCODE_CONFIG|\bQTC\b/;

test('an isolated install keeps identity, license, history and references', (t) => {
  const fixture = mkdtempSync(join(tmpdir(), 'master-only-'));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  const target = join(fixture, 'skills', 'master');
  cpSync(offer, target, { recursive: true });
  assert.deepEqual(readdirSync(join(fixture, 'skills')), ['master']);
  assert.match(skill, /^---\nname: master\ndescription: "[^"]+"\n---/);
  assert.deepEqual(readdirSync(join(target, 'references')).sort(), references);
  for (const [, href] of skill.matchAll(/\]\(([^)]+)\)/g)) {
    const linked = resolve(target, href);
    const within = relative(target, linked);
    assert.ok(!isAbsolute(href) && within && !within.startsWith('..'), `link inside the offer: ${href}`);
    assert.ok(existsSync(linked), `existing link: ${href}`);
  }
  for (const name of references) assert.ok(skill.includes(`](references/${name})`), `${name}: reachable from SKILL.md`);
  for (const text of [skill, ...references.map(reference)]) assert.doesNotMatch(text, HARNESS);
  assert.match(readFileSync(join(target, 'LICENSE'), 'utf8'), /MIT License[\s\S]*Tacuchi/);
  const version = /^## \[(\d+\.\d+\.\d+)\]/m.exec(readFileSync(join(target, 'CHANGELOG.md'), 'utf8'))[1];
  const notes = readFileSync(join(target, 'RELEASE_NOTES.md'), 'utf8');
  assert.match(notes, new RegExp(`^# master ${version.replaceAll('.', '\\.')}$`, 'm'));
  assert.ok(notes.includes(`skill/master/v${version}`));
});

test('the description fires on /master and draws its seams', () => {
  const description = /^description: "([^"]+)"$/m.exec(skill)[1];
  assert.ok(description.length <= 1024, 'description fits the 1024-character limit');
  assert.match(description, /^Turns the current agent into the master of a task/);
  assert.match(description, /Use when the person types \/master/);
  assert.match(description, /Herdr or Orca/);
  assert.match(description, /Not for a git master branch/);
  assert.match(description, /coordinating-agents skill/);
});

test('the invocation authorizes three effects for one run and keeps the rest with the person', () => {
  const boundary = skill.slice(skill.indexOf('## Invocation is the authorization'), skill.indexOf('## 1. Read the profile'));
  assert.match(boundary, /for this run only/);
  assert.match(boundary, /permission prompts skipped, inside the task's folder/);
  assert.match(boundary, /above the profile's floor/);
  assert.match(boundary, /routine questions/);
  for (const effect of ['commit, push, tag, publish or release', 'destructive or irreversible', 'production data', 'quota resets, paid credits', 'remote machines', 'did not create']) {
    assert.ok(boundary.includes(effect), `${effect}: stays with the person`);
  }
  assert.match(boundary, /pick the option that does not commit and collect the commits/);
  assert.match(skill, /## Invariants[\s\S]*for this run only[\s\S]*stay with the person/);
  assert.match(reference('profile.md'), /can narrow the authorization .*never widen it/);
});

test('solo is the default and delegation needs a named reason', () => {
  assert.match(skill, /Do the task yourself by default\. Delegate only for a reason you can name/);
  assert.match(skill, /two or more parts that can run in parallel without editing the same files/);
  assert.match(skill, /Stay solo when the task fits one context/);
  assert.match(skill, /`Solo: <why>` or `Delegating to <n> agents: <why>`/);
});

test('layouts stay even: only halving cut orders, measured before launch', () => {
  const rows = Object.fromEntries(
    [...skill.matchAll(/^\| (1|2|3|4|5 to 8) \| ([^|]+) \|$/gm)].map(([, panes, layout]) => [panes, layout.trim()]),
  );
  assert.deepEqual(Object.keys(rows).sort(), ['1', '2', '3', '4', '5 to 8']);
  assert.match(rows['3'], /two rows: two panes on top, one full-width pane below/);
  assert.match(rows['4'], /two rows of two/);
  assert.match(rows['5 to 8'], /3\+2, 3\+3, 4\+3, 4\+4/);
  assert.match(skill, /rows of equal height and, inside each row, panes of equal width/);
  assert.match(skill, /Never cut three columns: halving leaves 50\/25\/25/);
  assert.match(skill, /measure every pane before launching any agent/);
  const layouts = reference('layouts.md');
  assert.match(layouts, /62 \/ 29 \/ 29 \| no/);
  assert.match(layouts, /A split pane starts in the space's folder/);
  assert.match(layouts, /`vertical` puts the new pane side by side and `horizontal` stacks it below/);
  assert.match(layouts, /it drives the person's desktop, so the master never does it/);
  assert.match(layouts, /Checked on macOS on 2026-11-03/);
});

test('launches are interactive, flagged and verified on screen; quota reads cost nothing', () => {
  const launch = reference('launch.md');
  for (const flag of ['--dangerously-skip-permissions', '--dangerously-bypass-approvals-and-sandbox', 'model_reasoning_effort', '`agy models`']) {
    assert.ok(launch.includes(flag), `${flag}: documented`);
  }
  assert.match(launch, /Start every agent interactive/);
  assert.match(launch, /the flag you passed is a request, the screen is the fact/);
  assert.match(launch, /without spending quota/);
  assert.match(launch, /Redeeming one, or spending paid credits, needs the person's answer every time/);
  assert.match(skill, /Pass model and effort as launch flags/);
  assert.match(skill, /Read each agent's banner and confirm model, effort and permission mode before sending its task/);
  assert.match(skill, /A done state or a report is not a result: check the evidence/);
});

test('the brief and the report keep a fixed shape', () => {
  const brief = /Brief, one per agent:\n\n```text\n([\s\S]+?)```/.exec(skill)[1];
  for (const field of ['Task:', 'Folder:', 'Done when:', 'Limits:', 'Report:']) assert.ok(brief.includes(field), `brief: ${field}`);
  assert.match(brief, /no commit, push, tag, publish or release/);
  assert.match(brief, /start no other agents/);
  assert.match(skill, /Master: <task>\nMode: solo \| delegated \(<n> agents\)/);
  assert.match(skill, /Example:\n\n```text\nMaster: /);
});
