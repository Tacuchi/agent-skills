# angular-standards changelog

## [1.1.0] — 2026-11-14

- Error handling: the `catchError` that logs out belongs to the refresh call, not to the replayed request; logout is idempotent; a rejection is detected by its status; polling stops on 401/403.

## [1.0.0] — 2026-09-29

- First public version, copied from the author's own convention angular-standards and generalized: the organization's repositories, its HTTP wrapper and envelope names, its platform references and its Spanish-first naming and toast rules were removed.
