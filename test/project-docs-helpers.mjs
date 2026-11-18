import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const checker = resolve(import.meta.dirname, '../skills/documentation/project-docs/scripts/check.mjs');
export const source = 'a1\na2\na3\na4\na5\na6\n';

export function makeRepo(t, files = {}) {
  const base = mkdtempSync(join(tmpdir(), 'project-docs-'));
  const dir = join(base, 'my repo');
  mkdirSync(dir);
  t.after(() => rmSync(base, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const write = (path, text) => {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  };
  git('init', '-q');
  git('config', 'user.email', 'fixture@example.invalid');
  git('config', 'user.name', 'Fixture');
  git('config', 'commit.gpgsign', 'false');
  const commit = (message) => {
    git('add', '.');
    git('commit', '-qm', message, '--allow-empty');
    return git('rev-parse', 'HEAD');
  };
  for (const [path, text] of Object.entries(files)) write(path, text);
  return { dir, write, commit, git };
}

export function architecture({ commit, rows = '| 3. Blocks | `src/a.js:1-3` |', date = '2026-01-02', version = '1.0.0' }) {
  return `# Architecture\n\nReviewed on ${date} against version ${version} (commit \`${commit}\`).\n\nIn short:\n\n- It does one thing.\n\n${Array.from({ length: 7 }, (_, i) => `## ${i + 1}. Section\n\nDescription.\n`).join('\n')}\n## Appendix: evidence\n\nReferences at commit \`${commit}\`.\n\n| Section | Evidence |\n|---|---|\n${rows}\n`;
}

export function completeRepo(t) {
  const repo = makeRepo(t, {
    'src/a.js': source,
    'package.json': '{"version":"1.0.0"}',
    'LICENSE': 'MIT\n',
    'README.md': '# Example\n\n> A useful example.\n\n[Architecture](ARCHITECTURE.md)\n\n## Install\n\n## Usage\n\n## Contributing\n\n## License\n',
    'docs/decisions/0001-use-modules.md': '---\nstatus: accepted\ndate: 2026-01-02\n---\n\n# Use modules\n',
  });
  repo.pin = repo.commit('Create source');
  repo.write('ARCHITECTURE.md', architecture({ commit: repo.pin }));
  repo.commit('Document source');
  return repo;
}

export function runCheck(dir, ...args) {
  const result = spawnSync(process.execPath, [checker, '--repo', dir, '--json', ...args], {
    encoding: 'utf8', env: { ...process.env, HOME: join(dir, '.fixture-home') },
  });
  let json = null;
  if (result.stdout.trim()) json = JSON.parse(result.stdout);
  return { status: result.status, json, stdout: result.stdout, stderr: result.stderr };
}
