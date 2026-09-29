import assert from 'node:assert/strict';
import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const offer = join(root, 'skills', 'orchestration', 'herdr-coordination');
const skill = readFileSync(join(offer, 'SKILL.md'), 'utf8');

test('una instalación aislada conserva identidad, licencia, historia y alcance autónomo', (t) => {
  const fixture = mkdtempSync(join(tmpdir(), 'herdr-only-'));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  const target = join(fixture, 'skills', 'herdr-coordination');
  mkdirSync(target, { recursive: true });
  for (const file of ['SKILL.md', 'LICENSE', 'CHANGELOG.md', 'RELEASE_NOTES.md']) {
    copyFileSync(join(offer, file), join(target, file));
  }
  assert.deepEqual(readdirSync(join(fixture, 'skills')), ['herdr-coordination']);
  assert.match(skill, /^---\nname: herdr-coordination\ndescription: .+\n---/);
  assert.doesNotMatch(skill, /\baw\b|\.workflow\/|Workline|scratchpad|\/Users\/|w\d+:p\w+|OPENCODE_CONFIG/);
  assert.match(skill, /Si `herdr` falta.*no atribuyas tareas iniciadas ni resultados/s);
  assert.match(readFileSync(join(target, 'LICENSE'), 'utf8'), /MIT License[\s\S]*Tacuchi/);
  assert.match(readFileSync(join(target, 'CHANGELOG.md'), 'utf8'), /## \[1\.0\.0\]/);
  assert.match(readFileSync(join(target, 'RELEASE_NOTES.md'), 'utf8'), /skill\/herdr-coordination\/v1\.0\.0/);
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
});

test('permiso, cuota, commit, publicación e irreversibilidad vuelven a la persona', () => {
  const reserved = ['permiso', 'cuota/recursos', 'commit', 'publicación', 'irreversible'];
  const boundary = skill.slice(skill.indexOf('- Una solicitud de permiso'), skill.indexOf('\n\n## Ciclo observable'));
  for (const effect of reserved) assert.ok(boundary.includes(effect), `${effect}: frontera humana`);
  assert.match(boundary, /literalmente a la persona/);
  assert.match(boundary, /respuesta escrita explícita para \*\*esa\*\* solicitud/);
  assert.match(boundary, /Sólo transmite la opción que haya autorizado y comprueba su recepción/);
  assert.match(skill, /No ejecutes `herdr agent send-keys`.*hasta recibir la elección explícita/);
  assert.match(skill, /`herdr agent prompt` rechaza envíos a un agente ya bloqueado/);
  assert.match(skill, /si no se confirma recepción, conserva la pregunta pendiente/);
  assert.match(skill, /Con respuesta escrita «No», transmite «No», relee la pantalla/);
});
