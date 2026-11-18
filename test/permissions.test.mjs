import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const script = join(root, 'scripts', 'permissions.mjs');

const manifest = {
  skill: 'demo',
  needs: [
    { id: 'hc-read', type: 'command', tier: 'low', reason: 'Read agent panes.', prefixes: ['hc get', 'hc read'] },
    { id: 'hc-send', type: 'command', tier: 'high', reason: 'Type into agent terminals.', prefixes: ['hc send'] },
    { id: 'models', type: 'web', tier: 'low', reason: 'Read model data.', domains: ['models.dev'] },
  ],
};

function sandbox(t, { git = true } = {}) {
  const base = realpathSync(mkdtempSync(join(tmpdir(), 'permissions-')));
  t.after(() => rmSync(base, { recursive: true, force: true }));
  const home = join(base, 'home');
  const repo = join(base, 'repo');
  mkdirSync(home);
  mkdirSync(repo);
  if (git) mkdirSync(join(repo, '.git'));
  const manifestPath = join(base, 'skill', 'permissions.json');
  mkdirSync(join(base, 'skill'));
  writeFileSync(manifestPath, JSON.stringify(manifest));
  const run = (...args) => {
    const result = spawnSync(process.execPath, [script, ...args, '--manifest', manifestPath], {
      encoding: 'utf8', env: { ...process.env, HOME: home, CLAUDE_CONFIG_DIR: '', CODEX_HOME: '' },
    });
    return { status: result.status, json: JSON.parse(result.stdout), stderr: result.stderr };
  };
  const write = (path, content) => {
    mkdirSync(resolve(path, '..'), { recursive: true });
    writeFileSync(path, typeof content === 'string' ? content : JSON.stringify(content, null, 2));
  };
  const trustCodex = (path = repo) => write(join(home, '.codex', 'config.toml'), `[projects."${path}"]\ntrust_level = "trusted"\n`);
  return { base, home, repo, manifestPath, run, write, trustCodex };
}

const ids = (list) => list.map((need) => (typeof need === 'string' ? need : need.id));

test('validate refuses a prefix that would let the permission script write rules unasked', (t) => {
  const box = sandbox(t);
  const manifest = (prefix) => ({ skill: 'demo', needs: [{ id: 'self', type: 'command', tier: 'low', reason: 'x', prefixes: [prefix] }] });
  for (const prefix of ['node {skill_dir}/scripts/permissions.mjs', 'node {skill_dir}/scripts/permissions.mjs apply', 'node scripts/permissions.mjs']) {
    box.write(box.manifestPath, manifest(prefix));
    const { status, json } = box.run('validate');
    assert.equal(status, 2, prefix);
    assert.match(json.error, /needs\[0\]\.prefixes\[0\]: the permission script may be allowed only as "permissions\.mjs check"/);
  }
  box.write(box.manifestPath, manifest('node {skill_dir}/scripts/permissions.mjs check'));
  assert.equal(box.run('validate').status, 0);
});

test('validate accepts a manifest and names each problem of an invalid one', (t) => {
  const box = sandbox(t);
  assert.deepEqual(box.run('validate').json, { valid: true, skill: 'demo' });
  box.write(box.manifestPath, {
    skill: 'Demo',
    needs: [
      { id: 'a', type: 'command', tier: 'medium', reason: 'x', prefixes: ['git push; rm -rf /'] },
      { id: 'a', type: 'web', tier: 'low', reason: '', domains: ['https://x.dev'] },
      { id: 'b', type: 'file', tier: 'low', reason: 'x' },
    ],
  });
  const { status, json } = box.run('validate');
  assert.equal(status, 2);
  for (const problem of [/skill: expected a lowercase slug/, /needs\[0\]\.tier: expected low or high/, /shell operators/,
    /needs\[1\]\.id: duplicate id a/, /needs\[1\]\.reason/, /needs\[1\]\.domains\[0\]/, /needs\[2\]\.type: expected command or web/]) {
    assert.match(json.error, problem);
  }
});

