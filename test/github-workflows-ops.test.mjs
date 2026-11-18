import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const script = join(root, 'skills/engineering/github-workflows/scripts/ops.mjs');
const library = join(root, 'skills/engineering/github-workflows/scripts/lib/gh.mjs');
const sha = 'a'.repeat(40);
const oldSha = 'b'.repeat(40);
const workflow = `name: Deploy service
on:
  push:
    branches: [main]
  workflow_dispatch:
jobs:
  deploy:
    steps:
      - uses: docker/build-push-action@v6
        with:
          push: true
      - name: Restart service
        run: curl -fsS -X POST "$DEPLOY_URL/api/v1/deploy"
`;
function runRecord(id, commit, conclusion = 'success', workflowId = 7) {
  return { databaseId: id, workflowDatabaseId: workflowId, attempt: 1, workflowName: workflowId === 7 ? 'Deploy service' : 'Tests',
    headSha: commit, status: 'completed', conclusion, createdAt: new Date(Date.UTC(2026, 0, id)).toISOString(),
    updatedAt: new Date(Date.UTC(2026, 0, id, 1)).toISOString(),
    url: `https://github.com/example/service/actions/runs/${id}`, event: 'workflow_dispatch' };
}
function setup(t) {
  const dir = mkdtempSync(join(tmpdir(), 'github-workflows-ops-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const bin = join(dir, 'bin');
  mkdirSync(bin);
  copyFileSync(join(root, 'test/fixtures/github-workflows/fake-gh.fixture'), join(bin, 'gh'));
  chmodSync(join(bin, 'gh'), 0o755);
  const log = join(dir, 'calls.jsonl');
  const config = { repository: { nameWithOwner: 'example/service', defaultBranchRef: { name: 'main' } },
    workflows: [{ id: 7, name: 'Deploy service', path: '.github/workflows/deploy.yml', state: 'active' }],
    workflow, ref: 'main', sha,
    runs: [runRecord(12, 'c'.repeat(40), 'failure'), runRecord(11, sha), runRecord(10, oldSha), runRecord(9, oldSha, 'success', 8)],
    newRun: runRecord(13, sha),
    jobs: { jobs: [{ name: 'deploy', conclusion: 'failure', steps: [{ name: 'Restart service', conclusion: 'failure' }] }] },
    log: 'deploy\tRestart service\t2026-01-12T00:00:00Z connection refused\nother\tOther step\tunrelated failure\n' };
  const env = { ...process.env, PATH: [bin, dirname(process.execPath)].join(':'),
    FAKE_GH_LOG: log, FAKE_GH_STATE: join(dir, 'state') };
  return { dir, config, env,
    run(action, ...args) {
      return spawnSync(process.execPath, [script, action, '--repo', dir, '--json', ...args], {
        encoding: 'utf8', timeout: 15000, env: { ...env, FAKE_GH_CONFIG: JSON.stringify(config) },
      });
    },
    calls: () => existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n').map(JSON.parse) : [],
  };
}
const writes = (calls) => calls.filter((args) => ['workflow run', 'run rerun', 'run cancel'].includes(args.slice(0, 2).join(' ')));
function plan(fixture, action = 'deploy', ...args) {
  const result = fixture.run(action, ...args);
  assert.equal(result.status, 3, result.stderr);
  const json = JSON.parse(result.stdout);
  assert.match(json.confirm, /^[a-f0-9]{16,64}$/);
  return json;
}

test('status: lists runs, names the deployed commit and excerpts a failed step', (t) => {
  const fixture = setup(t);
  const result = fixture.run('status');
  assert.equal(result.status, 0, result.stderr);
  const json = JSON.parse(result.stdout);
  assert.deepEqual(json.runs[0], { id: 12, workflow: 'Deploy service', sha: 'c'.repeat(40), status: 'completed',
    conclusion: 'failure', created: fixture.config.runs[0].createdAt, url: fixture.config.runs[0].url });
  assert.deepEqual(json.deployed, { sha, run: 11 });
  assert.deepEqual(json.failed, { run: 12, job: 'deploy', step: 'Restart service',
    excerpt: '2026-01-12T00:00:00Z connection refused' });
  assert.deepEqual(writes(fixture.calls()), []);
});

test('deploy without --confirm prints the plan and its token, exits 3 and calls no write command', (t) => {
  const fixture = setup(t);
  const json = plan(fixture);
  assert.equal(json.plan.action, 'deploy');
  assert.equal(json.plan.repo, 'example/service');
  assert.equal(json.plan.workflow, '.github/workflows/deploy.yml');
  assert.equal(json.plan.ref, 'main');
  assert.equal(json.plan.sha, sha);
  assert.ok(json.plan.restarts.includes('Restart service'));
  assert.equal(plan(fixture).confirm, json.confirm);
  assert.deepEqual(writes(fixture.calls()), []);
});

test('deploy with the right token runs the workflow, follows it and exits by its conclusion', (t) => {
  for (const conclusion of ['success', 'failure', 'cancelled']) {
    const fixture = setup(t);
    const { confirm } = plan(fixture);
    fixture.config.conclusion = conclusion;
    const result = fixture.run('deploy', '--confirm', confirm);
    assert.equal(result.status, conclusion === 'success' ? 0 : 1, result.stderr);
    const calls = fixture.calls();
    assert.deepEqual(writes(calls).map((args) => args.slice(0, 3)), [['workflow', 'run', '.github/workflows/deploy.yml']]);
    const dispatch = calls.find((args) => args.slice(0, 2).join(' ') === 'workflow run');
    assert.equal(dispatch[dispatch.indexOf('--ref') + 1], 'main');
    assert.ok(calls.some((args) => args.slice(0, 3).join(' ') === 'run watch 13'));
    assert.equal(JSON.parse(result.stdout).conclusion, conclusion);
  }
});

test('deploy with a wrong or stale token exits 2 and runs nothing', (t) => {
  const fixture = setup(t);
  const { confirm } = plan(fixture);
  const wrong = fixture.run('deploy', '--confirm', 'wrong');
  assert.equal(wrong.status, 2);
  assert.match(wrong.stderr, /expected.*confirmation.*got.*wrong/i);
  fixture.config.sha = oldSha;
  const stale = fixture.run('deploy', '--confirm', confirm);
  assert.equal(stale.status, 2);
  assert.match(stale.stderr, /stale/i);
  assert.deepEqual(writes(fixture.calls()), []);
});

test('deploy and rollback: wrong-token errors never disclose the current confirmation token', (t) => {
  for (const action of ['deploy', 'rollback']) {
    const fixture = setup(t);
    const { confirm } = plan(fixture, action);
    const result = fixture.run(action, '--confirm', 'deadbeef');
    assert.equal(result.status, 2);
    assert.equal(result.stdout.includes(confirm), false, `${action} stdout disclosed the confirmation token`);
    assert.equal(result.stderr.includes(confirm), false, `${action} stderr disclosed the confirmation token`);
    assert.match(result.stderr, /run without --confirm.*new plan/i);
    assert.deepEqual(writes(fixture.calls()), []);
  }
});

test('deploy: a commit hash as --ref is rejected with the older-run route', (t) => {
  const fixture = setup(t);
  const result = fixture.run('deploy', '--ref', sha);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /expected.*branch or tag.*got/i);
  assert.match(result.stderr, /rollback --run/);
  assert.deepEqual(writes(fixture.calls()), []);
});

test('deploy: a ref moving immediately before dispatch is stale and starts nothing', (t) => {
  const fixture = setup(t);
  fixture.config.shaSequence = [sha, sha, oldSha];
  const { confirm } = plan(fixture);
  const result = fixture.run('deploy', '--confirm', confirm);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /expected.*confirmed commit.*got stale remote head/i);
  assert.deepEqual(writes(fixture.calls()), []);
});

