---
status: accepted
date: 2026-11-18
---

# Preserve retired offers in the catalog

Recorded on 2026-11-18 from the reason confirmed by the person on that date.
The catalog command validates retired entries and renders their historical refs and retirement reasons.

## Context and Problem Statement

An offer can stop being active while people still hold acquired copies.
The catalog needs to represent that lifecycle change and preserve the earlier offer's identity.

## Considered Options

- Keep retired entries with their history and reason.

No other evaluated option was recorded.

## Decision Outcome

Chosen option: keep retired entries.
The person confirmed the reason: preserve the history of what was offered without changing installed copies.

### Consequences

- A retired entry keeps its source and exact historical ref.
- Every retirement includes a reason.
- Retirement changes the editorial offer; it does not uninstall or update a host's copy.
