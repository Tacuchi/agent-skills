import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, lstatSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const OWN_SOURCE = 'https://github.com/Tacuchi/agent-skills';
const SLUG = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const TAG = /^skill\/([a-z][a-z0-9]*(?:-[a-z0-9]+)*)\/v\d+\.\d+\.\d+$/;
const START = '<!-- catalog:start -->';
const END = '<!-- catalog:end -->';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function text(value, label) {
  assert(typeof value === 'string' && value.trim() === value && value.length > 0 && !/[\r\n]/.test(value), `${label}: texto obligatorio en una línea`);
  return value;
}

function url(value, label) {
  text(value, label);
  const parsed = new URL(value);
  assert(parsed.protocol === 'https:' && !parsed.username && !parsed.password, `${label}: URL HTTPS sin credenciales requerida`);
  return value;
}

function git(root, args) {
  try {
    return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

function inside(root, path) {
  assert(typeof path === 'string' && path.length > 0 && !path.startsWith('/') && !path.includes('\\') && !path.split('/').some((part) => part === '.' || part === '..' || !part), `ruta inválida: ${path}`);
  const absolute = resolve(root, path);
  assert(absolute.startsWith(resolve(root) + sep), `ruta fuera del repositorio: ${path}`);
  return absolute;
}

function file(root, path, label) {
  const absolute = inside(root, path);
  assert(existsSync(absolute) && readFileSync(absolute, 'utf8').trim().length > 0, `${label}: falta ${path}`);
}

function skillFrontmatter(content, label) {
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(content)?.[1];
  assert(frontmatter && ['name', 'description'].every((key) => {
    const value = new RegExp(`^${key}:[ \t]*(.+)$`, 'm').exec(frontmatter)?.[1].trim();
    return value && value !== "''" && value !== '""';
  }), `${label}: SKILL.md sin frontmatter con name y description`);
  // Un escalar plano con `: ` o ` #` es YAML inválido o truncado: los instaladores estrictos omiten la skill.
  const plain = [...frontmatter.matchAll(/^[\w-]+:[ \t]*([^'"|>\s].*)$/gm)].find(([, value]) => /: |\s#/.test(value));
  assert(!plain, `${label}: SKILL.md con frontmatter YAML inválido; entrecomilla «${plain?.[0].split(':')[0]}»`);
}

function immutableEvidence(entry) {
  const evidence = new URL(entry.data_permissions.evidence_url);
  const source = new URL(entry.source_url);
  const path = decodeURIComponent(evidence.pathname);
  const commit = /\/(?:blob|tree)\/[a-f0-9]{40}(?:\/|$)|\/commit\/[a-f0-9]{40}(?:\/|$)/.test(path);
  const offerTag = TAG.test(entry.ref) || /^v\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(entry.ref);
  const tagged = offerTag && evidence.origin === source.origin && path.startsWith(`${source.pathname.replace(/\/$/, '')}/blob/${entry.ref}/`);
  assert(commit || tagged, `${entry.id}: evidencia debe estar anclada a una ref inmutable (commit SHA o tag de la oferta)`);
}

function validateEntry(root, entry, ids, slugs) {
  assert(entry && typeof entry === 'object' && !Array.isArray(entry), 'entrada inválida');
  const id = text(entry.id, 'id');
  assert(SLUG.test(id) && !ids.has(id), `${id}: id duplicado o inválido`);
  ids.add(id);
  text(entry.name, `${id}: nombre`);
  assert(SLUG.test(entry.domain), `${id}: dominio inválido`);
  assert(['own', 'external'].includes(entry.type), `${id}: tipo inválido`);
  assert(['active', 'retired'].includes(entry.status), `${id}: estado inválido`);
  url(entry.source_url, `${id}: fuente`);
  const path = entry.path;
  assert(typeof path === 'string' && path.endsWith('/SKILL.md') && !path.includes('\\') && !path.startsWith('/') && !path.split('/').some((part) => part === '.' || part === '..' || !part), `${id}: ruta de skill individual inválida`);
  text(entry.ref, `${id}: ref`);
  text(entry.lifecycle_owner, `${id}: responsable del lifecycle`);
  const info = entry.data_permissions;
  assert(info && typeof info === 'object' && !Array.isArray(info), `${id}: datos/permisos obligatorios`);
  assert(['verified', 'unverified'].includes(info.status), `${id}: estado de datos/permisos inválido`);
  text(info.summary, `${id}: datos/permisos`);
  if (info.status === 'verified') {
    url(info.evidence_url, `${id}: procedencia de verificación`);
    immutableEvidence(entry);
  } else {
    assert(info.summary === 'no verificados' && info.evidence_url === undefined, `${id}: no verificados no puede afirmar evidencia`);
  }
  if (entry.status === 'retired') text(entry.retirement_reason, `${id}: motivo de retiro`);
  else assert(entry.retirement_reason === undefined, `${id}: una oferta vigente no tiene motivo de retiro`);

  if (entry.type === 'external') {
    assert(entry.source_url.replace(/\.git\/?$/, '').replace(/\/$/, '') !== OWN_SOURCE && entry.lifecycle_owner.toLowerCase() !== 'tacuchi', `${id}: falsa atribución upstream`);
    assert(/^(?:[a-f0-9]{7,40}|v\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?)$/.test(entry.ref), `${id}: ref externa debe ser commit o versión fija`);
    assert(!('license' in entry) && !('changelog' in entry) && !('release_notes' in entry), `${id}: una externa no tiene release ni licencia local`);
    return;
  }

  assert(/^skills\/[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*\/SKILL\.md$/.test(path), `${id}: ruta propia inválida`);
  const [, domain, slug] = path.split('/');
  assert(domain === entry.domain && SLUG.test(domain) && SLUG.test(slug), `${id}: ruta y dominio contradictorios`);
  assert(entry.source_url === OWN_SOURCE && entry.lifecycle_owner === 'Tacuchi', `${id}: fuente o responsable propio incorrecto`);
  assert(!slugs.has(slug), `${id}: slug propio duplicado entre dominios`);
  slugs.add(slug);
  const match = TAG.exec(entry.ref);
  assert(match && match[1] === slug, `${id}: tag propio skill/<slug>/vX.Y.Z obligatorio`);
  const base = `skills/${domain}/${slug}`;
  assert(path === `${base}/SKILL.md`, `${id}: ruta propia contradictoria`);
  assert(entry.license === 'root' || entry.license === `${base}/LICENSE`, `${id}: licencia aplicable debe ser root o propia`);
  assert(entry.changelog === `${base}/CHANGELOG.md` && entry.release_notes === `${base}/RELEASE_NOTES.md`, `${id}: historial y notas individuales obligatorios`);
  const files = [path, entry.changelog, entry.release_notes, entry.license === 'root' ? 'LICENSE' : entry.license];
  if (entry.status === 'active') {
    for (const item of files) {
      if (item === path) {
        const absolute = inside(root, path);
        assert(existsSync(absolute) && lstatSync(absolute).isFile(), `${id}: ${path} debe ser un archivo regular en el checkout`);
      }
      file(root, item, id);
    }
  }
  assert(git(root, ['rev-parse', '--verify', `refs/tags/${entry.ref}^{commit}`]), `${id}: tag ${entry.ref} inexistente`);
  assert(/^100644 blob [a-f0-9]+\t/.test(git(root, ['ls-tree', entry.ref, '--', path]) ?? ''), `${id}: tag ${entry.ref} requiere ${path} como blob 100644`);
  for (const item of files) {
    assert(git(root, ['show', `${entry.ref}:${item}`]), `${id}: tag ${entry.ref} no contiene ${item} con contenido`);
  }
  skillFrontmatter(git(root, ['show', `${entry.ref}:${path}`]), `${id}: tag ${entry.ref} ${path}`);
}

function markdown(value) {
  return String(value).replaceAll('|', '\\|').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function rows(entries, retired) {
  if (!entries.length) return retired ? 'No hay ofertas retiradas.' : 'No hay ofertas vigentes.';
  const headings = '| Skill | Dominio | Tipo | Fuente | Ruta | Ref | Lifecycle | Datos/permisos |' + (retired ? ' Motivo |' : '');
  const separator = '| --- | --- | --- | --- | --- | --- | --- | --- |' + (retired ? ' --- |' : '');
  return [headings, separator, ...entries.map((entry) => {
    const info = entry.data_permissions;
    const evidence = info.status === 'verified' ? ` (${info.evidence_url})` : '';
    const fields = [entry.name, entry.domain, entry.type === 'own' ? 'propia' : 'externa', entry.source_url, entry.path, entry.ref, entry.lifecycle_owner, `${info.summary}${evidence}`];
    if (retired) fields.push(entry.retirement_reason);
    return `| ${fields.map(markdown).join(' | ')} |`;
  })].join('\n');
}

export function render(index) {
  return `${START}\nRevisión del índice: **${index.revision}** (esquema ${index.schema_version}).\n\n### Ofertas vigentes\n\n${rows(index.entries.filter((entry) => entry.status === 'active'), false)}\n\n### Ofertas retiradas\n\n${rows(index.entries.filter((entry) => entry.status === 'retired'), true)}\n${END}`;
}

export function checkCatalog(root, { check = true } = {}) {
  assert(git(root, ['rev-parse', '--verify', 'HEAD']), 'no se pudo leer HEAD para comparar la revisión');
  const index = JSON.parse(readFileSync(join(root, 'catalog/index.json'), 'utf8'));
  assert(index.schema_version === 1 && Number.isSafeInteger(index.revision) && index.revision >= 1 && Array.isArray(index.entries), 'esquema, revisión o entradas inválidos');
  const ids = new Set();
  const slugs = new Set();
  for (const entry of index.entries) validateEntry(root, entry, ids, slugs);

  const current = git(root, ['show', 'HEAD:catalog/index.json']);
  const previous = current !== null && JSON.stringify(JSON.parse(current)) === JSON.stringify(index)
    ? git(root, ['show', 'HEAD^:catalog/index.json'])
    : current;
  if (previous !== null) {
    const baseline = JSON.parse(previous);
    const changed = JSON.stringify({ schema_version: baseline.schema_version, entries: baseline.entries }) !== JSON.stringify({ schema_version: index.schema_version, entries: index.entries });
    assert(index.revision >= baseline.revision && (!changed || index.revision > baseline.revision), 'cambio editorial sin incremento de revision');
  }

  const readmePath = join(root, 'README.md');
  const readme = readFileSync(readmePath, 'utf8');
  const blocks = readme.match(/<!-- catalog:start -->[\s\S]*?<!-- catalog:end -->/g);
  assert(blocks?.length === 1, 'README debe contener un único bloque de catálogo');
  const expected = render(index);
  if (check) assert(blocks[0] === expected, 'README no coincide con catalog/index.json');
  else if (blocks[0] !== expected) writeFileSync(readmePath, readme.replace(blocks[0], expected));
  return index;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    checkCatalog(resolve(fileURLToPath(new URL('..', import.meta.url))), { check: process.argv.includes('--check') });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