test('deploy: a dispatched run on a different commit exits 1 with its link and cancels nothing', (t) => {
  const fixture = setup(t);
  const { confirm } = plan(fixture);
  fixture.config.newRun.headSha = oldSha;
  const result = fixture.run('deploy', '--confirm', confirm);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /expected.*commit.*got/i);
  assert.ok(result.stderr.includes(fixture.config.newRun.url));
  assert.equal(writes(fixture.calls()).length, 1);
  assert.ok(!fixture.calls().some((args) => args[1] === 'watch' || args[1] === 'cancel'));
});

test('deploy: an empty dispatch response finds only the new manual run and refuses ambiguity', (t) => {
  const fixture = setup(t);
  fixture.config.dispatchOutput = '';
  const { confirm } = plan(fixture);
  const result = fixture.run('deploy', '--confirm', confirm);
  assert.equal(result.status, 0, result.stderr);
  const ambiguous = setup(t);
  ambiguous.config.dispatchOutput = '';
  ambiguous.config.additionalRuns = [runRecord(14, sha)];
  const token = plan(ambiguous).confirm;
  const refused = ambiguous.run('deploy', '--confirm', token);
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /expected one.*got 2/i);
});

test('rollback picks the last good run before the deployed one, or the run given', (t) => {
  for (const explicit of [false, true]) {
    const fixture = setup(t);
    if (explicit) fixture.config.runs.push(runRecord(8, 'd'.repeat(40)));
    const target = explicit ? 8 : 10;
    const options = explicit ? ['--run', String(target)] : [];
    const json = plan(fixture, 'rollback', ...options);
    assert.equal(json.plan.run, target);
    assert.equal(json.plan.sha, explicit ? 'd'.repeat(40) : oldSha);
    assert.deepEqual(writes(fixture.calls()), []);
    const result = fixture.run('rollback', ...options, '--confirm', json.confirm);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(writes(fixture.calls()).map((args) => args.slice(0, 3)), [['run', 'rerun', String(target)]]);
    assert.ok(fixture.calls().some((args) => args.slice(0, 3).join(' ') === `run watch ${target}`));
  }
});

