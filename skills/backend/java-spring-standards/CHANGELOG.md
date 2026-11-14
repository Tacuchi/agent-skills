# java-spring-standards changelog

## [1.1.0] — 2026-11-14

- Transactions: annotations called from the same class are inert, a caught constraint violation leaves the transaction rollback-only, immutable `@OneToMany` collections fail on the second save, open-session-in-view hides another request's commit, and `LAZY` relations fail in `@Async` threads.
- New section "Filters that guard a path": undecoded request URIs, chunked bodies and burst tests for rate limits.
- Logging: check the runtime in `dependency:tree`; a generated `toString` leaks fields and an exception message can overflow a column.

## [1.0.0] — 2026-09-29

- First public version, copied from the author's own convention java-spring-standards and generalized: the organization's envelope, persistence and job-control references, its repository evidence and its Spanish-language rule for messages and logs were removed.
