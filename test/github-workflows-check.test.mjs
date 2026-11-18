import assert from 'node:assert/strict';
import test from 'node:test';
import { parseYaml, YamlUnreadable } from '../skills/engineering/github-workflows/scripts/lib/yaml.mjs';
import { deploy, makeRepo, runCheck } from './github-workflows-helpers.mjs';

const codes = (result) => result.json.findings.map((finding) => finding.code);

test('yaml: reads maps, block and flow lists, quoted and block scalars, and comments', () => {
  assert.deepEqual(parseYaml(`name: 'It''s CI' # comment
on: [push, pull_request]
env: { COUNT: 2, ENABLED: true, EMPTY: null, TEXT: "a\\nline" }
jobs:
  test:
    steps:
      - uses: actions/checkout@v4
      - run: |
          echo one
          echo two
      - run: >-
          echo
          folded
      - run: echo "https://example.invalid/#fragment" # comment
`), {
    name: "It's CI", on: ['push', 'pull_request'],
    env: { COUNT: 2, ENABLED: true, EMPTY: null, TEXT: 'a\nline' },
    jobs: { test: { steps: [
      { uses: 'actions/checkout@v4' }, { run: 'echo one\necho two\n' },
      { run: 'echo folded' }, { run: 'echo "https://example.invalid/#fragment"' },
    ] } },
  });
});

test('yaml: the key "on" stays a string and a bare `on: push` is the string push', () => {
  assert.deepEqual(parseYaml('on: push\n'), { on: 'push' });
  assert.deepEqual(parseYaml('"on":\n  push:\n'), { on: { push: null } });
});

test('yaml: anchors, aliases, tags and tabs are unreadable, with the line', () => {
  for (const syntax of ['  value: &shared [one]', '  value: *shared', '  value: !!str text', '\tvalue: text']) {
    assert.throws(() => parseYaml(`env:\n${syntax}\n`), (error) => {
      assert.ok(error instanceof YamlUnreadable);
      assert.equal(error.line, 2);
      assert.match(error.message, /Expected .*received /);
      return true;
    });
  }
});

test('yaml: malformed, duplicate and unsupported structures never become partial objects', () => {
  for (const text of [
    'on: [push\n', 'on: {push: [main}\n', 'a: one\na: two\n',
    'a: "unfinished\n', 'a: one\n  stray: two\n', 'a: one: two\n',
    '? [a, b]\n: value\n', 'a: value\n---\nb: value\n',
    'a: [one, two]]\n', 'a: {one: two}}\n', 'a: ["one]\n',
    'a: - nested\n', 'a: [plain{braces}]\n',
  ]) assert.throws(() => parseYaml(text), YamlUnreadable, text);
});

test('yaml: block chomping, folding, blank lines and indentation follow YAML scalars', () => {
  assert.deepEqual(parseYaml('a: |+\n  one\n\nb: |-\n  two\n\nc: >\n  one\n\n  two\n    indented\n  three\n'), {
    a: 'one\n\n', b: 'two', c: 'one\ntwo\n  indented\nthree\n',
  });
  assert.deepEqual(parseYaml('a: |2-\n    indented\n'), { a: '  indented' });
  assert.deepEqual(parseYaml('steps:\n- run: echo ok\n  env: { A: false }\n'), { steps: [{ run: 'echo ok', env: { A: false } }] });
});

test('check: a repository without workflows is state none and exits 0', (t) => {
  const result = runCheck(makeRepo(t).dir);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.json.state, 'none');
  assert.deepEqual(result.json.workflows, []);
  assert.deepEqual(result.json.summary, { errors: 0, warnings: 0 });
});

test('check: triggers are read from a string, a list and a map', (t) => {
  const repo = makeRepo(t);
  for (const [syntax, events] of [['push', ['push']], ['[push, pull_request]', ['push', 'pull_request']], ['{ push: { branches: [main] } }', ['push']]]) {
    repo.write('.github/workflows/ci.yml', `on: ${syntax}\njobs:\n  test:\n    steps:\n      - run: npm test\n`);
    const result = runCheck(repo.dir);
    const workflow = result.json.workflows[0];
    assert.deepEqual(Object.keys(workflow.triggers), events);
    assert.deepEqual(workflow.triggers.push, { branches: syntax.startsWith('{') ? ['main'] : [], paths: [], pathsIgnore: [] });
    assert.equal(workflow.kind, 'tests');
    assert.equal(workflow.docs_push_runs, true);
  }
});

test('check: a push of documentation runs unless a filter leaves it out', (t) => {
  const repo = makeRepo(t);
  for (const [filter, runs] of [
    ['', true], ['paths-ignore: [docs/**, README.md, ARCHITECTURE.md]', false],
    ["paths: ['src/**']", false], ["paths-ignore: ['docs/**']", true],
    ["paths: ['**', '!docs/**', '!README.md', '!ARCHITECTURE.md']", false],
    ["paths: ['**/*.js']", true], ["paths: ['docs/deep/**/example.txt']", true],
    ["paths: ['src/**', '!src/generated/**']", false],
  ]) {
    repo.write('.github/workflows/ci.yml', `on:\n  push:\n    ${filter}\njobs:\n  test:\n    steps:\n      - run: node --test\n`);
    assert.equal(runCheck(repo.dir).json.workflows[0].docs_push_runs, runs, filter);
  }
});

