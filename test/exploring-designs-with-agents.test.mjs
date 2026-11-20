import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const skillDir = join(root, 'skills', 'design', 'exploring-designs-with-agents');
const comparatorPath = join(skillDir, 'assets', 'comparator.html');
const roundsExamplePath = join(skillDir, 'assets', 'rounds.example.json');
const skillPath = join(skillDir, 'SKILL.md');

function getFreePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close((err) => (err ? reject(err) : resolvePort(port)));
    });
    server.on('error', reject);
  });
}

async function waitForServer(url, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

test('comparator.html makes no external network requests and has valid JS', () => {
  const html = readFileSync(comparatorPath, 'utf8');
  assert.doesNotMatch(html, /https?:\/\//i, 'comparator.html must not contain external http(s) URLs');
  assert.match(html, /fetch\(["']rounds\.json["']/, 'comparator.html loads rounds.json next to it');
  assert.match(html, /manifest\.json/, 'comparator.html reads per-agent manifest.json files');
  const script = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1];
  assert.ok(script, 'comparator.html contains an inline script');
  assert.doesNotThrow(() => new Function(script), 'comparator.html script parses as valid JS');
});

test('rounds.example.json parses with the expected shape', () => {
  const data = JSON.parse(readFileSync(roundsExamplePath, 'utf8'));
  assert.equal(typeof data.rounds, 'object');
  assert.notEqual(data.rounds, null);
  const roundIds = Object.keys(data.rounds);
  assert.ok(roundIds.length >= 2, 'example defines at least two rounds');
  for (const id of roundIds) {
    const round = data.rounds[id];
    assert.equal(typeof round.prefix, 'string', `round ${id} prefix is a string`);
    assert.ok(Array.isArray(round.agents) && round.agents.length > 0, `round ${id} has non-empty agents list`);
    for (const agent of round.agents) {
      assert.equal(typeof agent, 'string');
      assert.ok(agent.length > 0);
    }
  }
});

test('SKILL.md references exist and document the core workflow and traps', () => {
  const skill = readFileSync(skillPath, 'utf8');
  const expectedFiles = [
    'references/brief-template.md',
    'references/delivery-contract.md',
    'assets/comparator.html',
    'assets/rounds.example.json',
  ];
  for (const rel of expectedFiles) {
    assert.ok(skill.includes(`(${rel})`), `SKILL.md links ${rel}`);
    assert.ok(existsSync(join(skillDir, rel)), `${rel} exists`);
  }
  for (const requiredConcept of [
    /manifest\.json/,
    /127\.0\.0\.1/,
    /nohup/,
    /--ink-inverse/,
    /--virtual-time-budget/,
    /qlmanage/,
    /fontkit/,
    /computer-use/,
    /OFL/,
  ]) {
    assert.match(skill, requiredConcept, `SKILL.md mentions ${requiredConcept}`);
  }
});

test('comparator serves two agents and one round over python3 -m http.server on 127.0.0.1', async (t) => {
  const workDir = mkdtempSync(join(tmpdir(), 'design-comparator-'));
  t.after(() => rmSync(workDir, { recursive: true, force: true }));

  copyFileSync(comparatorPath, join(workDir, 'comparator.html'));
  const rounds = {
    title: 'Sample Mark',
    default_round: '1',
    rounds: {
      '1': { prefix: '', label: 'Initial', agents: ['alpha', 'beta'] },
    },
  };
  writeFileSync(join(workDir, 'rounds.json'), JSON.stringify(rounds, null, 2));

  const sampleSvg = '<svg viewBox="0 0 108 108"><circle cx="54" cy="54" r="24" fill="currentColor"/></svg>';
  for (const agent of ['alpha', 'beta']) {
    const dir = join(workDir, agent);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, 'manifest.json'),
      JSON.stringify({
        agent,
        model: `${agent}-model`,
        variants: [
          {
            id: `${agent}-v1`,
            idea: 'abstract mark',
            name: `${agent} One`,
            concept: 'Clean test shape.',
            recommended: true,
          },
        ],
      })
    );
    writeFileSync(join(dir, `${agent}-v1-iso.svg`), sampleSvg);
    writeFileSync(join(dir, `${agent}-v1-logo.svg`), sampleSvg);
    writeFileSync(join(dir, `${agent}-v1-mono.svg`), sampleSvg);
  }

  const port = await getFreePort();
  const child = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', workDir], {
    stdio: 'ignore',
  });
  t.after(() => {
    child.kill('SIGTERM');
  });

  const baseUrl = `http://127.0.0.1:${port}`;
  const htmlRes = await waitForServer(`${baseUrl}/comparator.html`);
  assert.equal(htmlRes.status, 200);
  assert.match(await htmlRes.text(), /Design Exploration Comparator/);

  const roundsRes = await fetch(`${baseUrl}/rounds.json`);
  assert.equal(roundsRes.status, 200);
  const loadedRounds = await roundsRes.json();
  assert.deepEqual(loadedRounds.rounds['1'].agents, ['alpha', 'beta']);

  for (const agent of loadedRounds.rounds['1'].agents) {
    const manifestRes = await fetch(`${baseUrl}/${agent}/manifest.json`);
    assert.equal(manifestRes.status, 200);
    const manifest = await manifestRes.json();
    assert.equal(manifest.agent, agent);
    assert.equal(manifest.variants.length, 1);
    const id = manifest.variants[0].id;
    for (const suffix of ['iso', 'logo', 'mono']) {
      const svgRes = await fetch(`${baseUrl}/${agent}/${id}-${suffix}.svg`);
      assert.equal(svgRes.status, 200);
      assert.match(await svgRes.text(), /<svg/);
    }
  }
});
