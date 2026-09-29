# Dialectos y migraciones revisables

Esta guía ayuda a redactar, no a aplicar. Nunca ejecutes DML/DDL por **ningún canal**, incluidos consola, MCP, driver, migrador o pruebas contra una base: entrega los scripts al aplicador. La revisión estática no acredita ejecución exitosa. El [ejemplo ficticio de parámetros](../assets/ejemplo-parametros.md) sólo muestra una consulta de lectura.

## Identificar el dialecto antes de escribir

Pide motor y versión, esquema conocido y convenciones del proyecto. No extrapoles sintaxis ni garantías de un motor a otro.

| Dialecto | Parámetros de valores | Transacciones y precauciones |
|---|---|---|
| PostgreSQL | `$1`, `$2` en sentencias preparadas (o sintaxis del driver); `ON CONFLICT` para claves conocidas. | Muchas operaciones DDL admiten transacción, pero `CREATE INDEX CONCURRENTLY` no puede ir dentro de un bloque transaccional; documenta bloqueos y versión. |
| MySQL | `?` en sentencias preparadas por el driver; `ON DUPLICATE KEY UPDATE` si la regla de conflicto es intencional. | Muchas operaciones DDL hacen commit implícito: no prometas deshacerlas con `ROLLBACK`; revisa motor de almacenamiento y versión. |
| SQLite | `?` o parámetros con nombre según el cliente; `ON CONFLICT` sólo con una clave/índice apropiado. | Las migraciones DDL suelen ser transaccionales, pero alterar tablas tiene límites: un cambio complejo puede necesitar crear, copiar, renombrar y verificar. Planifica claves foráneas con cuidado. |

El marcador sirve para **valores**, no para nombres de tabla o columna: selecciona identificadores de una lista cerrada y verificada, nunca por concatenación de entrada libre. Si el destino sólo admite SQL para revisión, separa la lista de parámetros y sus tipos del texto SQL; no sustituyas datos reales ni secretos en ejemplos.

## Diseñar avance y rollback

1. Declara precondiciones verificables por el aplicador: esquema, versión, permisos, claves y copia previa cuando sea necesaria. Ordena por dependencias reales: crear entidad principal antes de una clave foránea que la referencia; cargar datos después de preparar columnas; quitar dependencias antes de retirar objetos. Para rollback, invierte ese grafo, no sólo la lista de archivos.
2. Separa el forward del rollback y vincula cada cambio con su inversa o con un procedimiento de restauración. Un `DROP TABLE IF EXISTS` sólo revierte un `CREATE TABLE` si el objeto era inexistente antes del avance y no guarda datos ajenos; un `DROP COLUMN` tras migrar datos puede destruir información. No vendas como reversible un `DELETE`, un cambio de tipo con pérdida, o un `DROP ... CASCADE` sin copia recuperable.
3. Para cambios de datos, delimita filas por clave estable y registra qué valores anteriores se conservarán. En rollback, borrar por una clave natural exclusiva de las filas insertadas o restaurar desde una copia declarada; nunca un `DELETE` sin filtro. Si no hay copia ni inversa segura, marca el reverso como manual y exige respaldo antes de aplicar.
4. Adjunta un orden de aplicación y verificaciones para quien ejecute: conteos acotados, restricciones esperadas, consultas de inspección y criterios de parada. Redactar esas verificaciones no autoriza ejecutarlas.

Ejemplo ficticio PostgreSQL; **sólo texto** para revisión, no ejecutes estos fragmentos:

```sql
-- Forward: requiere que biblioteca.libros exista y no tenga una columna estado.
ALTER TABLE biblioteca.libros ADD COLUMN estado text;
-- Aplicador: poblar por lotes con claves y valores definidos antes de imponer NOT NULL.
```

```sql
-- Rollback: sólo si el aplicador confirma que no hay datos que preservar en estado.
ALTER TABLE biblioteca.libros DROP COLUMN estado;
```

El ejemplo muestra por qué el rollback está condicionado; con datos nuevos que deban conservarse, documenta la restauración en lugar de entregar ese `DROP` como inversa automática.

## Idempotencia, transacción y volumen

- `IF NOT EXISTS` evita repetir una creación, pero no demuestra que un objeto preexistente tenga la definición esperada. Comprueba la precondición y describe qué hacer si difiere. `ON CONFLICT` o equivalentes sólo sirven si la clave y el efecto sobre datos existentes están decididos; no escondas errores de negocio con un «ignorar» global.
- Separa fases que no comparten semántica transaccional. Declara explícitamente dónde puede iniciar y confirmar la transacción el aplicador, qué excepción impide usarla y qué queda persistido ante fallo parcial. No añadas un `BEGIN/COMMIT` universal para motores u operaciones que no lo soportan.
- Estima filas e índices afectados antes de planificar una actualización grande. Identifica bloqueos de tabla o fila, duración probable, timeout, concurrencia, espacio para índices y copias, y riesgo de replicación. Propón lotes por clave estable con verificación y punto de reanudación si una operación única es demasiado costosa; evita paginación por `OFFSET` sobre datos cambiantes.
- Prefiere transformaciones declarativas legibles (por ejemplo, una CTE si el dialecto lo permite) a bucles o funciones efímeras; no presupongas que la misma CTE admite escritura idéntica en todos los dialectos.

Entrega el par de scripts con supuestos, dialecto, parámetros, secuencia de dependencias, puntos de transacción, riesgos y reversibilidad real. Quien aplica decide y ejecuta bajo sus permisos; esta skill no ejecuta mutaciones, ni para comprobarlas.