test('check: docs-trigger is an error for deploy and publish, a warning for tests', (t) => {
  const repo = makeRepo(t, {
    'deploy.yml': deploy.replace('    paths-ignore: [docs/**, README.md, ARCHITECTURE.md]\n', ''),
    'publish.yml': 'on: [push, release]\njobs:\n  publish:\n    steps:\n      - run: npm publish\n',
    'ci.yml': 'on: push\njobs:\n  test:\n    steps:\n      - run: npm test\n',
  });
  const result = runCheck(repo.dir);
  assert.equal(result.status, 1);
  assert.deepEqual(result.json.findings.filter((finding) => finding.code === 'docs-trigger').map(({ file, level }) => [file, level]), [
    ['.github/workflows/ci.yml', 'warning'], ['.github/workflows/deploy.yml', 'error'], ['.github/workflows/publish.yml', 'error'],
  ]);
  for (const finding of result.json.findings) {
    assert.ok(finding.line > 0);
    assert.match(finding.message, /Expected .*received /);
  }
});

test('check: an unreadable workflow is reported with its line and never passes as clean', (t) => {
  const repo = makeRepo(t, { 'broken.yml': 'on: push\njobs: &jobs {}\n', 'ci.yml': 'on: push\njobs:\n  test:\n    steps:\n      - run: npm test\n' });
  const result = runCheck(repo.dir);
  assert.equal(result.status, 1);
  assert.equal(result.json.findings.find((finding) => finding.code === 'unreadable').line, 2);
  assert.ok(codes(result).includes('docs-trigger'));
  assert.equal(result.json.workflows.length, 2);
});

test('check: a secret written in the file is inline-secret and the value is not printed', (t) => {
  const secret = 'ghp_' + 'A'.repeat(36);
  const repo = makeRepo(t, { 'ci.yml': `on: workflow_dispatch\nenv:\n  API_TOKEN: ${secret}\njobs: {}\n` });
  const result = runCheck(repo.dir);
  assert.equal(result.status, 1);
  assert.ok(codes(result).includes('inline-secret'));
  assert.ok(!result.stdout.includes(secret));
  assert.ok(!result.stderr.includes(secret));
});

test('check: a workflow that writes without a permissions block is a warning', (t) => {
  const repo = makeRepo(t, { 'publish.yml': 'on: release\njobs:\n  publish:\n    steps:\n      - run: npm publish\n' });
  const result = runCheck(repo.dir);
  assert.equal(result.status, 0);
  assert.deepEqual(codes(result), ['no-permissions']);
  assert.equal(result.json.findings[0].level, 'warning');
  repo.write('.github/workflows/publish.yml', 'on: release\njobs:\n  publish:\n    permissions: { contents: write }\n    steps:\n      - run: npm publish\n');
  assert.deepEqual(runCheck(repo.dir).json.findings, []);
});

test('check: a complete deploy workflow has no findings', (t) => {
  const result = runCheck(makeRepo(t, { 'deploy.yml': deploy }).dir);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.deepEqual(result.json.findings, []);
  assert.equal(result.json.workflows[0].kind, 'deploy');
});

for (const [code, before, after, level] of [
  ['no-concurrency', 'concurrency:\n  group: deploy-${{ github.ref }}\n  cancel-in-progress: false\n', '', 'error'],
  ['cancels-in-progress', 'cancel-in-progress: false', 'cancel-in-progress: true', 'error'],
  ['build-before-tests', '    needs: test\n', '', 'error'],
  ['mutable-tag', 'tags: ${{ env.IMAGE }}:${{ github.sha }}', 'tags: ${{ env.IMAGE }}:latest', 'error'],
  ['no-health-check', '      - name: Check health\n        if: env.HAS_TARGET == \'true\'\n        run: curl -fsS "$SERVICE_URL/health"\n', '', 'error'],
  ['no-manual-trigger', '  workflow_dispatch:\n', '', 'warning'],
  ['fails-without-secrets', "        if: env.HAS_TARGET == 'true'\n", '', 'warning'],
]) test(`check: ${code} reports the missing deployment requirement`, (t) => {
  assert.ok(deploy.includes(before));
  const result = runCheck(makeRepo(t, { 'deploy.yml': deploy.replace(before, after) }).dir);
  assert.deepEqual(codes(result), [code], result.stdout);
  assert.equal(result.status, level === 'error' ? 1 : 0);
  assert.equal(result.json.findings[0].level, level);
  assert.ok(result.json.findings[0].line > 0);
  assert.match(result.json.findings[0].message, /Expected .*received /);
});

