import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
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

// Generic contract for every offer directory, whether or not the catalog lists it yet.
const OFFER_DIRS = readdirSync(join(root, 'skills')).flatMap((domain) =>
  readdirSync(join(root, 'skills', domain)).map((slug) => ({ domain, slug, dir: join(root, 'skills', domain, slug) })));
const SLUGS = new Set(OFFER_DIRS.map(({ slug }) => slug));
const FORBIDDEN = [
  /\bQTC\b/, /qtc-/i, /\bRespBase\b/, /\bReqBase\b/, /\bApiService\b/, /tb_maestra/, /\b(?:esq|tb|seq|fn|sp)_[a-z]/,
  /\bWorkline\b/i, /\/w:/, /\baw\b/, /\.workflow\//, /structured-choice/, /worktree unit/i,
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
