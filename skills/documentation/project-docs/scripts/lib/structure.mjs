import { appendixRegion, outsideFences, parsePin } from './evidence.mjs';
import { listFiles, projectVersion, readWorking } from './repo.mjs';

function finding(code, file, message, level = 'error') {
  return { group: 'structure', level, code, file, message };
}

function architectureFindings(markdown, declaredVersion) {
  const file = 'ARCHITECTURE.md';
  if (markdown === null) return [finding('missing-architecture', file, 'Expected ARCHITECTURE.md; received no file.')];
  const findings = [];
  const pin = parsePin(markdown);
  // A project that declares no version leaves it out of the header.
  if (!pin || (declaredVersion && !pin.version)) findings.push(finding('bad-header', file, 'Expected the first paragraph after the title to contain a date, a commit in inline code and the version when the project declares one; received an incomplete header.'));
  const headings = [...outsideFences(markdown).matchAll(/^## (.+)$/gm)];
  const numbered = headings.filter((match) => /^\d+\.\s/.test(match[1]));
  const actual = numbered.map((match) => Number(match[1].match(/^\d+/)[0]));
  if (actual.join(',') !== '1,2,3,4,5,6,7') findings.push(finding('bad-sections', file, `Expected sections 1 through 7 in order; received ${actual.join(', ') || 'none'}.`));
  const appendix = appendixRegion(markdown);
  if (!appendix || appendix.start < (numbered.at(-1)?.index ?? 0)) findings.push(finding('missing-appendix', file, 'Expected an unnumbered appendix after the seven sections; received no trailing appendix.'));
  return findings;
}

function readmeFindings(markdown) {
  const file = 'README.md';
  if (markdown === null) return [finding('missing-readme', file, 'Expected README.md; received no file.')];
  const findings = [];
  const text = outsideFences(markdown);
  const description = text.match(/^> (.*)$/m)?.[1];
  if (!description || description.length >= 120) findings.push(finding('readme-short-description', file, `Expected a first blockquote description shorter than 120 characters; received ${description === undefined ? 'none' : description.length + ' characters'}.`));
  if (!/\[[^\]]*\]\(\s*<?(?:\.\/)?ARCHITECTURE\.md(?:#[^\s)>]*)?>?(?:\s+["'][^\n]*["'])?\s*\)/.test(text)) findings.push(finding('readme-no-architecture-link', file, 'Expected a relative link to ARCHITECTURE.md; received no matching link.'));
  const aliases = [ /^(Install|Installation|Instalaci\u00f3n)$/i, /^(Usage|Uso)$/i, /^(Contributing|Contribuir|Contribuciones)$/i, /^(License|Licencia)$/i ];
  const order = [...text.matchAll(/^## (.+?)\s*#*\s*$/gm)].map((match) => aliases.findIndex((alias) => alias.test(match[1]))).filter((index) => index !== -1);
  if (!order.length) findings.push(finding('readme-sections-unrecognized', file, 'Expected installation, usage, contributing and license headings in English or Spanish; received no recognized headings.', 'warning'));
  else if (order.join(',') !== '0,1,2,3') findings.push(finding('readme-order', file, `Expected installation, usage, contributing, license in that order; received recognized heading positions ${order.join(', ')}.`));
  return findings;
}

export function checkStructure(repo) {
  const findings = [...architectureFindings(readWorking(repo, 'ARCHITECTURE.md'), projectVersion(repo)), ...readmeFindings(readWorking(repo, 'README.md'))];
  for (const file of listFiles(repo, 'docs/decisions').filter((path) => path.endsWith('.md'))) {
    const name = file.split('/').at(-1);
    if (!/^\d{4}-[a-z0-9-]+\.md$/.test(name)) findings.push(finding('bad-decision-name', file, `Expected a decision name matching NNNN-lowercase-slug.md; received ${name}.`));
    const content = readWorking(repo, file);
    const front = content?.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
    if (!front || !/^status:\s*\S.+$/m.test(front) || !/^date:\s*['"]?\d{4}-\d{2}-\d{2}['"]?\s*$/m.test(front)) findings.push(finding('bad-decision-front-matter', file, 'Expected YAML front matter with nonempty status and YYYY-MM-DD date; received missing or malformed fields.'));
  }
  return findings;
}