test('check reports, per host, what is missing with its reason and tier, and what cannot be configured', (t) => {
  const box = sandbox(t);
  const { status, json } = box.run('check', '--root', box.repo);
  assert.equal(status, 0);
  assert.deepEqual(Object.keys(json.hosts), ['claude', 'codex', 'agy']);
  assert.deepEqual(ids(json.hosts.claude.missing), ['hc-read', 'hc-send', 'models']);
  assert.deepEqual(json.hosts.claude.missing[0], {
    id: 'hc-read', tier: 'low', reason: 'Read agent panes.', uses: ['hc get', 'hc read'], rules: ['Bash(hc get:*)', 'Bash(hc read:*)'],
  });
  assert.deepEqual(json.hosts.claude.missing[2].rules, ['WebFetch(domain:models.dev)']);
  assert.deepEqual(ids(json.hosts.codex.missing), ['hc-read', 'hc-send']);
  assert.deepEqual(ids(json.hosts.codex.unsupported), ['models']);
  assert.deepEqual(ids(json.hosts.agy.unsupported), ['hc-read', 'hc-send', 'models']);
  assert.match(json.hosts.agy.notice, /no per-project permissions/);
  assert.deepEqual(json.hosts.agy.questions, []);
});

test('what the global or the project configuration already allows is covered and not proposed', (t) => {
  const box = sandbox(t);
  box.write(join(box.home, '.claude', 'settings.json'), { permissions: { allow: ['Bash(hc:*)'] } });
  box.write(join(box.repo, '.claude', 'settings.json'), { permissions: { allow: ['WebFetch(domain:models.dev)'] } });
  box.write(join(box.home, '.codex', 'rules', 'default.rules'), 'prefix_rule(\n    pattern = ["hc", ["get", "read"]],\n    decision = "allow",\n)\n');
  box.write(join(box.home, '.gemini', 'antigravity-cli', 'settings.json'), { permissions: { allow: ['command(hc send)'] } });
  const { json } = box.run('check', '--root', box.repo);
  assert.deepEqual(json.hosts.claude.covered, ['hc-read', 'hc-send', 'models']);
  assert.deepEqual(json.hosts.claude.missing, []);
  assert.deepEqual(json.hosts.claude.questions, []);
  assert.deepEqual(json.hosts.codex.covered, ['hc-read']);
  assert.deepEqual(json.hosts.agy.covered, ['hc-send']);
});

test('a rule that does not cover the whole prefix leaves the need missing', (t) => {
  const box = sandbox(t);
  box.write(join(box.home, '.claude', 'settings.json'), { permissions: { allow: ['Bash(hc get)', 'Bash(hc:status)', 'Bash(hcx:*)', 'Bash(hc se:*)', 'Bash(hc send foo:*)'] } });
  const { json } = box.run('check', '--root', box.repo, '--host', 'claude');
  assert.deepEqual(ids(json.hosts.claude.missing), ['hc-read', 'hc-send', 'models']);
  box.write(join(box.home, '.claude', 'settings.json'), { permissions: { allow: ['Bash(hc *)', 'Bash(*)'] } });
  assert.deepEqual(box.run('check', '--root', box.repo, '--host', 'claude').json.hosts.claude.covered, ['hc-read', 'hc-send']);
});

test('the low-risk question offers four options in order, and the high-risk one recommends asking every time', (t) => {
  const box = sandbox(t);
  const [low, high] = box.run('check', '--root', box.repo, '--host', 'claude').json.hosts.claude.questions;
  assert.equal(low.tier, 'low');
  assert.deepEqual(low.ids, ['hc-read', 'models']);
  assert.deepEqual(low.options.map((option) => option.label), ['Only for me in this repo', 'Shared in this repo', 'Skip for now', "Don't ask again in this repo"]);
  assert.equal(low.options[0].recommended, true);
  assert.equal(low.options.filter((option) => option.recommended).length, 1);
  assert.match(low.options[0].command, /apply .*--host claude --scope local --ids hc-read,models$/);
  assert.match(low.options[1].command, /--scope shared --ids hc-read,models$/);
  assert.equal(low.options[2].command, null);
  assert.match(low.options[3].command, /--dont-ask --ids hc-read,models$/);
  assert.equal(high.tier, 'high');
  assert.deepEqual(high.ids, ['hc-send']);
  assert.match(high.text, /^High risk: .*Type into agent terminals/);
  assert.deepEqual(high.options.map((option) => option.label), ['Ask every time', 'Allow only for me in this repo', 'Allow shared in this repo', "Don't ask again in this repo"]);
  assert.equal(high.options[0].recommended, true);
  assert.equal(high.options[0].command, null);
  assert.equal(high.options.filter((option) => option.recommended).length, 1);
});

