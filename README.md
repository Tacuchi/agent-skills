# Agent Skills de Tacuchi

Repositorio personal para descubrir skills independientes organizadas por dominio y referencias externas curadas. Las ofertas vigentes figuran en el catálogo de abajo; una oferta propia usa `skills/<dominio>/<slug>/SKILL.md`. Elegir una ruta no obliga a adquirir las demás.

Consulta la fuente, la ref y los datos/permisos de cada oferta antes de decidir. Utiliza el mecanismo de adquisición de tu host si admite la fuente y la ruta individual. Este repositorio no instala ni actualiza nada por sí mismo; la compatibilidad con un canal concreto se comprueba al publicar cada skill.

## Catálogo

<!-- catalog:start -->
Revisión del índice: **1** (esquema 1).

### Ofertas vigentes

No hay ofertas vigentes.

### Ofertas retiradas

No hay ofertas retiradas.
<!-- catalog:end -->

El índice editorial es [`catalog/index.json`](catalog/index.json). Cada oferta indica su URL, ubicación y ref exacta; las retiradas conservan motivo e historia. El bloque anterior se genera con `node scripts/catalog.mjs` y se compara con `node scripts/catalog.mjs --check`.

Para consultar una oferta, abre su fuente y la ruta `SKILL.md` en la ref indicada. Para adquirir una sola skill, selecciona esa ruta en un host que acepte la fuente y la ref; confirma el canal compatible en la iniciativa de esa skill. `skills.sh` se utiliza sólo después de comprobar soporte para la ruta individual. Actualizar o retirar una fila del índice no cambia ninguna copia instalada: el host y su persona mantienen el control.

Consulta [CONTRIBUTING.md](CONTRIBUTING.md) para el contrato de licencia, historial y release por skill. El código del repositorio está bajo la [licencia MIT](LICENSE) de Tacuchi; la licencia aplicable a cada skill propia se declara expresamente al publicarla. Las referencias externas mantienen sus titulares y licencias upstream.