test('rollback with no earlier good run refuses and says why', (t) => {
  const fixture = setup(t);
  fixture.config.runs = [runRecord(11, sha), runRecord(10, oldSha, 'failure'), runRecord(9, oldSha, 'success', 8)];
  const result = fixture.run('rollback');
  assert.equal(result.status, 2);
  assert.match(result.stderr, /expected.*earlier successful.*got none/i);
  assert.deepEqual(writes(fixture.calls()), []);
});

test('rollback: follows the new attempt instead of accepting the old successful result', (t) => {
  const fixture = setup(t);
  const { confirm } = plan(fixture, 'rollback');
  fixture.config.conclusion = 'failure';
  fixture.config.rerunReadsBeforeNew = 1;
  const result = fixture.run('rollback', '--confirm', confirm);
  assert.equal(result.status, 1, result.stderr);
  const calls = fixture.calls();
  const start = calls.findIndex((args) => args.slice(0, 2).join(' ') === 'run rerun');
  const following = calls.slice(start + 1);
  assert.ok(following.filter((args) => args.slice(0, 3).join(' ') === 'run view 10').length >= 3);
  assert.ok(following.some((args) => args.slice(0, 3).join(' ') === 'run watch 10'));
});

test('gh missing, unauthenticated or failing exits 2; an error is never read as no runs', (t) => {
  for (const message of ['not logged into any GitHub hosts', 'HTTP 401: Bad credentials', 'network connection refused']) {
    const fixture = setup(t);
    fixture.config.error = message;
    fixture.config.errorCommand = 'run list';
    const result = fixture.run('status');
    assert.equal(result.status, 2);
    assert.ok(result.stderr.includes(message), result.stderr);
    assert.equal(result.stdout, '');
    assert.deepEqual(writes(fixture.calls()), []);
  }
  const fixture = setup(t);
  fixture.env.PATH = join(fixture.dir, 'missing');
  const result = fixture.run('status');
  assert.equal(result.status, 2);
  assert.match(result.stderr, /expected.*gh.*got.*ENOENT/i);
  assert.equal(result.stdout, '');
});

