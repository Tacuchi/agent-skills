---
name: sql-authoring
description: Redacta scripts SQL revisables con dialecto, parámetros y rollback para aplicación por otra persona. Úsala al preparar consultas, migraciones o cambios de esquema sin ejecutarlos en ninguna base.
---

# Autoría de SQL

Prepara scripts para revisión y aplicación ajena; esta skill no ejecuta cambios de datos o esquema.

## Frontera de seguridad

- Pide motor y versión, esquema conocido, intención, restricciones, datos sensibles y destino autorizado. Lee sólo fuentes permitidas. Si falta un destino aprobado, presenta los scripts en la conversación sin escribir archivos.
- No ejecutes DML ni DDL por **ningún canal**: shell, MCP, driver, cliente, consola, migrador, test contra base real ni petición indirecta a otra herramienta. Esto incluye `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `CREATE`, `ALTER`, `DROP` y equivalentes. La aplicación queda a cargo de otra persona o proceso con autorización propia.
- No interpolar entradas en sentencias. Usa parámetros según el dialecto y separa valores de la fuente SQL. No coloques secretos ni volcados personales en ejemplos o artefactos; cualquier consulta remota requiere consentimiento y permisos de lectura explícitos.

## Redacción

1. Declara dialecto y supuestos, precondiciones y resultado esperado. Si no conoces el esquema, solicita su definición en vez de deducir columnas.
2. Prepara el script de avance y un reverso en orden compatible con dependencias. Si el cambio no puede revertirse sin perder datos, dilo y especifica restauración o copia previa como condición de aplicación, nunca prometas rollback ficticio.
3. Señala puntos de transacción, bloqueos, idempotencia y riesgos de volumen según el motor. Usa parámetros para valores externos y marca placeholders que otra persona deba resolver.
   Consulta la [guía de dialectos y migraciones](references/dialecto-y-migraciones.md) para elegir sintaxis, ordenar dependencias y preparar un reverso honesto sin ejecutar sentencias.
4. Entrega los dos scripts, un ejemplo de parámetros y una lista de verificaciones **para el aplicador**, sin correr DML/DDL ni siquiera como prueba. El [ejemplo ficticio](assets/ejemplo-parametros.md) ilustra los límites; no lo ejecutes.

## Salida

Un par forward/rollback y sus supuestos, con dialecto, orden y responsable de ejecución indicados. Revisa sintaxis estáticamente cuando sea posible; no confundas una revisión textual con una ejecución exitosa.