test('Claude Code: local and shared apply keep the existing settings, add each rule once and say when it applies', (t) => {
  const box = sandbox(t);
  const local = join(box.repo, '.claude', 'settings.local.json');
  box.write(local, { model: 'x', permissions: { allow: ['Bash(ls:*)', 'Bash(hc get:*)'], deny: ['Bash(rm:*)'] }, env: { A: '1' } });
  const first = box.run('apply', '--root', box.repo, '--host', 'claude', '--scope', 'local', '--ids', 'hc-read,models');
  assert.equal(first.status, 0);
  assert.deepEqual(first.json.added, ['Bash(hc read:*)', 'WebFetch(domain:models.dev)']);
  assert.match(first.json.applies, /^Applies now/);
  const written = JSON.parse(readFileSync(local, 'utf8'));
  assert.deepEqual(written, {
    model: 'x', permissions: { allow: ['Bash(ls:*)', 'Bash(hc get:*)', 'Bash(hc read:*)', 'WebFetch(domain:models.dev)'], deny: ['Bash(rm:*)'] }, env: { A: '1' },
  });
  const bytes = readFileSync(local, 'utf8');
  const second = box.run('apply', '--root', box.repo, '--host', 'claude', '--scope', 'local', '--ids', 'hc-read,models');
  assert.deepEqual(second.json.written, []);
  assert.equal(readFileSync(local, 'utf8'), bytes);
  assert.equal(existsSync(join(box.repo, '.claude', 'settings.json')), false);

  const shared = box.run('apply', '--root', box.repo, '--host', 'claude', '--scope', 'shared', '--ids', 'hc-send');
  assert.deepEqual(shared.json.written, [join(box.repo, '.claude', 'settings.json')]);
  assert.match(shared.json.applies, /trust/);
  assert.deepEqual(JSON.parse(readFileSync(join(box.repo, '.claude', 'settings.json'), 'utf8')), { permissions: { allow: ['Bash(hc send:*)'] } });
  assert.deepEqual(box.run('check', '--root', box.repo, '--host', 'claude').json.hosts.claude.missing, []);
});

test('Claude Code: in a subfolder of a repo the local file goes to the git root and the shared one to the folder', (t) => {
  const box = sandbox(t);
  const hub = join(box.repo, 'projects', 'one');
  mkdirSync(hub, { recursive: true });
  box.run('apply', '--root', hub, '--host', 'claude', '--scope', 'local', '--ids', 'hc-read');
  box.run('apply', '--root', hub, '--host', 'claude', '--scope', 'shared', '--ids', 'hc-send');
  assert.ok(existsSync(join(box.repo, '.claude', 'settings.local.json')));
  assert.ok(existsSync(join(hub, '.claude', 'settings.json')));
  assert.equal(existsSync(join(hub, '.claude', 'settings.local.json')), false);
});

test('Claude Code: an unreadable settings file is reported and left untouched', (t) => {
  const box = sandbox(t);
  const local = join(box.repo, '.claude', 'settings.local.json');
  box.write(local, '{ "permissions": ');
  const result = box.run('apply', '--root', box.repo, '--host', 'claude', '--scope', 'local', '--ids', 'hc-read');
  assert.equal(result.status, 2);
  assert.match(result.json.error, /not valid JSON.*nothing was written/);
  assert.equal(readFileSync(local, 'utf8'), '{ "permissions": ');
  assert.match(box.run('apply', '--root', box.repo, '--host', 'claude', '--scope', 'local', '--ids', 'nope').json.error, /nope not declared/);
});