test('status: a genuine empty history is distinct from missing deployment workflows', (t) => {
  const fixture = setup(t);
  fixture.config.runs = [];
  assert.deepEqual(JSON.parse(fixture.run('status').stdout), { runs: [], deployed: null, failed: null });
  fixture.config.workflows = [];
  assert.deepEqual(JSON.parse(fixture.run('status').stdout), { runs: [], deployed: null, failed: null });
  const result = fixture.run('deploy');
  assert.equal(result.status, 2);
  assert.match(result.stderr, /expected one.*deploy.*got 0/i);
});

test('operations: malformed JSON and failure after confirmation never become empty history or success', (t) => {
  for (const response of ['not JSON', '{}', '[{}]']) {
    const fixture = setup(t);
    fixture.config.responses = { 'run list': response };
    const result = fixture.run('status');
    assert.equal(result.status, 2);
    assert.match(result.stderr, /expected.*got/i);
    assert.equal(result.stdout, '');
  }
  for (const command of ['workflow run', 'run watch']) {
    const fixture = setup(t);
    const { confirm } = plan(fixture);
    fixture.config.errorCommand = command;
    fixture.config.error = 'network connection refused';
    const result = fixture.run('deploy', '--confirm', confirm);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /network connection refused/);
  }
});

test('deploy: an explicit branch or tag resolves remotely and missing manual triggers refuse', (t) => {
  const fixture = setup(t);
  fixture.config.ref = 'release/stable';
  const result = plan(fixture, 'deploy', '--ref', 'release/stable');
  assert.equal(result.plan.ref, 'release/stable');
  assert.ok(fixture.calls().some((args) => args[1]?.endsWith('/commits/release%2Fstable')));
  fixture.config.workflow = workflow.replace('  workflow_dispatch:\n', '');
  const refused = fixture.run('deploy', '--ref', 'release/stable');
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /expected.*workflow_dispatch.*got no manual trigger/i);
  assert.deepEqual(writes(fixture.calls()), []);
});

test('operations: invalid options and foreign or unsuccessful rollback runs refuse without writes', (t) => {
  const fixture = setup(t);
  for (const [action, args] of [['status', ['--ref', 'main']], ['deploy', ['--run', '10']],
    ['deploy', ['--ref']], ['deploy', ['--unknown']], ['rollback', ['--run', '9']], ['rollback', ['--run', '12']]]) {
    const result = fixture.run(action, ...args);
    assert.equal(result.status, 2, result.stderr);
    assert.match(result.stderr, /expected.*got/i);
  }
  assert.deepEqual(writes(fixture.calls()), []);
});

test('helpers: lastGoodBefore stays in its workflow and confirmation binds the full plan', async () => {
  const { lastGoodBefore, confirmToken } = await import(library);
  const runs = [runRecord(9, sha), runRecord(8, sha, 'failure'), runRecord(7, oldSha, 'success', 8), runRecord(6, oldSha)];
  assert.equal(lastGoodBefore(runs, 9).databaseId, 6);
  assert.equal(lastGoodBefore(runs, 6), null);
  assert.equal(lastGoodBefore(runs, 99), null);
  const value = { repo: 'example/service', action: 'deploy', workflow: 'deploy.yml', ref: 'main', sha, restarts: ['service'] };
  assert.equal(confirmToken(value), confirmToken(Object.fromEntries(Object.entries(value).reverse())));
  for (const key of ['repo', 'workflow', 'ref', 'sha']) assert.notEqual(confirmToken(value), confirmToken({ ...value, [key]: 'different' }));
});
