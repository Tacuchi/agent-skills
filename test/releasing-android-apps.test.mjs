import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const skillDir = join(root, 'skills', 'mobile', 'releasing-android-apps');
const checkListing = join(skillDir, 'scripts', 'check-listing.py');
const emulatorUi = join(skillDir, 'scripts', 'emulator-ui.sh');

function runCheckListing(args, cwd) {
  return spawnSync('python3', [checkListing, ...args], {
    cwd,
    encoding: 'utf8',
    timeout: 15000,
  });
}

function makeListing(t, { name, short, full }) {
  const dir = mkdtempSync(join(tmpdir(), 'releasing-android-apps-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const file = join(dir, 'listing.md');
  const sections = [];
  if (name !== undefined) sections.push(`<!-- name -->\n${name}\n<!-- /name -->`);
  if (short !== undefined) sections.push(`<!-- short -->\n${short}\n<!-- /short -->`);
  if (full !== undefined) sections.push(`<!-- full -->\n${full}\n<!-- /full -->`);
  writeFileSync(file, `# Store listing\n\n${sections.join('\n\n')}\n`, 'utf8');
  return { dir, file };
}

test('check-listing.py --help prints English usage and exits 0', () => {
  const result = runCheckListing(['--help'], root);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Check Google Play store listing text/);
  assert.match(result.stdout, /--forbidden/);
});

test('check-listing.py passes a valid markdown listing within Play limits', (t) => {
  const { dir, file } = makeListing(t, {
    name: 'Pocket Audio Mixer',
    short: 'Combine local background tracks, cover art, and voice notes on your phone.',
    full: 'Mix your own local audio files and recorded voice notes offline on your device.\n\nAll files stay on your phone with no account required.',
  });
  const result = runCheckListing([file], dir);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /name: 18\/30 OK/);
  assert.match(result.stdout, /short: 74\/80 OK/);
  assert.match(result.stdout, /full: \d+\/4000 OK/);
});

test('check-listing.py fails when a field exceeds its character limit', (t) => {
  const { dir, file } = makeListing(t, {
    name: 'A Very Long Android Application Name Exceeding Thirty Characters',
    short: 'Within eighty characters.',
    full: 'Clean full description with local audio tools.',
  });
  const result = runCheckListing([file], dir);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /name: \d+\/30 OVER LIMIT/);
  assert.match(result.stdout, /short: \d+\/80 OK/);
  assert.match(result.stdout, /full: \d+\/4000 OK/);
});

test('check-listing.py fails when default forbidden download terms appear', (t) => {
  const { dir, file } = makeListing(t, {
    name: 'Pocket Audio Mixer',
    short: 'Download any video clip and turn it into a ringtone.',
    full: 'Fast audio editing directly on your phone.',
  });
  const result = runCheckListing([file], dir);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /short: forbidden term matched \('Download'\)/);
});

test('check-listing.py supports direct flags, custom forbidden patterns, and opting out of defaults', () => {
  const blocked = runCheckListing([
    '--name', 'Audio Studio',
    '--short', 'Edit local clips on-device.',
    '--full', 'Includes a secret-brand mention.',
    '--forbidden', 'secret-brand',
  ], root);
  assert.equal(blocked.status, 1);
  assert.match(blocked.stdout, /full: forbidden term matched \('secret-brand'\)/);

  const allowed = runCheckListing([
    '--name', 'Audio Studio',
    '--short', 'Download offline language packs cleanly.',
    '--full', 'Works locally on your phone.',
    '--no-default-forbidden',
  ], root);
  assert.equal(allowed.status, 0, allowed.stdout + allowed.stderr);
});

test('check-listing.py fails when a required markdown block is missing', (t) => {
  const { dir, file } = makeListing(t, {
    name: 'Audio Studio',
    short: 'Local audio editing on your device.',
  });
  const result = runCheckListing([file], dir);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /full: missing block/);
});

test('emulator-ui.sh --help prints English usage and exits 0', () => {
  const result = spawnSync('sh', [emulatorUi, '--help'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 10000,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Usage: emulator-ui\.sh/);
  assert.match(result.stdout, /\bdump\b[\s\S]*\btap\b[\s\S]*\bshot\b/);
  assert.match(result.stdout, /ANDROID_HOME/);
});
