# sql-authoring changelog

## [2.0.0] — 2026-09-29

- The skill, its guide, its example and its history are now in English. The `description` the host uses to activate it changes, so this is a major version.
- The guide is renamed to `references/dialect-and-migrations.md` and the example to `assets/example-parameters.md`.
- Adds generic PostgreSQL rules to the guide: idempotent forms, explicit schema, `format()` with `%L`, CTEs, a short header, a bundle in five ordered categories with coupled and global rollbacks, backups before `UPDATE`/`DELETE`, flagged irreversible operations, grants and ownership as part of the bundle, derived target sets and offline parsing with `pglast`.
- It still runs no DML or DDL through any channel and imposes no universal `BEGIN`/`COMMIT`.

## [1.1.0] — 2026-09-28

- Adds a guide to dialects, parameters, forward/rollback, dependencies, idempotency, transactions, locks and volume risks, without running mutations.

## [1.0.0] — 2026-09-28

- First standalone SQL guide with parameters, dialect, forward/rollback and application by someone else.