test('Codex: an untrusted project gets a warning and no file; a trusted one gets rules once', (t) => {
  const box = sandbox(t);
  const rules = join(box.repo, '.codex', 'rules', 'agent-skills.rules');
  const untrusted = box.run('check', '--root', box.repo, '--host', 'codex').json.hosts.codex;
  assert.equal(untrusted.trusted, false);
  assert.match(untrusted.notice, /does not trust this project/);
  assert.deepEqual(untrusted.questions, []);
  const refused = box.run('apply', '--root', box.repo, '--host', 'codex', '--scope', 'local', '--ids', 'hc-read');
  assert.deepEqual(refused.json.written, []);
  assert.match(refused.json.notice, /Nothing is written/);
  assert.equal(existsSync(rules), false);

  box.trustCodex();
  const trusted = box.run('check', '--root', box.repo, '--host', 'codex').json.hosts.codex;
  assert.equal(trusted.trusted, true);
  assert.deepEqual(trusted.questions.map((question) => question.tier), ['low', 'high']);
  const first = box.run('apply', '--root', box.repo, '--host', 'codex', '--scope', 'local', '--ids', 'hc-read,hc-send,models');
  assert.deepEqual(first.json.added, ['hc get', 'hc read', 'hc send']);
  assert.deepEqual(first.json.unsupported, ['models']);
  assert.match(first.json.applies, /next Codex session/);
  const bytes = readFileSync(rules, 'utf8');
  assert.match(bytes, /pattern = \["hc","get"\],\n {4}decision = "allow"/);
  assert.deepEqual(box.run('apply', '--root', box.repo, '--host', 'codex', '--scope', 'shared', '--ids', 'hc-read').json.written, []);
  assert.equal(readFileSync(rules, 'utf8'), bytes);
  assert.deepEqual(box.run('check', '--root', box.repo, '--host', 'codex').json.hosts.codex.covered, ['hc-read', 'hc-send']);

  const codex = spawnSync('codex', ['execpolicy', 'check', '--rules', rules, 'hc', 'read', '1'], { encoding: 'utf8', input: '' });
  if (codex.error) return t.diagnostic('codex is not installed: execpolicy check skipped');
  assert.equal(JSON.parse(codex.stdout).decision, 'allow');
});

test('Antigravity: apply writes nothing and lists what the skill uses', (t) => {
  const box = sandbox(t);
  const result = box.run('apply', '--root', box.repo, '--host', 'agy', '--scope', 'local', '--ids', 'hc-read');
  assert.equal(result.status, 0);
  assert.deepEqual(result.json.written, []);
  assert.match(result.json.notice, /no per-project permissions/);
  assert.equal(existsSync(join(box.home, '.gemini')), false);
});

test("don't ask again keeps a local choice outside the host settings, and later checks skip those needs", (t) => {
  const box = sandbox(t);
  box.write(join(box.repo, '.gitignore'), 'node_modules\n');
  const result = box.run('apply', '--root', box.repo, '--dont-ask', '--ids', 'hc-send');
  assert.deepEqual(result.json.dont_ask, ['hc-send']);
  const state = join(box.repo, '.agent-skills', 'permissions-state.json');
  assert.deepEqual(JSON.parse(readFileSync(state, 'utf8')), { dont_ask: { demo: ['hc-send'] } });
  assert.equal(readFileSync(join(box.repo, '.agent-skills', '.gitignore'), 'utf8'), '*\n');
  assert.equal(readFileSync(join(box.repo, '.gitignore'), 'utf8'), 'node_modules\n');
  assert.equal(existsSync(join(box.repo, '.claude')), false);
  const claude = box.run('check', '--root', box.repo, '--host', 'claude').json.hosts.claude;
  assert.deepEqual(claude.dont_ask, ['hc-send']);
  assert.deepEqual(ids(claude.missing), ['hc-read', 'models']);
  assert.deepEqual(claude.questions.map((question) => question.tier), ['low']);
  assert.deepEqual(box.run('apply', '--root', box.repo, '--dont-ask', '--ids', 'hc-send').json.written, []);
});
