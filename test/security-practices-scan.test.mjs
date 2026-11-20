import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const scanner = fileURLToPath(new URL('../skills/engineering/security-practices/scripts/scan-sensitive.py', import.meta.url));
const email = 'fixture@example.invalid';
const token = 'ghp_' + 'A'.repeat(30);
const input = [
  'diff --git a/docs/sample file b/docs/sample file',
  `+contact ${email} token=${token}`,
  `-contact ${email}`,
  'FILE:actions.log',
  `copied ${token}`,
].join('\n');

for (const context of [false, true]) {
  test(`scanner counts findings by file with context ${context ? 'enabled' : 'disabled'}`, () => {
    const result = spawnSync(scanner, context ? ['--show-context'] : [], { input, encoding: 'utf8' });
    assert.equal(result.status, 0, result.error?.message);
    assert.deepEqual(result.stdout.trimEnd().split('\n'), [
      'assigned_secret\tdocs/sample file\t1',
      'email\tdocs/sample file\t2',
      'github_token\tactions.log\t1',
      'github_token\tdocs/sample file\t1',
    ]);
    if (context) assert.match(result.stderr, /contact \[redacted\] \[redacted\]/);
    else assert.equal(result.stderr, '');
    for (const value of [email, token]) assert.ok(!(result.stdout + result.stderr).includes(value));
  });
}
