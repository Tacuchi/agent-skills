# Agent Skills de Tacuchi

Repositorio personal para descubrir skills independientes organizadas por dominio y referencias externas curadas. Las ofertas vigentes figuran en el catálogo de abajo; una oferta propia usa `skills/<dominio>/<slug>/SKILL.md`. Elegir una ruta no obliga a adquirir las demás.

Consulta la fuente, la ref y los datos/permisos de cada oferta antes de decidir. Utiliza el mecanismo de adquisición de tu host si admite la fuente y la ruta individual. Este repositorio no instala ni actualiza nada por sí mismo; la compatibilidad con un canal concreto se comprueba al publicar cada skill.

## Catálogo

<!-- catalog:start -->
Revisión del índice: **3** (esquema 1).

### Ofertas vigentes

| Skill | Dominio | Tipo | Fuente | Ruta | Ref | Lifecycle | Datos/permisos |
| --- | --- | --- | --- | --- | --- | --- | --- |
| UI authoring | design | propia | https://github.com/Tacuchi/agent-skills | skills/design/ui-authoring/SKILL.md | skill/ui-authoring/v1.1.0 | Tacuchi | no verificados |
| System diagrams | architecture | propia | https://github.com/Tacuchi/agent-skills | skills/architecture/system-diagrams/SKILL.md | skill/system-diagrams/v1.1.0 | Tacuchi | no verificados |
| SQL authoring | data | propia | https://github.com/Tacuchi/agent-skills | skills/data/sql-authoring/SKILL.md | skill/sql-authoring/v1.1.0 | Tacuchi | no verificados |

### Ofertas retiradas

No hay ofertas retiradas.
<!-- catalog:end -->

El índice editorial es [`catalog/index.json`](catalog/index.json). Cada oferta indica su URL, ubicación y ref exacta; las retiradas conservan motivo e historia. El bloque anterior se genera con `node scripts/catalog.mjs` y se compara con `node scripts/catalog.mjs --check`.

Para consultar una oferta, abre su fuente y la ruta `SKILL.md` en la ref indicada. Para adquirir una sola skill, selecciona esa ruta en un host que acepte la fuente y la ref; confirma el canal compatible en la iniciativa de esa skill. `skills.sh` se utiliza sólo después de comprobar soporte para la ruta individual. Actualizar o retirar una fila del índice no cambia ninguna copia instalada: el host y su persona mantienen el control.

## Adquisición individual

Elige **una sola** ruta del repositorio `https://github.com/Tacuchi/agent-skills` en un host que admita fuente, ruta y ref inmutable:

- [ui-authoring](skills/design/ui-authoring/SKILL.md): `skills/design/ui-authoring/SKILL.md` en `skill/ui-authoring/v1.0.0`; decisiones de recorrido, pantallas y accesibilidad. [Notas individuales](skills/design/ui-authoring/RELEASE_NOTES.md).
- [system-diagrams](skills/architecture/system-diagrams/SKILL.md): `skills/architecture/system-diagrams/SKILL.md` en `skill/system-diagrams/v1.0.0`; diagramas con evidencia y render local. [Notas individuales](skills/architecture/system-diagrams/RELEASE_NOTES.md).
- [sql-authoring](skills/data/sql-authoring/SKILL.md): `skills/data/sql-authoring/SKILL.md` en `skill/sql-authoring/v1.0.0`; scripts parametrizados y reversos para aplicación ajena. [Notas individuales](skills/data/sql-authoring/RELEASE_NOTES.md).

Estas rutas comparten repo, pero cada oferta se adquiere por separado y declara su propia licencia e historial. La persona crea los tags; después de validar cada árbol etiquetado se prepara una GitHub Release **por tag** con sus propias notas. El catálogo local sólo acredita refs existentes en este checkout: comprobar la publicación remota y adquirir desde un host compatible son pasos operativos posteriores.

Consulta [CONTRIBUTING.md](CONTRIBUTING.md) para el contrato de licencia, historial y release por skill. El código del repositorio está bajo la [licencia MIT](LICENSE) de Tacuchi; la licencia aplicable a cada skill propia se declara expresamente al publicarla. Las referencias externas mantienen sus titulares y licencias upstream.
