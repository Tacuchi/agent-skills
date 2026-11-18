import { existsSync } from 'node:fs';
import { dirname, posix } from 'node:path';
import { outsideFences } from './evidence.mjs';
import { documentationFiles, readWorking, repositoryPath } from './repo.mjs';

function anchors(markdown) {
  const used = new Set();
  for (const match of outsideFences(markdown).matchAll(/^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$/gm)) {
    const base = match[1].toLowerCase().replace(/<[^>]*>/g, '').replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '').replace(/ /g, '-');
    let slug = base;
    let counter = 0;
    while (used.has(slug)) slug = `${base}-${++counter}`;
    used.add(slug);
  }
  return used;
}

function destinations(text) {
  const definitions = new Map([...text.matchAll(/^ {0,3}\[([^\]]+)\]:\s*(?:<([^>]+)>|(\S+))/gm)].map((m) => [m[1].toLowerCase(), m[2] ?? m[3]]));
  const found = [];
  for (const match of text.matchAll(/!?\[([^\]]*)\](?:\(\s*(<[^>]*>|[^\n]*?)\s*\)|\[([^\]]*)\])/g)) {
    let destination = match[2];
    if (destination === undefined) destination = definitions.get((match[3] || match[1]).toLowerCase());
    if (destination === undefined) continue;
    if (destination.startsWith('<')) destination = destination.slice(1, destination.indexOf('>'));
    else destination = destination.replace(/\s+["'][\s\S]*["']$/, '');
    found.push({ destination, line: text.slice(0, match.index).split('\n').length });
  }
  return found;
}

export function checkLinks(repo) {
  const findings = [];
  for (const file of documentationFiles(repo)) {
    const text = outsideFences(readWorking(repo, file));
    for (const { destination, line } of destinations(text)) {
      if (!destination || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(destination)) continue;
      const hash = destination.indexOf('#');
      const urlPath = (hash === -1 ? destination : destination.slice(0, hash)).split('?')[0];
      let path;
      let anchor;
      try {
        path = urlPath ? posix.normalize(posix.join(dirname(file), decodeURIComponent(urlPath))) : file;
        anchor = hash === -1 ? null : decodeURIComponent(destination.slice(hash + 1));
      } catch {
        findings.push({ group: 'links', level: 'error', code: 'broken-link', file, line, message: 'Expected a valid percent-encoded relative destination; received invalid encoding.' });
        continue;
      }
      const target = repositoryPath(repo, path);
      if (!target || !existsSync(target)) {
        findings.push({ group: 'links', level: 'error', code: 'broken-link', file, line, message: `Expected an existing relative target; received missing ${path}.` });
        continue;
      }
      if (anchor && path.endsWith('.md')) {
        const content = readWorking(repo, path);
        if (content === null || !anchors(content).has(anchor)) findings.push({ group: 'links', level: 'error', code: 'broken-anchor', file, line, message: `Expected an existing heading anchor in ${path}; received #${anchor}.` });
      }
    }
  }
  return findings;
}
