import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const offer = join(root, 'skills', 'orchestration', 'herdr-coordination');
const skill = readFileSync(join(offer, 'SKILL.md'), 'utf8');
const version = /^## \[(\d+\.\d+\.\d+)\]/m.exec(readFileSync(join(offer, 'CHANGELOG.md'), 'utf8'))[1];
const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();

test('una instalación aislada conserva identidad, licencia, historia y alcance autónomo', (t) => {
  const fixture = mkdtempSync(join(tmpdir(), 'herdr-only-'));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  const target = join(fixture, 'skills', 'herdr-coordination');
  mkdirSync(target, { recursive: true });
  for (const file of ['SKILL.md', 'LICENSE', 'CHANGELOG.md', 'RELEASE_NOTES.md']) {
    copyFileSync(join(offer, file), join(target, file));
  }
  assert.deepEqual(readdirSync(join(fixture, 'skills')), ['herdr-coordination']);
  assert.match(skill, /^---\nname: herdr-coordination\ndescription: "[^"]+"\n---/);
  assert.doesNotMatch(skill, /\baw\b|\.workflow\/|Workline|scratchpad|\/Users\/|w\d+:p\w+|OPENCODE_CONFIG/);
  assert.match(skill, /Si `herdr` falta.*no atribuyas tareas iniciadas ni resultados/s);
  assert.match(readFileSync(join(target, 'LICENSE'), 'utf8'), /MIT License[\s\S]*Tacuchi/);
  assert.match(readFileSync(join(target, 'CHANGELOG.md'), 'utf8'), /## \[1\.0\.0\]/);
  assert.ok(readFileSync(join(target, 'RELEASE_NOTES.md'), 'utf8').includes(`skill/herdr-coordination/v${version}`));
});

test('trazas inventadas no convierten estado, envío ni cambio pendiente en un éxito', () => {
  const table = Object.fromEntries(
    [...skill.matchAll(/^\| `(working|blocked|idle|done|unknown)` \| ([^|]+) \|$/gm)]
      .map(([, state, action]) => [state, action]),
  );
  const transcripts = [
    { state: 'working', output: 'Ejecutando pruebas', required: /Esperar|leer progreso/, prohibited: /declarar conclusión/ },
    { state: 'blocked', output: '¿Permitir escritura? Sí / No', required: /persona.*esperar autorización/, prohibited: /aprobar automáticamente/ },
    { state: 'idle', output: '¿Qué archivo reviso?', required: /Leer el panel.*pregunta/, prohibited: /concluir sin leer/ },
    { state: 'done', output: 'Revisé el módulo; faltan pruebas', required: /verificar entregable\/pruebas/, prohibited: /declarar conclusión sin verificar/ },
    { state: 'unknown', output: 'Sesión no detectada después de reinicio', required: /revisar detección.*incierto.*no repetir ni declarar éxito/, prohibited: /declarar éxito sin revisar/ },
  ];
  assert.deepEqual(Object.keys(table).sort(), transcripts.map(({ state }) => state).sort());
  for (const { state, required, prohibited } of transcripts) {
    assert.match(table[state], required, `${state}: acción conservadora`);
    assert.doesNotMatch(table[state], prohibited, `${state}: sin conclusión inferida`);
  }
  assert.match(skill, /si el agente ya trabajaba, puede coincidir con el fin de otro encargo/);
  assert.match(skill, /Si la recepción es incierta, inspecciona antes de reenviar/);
  assert.match(skill, /después de identificar la instancia y el último encargo/);
  assert.match(skill, /espera a que se actualice, vuelve a leer la pantalla/);
  assert.match(skill, /Comprueba el reparto con `herdr pane layout` y corrígelo con `herdr pane resize/);
  assert.match(skill, /envía sólo cuando la pantalla de revisión muestre todas las respuestas/);
});

test('permiso, cuota, commit, publicación e irreversibilidad vuelven a la persona', () => {
  const reserved = ['permiso', 'cuota/recursos', 'commit', 'publicación', 'irreversible'];
  const boundary = skill.slice(skill.indexOf('- Una solicitud de permiso'), skill.indexOf('\n\n## Ciclo observable'));
  for (const effect of reserved) assert.ok(boundary.includes(effect), `${effect}: frontera humana`);
  assert.match(boundary, /literalmente a la persona/);
  assert.match(boundary, /respuesta escrita explícita para \*\*esa\*\* solicitud/);
  assert.match(boundary, /Sólo transmite la opción que haya autorizado y comprueba su recepción/);
  assert.match(boundary, /autorización general dada antes .* no es la respuesta a \*\*esa\*\* solicitud/);
  assert.match(boundary, /si el host bloquea el envío .* no busques otra vía; .*deja que conteste en su panel/);
  assert.match(skill, /No ejecutes `herdr agent send-keys`.*hasta recibir la elección explícita/);
  assert.match(skill, /`herdr agent prompt` rechaza envíos a un agente ya bloqueado/);
  assert.match(skill, /si no se confirma recepción, conserva la pregunta pendiente/);
  assert.match(skill, /Con respuesta escrita «No», transmite «No», relee la pantalla/);
});

test('Herdr es la cuarta oferta y apunta a la ref de su última versión', () => {
  const current = JSON.parse(readFileSync(join(root, 'catalog', 'index.json'), 'utf8'));
  assert.deepEqual(current.entries.map(({ id }) => id), ['ui-authoring', 'system-diagrams', 'sql-authoring', 'herdr-coordination']);
  const entry = current.entries.at(-1);
  assert.equal(entry.id, 'herdr-coordination');
  assert.equal(entry.path, 'skills/orchestration/herdr-coordination/SKILL.md');
  assert.equal(entry.ref, `skill/herdr-coordination/v${version}`);
  assert.equal(entry.type, 'own');
  assert.equal(entry.data_permissions.status, 'unverified');
  assert.doesNotThrow(() => git('merge-base', '--is-ancestor', entry.ref, 'HEAD'));
  for (const file of ['SKILL.md', 'LICENSE', 'CHANGELOG.md', 'RELEASE_NOTES.md']) {
    assert.equal(git('show', `${entry.ref}:skills/orchestration/herdr-coordination/${file}`), readFileSync(join(offer, file), 'utf8').trim());
  }
});

test('fixtures de ocho familias de host adquieren sólo Herdr y leen su metadata sin arnés', (t) => {
  const fixture = mkdtempSync(join(tmpdir(), 'herdr-host-matrix-'));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  const hosts = new Map([
    ['claude', '.claude/skills'], ['codex', '.codex/skills'], ['warp', '.warp/skills'],
    ['oz', '.agents/skills'], ['gemini/agy', '.gemini/skills'], ['opencode', '.agents/skills'],
    ['crush', '.config/crush/skills'], ['kimi', '.kimi-code/skills'],
  ]);
  for (const [host, location] of hosts) {
    const skills = join(fixture, host, location);
    const target = join(skills, 'herdr-coordination');
    mkdirSync(target, { recursive: true });
    copyFileSync(join(offer, 'SKILL.md'), join(target, 'SKILL.md'));
    assert.deepEqual(readdirSync(skills), ['herdr-coordination'], `${host}: sin ofertas hermanas`);
    const installed = readFileSync(join(target, 'SKILL.md'), 'utf8');
    assert.match(installed, /^name: herdr-coordination$/m, `${host}: selección por nombre`);
    assert.match(installed, /^description: .+Herdr.+$/m, `${host}: selección por descripción`);
    assert.doesNotMatch(installed, /\baw\b|\.workflow\/|Workline/);
  }
});
