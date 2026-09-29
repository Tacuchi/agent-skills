import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
// Spanish diacritics and punctuation, written as escapes so this file passes its own policy.
const SPANISH = /[\u00e1\u00e9\u00ed\u00f3\u00fa\u00fc\u00f1\u00c1\u00c9\u00cd\u00d3\u00da\u00dc\u00d1\u00bf\u00a1]/;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

// Code blocks, inline code and table rows may carry lexicon as data; the rest is prose.
function markdownProse(content) {
  let fenced = false;
  return content.split('\n').map((line) => {
    if (/^\s*(?:```|~~~)/.test(line)) {
      fenced = !fenced;
      return '';
    }
    if (fenced || /^\s*\|/.test(line)) return '';
    return line.replace(/`[^`]*`/g, '');
  });
}

function violations(path) {
  const content = readFileSync(path, 'utf8');
  const lines = extname(path) === '.md' ? markdownProse(content) : content.split('\n');
  return lines.flatMap((line, index) => (SPANISH.test(line) ? [`${relative(root, path)}:${index + 1}`] : []));
}

const files = [
  join(root, 'README.md'),
  join(root, 'CONTRIBUTING.md'),
  ...walk(join(root, 'skills')),
  ...walk(join(root, 'scripts')),
  ...walk(join(root, 'test')),
];

test('prose, messages and literals are in English', () => {
  assert.deepEqual(files.flatMap(violations), []);
});

test('file and directory names are in English', () => {
  const names = files.map((path) => relative(root, path)).filter((path) => SPANISH.test(path));
  assert.deepEqual(names, []);
});

test('the policy rejects Spanish prose and allows it only as data', () => {
  const prose = markdownProse('Una regla en espa\u00f1ol.\n`c\u00f3digo`\n| palabra | se\u00f1al |\n```\ncomentario: \u00bfs\u00ed?\n```');
  assert.deepEqual(prose.map((line) => SPANISH.test(line)), [true, false, false, false, false, false]);
});
