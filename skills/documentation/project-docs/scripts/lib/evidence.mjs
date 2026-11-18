import { posix } from 'node:path';
import { readWorking, resolveCommit, showFile } from './repo.mjs';

export function lines(text) {
  const result = text.replaceAll('\r\n', '\n').split('\n');
  if (result.at(-1) === '') result.pop();
  return result;
}

export function outsideFences(markdown) {
  let fence = null;
  return markdown.replaceAll('\r\n', '\n').split('\n').map((line) => {
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length && /^\s*$/.test(line.slice(marker[0].length))) fence = null;
      return '';
    }
    return fence ? '' : line;
  }).join('\n');
}

export function headerParagraph(markdown) {
  return outsideFences(markdown).match(/^# [^\n]*\n\s*\n([^\n]+(?:\n(?!\s*\n|#)[^\n]+)*)/m)?.[1] ?? null;
}

export function parsePin(markdown) {
  const paragraph = headerParagraph(markdown);
  if (!paragraph) return null;
  const date = paragraph.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
  const commit = paragraph.match(/`([0-9a-f]{7,40})`/)?.[1];
  const version = paragraph.replace(date ?? '', '').replace(/`[0-9a-f]{7,40}`/g, '').match(/\bv?(\d+(?:\.\d+){1,3})(?![\d.])/)?.[1] ?? null;
  return date && commit ? { date, version, commit } : null;
}

const MAX_ROW_CITATIONS = 5;
const VOLATILE_LINE = /^\s*(?:["']?(?:version|revision)["']?\s*[:=]|<version>)/i;

export function appendixRegion(markdown) {
  const text = outsideFences(markdown);
  const headings = [...text.matchAll(/^## (.+)$/gm)];
  const heading = headings.filter((match) => !/^\d+\.\s/.test(match[1])).at(-1);
  if (!heading) return null;
  const next = headings.find((match) => match.index > heading.index);
  return { start: heading.index, end: next?.index ?? text.length, text: text.slice(heading.index, next?.index) };
}

export function parseAppendix(markdown) {
  const region = appendixRegion(markdown);
  if (!region) return [];
  return region.text.split('\n').flatMap((line) => {
    if (!/^\s*\|/.test(line)) return [];
    const cells = line.split('|');
    const citations = [...cells.slice(2).join('|').matchAll(/`([^`\n]+):(\d+)(?:-(\d+))?`/g)].map((match) => ({ path: match[1], start: Number(match[2]), end: Number(match[3] ?? match[2]) }));
    return citations.length ? [{ section: cells[1].trim(), citations }] : [];
  });
}

export function classify(oldText, currentText, start, end) {
  if (oldText === null || currentText === null || start < 1 || end < start) return { status: 'stale' };
  const oldLines = lines(oldText);
  const currentLines = lines(currentText);
  if (end > oldLines.length) return { status: 'stale' };
  const block = oldLines.slice(start - 1, end);
  const matchesAt = (index) => block.every((line, offset) => currentLines[index + offset] === line);
  if (end <= currentLines.length && matchesAt(start - 1)) return { status: 'ok' };
  const matches = [];
  for (let index = 0; index <= currentLines.length - block.length; index += 1) {
    if (matchesAt(index)) matches.push(index);
    if (matches.length > 1) return { status: 'stale' };
  }
  return matches.length === 1 ? { status: 'moved', movedTo: [matches[0] + 1, matches[0] + block.length] } : { status: 'stale' };
}

export function citationLabel(cited) {
  return `${cited.path}:${cited.start}-${cited.end}`;
}

export function inspectCitation(repo, commit, cited) {
  const path = posix.normalize(cited.path.replaceAll('\\', '/')).replace(/^\.\//, '');
  if (['README.md', 'ARCHITECTURE.md'].includes(path) || path.startsWith('docs/')) {
    return { status: 'stale', code: 'self-citation', detail: 'Expected code or configuration evidence; received a documentation citation.' };
  }
  const oldText = showFile(repo, commit, cited.path);
  if (oldText === null) return { status: 'stale', code: 'missing-at-pin', detail: 'Expected a file at the pinned commit; received no file.' };
  if (cited.start < 1 || cited.end < cited.start || cited.end > lines(oldText).length) {
    return { status: 'stale', code: 'out-of-range', detail: `Expected a range within 1-${lines(oldText).length}; received ${cited.start}-${cited.end}.` };
  }
  // A line that states a version or a revision changes at every release: a range over it goes stale each time.
  const offset = lines(oldText).slice(cited.start - 1, cited.end).findIndex((line) => VOLATILE_LINE.test(line));
  const volatile = offset === -1 ? {} : { volatileLine: cited.start + offset };
  const result = classify(oldText, readWorking(repo, cited.path), cited.start, cited.end);
  if (result.status === 'ok') return { ...result, ...volatile };
  return { ...result, ...volatile, code: result.status, detail: result.status === 'moved'
    ? `Expected the block at its cited range; received one match at ${result.movedTo.join('-')}.`
    : 'Expected the same block at its range or one unique new range; received changed, missing or ambiguous content.' };
}

export function evidenceEntries(repo, markdown) {
  const pin = parsePin(markdown);
  if (!pin) return [];
  const commit = resolveCommit(repo, pin.commit);
  if (!commit) {
    const error = new Error(`Expected a locally available pinned commit; received ${pin.commit}. Fetch the missing history (git fetch --unshallow for a shallow clone).`);
    error.code = 'pin-unknown';
    throw error;
  }
  return parseAppendix(markdown).flatMap(({ section, citations }) => citations.map((cited) => ({ section, cited, ...inspectCitation(repo, commit, cited) })));
}

export function checkEvidence(repo, markdown) {
  const entries = evidenceEntries(repo, markdown);
  const warning = (code, section, message, extra = {}) => ({ group: 'evidence', level: 'warning', code, file: 'ARCHITECTURE.md', section, ...extra, message });
  return [
    ...entries.filter((entry) => entry.code).map((entry) => ({
      group: 'evidence', level: entry.status === 'moved' ? 'warning' : 'error', code: entry.code,
      file: 'ARCHITECTURE.md', section: entry.section, cited: entry.cited,
      ...(entry.movedTo ? { moved_to: entry.movedTo } : {}),
      message: `${citationLabel(entry.cited)} (${entry.section}): ${entry.detail}`,
    })),
    ...entries.filter((entry) => entry.volatileLine).map((entry) => warning('volatile-citation', entry.section,
      `${citationLabel(entry.cited)} (${entry.section}): Expected a range without a version or revision line; received one at line ${entry.volatileLine}.`, { cited: entry.cited })),
    ...(entries.length ? parseAppendix(markdown) : []).filter((row) => row.citations.length > MAX_ROW_CITATIONS).map((row) => warning('too-many-citations', row.section,
      `${row.section}: Expected at most ${MAX_ROW_CITATIONS} citations in a row; received ${row.citations.length}.`)),
  ];
}

export function repin(repo, markdown, { head, date, version }) {
  const pin = parsePin(markdown);
  if (!pin) throw new Error('Expected a header with date and commit; received an invalid header.');
  const entries = evidenceEntries(repo, markdown);
  const region = appendixRegion(markdown);
  const paragraph = headerParagraph(markdown);
  let header = paragraph.replace(pin.date, date).replace('`' + pin.commit + '`', '`' + head + '`');
  if (version && pin.version) header = header.replace(new RegExp(`\\bv?${pin.version.replaceAll('.', '\\.')}\\b`), version);
  if (!region) return markdown.replace(paragraph, header);
  const originalLines = markdown.split(/\r?\n/);
  const appendixStart = outsideFences(markdown).slice(0, region.start).split('\n').length - 1;
  let section = null;
  const replacements = originalLines.map((line, index) => {
    if (index < appendixStart) return line;
    if (/^\s*\|/.test(line)) section = line.split('|')[1].trim();
    return line.replace(/`([^`\n]+):(\d+)(?:-(\d+))?`/g, (match, path, start, end) => {
      const moved = entries.find((entry) => entry.section === section && entry.cited.path === path && entry.cited.start === Number(start) && entry.cited.end === Number(end ?? start) && entry.status === 'moved');
      return moved ? '`' + path + ':' + moved.movedTo.join('-') + '`' : match;
    }).replaceAll('`' + pin.commit + '`', '`' + head + '`');
  });
  // Keep existing line endings when only the pin and evidence ranges change.
  const newline = markdown.includes('\r\n') ? '\r\n' : '\n';
  return replacements.join(newline).replace(paragraph.replaceAll('\n', newline), header.replaceAll('\n', newline));
}