test('check: health before deployment, non-failing health and unrelated guards do not satisfy deployment rules', (t) => {
  const health = '      - name: Check health\n        if: env.HAS_TARGET == \'true\'\n        run: curl -fsS "$SERVICE_URL/health"\n';
  const repo = makeRepo(t);
  for (const text of [
    deploy.replace(health, '').replace('      - name: Deploy service', health + '      - name: Deploy service'),
    deploy.replace('run: curl -fsS "$SERVICE_URL/health"', 'run: curl -sS "$SERVICE_URL/health" || true'),
    deploy.replace('run: curl -fsS "$SERVICE_URL/health"', 'continue-on-error: true\n        run: curl -fsS "$SERVICE_URL/health"'),
  ]) {
    repo.write('.github/workflows/deploy.yml', text);
    assert.ok(codes(runCheck(repo.dir)).includes('no-health-check'));
  }
  for (const condition of ["github.ref == 'refs/heads/main'", "env.HAS_TARGET == 'false'", "env.HAS_TARGET != 'true'", "${{ !(secrets.TARGET_TOKEN != '' && secrets.TARGET_APP != '') }}"]) {
    repo.write('.github/workflows/deploy.yml', deploy.replace("if: env.HAS_TARGET == 'true'", `if: ${condition}`));
    assert.ok(codes(runCheck(repo.dir)).includes('fails-without-secrets'), condition);
  }
});

test('yaml: a root flow mapping and nested flow collections retain their types', () => {
  assert.deepEqual(parseYaml('{ on: push, jobs: {}, values: [1, false, { nested: [a, b] }] }\n'), { on: 'push', jobs: {}, values: [1, false, { nested: ['a', 'b'] }] });
});

test('check: inherited deployment secrets also require a presence guard', (t) => {
  const text = deploy.replace('    env:\n      HAS_TARGET:', '    env:\n      TARGET_TOKEN: ${{ secrets.TARGET_TOKEN }}\n      TARGET_APP: ${{ secrets.TARGET_APP }}\n      HAS_TARGET:')
    .replace('        env:\n          TARGET_TOKEN: ${{ secrets.TARGET_TOKEN }}\n          TARGET_APP: ${{ secrets.TARGET_APP }}\n', '')
    .replace("        if: env.HAS_TARGET == 'true'\n", '');
  assert.ok(codes(runCheck(makeRepo(t, { 'deploy.yml': text }).dir)).includes('fails-without-secrets'));
});

test('check: build dependencies may be transitive and tests may be in the build job', (t) => {
  const repo = makeRepo(t, { 'deploy.yml': deploy.replace('    needs: test\n', '    needs: prepare\n').replace('  build-deploy:\n', '  prepare:\n    needs: test\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo prepared\n  build-deploy:\n') });
  assert.deepEqual(runCheck(repo.dir).json.findings, []);
  repo.write('.github/workflows/deploy.yml', deploy.replace('  test:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm test\n', '').replace('    needs: test\n', '').replace('      - uses: docker/build-push-action@v6', '      - run: npm test\n      - uses: docker/build-push-action@v6'));
  assert.deepEqual(runCheck(repo.dir).json.findings, []);
});

test('check: invalid flags and missing paths exit 2 with structured errors', (t) => {
  const repo = makeRepo(t);
  for (const args of [['--nope'], ['--repo'], ['--repo', `${repo.dir}/absent`]]) {
    const result = runCheck(repo.dir, ...args);
    assert.equal(result.status, 2);
    assert.ok(result.json.error.code);
    assert.match(result.json.error.message, /Expected .*received /);
  }
});

test('check: OIDC permissions are not inline secrets and lint checks count as tests', (t) => {
  const repo = makeRepo(t, { 'ci.yml': 'on: push\npermissions: { contents: read, id-token: write }\njobs:\n  shellcheck:\n    steps:\n      - run: shellcheck scripts/setup.sh\n' });
  const result = runCheck(repo.dir);
  assert.equal(result.status, 0);
  assert.equal(result.json.workflows[0].kind, 'tests');
  assert.deepEqual(codes(result), ['docs-trigger']);
  repo.write('.github/workflows/ci.yml', 'on: workflow_dispatch\npermissions:\n  id-token: write\njobs: {}\n');
  assert.deepEqual(runCheck(repo.dir).json.findings, []);
});

test('check: an HTTP status probe that tolerates requests but fails after polling is a health check', (t) => {
  const script = `run: |
          for i in $(seq 1 30); do
            code=$(curl -s -o /dev/null -w '%{http_code}' "$SERVICE_URL" || true)
            if [ "$code" = "200" ]; then exit 0; fi
            sleep 1
          done
          exit 1`;
  const text = deploy.replace('run: curl -fsS "$SERVICE_URL/health"', script).replace('name: Check health', 'name: Check published site');
  assert.deepEqual(runCheck(makeRepo(t, { 'deploy.yml': text }).dir).json.findings, []);
});
