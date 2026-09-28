# Contribuir

Este repositorio personal publica skills independientes bajo `skills/<dominio>/<slug>/SKILL.md` y puede incluir referencias curadas a proyectos externos. No se incorpora ninguna oferta por existir en otro catálogo. Antes de proponer una skill, describe su contrato, su dominio, su fuente y su forma de uso; el contenido y su aceptación pertenecen a su propia iniciativa.

## Una oferta propia

Cada skill propia necesita un responsable identificable, `SKILL.md` como archivo regular (no symlink), con frontmatter `name` y `description` también en el tag, licencia aplicable (archivo `LICENSE` en su directorio o herencia **explícita** de la MIT raíz en el índice), `CHANGELOG.md` por skill y notas de versión por skill (`RELEASE_NOTES.md`). Declara datos y permisos conocidos con la procedencia de la verificación, o indícalos como «no verificados». Registra su ruta y ref adquirible exacta en `catalog/index.json`. El tag `skill/<slug>/vX.Y.Z` debe señalar un commit que contenga la skill, su licencia y su historial; la GitHub Release correspondiente usa ese tag y las notas de esa skill. No hay releases colectivos implícitos.

Un cambio de oferta (alta, actualización de ref o estado, retiro, metadatos visibles) incrementa `revision` del índice, independientemente de las versiones de skills. Un cambio interno de contenido que no cambie la oferta no exige ese incremento. Actualiza el README con `node scripts/catalog.mjs` y comprueba `node --test && node scripts/catalog.mjs --check` antes de proponer el cambio. La publicación en GitHub y la comprobación de la Release son pasos operativos separados de esta validación local.

## Referencias externas y retiro

Una referencia externa identifica proyecto, URL/ref y responsable del lifecycle upstream; no recibe tag, licencia ni release local de este repositorio. Antes de marcar `data_permissions.status: verified`, una persona debe revisar en origen **lo afirmado en el resumen** (datos y permisos), no sólo la existencia de un enlace: `evidence_url` debe apuntar a un permalink con commit SHA o al tag de la oferta. El comprobador valida el anclaje de la URL, no el contenido ni la revisión humana. Si una oferta se retira, conserva en el índice su fuente y ref histórica con `retirement_reason`, sube la revisión y regenera README. Retirar o actualizar una fila sólo cambia la oferta editorial: no modifica instalaciones existentes ni sincroniza catálogos ajenos.

## Campos del índice

`schema_version` identifica el formato y `revision` comienza en 1. `entries` empieza vacío. Cada entrada usa `id`, `name`, `domain`, `type` (`own` o `external`), `source_url`, `path` hasta un `SKILL.md`, `ref` fija, `lifecycle_owner`, `status` (`active` o `retired`) y `data_permissions` con `status` (`unverified` o `verified`), `summary` y, sólo cuando se afirma verificación, `evidence_url` HTTPS anclada a un commit SHA o al tag de la oferta. Sin verificación, `summary` es literalmente `no verificados`. Las retiradas agregan `retirement_reason` y retienen fuente y ref históricas.

Una propia agrega `license: "root"` para heredar expresamente la MIT raíz (o la ruta `skills/<dominio>/<slug>/LICENSE`), `changelog` a su `CHANGELOG.md` y `release_notes` a su `RELEASE_NOTES.md`. Su `ref` debe ser el tag `skill/<slug>/vX.Y.Z`. Una externa usa una ref upstream fija de versión `vX.Y.Z` o commit hexadecimal y una ruta de skill del upstream; no se le agregan los campos de release propios. El comprobador local inspecciona el árbol Git etiquetado de las propias vigentes y retiradas, pero no consulta GitHub Releases ni valida la adquisición real por un host: ambos requieren el pase operativo de la iniciativa de contenido.

## Canal de adquisición

Consulta el índice y el `SKILL.md` de la ruta concreta antes de elegir. Adquiere únicamente esa ruta mediante las herramientas del host que acepten esa fuente y esa ref; verifica los requisitos de dicho host. Usa `skills.sh` sólo después de demostrar que acepta la ruta individual; no se presupone esa compatibilidad. La adquisición y cualquier desinstalación son decisiones expresas de la persona y del gestor de su host.
