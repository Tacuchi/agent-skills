import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { makeRepo, runCheck } from './github-workflows-helpers.mjs';

const assets = resolve(import.meta.dirname, '../skills/engineering/github-workflows/assets');
const templates = readdirSync(assets).filter((name) => name.endsWith('.yml.template'));
const answers = {
  'default branch': 'main',
  'operating systems, such as ubuntu-latest': 'ubuntu-latest',
  'setup action for the runtime': 'actions/setup-node@v4',
  'version input of that action': 'node-version',
  'runtime version': '22',
  'command that installs the dependencies': 'npm ci',
  'command that runs the tests': 'npm test',
  'command that publishes the package': 'npm publish',
  owner: 'example',
  'image name': 'demo',
  'address of the deployment target': 'https://deploy.example.com',
  TARGET_TOKEN: 'TARGET_TOKEN',
  TARGET_APP: 'TARGET_APP',
};
const fill = (text) => text.replace(/<([^<>\n]+)>/g, (whole, name) => answers[name] ?? whole);
const code = (text) => text.split('\n').filter((line) => !line.trim().startsWith('#')).join('\n');

test('templates: the three kinds exist', () => {
  assert.deepEqual(templates.sort(), ['ci.yml.template', 'deploy.yml.template', 'publish.yml.template']);
});

test('templates: each one, with its placeholders filled, passes check with no findings', async (t) => {
  for (const name of templates) {
    await t.test(name, (caseT) => {
      const filled = fill(readFileSync(join(assets, name), 'utf8'));
      assert.doesNotMatch(code(filled), /<[^<>\n]+>/, 'every placeholder outside the comments has an answer');
      const repo = makeRepo(caseT, { [name.replace('.template', '')]: filled });
      const result = runCheck(repo.dir);
      assert.equal(result.status, 0, result.stdout + result.stderr);
      assert.deepEqual(result.json.findings, []);
      assert.equal(result.json.workflows[0].docs_push_runs, false);
    });
  }
});

test('templates: none carries an address, a user or an identifier that is not a placeholder', () => {
  for (const name of templates) {
    const text = readFileSync(join(assets, name), 'utf8');
    assert.doesNotMatch(text, /https?:\/\/[a-z0-9.-]+\.[a-z]{2,}/i, `${name}: no real address`);
    assert.doesNotMatch(text, /ghcr\.io\/(?!<owner>)/, `${name}: the image owner is a placeholder`);
  }
});
