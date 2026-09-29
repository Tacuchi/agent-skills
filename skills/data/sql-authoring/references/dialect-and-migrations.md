# Reviewable dialects and migrations

This guide helps you draft, not apply. Never run DML/DDL through **any channel**, including console, MCP, driver, migrator or tests against a database: hand the scripts to the applier. A static review does not prove a successful run. The [fictional parameters example](../assets/example-parameters.md) only shows a read query.

## Identify the dialect before writing

Ask for engine and version, known schema and the project's conventions. Do not carry syntax or guarantees over from one engine to another.

| Dialect | Value parameters | Transactions and precautions |
|---|---|---|
| PostgreSQL | `$1`, `$2` in prepared statements (or the driver's syntax); `ON CONFLICT` for known keys. | Many DDL operations support transactions, but `CREATE INDEX CONCURRENTLY` cannot run inside a transaction block; document locks and version. |
| MySQL | `?` in statements prepared by the driver; `ON DUPLICATE KEY UPDATE` if the conflict rule is intended. | Many DDL operations commit implicitly: do not promise to undo them with `ROLLBACK`; check storage engine and version. |
| SQLite | `?` or named parameters, depending on the client; `ON CONFLICT` only with a suitable key or index. | DDL migrations are usually transactional, but altering tables has limits: a complex change may need to create, copy, rename and verify. Plan foreign keys with care. |

The placeholder is for **values**, not for table or column names: pick identifiers from a closed, verified list, never by concatenating free input. If the destination only accepts SQL for review, keep the list of parameters and their types apart from the SQL text; do not substitute real data or secrets in examples.

## Design forward and rollback

1. State preconditions the applier can verify: schema, version, permissions, keys and a prior backup when needed. Order by real dependencies: create the main entity before a foreign key that references it; load data after preparing columns; remove dependencies before retiring objects. For the rollback, invert that graph, not just the list of files.
2. Keep the forward apart from the rollback, and tie each change to its inverse or to a restore procedure. A `DROP TABLE IF EXISTS` only reverts a `CREATE TABLE` if the object did not exist before the forward and holds no one else's data; a `DROP COLUMN` after migrating data can destroy information. Do not sell as reversible a `DELETE`, a lossy type change or a `DROP ... CASCADE` without a recoverable copy.
3. For data changes, bound the rows by a stable key and record which previous values will be kept. In the rollback, delete by a natural key unique to the inserted rows or restore from a declared copy; never a `DELETE` without a filter. If there is no copy and no safe inverse, mark the rollback as manual and require a backup before applying.
4. Attach an application order and checks for whoever runs it: bounded counts, expected constraints, inspection queries and stop criteria. Writing those checks does not authorize running them.

Fictional PostgreSQL example; **text only** for review, do not run these fragments:

```sql
-- Forward: requires library.books to exist and to have no status column.
ALTER TABLE library.books ADD COLUMN status text;
-- Applier: fill it in batches with keys and values defined before enforcing NOT NULL.
```

```sql
-- Rollback: only if the applier confirms there is no data to keep in status.
ALTER TABLE library.books DROP COLUMN status;
```

The example shows why the rollback is conditional; with new data that must be kept, document the restore instead of delivering that `DROP` as an automatic inverse.

## Idempotency, transactions and volume

- `IF NOT EXISTS` avoids repeating a creation, but it does not prove that a pre-existing object has the expected definition. Check the precondition and describe what to do if it differs. `ON CONFLICT` and its equivalents only help if the key and the effect on existing data are decided; do not hide business errors behind a global "ignore".
- Separate phases that do not share transactional semantics. State explicitly where the applier can start and commit the transaction, which exception prevents using one, and what stays persisted after a partial failure. Do not add a universal `BEGIN/COMMIT` for engines or operations that do not support it.
- Estimate the rows and indexes affected before planning a large update. Identify table or row locks, likely duration, timeout, concurrency, space for indexes and copies, and replication risk. Propose batches by stable key with a check and a resume point if a single operation is too costly; avoid `OFFSET` pagination over changing data.
- Prefer readable declarative transformations (for example, a CTE if the dialect allows it) to loops or throwaway functions; do not assume the same CTE supports identical writes in every dialect.

## PostgreSQL

Generic PostgreSQL authoring rules. They add to the sections above and never override them: every script is still delivered, never run, and transaction points are still stated per operation.

### Authoring discipline

- **Idempotent forms.** A script can be re-run without breaking (the `ON CONFLICT` caveat above still applies: decide the key and the effect on existing data first):

  | Operation | Idempotent form |
  |---|---|
  | Create table / sequence / index | `CREATE TABLE\|SEQUENCE\|INDEX IF NOT EXISTS` |
  | Drop an object | `DROP … IF EXISTS` |
  | Create or update a function | `CREATE OR REPLACE FUNCTION` |
  | Insert without duplicating | `INSERT … ON CONFLICT DO NOTHING` |
  | Upsert | `INSERT … ON CONFLICT DO UPDATE` |

- **Explicit schema.** Qualify every object with its schema, never a bare name that depends on `search_path`, and do not put application objects in `public`:

  ```sql
  SELECT * FROM billing.invoice;   -- right
  SELECT * FROM invoice;           -- wrong (no schema)
  SELECT * FROM public.invoice;    -- wrong
  ```

- **Always parametrize.** Never concatenate strings: `$1`/`$2` in parametrized queries, and `format()` with `%L` in PL/pgSQL.
- **CTEs over nested subqueries and over `DO`/`LOOP`.** Declarative SQL is auditable and revertible. Use a CTE when there are two or more chained joins or a reused subquery.

  ```sql
  -- Avoid:
  SELECT * FROM a WHERE id IN (SELECT id FROM b WHERE id IN (SELECT id FROM c));
  -- Prefer:
  WITH b_ids AS (SELECT b.id FROM b JOIN c ON b.id = c.id)
  SELECT * FROM a JOIN b_ids ON a.id = b_ids.id;
  ```

- **Comment only the why**, when it is not obvious. Never document what a line does when its names already say it.
- **Short header.** Every script opens with a header that names the script, the object it changes and its scope, between two lines of equal signs:

  ```sql
  -- ============================================================================
  -- Script:  01-invoice.sql
  -- Object:  Create the invoice table.
  -- Scope:   billing schema; no data migration.
  -- ============================================================================
  ```

  Author, date and engine are not header fields; when needed they go as a one-line note below. Keep one file per table, and edit that script in place instead of adding incremental files, unless the project's migrator treats applied scripts as immutable; then add a new file.
- **Irreversible operations.** `TRUNCATE`, `DROP`, a lossy `ALTER` or a `DELETE` without a backup are flagged `-- WARNING: IRREVERSIBLE` and need explicit confirmation from the person.

### Migration bundle — categories and order

A change's forward scripts go in five fixed categories, applied in ascending order. An empty category has no folder and does not renumber the others. Inside each category, number the files `01-<name>.sql`, `02-<name>.sql`, … without gaps.

| Order | Folder | Content |
|---|---|---|
| 01 | `01-ddl-tables/` | `CREATE/ALTER/DROP TABLE`, `CREATE INDEX`, `CREATE SEQUENCE` |
| 02 | `02-ddl-functions/` | `CREATE [OR REPLACE] FUNCTION/PROCEDURE` and their `DROP` |
| 03 | `03-data-migration/` | `UPDATE`, `INSERT … SELECT`, `DELETE` over existing data |
| 04 | `04-inserts/` | `INSERT … VALUES`, catalog seeds, initial configuration |
| 05 | `05-grants/` | `GRANT`/`REVOKE`, `ALTER … OWNER TO`, `ALTER DEFAULT PRIVILEGES` |

The order **01 → 02 → 03 → 04 → 05** is mandatory. Check cross-dependencies before closing the bundle. Grants go **last**, because a privilege cannot be granted on an object that does not exist yet, and they are re-run whenever a later change adds an object (see below).

### Coupled rollback

- Every `<category>/NN-<name>.sql` has a coupled `rollback/<category>/NN-<name>.rollback.sql`.
- A global **`rollback/00-global/00-ROLLBACK.sql`** reverses the final state in dependency-safe order (05 → 01), not as a literal replay, in a single transaction when every step supports one; otherwise state the non-transactional steps (such as `DROP INDEX CONCURRENTLY`) and their order.
- No `.sql` at the bundle root or directly under `rollback/`, and no `.rollback.sql` in category folders. The globs `*/*.sql` and `0*/*.sql` reach forward scripts only; `**/*.sql`, `find` and PowerShell `-Recurse` also reach rollbacks and must not be used to apply a bundle.
- **Before an `UPDATE` or a `DELETE`**, the script backs up the affected rows to a backup table named after the table and the change; the rollback restores from there.
- `DELETE` **always has a `WHERE`**.

### Access and ownership are part of the bundle

A change that creates a schema or a table has decided who can use it, by omission if not on purpose. Treat access as a **deliverable of the same bundle**, not as a follow-up ticket, and put it in `05-grants/` with its coupled rollback like anything else.

**The owner of a new object is the role that creates it.** This is the rule that makes grant scripts rot, and it is silent: a `05-grants/` script that ran last month does not cover the table a later `01-ddl-tables/` change added, so that one table stays closed while the schema around it is open. Two consequences:

- **Re-run the grants script after every change that adds an object.** Say so in its header; a bundle whose access step is described as one-time will drift.
- **Write it as a loop over the catalog, never as a fixed list of object names.** A loop over `pg_class` filtered by schema covers what exists today and what the next change adds, with no edit. A hardcoded list is a second inventory to keep in sync with the first.

**Two mechanisms, and the choice is a trade-off to state, not a default to assume.**

| | Transfer ownership (`ALTER … OWNER TO`) | Explicit `GRANT` |
|---|---|---|
| Uses | the privilege graph the database already has | a new ACL entry |
| Future objects | inherit correctly if created by the new owner | need `ALTER DEFAULT PRIVILEGES`, or a re-grant |
| Maintenance | none | a role list to remember when an account is created |
| Cost | the new owner can also `DROP` | ownership stays narrow |

Pick by which cost the project can carry, and **write the cost in the script header**. "Grants read access" is not what an ownership transfer does, and a reader who assumes it will be surprised the first time someone drops a table.

**Never widen a role that already has what it needs.** Measure before granting: a role that reads through a blanket read role (`pg_read_all_data` or an equivalent) needs nothing, and adding it to a `GRANT … ON ALL TABLES` hands it **write** access it never asked for. A wider grant "just in case" is the same defect as an empty list standing in for an error.

**Verify from the catalog, not from the statement succeeding.** A `GRANT` or an `ALTER … OWNER TO` that runs without error can still leave the wrong state: the wrong object, a role that resolves elsewhere. Close the script with a `DO` block that reads back `pg_get_userbyid`, `has_schema_privilege`, `relacl` or `pg_default_acl` and raises if the invariant does not hold. Two guards worth writing every time:

- **Before** an ownership transfer, check that the current owner **inherits from the destination role**. If it does not, the transfer strips the application's access to its own tables, and the outage arrives at the next write, not at apply time.
- **After** any access change, check that the roles that must *not* gain write did not. That assertion is what separates "opened the schema" from "opened the schema to everyone".

The global rollback usually needs no step for `05-grants/`: a `DROP SCHEMA` takes its ACLs and ownership with it. The exception is `pg_default_acl`: it references the schema by OID and must be revoked explicitly by the **same role that set it** (without `FOR ROLE` it only touches the executing role's rows).

### Derive the target set from the destination, do not copy it

A grants script is a loop over the catalog rather than a fixed list of object names. The same holds one axis over: **who** a change reaches, meaning which roles get a permission or which accounts get a flag, is also a set to derive, not a list to paste.

Environments drift. A list measured in a staging database arrives wrong in production, in both directions, because each environment grew its own catalog. A script that reproduces the **condition** in SQL instead of its result applies to every environment unedited:

```sql
-- recipients: whoever can collect payments AND meets the current condition
CREATE TEMP TABLE tmp_recipients ON COMMIT DROP AS
WITH can_collect AS (...), current_condition AS (...)
SELECT r.role_id, r.role_code FROM ... WHERE r.status = 1 AND (...);
```

Materialize it once and let both the write and the verification read it, so the two cannot drift apart in a later edit. Three consequences the header has to state:

- **The result is not known until it runs.** That is the point, and it is also why the verification block stops being optional: it is the only thing between "applied" and "applied as intended".
- **The empty set is a failure, not a no-op.** A derivation that returns zero rows inserts nothing, and the script still succeeds. Raise on it. An empty grant is the same defect as an empty list standing in for an error, except that it surfaces in production, when somebody cannot do their job.
- **Assert the names the request actually promised.** Set equality proves the script did what it computed; it does not prove the computation reached the people who asked. Name those few explicitly and fail if they are missing.

### Validating a script you are not allowed to run

A delivered script nobody ran is a script nobody checked. Close that gap with an offline parse. `pglast` wraps libpg_query, the real PostgreSQL parser and not a regex, so a green parse is the same grammar the server uses:

```python
from pglast import parser
parser.parse_sql(text)               # per script
parser.parse_plpgsql_json(block)     # per DO block, separately
```

**`parse_sql` does not look inside a `DO` block.** It validates the block as a string literal, so a broken PL/pgSQL body passes green and fails at apply time. Parse every `DO` with `parse_plpgsql_json` as well; in a bundle whose verification lives in `DO` blocks, that second pass is the one that matters.

Say what it proves and what it does not: this is **syntax**, not catalog. A column that does not exist, a constraint named wrong, a role that is absent: none of that is visible here. Those belong to a read-only inspection of the target, done by someone authorized, and to the script's own guard block.

### Anti-patterns to avoid

- Concatenating strings in dynamic SQL (injection).
- A table without a schema, or in `public`.
- `DELETE` or `UPDATE` without a backup or a `WHERE`.
- Throwaway functions or procedures created only to reuse logic inside one script: use a CTE or repeat it inline.
- A grants script written as a fixed list of table names, or described as one-time: both go stale the next time the bundle adds an object.
- Granting to a role that already reads through a blanket read role: it buys no read and hands out write.
- A derived set with no guard against returning empty: it grants nothing and reports success.
- Delivering a script whose `DO` blocks were never parsed: `parse_sql` alone reads them as text.

Deliver the pair of scripts with assumptions, dialect, parameters, dependency sequence, transaction points, risks and real reversibility. Whoever applies them decides and runs them under their own permissions; this skill does not run mutations, not even to test them.
