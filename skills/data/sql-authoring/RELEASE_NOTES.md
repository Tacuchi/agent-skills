# sql-authoring 2.1.0

Drafts reviewable SQL scripts with dialect, parameters and rollback for another person to apply. It runs no DML or DDL through any channel, and it states transaction points per operation instead of imposing a universal `BEGIN`/`COMMIT`.

Version 2.1.0 adds the checklist for a bundle applied by hand from a console: one code block per step with the condition to advance in prose, `ON_ERROR_STOP` on every invocation, verification in a new connection, the lock an `ALTER TABLE` holds until its `COMMIT`, and delivery in two bundles when old and new code need different objects. The generic PostgreSQL rules of 2.0.0 stay as they were.

Acquire the whole `sql-authoring` directory (including `references/` and `assets/`) from `Tacuchi/agent-skills` once the ref `skill/sql-authoring/v2.1.0` exists.

Owner: Tacuchi. License: MIT, in the `LICENSE` file of this directory. The ref and its remote publication are created after this change.
