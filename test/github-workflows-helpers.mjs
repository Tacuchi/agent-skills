import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const checker = resolve(import.meta.dirname, '../skills/engineering/github-workflows/scripts/check.mjs');
export const deploy = readFileSync(new URL('./fixtures/github-workflows/deploy.yml', import.meta.url), 'utf8');

export function makeRepo(t, workflows = {}) {
  const base = mkdtempSync(join(tmpdir(), 'github-workflows-'));
  const dir = join(base, 'my repo');
  mkdirSync(dir);
  t.after(() => rmSync(base, { recursive: true, force: true }));
  const write = (path, text) => {
    const target = join(dir, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, text);
  };
  for (const [file, text] of Object.entries(workflows)) write(`.github/workflows/${file}`, text);
  return { dir, write };
}

export function runCheck(dir, ...args) {
  const result = spawnSync(process.execPath, [checker, '--repo', dir, '--json', ...args], { encoding: 'utf8' });
  return { status: result.status, json: result.stdout.trim() ? JSON.parse(result.stdout) : null, stdout: result.stdout, stderr: result.stderr };
}
