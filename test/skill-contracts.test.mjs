import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const offers = [
  ['design', 'ui-authoring'],
  ['architecture', 'system-diagrams'],
  ['data', 'sql-authoring'],
];
const versionBySlug = { 'ui-authoring': '3.0.0', 'system-diagrams': '2.0.0', 'sql-authoring': '2.1.0' };
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
      assert.doesNotMatch(details, /\bagent-workflow\b|\baw\b|\.workflow\/|docs\/(?:designs|diagrams|scripts)\/|\bQTC\b/i);
      checkLocalLinks(details, join(target, 'references'), target);
      assert.match(readFileSync(join(target, 'LICENSE'), 'utf8'), /MIT License[\s\S]*Tacuchi/);
      const changelog = readFileSync(join(target, 'CHANGELOG.md'), 'utf8');
      assert.match(changelog, /## \[2\.0\.0\][\s\S]*## \[1\.1\.0\][\s\S]*## \[1\.0\.0\]/);
      const notes = readFileSync(join(target, 'RELEASE_NOTES.md'), 'utf8');
      const version = versionBySlug[slug].replaceAll('.', '\\.');
      assert.match(notes, new RegExp(`^# ${slug} ${version}$`, 'm'));
      assert.match(notes, new RegExp(`skill/${slug}/v${version}`));
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

// Generic contract for every offer directory, whether or not the catalog lists it yet.
const OFFER_DIRS = readdirSync(join(root, 'skills')).flatMap((domain) =>
  readdirSync(join(root, 'skills', domain)).map((slug) => ({ domain, slug, dir: join(root, 'skills', domain, slug) })));
const SLUGS = new Set(OFFER_DIRS.map(({ slug }) => slug));
const FORBIDDEN = [
  /\bQTC\b/, /qtc-/i, /\bRespBase\b/, /\bReqBase\b/, /\bApiService\b/, /tb_maestra/, /\b(?:esq|tb|seq|fn|sp)_[a-z]/,
  /\bagent-workflow\b/i, /\/w:/, /\baw\b/, /\.workflow\//, /structured-choice/, /worktree unit/i,
  /\b(?:code-review|sql-database-standards|receiving-code-review)\b/, /(?:the |`)(?:testing|writing)`? skill\b/,
  // Host-native slash commands never stand in for an offer.
  /(?:^|[\s(`])\/(?:review|code-review|security-review|ultrareview|init|simplify)\b/m,
  // No offer requires another: a mention is optional.
  /\b(?:load|requires?|must use)\b[^.\n]*`[a-z0-9-]+` skill/i,
];
// Built-in commands, skills and subcommands of the eight hosts. Provenance per host: `local` = read
// from the installed CLI's `--help` on 2026-09-29; `documented` = the host's documented built-ins,
// not verifiable from local help (kept as not checked, never assumed free).
const NATIVE_NAMES = {
  'claude-code (documented; local --help lists subcommands only)': ['review', 'code-review', 'security-review', 'ultrareview', 'init', 'compact', 'clear', 'config', 'context', 'cost', 'doctor', 'memory', 'agents', 'hooks', 'mcp', 'plugin', 'plugins', 'permissions', 'model', 'resume', 'help', 'status', 'login', 'logout', 'bug', 'simplify', 'batch', 'loop', 'debug', 'export', 'rewind', 'sandbox', 'add-dir', 'statusline', 'output-style', 'pr-comments', 'install-github-app', 'terminal-setup', 'ide', 'vim', 'install', 'update', 'worktree'],
  'codex (local: review, exec, apply, resume, fork, doctor, plugin, sandbox, cloud, agents, features, mcp)': ['review', 'exec', 'apply', 'resume', 'fork', 'doctor', 'plugin', 'sandbox', 'cloud', 'agents', 'features', 'mcp', 'login', 'logout', 'completion', 'debug', 'init', 'compact', 'diff', 'mention', 'model', 'approvals', 'new', 'undo', 'status', 'quit'],
  'gemini-cli/antigravity (local agy: agent, agents, install, mcp, models, plugin, plugins, update; slash commands documented)': ['agent', 'agents', 'install', 'mcp', 'models', 'plugin', 'plugins', 'update', 'help', 'chat', 'memory', 'tools', 'compress', 'restore', 'stats', 'theme', 'auth', 'editor', 'extensions', 'init', 'settings', 'directory', 'docs', 'privacy', 'about', 'bug'],
  'opencode (documented; local --help lists no subcommands)': ['init', 'share', 'unshare', 'compact', 'undo', 'redo', 'models', 'sessions', 'themes', 'editor', 'export', 'help', 'new', 'details', 'agent', 'run', 'serve', 'auth', 'upgrade'],
  'crush (local: run, logs, models, projects, session, stats, login, logout, dirs, update-providers)': ['run', 'logs', 'models', 'projects', 'session', 'stats', 'login', 'logout', 'dirs', 'update-providers', 'completion', 'help'],
  'warp/oz (local oz: agent, run, runner, schedule, memory, memory-store, mcp, environment, integration, artifact, secret, model)': ['agent', 'run', 'runner', 'schedule', 'memory', 'memory-store', 'mcp', 'environment', 'integration', 'artifact', 'secret', 'model', 'login', 'logout', 'federate', 'whoami'],
  'kimi (local: acp, ask, doctor, export, login, migrate, new, project, provider, server, web)': ['acp', 'ask', 'doctor', 'export', 'login', 'migrate', 'new', 'project', 'provider', 'server', 'web', 'init', 'compact', 'clear', 'help', 'setup'],
};

function filesOf(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? filesOf(join(dir, entry.name)) : [join(dir, entry.name)]);
}

function copyTree(source, target) {
  mkdirSync(target, { recursive: true });
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    if (entry.isDirectory()) copyTree(join(source, entry.name), join(target, entry.name));
    else copyFileSync(join(source, entry.name), join(target, entry.name));
  }
}

test('every offer directory is a standalone, licensed, versioned and clean skill', async (t) => {
  assert.equal(OFFER_DIRS.length, SLUGS.size, 'slugs are unique across domains');
  for (const { slug, dir } of OFFER_DIRS) {
    await t.test(slug, (caseT) => {
      const fixture = mkdtempSync(join(tmpdir(), `${slug}-alone-`));
      caseT.after(() => rmSync(fixture, { recursive: true, force: true }));
      const target = join(fixture, slug);
      copyTree(dir, target);
      assert.deepEqual(readdirSync(fixture), [slug]);
      const skill = readFileSync(join(target, 'SKILL.md'), 'utf8');
      assert.match(skill, new RegExp(`^---\nname: ${slug}\ndescription: .+\n---`));
      const description = /^description: (.+)$/m.exec(skill)[1];
      const text = description.startsWith('"') ? JSON.parse(description) : description;
      assert.ok(description.startsWith('"') || !description.includes(': '), `${slug}: an unquoted description holds no ": "`);
      assert.ok(text.length <= 1024, `${slug}: description fits the 1024-character limit (${text.length})`);
      assert.ok(slug.length <= 64, `${slug}: name fits the 64-character limit`);
      assert.match(readFileSync(join(target, 'LICENSE'), 'utf8'), /MIT License[\s\S]*Tacuchi/);
      const version = /^## \[(\d+\.\d+\.\d+)\]/m.exec(readFileSync(join(target, 'CHANGELOG.md'), 'utf8'))?.[1];
      assert.ok(version, `${slug}: CHANGELOG announces a version`);
      const notes = readFileSync(join(target, 'RELEASE_NOTES.md'), 'utf8');
      assert.match(notes, new RegExp(`^# ${slug} ${version.replaceAll('.', '\\.')}$`, 'm'));
      assert.ok(notes.includes(`skill/${slug}/v${version}`), `${slug}: release notes name the tag`);
      for (const file of filesOf(target)) {
        const content = readFileSync(file, 'utf8');
        const where = relative(target, file);
        for (const token of FORBIDDEN) assert.doesNotMatch(content, token, `${slug}/${where}: ${token}`);
        const mentions = [
          ...content.matchAll(/(?:\bthe |`)`?([a-z0-9]+(?:-[a-z0-9]+)+)`? skill\b/g),
          ...content.matchAll(/`([a-z0-9]+(?:-[a-z0-9]+)*)` skill\b/g),
        ];
        for (const [, named] of mentions) {
          assert.ok(SLUGS.has(named), `${slug}/${where}: names a skill that is not an offer: ${named}`);
        }
        if (file.endsWith('.md')) checkLocalLinks(content, resolve(file, '..'), target);
      }
    });
  }
});

test('no offer takes the name of a native command, skill or subcommand of the eight hosts (Warp and Oz share one CLI)', () => {
  for (const [host, names] of Object.entries(NATIVE_NAMES)) {
    for (const { slug } of OFFER_DIRS) assert.ok(!names.includes(slug), `${slug} collides with ${host}`);
  }
});

test('the creating-tools scripts scaffold a tool and archive a run in a temporary directory', (t) => {
  const scripts = join(root, 'skills', 'agents', 'creating-tools', 'scripts');
  const cwd = mkdtempSync(join(tmpdir(), 'creating-tools-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const run = (script, ...args) => spawnSync(process.execPath, [join(scripts, script), ...args], { cwd, encoding: 'utf8' });
  assert.equal(run('scaffold-tool.mjs').status, 1, 'no arguments prints usage and fails');
  assert.equal(run('scaffold-tool.mjs', 'Bad_Slug').status, 1);
  const scaffold = run('scaffold-tool.mjs', 'sample-tool', '--type', 'cli');
  assert.equal(scaffold.status, 0, scaffold.stderr);
  const tool = join(cwd, 'docs', 'tools', 'sample-tool');
  for (const dir of ['runs', 'output']) assert.ok(existsSync(join(tool, dir)), `${dir}/ created`);
  assert.match(readFileSync(join(tool, 'README.md'), 'utf8'), /\*\*Type\*\*: cli/);
  const index = join(cwd, 'docs', 'tools', 'README.md');
  assert.match(readFileSync(index, 'utf8'), /\| \[sample-tool\]\(sample-tool\/README\.md\) \|/);
  assert.equal(run('scaffold-tool.mjs', 'sample-tool').status, 0, 'a re-run is idempotent');
  assert.equal(readFileSync(index, 'utf8').match(/\(sample-tool\/README\.md\)/g).length, 1);
  const archived = run('record-run.mjs', 'sample-tool', '--', process.execPath, '-e', 'process.exit(3)');
  assert.equal(archived.status, 3, 'the command exit code is kept');
  const [stamp] = readdirSync(join(tool, 'runs'));
  assert.match(readFileSync(join(tool, 'runs', stamp, 'command.txt'), 'utf8'), /exit_code=3/);
  assert.ok(existsSync(join(tool, 'runs', stamp, 'run.log')));
  assert.equal(run('record-run.mjs', 'missing-tool', '--', 'true').status, 1);
});

const PERMISSION_SKILLS = [
  ['orchestration', 'master'],
  ['orchestration', 'coordinating-agents'],
  ['agents', 'creating-tools'],
  ['engineering', 'software-testing'],
  ['git', 'git-conventions'],
  ['git', 'resolving-merge-conflicts'],
  ['documentation', 'project-docs'],
  ['engineering', 'github-workflows'],
];
const GIT_READ = ['git status', 'git diff', 'git log', 'git branch --show-current'];
const permissionsOf = (domain, slug) => JSON.parse(readFileSync(join(root, 'skills', domain, slug, 'permissions.json'), 'utf8'));
const prefixes = (manifest, tier) => manifest.needs.filter((need) => !tier || need.tier === tier).flatMap((need) => need.prefixes ?? []);

test('each skill that runs commands ships an identical permission script and a valid permissions.json', async (t) => {
  const reference = readFileSync(join(root, 'scripts', 'permissions.mjs'), 'utf8');
  for (const [domain, slug] of PERMISSION_SKILLS) {
    await t.test(slug, (caseT) => {
      const source = join(root, 'skills', domain, slug);
      assert.equal(readFileSync(join(source, 'scripts', 'permissions.mjs'), 'utf8'), reference, `${slug}: copy differs from scripts/permissions.mjs`);
      const fixture = mkdtempSync(join(tmpdir(), `${slug}-permissions-`));
      caseT.after(() => rmSync(fixture, { recursive: true, force: true }));
      const target = join(fixture, slug);
      cpSync(source, target, { recursive: true });
      const run = (...args) => spawnSync(process.execPath, [join(target, 'scripts', 'permissions.mjs'), ...args], {
        cwd: fixture, encoding: 'utf8', env: { ...process.env, HOME: fixture, CLAUDE_CONFIG_DIR: '', CODEX_HOME: '' },
      });
      const validated = run('validate');
      assert.equal(validated.status, 0, validated.stdout);
      assert.equal(JSON.parse(validated.stdout).skill, slug);
      const checked = run('check', '--root', fixture, '--host', 'claude');
      assert.equal(checked.status, 0, checked.stdout);
      const claude = JSON.parse(checked.stdout).hosts.claude;
      assert.ok(claude.missing.some((need) => need.id === 'permission-check'), `${slug}: the check itself is declared`);
      const self = claude.missing.find((need) => need.id === 'permission-check');
      assert.deepEqual(self.rules, [`Bash(node ${realpathSync(target)}/scripts/permissions.mjs:*)`]);
    });
  }
});

test('step 0 checks, asks low and high risk apart, writes only the choice and goes on when the check fails', () => {
  for (const [domain, slug] of PERMISSION_SKILLS) {
    const skill = readFileSync(join(root, 'skills', domain, slug, 'SKILL.md'), 'utf8');
    const at = skill.indexOf('\n## Step 0 — Permissions this skill uses\n');
    assert.ok(at > 0, `${slug}: step 0 present`);
    assert.equal(skill.indexOf('\n## '), at, `${slug}: step 0 is the first section`);
    const step = skill.slice(at, skill.indexOf('\n## ', at + 1));
    assert.match(step, /node <skill dir>\/scripts\/permissions\.mjs check --root <session folder> --host <claude\|codex\|agy>/);
    assert.match(step, /If `node` is missing or the command fails, say so, list the needs in `<skill dir>\/permissions\.json` and go on with the skill/);
    assert.match(step, /structured question tool/);
    assert.match(step, /Low-risk and high-risk needs are separate questions; ask them separately and never recommend allowing a high-risk need/);
    assert.match(step, /Run the `command` of the option the person chose, exactly as given\. An option without a command writes nothing\. Write nothing the person did not choose/);
    assert.match(step, /`applies` line .* now or after a restart/);
  }
});

test('each skill declares the needs its steps use, with git read-only and unrestricted launches as high risk', () => {
  for (const [domain, slug] of PERMISSION_SKILLS) {
    for (const prefix of prefixes(permissionsOf(domain, slug)).filter((p) => p.startsWith('git '))) {
      assert.ok(GIT_READ.includes(prefix), `${slug}: ${prefix} is not a read-only git operation`);
    }
  }
  for (const slug of ['git-conventions', 'resolving-merge-conflicts']) {
    const manifest = permissionsOf('git', slug);
    assert.deepEqual(prefixes(manifest).filter((p) => p.startsWith('git ')), GIT_READ);
    assert.deepEqual(prefixes(manifest, 'high'), []);
  }
  const testing = permissionsOf('engineering', 'software-testing');
  assert.deepEqual(prefixes(testing, 'high'), []);
  for (const wrapper of ['./mvnw test', './gradlew', 'npm test']) assert.ok(prefixes(testing, 'low').includes(wrapper), wrapper);
  for (const slug of ['master', 'coordinating-agents']) {
    const manifest = permissionsOf('orchestration', slug);
    // Agents are launched by typing their command into a terminal, so whatever types is high risk.
    assert.deepEqual(prefixes(manifest, 'high'), ['hc send', 'hc keys', 'hc run']);
    for (const read of ['hc get', 'hc read', 'hc wait', 'herdr-app do', 'openusage']) assert.ok(prefixes(manifest, 'low').includes(read), `${slug}: ${read}`);
    assert.ok(!prefixes(manifest, 'low').some((p) => p === 'hc' || p.startsWith('hc send')), `${slug}: no low rule covers typing into terminals`);
  }
  assert.ok(prefixes(permissionsOf('orchestration', 'master'), 'low').includes('curl -s https://models.dev/api.json'));
  const tools = permissionsOf('agents', 'creating-tools');
  assert.deepEqual(prefixes(tools, 'low'), ['node {skill_dir}/scripts/permissions.mjs', 'node {skill_dir}/scripts/scaffold-tool.mjs']);
  assert.deepEqual(prefixes(tools, 'high'), ['node {skill_dir}/scripts/record-run.mjs']);
});

test('project-docs names its three commands, its fixed rules and every file it ships', () => {
  const dir = join(root, 'skills', 'documentation', 'project-docs');
  const skill = readFileSync(join(dir, 'SKILL.md'), 'utf8');
  for (const command of ['`generate <repo>`', '`update <repo>`', '`check <repo>`']) assert.ok(skill.includes(command), command);
  assert.ok(skill.includes('The documentation set is never its own evidence'));
  assert.ok(skill.includes('"Not recorded yet"'));
  assert.match(skill, /structured question tool/);
  assert.ok(skill.split('\n').length < 200, 'SKILL.md stays short');
  const docs = ['SKILL.md', ...readdirSync(join(dir, 'references')).map((name) => `references/${name}`)];
  const linked = new Set(docs.flatMap((doc) => [...readFileSync(join(dir, doc), 'utf8').matchAll(/\]\(([^)#]+)\)/g)]
    .map(([, href]) => relative(dir, resolve(dir, doc, '..', href)))));
  for (const folder of ['references', 'assets']) {
    for (const name of readdirSync(join(dir, folder))) assert.ok(linked.has(`${folder}/${name}`), `${folder}/${name} is linked from the skill`);
  }
  for (const file of filesOf(dir)) {
    const content = readFileSync(file, 'utf8');
    assert.doesNotMatch(content, /installation sheet/i, relative(dir, file));
    assert.doesNotMatch(content, /`instance\b/, relative(dir, file));
  }
});

test('git-conventions tells what a push starts before pushing and checks what ran after', () => {
  const dir = join(root, 'skills', 'git', 'git-conventions');
  const skill = readFileSync(join(dir, 'SKILL.md'), 'utf8');
  for (const piece of ['### What a push starts', '[skip ci]', 'gh run list', 'Never push to find out']) assert.ok(skill.includes(piece), piece);
  assert.ok(skill.indexOf('### What a push starts') < skill.indexOf('### Commands that mislead'), 'the rule comes before the list of traps');
  assert.match(readFileSync(join(dir, 'CHANGELOG.md'), 'utf8'), /^# git-conventions changelog\n\n## \[1\.3\.0\]/);
  assert.ok(prefixes(permissionsOf('git', 'git-conventions'), 'low').includes('gh run list'));
});

test('github-workflows names its six commands, its fixed rules and every file it ships', () => {
  const dir = join(root, 'skills', 'engineering', 'github-workflows');
  const skill = readFileSync(join(dir, 'SKILL.md'), 'utf8');
  for (const command of ['check', 'generate', 'update', 'status', 'deploy', 'rollback']) assert.ok(skill.includes(`\`${command} <repo>\``), command);
  assert.ok(skill.includes('Nothing that reaches production runs without the person\'s explicit yes'));
  assert.ok(skill.includes('reported as unreadable, never as clean'));
  assert.match(skill, /structured question tool/);
  assert.ok(skill.split('\n').length < 200, 'SKILL.md stays short');
  const docs = ['SKILL.md', ...readdirSync(join(dir, 'references')).map((name) => `references/${name}`)];
  const linked = new Set(docs.flatMap((doc) => [...readFileSync(join(dir, doc), 'utf8').matchAll(/\]\(([^)#]+)\)/g)]
    .map(([, href]) => relative(dir, resolve(dir, doc, '..', href)))));
  for (const folder of ['references', 'assets']) {
    for (const name of readdirSync(join(dir, folder))) assert.ok(linked.has(`${folder}/${name}`), `${folder}/${name} is linked from the skill`);
  }
  // The operations script is the only high-risk need, and reading runs is low risk.
  const manifest = permissionsOf('engineering', 'github-workflows');
  assert.deepEqual(prefixes(manifest, 'high'), ['node {skill_dir}/scripts/ops.mjs']);
  for (const read of ['gh run list', 'gh run view']) assert.ok(prefixes(manifest, 'low').includes(read), read);
});
