# sql-authoring 2.0.0

Version 2.0.0 publishes the skill in English. Its `description` changes, and so does the text a host matches to activate it; that is why it is a major version. The guide is now `references/dialect-and-migrations.md` and the example `assets/example-parameters.md`.

It also adds generic PostgreSQL rules to the guide: idempotent forms, explicit schema, CTEs, a short header, a bundle in five ordered categories with coupled and global rollbacks, backups before `UPDATE`/`DELETE`, grants and ownership as part of the bundle, derived target sets and offline parsing with `pglast`. The existing limits hold: it runs no DML or DDL through any channel, and it states transaction points per operation instead of imposing a universal `BEGIN`/`COMMIT`.

Acquire the whole `sql-authoring` directory (including `references/` and `assets/`) from `Tacuchi/agent-skills` once the ref `skill/sql-authoring/v2.0.0` exists.

Owner: Tacuchi. License: MIT, in the `LICENSE` file of this directory. The ref and its remote publication are created after this change.
