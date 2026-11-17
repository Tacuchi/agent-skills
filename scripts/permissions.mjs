#!/usr/bin/env node
// permissions.mjs — checks and writes the project permissions a skill declares in its permissions.json.
//
// Every skill that runs commands ships an identical copy of this file in its scripts/ folder,
// next to its permissions.json. It never writes the global configuration of any host:
// it reads it only to avoid proposing what is already allowed.
//
//   node permissions.mjs check    [--root DIR] [--host claude|codex|agy] [--manifest FILE]
//   node permissions.mjs apply    --host claude|codex --scope local|shared --ids a,b [--root DIR] [--manifest FILE]
//   node permissions.mjs apply    --dont-ask --ids a,b [--root DIR] [--manifest FILE]
//   node permissions.mjs validate [--manifest FILE]
//
// Output is JSON on stdout. Exit 0 on a handled outcome, 2 on bad usage or an invalid manifest.

import { existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const HOSTS = ['claude', 'codex', 'agy'];
const TIERS = ['low', 'high'];
const ID = /^[a-z0-9][a-z0-9-]*$/;
const DOMAIN = /^(?:[a-z0-9-]+\.)+[a-z]{2,}$/;
const SHELL_META = /[;&|`$<>*\\"'\n]/;
const STATE_DIR = '.agent-skills';
const STATE_FILE = 'permissions-state.json';
const CODEX_RULES = 'agent-skills.rules';

class UsageError extends Error {}

function fail(message) {
  throw new UsageError(message);
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === '--dont-ask') options.dontAsk = true;
    else if (['--root', '--host', '--scope', '--ids', '--manifest'].includes(arg)) {
      const value = rest[++i];
      if (value === undefined || value.startsWith('--')) fail(`${arg} needs a value`);
      options[arg.slice(2)] = value;
    } else fail(`unknown argument: ${arg}`);
  }
  return { command, options };
}

function real(path) {
  try {
    return realpathSync(path);
  } catch {
    return resolve(path);
  }
}

function readJson(path) {
  if (!existsSync(path)) return undefined;
  const text = readFileSync(path, 'utf8');
  if (text.trim() === '') return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`${path} is not valid JSON (${error.message}); fix it by hand, nothing was written`);
  }
}

// --- Manifest ---------------------------------------------------------------

function validateManifest(manifest, source) {
  const problems = [];
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return [`${source}: expected a JSON object with "skill" and "needs"`];
  }
  if (typeof manifest.skill !== 'string' || !ID.test(manifest.skill)) {
    problems.push(`skill: expected a lowercase slug, got ${JSON.stringify(manifest.skill)}`);
  }
  if (!Array.isArray(manifest.needs) || manifest.needs.length === 0) {
    problems.push('needs: expected a non-empty array');
    return problems;
  }
  const seen = new Set();
  manifest.needs.forEach((need, index) => {
    const at = `needs[${index}]`;
    if (!need || typeof need !== 'object') return problems.push(`${at}: expected an object`);
    if (typeof need.id !== 'string' || !ID.test(need.id)) problems.push(`${at}.id: expected a lowercase slug, got ${JSON.stringify(need.id)}`);
    else if (seen.has(need.id)) problems.push(`${at}.id: duplicate id ${need.id}`);
    else seen.add(need.id);
    if (!TIERS.includes(need.tier)) problems.push(`${at}.tier: expected low or high, got ${JSON.stringify(need.tier)}`);
    if (typeof need.reason !== 'string' || need.reason.trim() === '') problems.push(`${at}.reason: expected a sentence`);
    if (need.type === 'command') {
      if (!Array.isArray(need.prefixes) || need.prefixes.length === 0) problems.push(`${at}.prefixes: expected a non-empty array of command prefixes`);
      else need.prefixes.forEach((prefix, j) => {
        if (typeof prefix !== 'string' || prefix.trim() === '' || prefix !== prefix.trim() || /\s{2,}/.test(prefix)) {
          problems.push(`${at}.prefixes[${j}]: expected words separated by single spaces, got ${JSON.stringify(prefix)}`);
        } else if (SHELL_META.test(prefix.replaceAll('{skill_dir}', ''))) {
          problems.push(`${at}.prefixes[${j}]: shell operators, quotes and wildcards are not allowed, got ${JSON.stringify(prefix)}`);
        }
      });
    } else if (need.type === 'web') {
      if (!Array.isArray(need.domains) || need.domains.length === 0) problems.push(`${at}.domains: expected a non-empty array of host names`);
      else need.domains.forEach((domain, j) => {
        if (typeof domain !== 'string' || !DOMAIN.test(domain)) problems.push(`${at}.domains[${j}]: expected a host name such as models.dev, got ${JSON.stringify(domain)}`);
      });
    } else problems.push(`${at}.type: expected command or web, got ${JSON.stringify(need.type)}`);
  });
  return problems;
}

function loadManifest(options) {
  const path = resolve(options.manifest ?? join(import.meta.dirname, '..', 'permissions.json'));
  if (!existsSync(path)) fail(`no permissions.json at ${path}`);
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail(`${path} is not valid JSON (${error.message})`);
  }
  const problems = validateManifest(manifest, path);
  if (problems.length) fail(`${path} is invalid:\n- ${problems.join('\n- ')}`);
  const skillDir = real(dirname(path));
  const needs = manifest.needs.map((need) => ({
    ...need,
    // Each prefix keeps its words; {skill_dir} becomes one word even if the path has spaces.
    commands: (need.prefixes ?? []).map((prefix) => prefix.split(' ').map((word) => word.replaceAll('{skill_dir}', skillDir))),
  }));
  return { path, skill: manifest.skill, needs };
}

// --- Locations --------------------------------------------------------------

function gitRoot(start) {
  for (let dir = start; ; dir = dirname(dir)) {
    if (existsSync(join(dir, '.git'))) return dir;
    if (dirname(dir) === dir) return undefined;
  }
}

function locations(rootOption) {
  const root = real(rootOption ?? process.cwd());
  const repo = gitRoot(root) ?? root;
  const home = process.env.HOME || homedir();
  const claudeHome = process.env.CLAUDE_CONFIG_DIR || join(home, '.claude');
  const codexHome = process.env.CODEX_HOME || join(home, '.codex');
  return {
    root,
    repo,
    claude: {
      // Checked on 2026-11-17: Claude Code reads the local file at the git root and the shared file
      // from the folder where the session started.
      local: join(repo, '.claude', 'settings.local.json'),
      shared: join(root, '.claude', 'settings.json'),
      read: [...new Set([
        join(repo, '.claude', 'settings.local.json'), join(root, '.claude', 'settings.local.json'),
        join(root, '.claude', 'settings.json'), join(repo, '.claude', 'settings.json'),
        join(claudeHome, 'settings.json'),
      ])],
    },
    codex: {
      rules: join(repo, '.codex', 'rules', CODEX_RULES),
      projectRules: join(repo, '.codex', 'rules'),
      globalRules: join(codexHome, 'rules'),
      config: join(codexHome, 'config.toml'),
    },
    agy: { settings: join(home, '.gemini', 'antigravity-cli', 'settings.json') },
    state: join(root, STATE_DIR, STATE_FILE),
  };
}

// --- Rules per host ---------------------------------------------------------

const commandText = (words) => words.join(' ');

function claudeRules(need) {
  return need.type === 'web'
    ? need.domains.map((domain) => `WebFetch(domain:${domain})`)
    : need.commands.map((words) => `Bash(${commandText(words)}:*)`);
}

function globCovers(pattern, text) {
  const regex = new RegExp(`^${pattern.split('*').map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`);
  // A rule covers a prefix only if it also covers whatever follows the prefix.
  return regex.test(text) && regex.test(`${text} --any-argument`);
}

function claudeCovers(rule, text) {
  if (rule === 'Bash' || rule === 'Bash(*)') return true;
  const match = /^Bash\((.*)\)$/s.exec(rule);
  if (!match) return false;
  const body = match[1];
  if (body.endsWith(':*')) {
    const prefix = body.slice(0, -2);
    return text === prefix || text.startsWith(`${prefix} `);
  }
  return body.includes('*') ? globCovers(body, text) : false;
}

function claudeAllowed(paths) {
  return paths.flatMap((path) => {
    const settings = readJson(path);
    const allow = settings?.permissions?.allow;
    return Array.isArray(allow) ? allow.filter((rule) => typeof rule === 'string') : [];
  });
}

function claudeNeedCovered(need, allowed) {
  if (need.type === 'web') {
    return need.domains.every((domain) => allowed.some((rule) => rule === 'WebFetch' || rule === `WebFetch(domain:${domain})`));
  }
  return need.commands.every((words) => allowed.some((rule) => claudeCovers(rule, commandText(words))));
}

function codexPatterns(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((name) => name.endsWith('.rules')).flatMap((name) => {
    const text = readFileSync(join(dir, name), 'utf8');
    return [...text.matchAll(/prefix_rule\s*\(([\s\S]*?)\)\s*(?:\n|$)/g)].flatMap(([, body]) => {
      const decision = /decision\s*=\s*"([^"]+)"/.exec(body)?.[1] ?? 'allow';
      const start = body.search(/pattern\s*=\s*\[/);
      if (decision !== 'allow' || start === -1) return [];
      const open = body.indexOf('[', start);
      let depth = 0;
      for (let i = open; i < body.length; i++) {
        if (body[i] === '[') depth++;
        if (body[i] === ']' && --depth === 0) {
          try {
            return [JSON.parse(body.slice(open, i + 1).replace(/,\s*]/g, ']'))];
          } catch {
            return [];
          }
        }
      }
      return [];
    });
  });
}

function codexCovers(pattern, words) {
  return pattern.length <= words.length && pattern.every((part, i) => (Array.isArray(part) ? part.includes(words[i]) : part === words[i]));
}

function codexTrusted(config, repo) {
  if (!existsSync(config)) return false;
  const text = readFileSync(config, 'utf8');
  for (const [, path, body] of text.matchAll(/^\[projects\."((?:[^"\\]|\\.)*)"\]\s*\n([\s\S]*?)(?=^\[|(?![\s\S]))/gm)) {
    if (real(path.replace(/\\(.)/g, '$1')) === repo && /^\s*trust_level\s*=\s*"trusted"/m.test(body)) return true;
  }
  return false;
}

function codexRule(skill, need, words) {
  const justification = `agent-skills ${skill}/${need.id}: ${need.reason}`.replace(/["\\]/g, '');
  return `prefix_rule(\n    pattern = ${JSON.stringify(words)},\n    decision = "allow",\n    justification = "${justification}",\n)\n`;
}

function agyAllowed(path) {
  const allow = readJson(path)?.permissions?.allow;
  return Array.isArray(allow) ? allow.filter((rule) => typeof rule === 'string') : [];
}

function agyNeedCovered(need, allowed) {
  if (need.type !== 'command') return false;
  return need.commands.every((words) => allowed.some((rule) => {
    const body = /^command\((.*)\)$/s.exec(rule)?.[1];
    if (body === undefined) return false;
    const prefix = body.endsWith(':*') ? body.slice(0, -2) : body;
    return commandText(words) === prefix || commandText(words).startsWith(`${prefix} `);
  }));
}

// --- State of "don't ask again" ---------------------------------------------

function readState(path) {
  const state = readJson(path) ?? {};
  return state && typeof state.dont_ask === 'object' && !Array.isArray(state.dont_ask) ? state : { dont_ask: {} };
}

function writeState(path, skill, ids) {
  const state = readState(path);
  const before = state.dont_ask[skill] ?? [];
  const after = [...new Set([...before, ...ids])];
  // The folder ignores itself, so the root .gitignore is never touched and the choice stays local.
  mkdirSync(dirname(path), { recursive: true });
  const ignore = join(dirname(path), '.gitignore');
  if (!existsSync(ignore)) writeFileSync(ignore, '*\n');
  if (after.length === before.length) return false;
  state.dont_ask[skill] = after;
  writeFileSync(path, `${JSON.stringify(state, null, 2)}\n`);
  return true;
}

// --- Notices ----------------------------------------------------------------

const APPLIES = {
  claude: {
    local: 'Applies now: Claude Code reloads permission rules during the session, no restart needed.',
    shared: 'Applies now if Claude Code already trusts this folder; otherwise after you accept the trust prompt at the next start.',
  },
  codex: 'Applies from the next Codex session: Codex loads project rules when a session starts, and only in trusted projects.',
};

const CODEX_UNTRUSTED = 'Codex does not trust this project, so it would not load project rules. Nothing is written; trust the project in Codex first.';
const AGY_NOTICE = 'Antigravity has no per-project permissions; nothing can be written in this repo. These are the commands the skill will use.';

// --- check ------------------------------------------------------------------

function describe(need, host) {
  return {
    id: need.id,
    tier: need.tier,
    reason: need.reason,
    uses: need.type === 'web' ? need.domains : need.commands.map(commandText),
    rules: host === 'claude' ? claudeRules(need) : host === 'codex' && need.type === 'command' ? need.commands.map(commandText) : [],
  };
}

function hostReport(host, manifest, where, dontAsk) {
  const report = { covered: [], missing: [], unsupported: [], dont_ask: [] };
  let allowed;
  if (host === 'claude') allowed = claudeAllowed(where.claude.read);
  if (host === 'codex') allowed = [...codexPatterns(where.codex.projectRules), ...codexPatterns(where.codex.globalRules)];
  if (host === 'agy') allowed = agyAllowed(where.agy.settings);
  for (const need of manifest.needs) {
    const covered = host === 'claude' ? claudeNeedCovered(need, allowed)
      : host === 'codex' ? need.type === 'command' && need.commands.every((words) => allowed.some((pattern) => codexCovers(pattern, words)))
        : agyNeedCovered(need, allowed);
    if (covered) report.covered.push(need.id);
    else if (host === 'agy' || (host === 'codex' && need.type === 'web')) report.unsupported.push(describe(need, host));
    else if (dontAsk.includes(need.id)) report.dont_ask.push(need.id);
    else report.missing.push(describe(need, host));
  }
  if (host === 'claude') report.targets = { local: where.claude.local, shared: where.claude.shared };
  if (host === 'codex') {
    report.trusted = codexTrusted(where.codex.config, where.repo);
    report.target = where.codex.rules;
    if (!report.trusted && report.missing.length) report.notice = CODEX_UNTRUSTED;
  }
  if (host === 'agy') report.notice = AGY_NOTICE;
  return report;
}

function invocation(manifest, where) {
  const script = real(import.meta.filename);
  const manifestArg = real(dirname(manifest.path)) === real(join(import.meta.dirname, '..')) ? '' : ` --manifest '${manifest.path}'`;
  return `node '${script}' apply --root '${where.root}'${manifestArg}`;
}

function questions(host, report, manifest, where) {
  if (host === 'agy' || (host === 'codex' && !report.trusted)) return [];
  const base = invocation(manifest, where);
  const sharedNote = host === 'codex' ? ' Codex has one rules file in the repo; it is shared once someone commits it.' : '';
  const out = [];
  for (const tier of TIERS) {
    const needs = report.missing.filter((need) => need.tier === tier);
    if (!needs.length) continue;
    const ids = needs.map((need) => need.id).join(',');
    const list = needs.map((need) => `${need.uses.join(', ')} (${need.reason})`).join('; ');
    const write = (scope) => `${base} --host ${host} --scope ${scope} --ids ${ids}`;
    const dontAsk = { label: "Don't ask again in this repo", description: 'Writes no rule and keeps this choice in a local file that git ignores; later checks in this repo skip these needs.', command: `${base} --dont-ask --ids ${ids}` };
    out.push(tier === 'low'
      ? {
        tier, ids: needs.map((need) => need.id),
        text: `${manifest.skill} will run commands that are not allowed yet in this repo: ${list}. Allow them to avoid prompts during the session?`,
        options: [
          { label: 'Only for me in this repo', recommended: true, description: `Adds the rules to your personal settings of this repo.${sharedNote}`, command: write('local') },
          { label: 'Shared in this repo', description: `Adds the rules to the settings that everyone in this repo gets when committed.${sharedNote}`, command: write('shared') },
          { label: 'Skip for now', description: 'Writes nothing; the host keeps asking each time during this session.', command: null },
          dontAsk,
        ],
      }
      : {
        tier, ids: needs.map((need) => need.id),
        text: `High risk: ${manifest.skill} can also ${list}. Allowing this lets it run without the host asking you each time. Keep asking?`,
        options: [
          { label: 'Ask every time', recommended: true, description: 'Writes nothing; the host asks you before each use.', command: null },
          { label: 'Allow only for me in this repo', description: `Adds the rules to your personal settings of this repo; the host stops asking.${sharedNote}`, command: write('local') },
          { label: 'Allow shared in this repo', description: `Adds the rules to the settings everyone in this repo gets when committed.${sharedNote}`, command: write('shared') },
          dontAsk,
        ],
      });
  }
  return out;
}

function check(options) {
  const manifest = loadManifest(options);
  const where = locations(options.root);
  if (options.host && !HOSTS.includes(options.host)) fail(`--host: expected one of ${HOSTS.join(', ')}, got ${options.host}`);
  const dontAsk = readState(where.state).dont_ask[manifest.skill] ?? [];
  const hosts = {};
  for (const host of options.host ? [options.host] : HOSTS) {
    const report = hostReport(host, manifest, where, dontAsk);
    report.questions = questions(host, report, manifest, where);
    hosts[host] = report;
  }
  return { skill: manifest.skill, root: where.root, hosts };
}

// --- apply ------------------------------------------------------------------

function selectNeeds(manifest, ids) {
  if (!ids) fail('--ids: expected a comma-separated list of need ids');
  const wanted = ids.split(',').map((id) => id.trim()).filter(Boolean);
  const unknown = wanted.filter((id) => !manifest.needs.some((need) => need.id === id));
  if (unknown.length) fail(`--ids: ${unknown.join(', ')} not declared in ${manifest.path}`);
  return manifest.needs.filter((need) => wanted.includes(need.id));
}

function applyClaude(path, needs) {
  const settings = readJson(path) ?? {};
  if (typeof settings !== 'object' || Array.isArray(settings)) fail(`${path} is not a JSON object; nothing was written`);
  settings.permissions ??= {};
  if (typeof settings.permissions !== 'object' || Array.isArray(settings.permissions)) fail(`${path}: "permissions" is not an object; nothing was written`);
  settings.permissions.allow ??= [];
  if (!Array.isArray(settings.permissions.allow)) fail(`${path}: "permissions.allow" is not an array; nothing was written`);
  const added = needs.flatMap(claudeRules).filter((rule, i, all) => all.indexOf(rule) === i && !settings.permissions.allow.includes(rule));
  if (!added.length) return [];
  settings.permissions.allow.push(...added);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(settings, null, 2)}\n`);
  return added;
}

function applyCodex(path, skill, needs) {
  const existing = codexPatterns(dirname(path));
  const blocks = [];
  const added = [];
  for (const need of needs.filter((n) => n.type === 'command')) {
    for (const words of need.commands) {
      if (existing.some((pattern) => JSON.stringify(pattern) === JSON.stringify(words))) continue;
      existing.push(words);
      blocks.push(codexRule(skill, need, words));
      added.push(commandText(words));
    }
  }
  if (!blocks.length) return [];
  mkdirSync(dirname(path), { recursive: true });
  const before = existsSync(path) ? readFileSync(path, 'utf8') : '# Rules added by agent-skills after the person approved them.\n';
  writeFileSync(path, `${before}${before.endsWith('\n') ? '' : '\n'}\n${blocks.join('\n')}`);
  return added;
}

function apply(options) {
  const manifest = loadManifest(options);
  const where = locations(options.root);
  const needs = selectNeeds(manifest, options.ids);
  if (options.dontAsk) {
    const changed = writeState(where.state, manifest.skill, needs.map((need) => need.id));
    return { skill: manifest.skill, written: changed ? [where.state] : [], dont_ask: needs.map((need) => need.id), notice: 'No rule was written; later checks in this repo skip these needs.' };
  }
  if (!HOSTS.includes(options.host)) fail(`--host: expected one of ${HOSTS.join(', ')}, got ${options.host}`);
  if (options.host === 'agy') return { skill: manifest.skill, written: [], added: [], notice: AGY_NOTICE };
  if (!['local', 'shared'].includes(options.scope)) fail(`--scope: expected local or shared, got ${options.scope}`);
  if (options.host === 'claude') {
    const path = where.claude[options.scope];
    const added = applyClaude(path, needs);
    return { skill: manifest.skill, written: added.length ? [path] : [], added, applies: APPLIES.claude[options.scope] };
  }
  if (!codexTrusted(where.codex.config, where.repo)) return { skill: manifest.skill, written: [], added: [], notice: CODEX_UNTRUSTED };
  const skipped = needs.filter((need) => need.type !== 'command').map((need) => need.id);
  const added = applyCodex(where.codex.rules, manifest.skill, needs);
  return {
    skill: manifest.skill, written: added.length ? [where.codex.rules] : [], added, applies: APPLIES.codex,
    ...(skipped.length ? { unsupported: skipped } : {}),
  };
}

// --- main -------------------------------------------------------------------

function main() {
  try {
    const { command, options } = parseArgs(process.argv.slice(2));
    let result;
    if (command === 'check') result = check(options);
    else if (command === 'apply') result = apply(options);
    else if (command === 'validate') result = { valid: true, skill: loadManifest(options).skill };
    else fail('usage: permissions.mjs check|apply|validate [--root DIR] [--host claude|codex|agy] [--scope local|shared] [--ids a,b] [--dont-ask] [--manifest FILE]');
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    if (!(error instanceof UsageError)) throw error;
    process.stdout.write(`${JSON.stringify({ error: error.message }, null, 2)}\n`);
    process.exitCode = 2;
  }
}

main();
