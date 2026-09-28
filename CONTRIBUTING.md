# Contribuir

Este repositorio personal publica skills independientes bajo `skills/<dominio>/<slug>/SKILL.md` y puede incluir referencias curadas a proyectos externos. No se incorpora ninguna oferta por existir en otro catálogo. Antes de proponer una skill, describe su contrato, su dominio, su fuente y su forma de uso; el contenido y su aceptación pertenecen a su propia iniciativa.

## Una oferta propia

Cada skill propia necesita un responsable identificable, `SKILL.md`, licencia aplicable (archivo `LICENSE` en su directorio o herencia **explícita** de la MIT raíz en el índice), `CHANGELOG.md` por skill y notas de versión por skill (`RELEASE_NOTES.md`). Declara datos y permisos conocidos con la procedencia de la verificación, o indícalos como «no verificados». Registra su ruta y ref adquirible exacta en `catalog/index.json`. El tag `skill/<slug>/vX.Y.Z` debe señalar un commit que contenga la skill, su licencia y su historial; la GitHub Release correspondiente usa ese tag y las notas de esa skill. No hay releases colectivos implícitos.

Un cambio de oferta (alta, actualización de ref o estado, retiro, metadatos visibles) incrementa `revision` del índice, independientemente de las versiones de skills. Un cambio interno de contenido que no cambie la oferta no exige ese incremento. Actualiza el README con `node scripts/catalog.mjs` y comprueba `node --test && node scripts/catalog.mjs --check` antes de proponer el cambio. La publicación en GitHub y la comprobación de la Release son pasos operativos separados de esta validación local.

## Referencias externas y retiro

Una referencia externa identifica proyecto, URL/ref y responsable del lifecycle upstream; no recibe tag, licencia ni release local de este repositorio. Comprueba en origen los datos/permisos que afirmes como verificados. Si una oferta se retira, conserva en el índice su fuente y ref histórica con `retirement_reason`, sube la revisión y regenera README. Retirar o actualizar una fila sólo cambia la oferta editorial: no modifica instalaciones existentes ni sincroniza catálogos ajenos.

## Canal de adquisición

Consulta el índice y el `SKILL.md` de la ruta concreta antes de elegir. Adquiere únicamente esa ruta mediante las herramientas del host que acepten esa fuente y esa ref; verifica los requisitos de dicho host. Usa `skills.sh` sólo después de demostrar que acepta la ruta individual; no se presupone esa compatibilidad. La adquisición y cualquier desinstalación son decisiones expresas de la persona y del gestor de su host.
