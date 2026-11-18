import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { documentationFiles, readWorking } from './repo.mjs';

const patterns = [
  { code: 'local-path', name: 'personal-directory', regex: /\/(?:Users|home)\/[^/\s]+\/|[A-Za-z]:\\Users\\[^\\\s]+\\/i },
  { code: 'secret-pattern', name: 'private-key', regex: /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----/ },
  { code: 'secret-pattern', name: 'github-token', regex: /\bghp_[A-Za-z0-9]{36}\b|\bgithub_pat_[A-Za-z0-9_]+/ },
  { code: 'secret-pattern', name: 'api-key', regex: /\bsk-[A-Za-z0-9_-]{20,}/ },
  { code: 'secret-pattern', name: 'access-key', regex: /\bAKIA[A-Z0-9]{16}\b/ },
  { code: 'secret-pattern', name: 'slack-token', regex: /\bxox[baprs]-[A-Za-z0-9-]+/ },
];

// The list in use: the one given, else the person's own outside every repository, else none.
export function privateTermsPath(explicit) {
  const defaultFile = join(process.env.HOME || homedir(), '.config/agent-skills/project-docs/private-terms.txt');
  return explicit ?? (existsSync(defaultFile) ? defaultFile : null);
}

export function checkPrivacy(repo, { privateTermsFile } = {}) {
  const termsFile = privateTermsPath(privateTermsFile);
  const terms = termsFile ? readFileSync(termsFile, 'utf8').split(/\r?\n/).flatMap((value, index) => {
    const term = value.trim();
    return term && !term.startsWith('#') ? [{ term: term.toLowerCase(), line: index + 1 }] : [];
  }) : [];
  const findings = [];
  for (const file of documentationFiles(repo, { privacy: true })) {
    const content = readWorking(repo, file);
    for (const [index, line] of content.split(/\r?\n/).entries()) {
      for (const pattern of patterns) {
        if (pattern.regex.test(line)) findings.push({ group: 'privacy', level: 'error', code: pattern.code, file, line: index + 1, message: `${file}:${index + 1}: Expected public documentation without ${pattern.name}; received a match for that pattern (content omitted).` });
      }
      for (const entry of terms) {
        if (line.toLowerCase().includes(entry.term)) findings.push({ group: 'privacy', level: 'error', code: 'private-term', file, line: index + 1, message: `${file}:${index + 1}: Expected no configured private terms; received a match for term list line ${entry.line} (content omitted).` });
      }
    }
  }
  return findings;
}
