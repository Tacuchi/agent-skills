---
name: sql-authoring
description: Drafts reviewable SQL scripts with dialect, parameters and rollback for another person to apply, including PostgreSQL migration bundles with grants and ownership. Use it when preparing queries, migrations or schema changes without running them against any database.
---

# Authoring SQL

Prepare scripts for review and for someone else to apply; this skill does not run data or schema changes.

## Safety boundary

- Ask for engine and version, known schema, intent, constraints, sensitive data and authorized destination. Read only permitted sources. Without an approved destination, present the scripts in the conversation without writing files.
- Do not run DML or DDL through **any channel**: shell, MCP, driver, client, console, migrator, a test against a real database, or an indirect request to another tool. This includes `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `CREATE`, `ALTER`, `DROP` and their equivalents. Applying them is up to another person or process with its own authorization.
- Do not interpolate inputs into statements. Use parameters as the dialect allows and keep values apart from the SQL source. Do not put secrets or personal dumps in examples or artifacts; any remote query needs consent and explicit read permissions.

## Drafting

1. State the dialect and assumptions, preconditions and expected result. If you do not know the schema, ask for its definition instead of guessing columns.
2. Prepare the forward script and a rollback in an order compatible with dependencies. If the change cannot be reversed without losing data, say so and require a restore or a prior backup as a condition for applying it; never promise a fictional rollback.
3. Point out transaction points, locks, idempotency and volume risks for the engine. Use parameters for external values and mark placeholders another person has to resolve.
   Read the [dialects and migrations guide](references/dialect-and-migrations.md) to choose syntax, order dependencies and prepare an honest rollback without running statements. For PostgreSQL, its PostgreSQL section adds the bundle layout, the coupled rollbacks, grants and ownership, derived target sets and offline parsing.
4. Deliver both scripts, an example of parameters and a checklist **for the applier**, without running DML/DDL even as a test. The [fictional example](assets/example-parameters.md) shows the limits; do not run it.

## Output

A forward/rollback pair and its assumptions, with dialect, order and who runs it stated. Check syntax statically when possible; do not mistake a textual review for a successful run.
