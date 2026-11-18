---
status: accepted
date: 2026-11-18
---

# Release every skill independently

Recorded on 2026-11-18 from the reason confirmed by the person on that date.
The catalog command's per-skill tag and release-file checks establish the implemented behavior.

## Context and Problem Statement

The repository holds multiple skills under domain folders.
Each skill needs an acquisition ref and release history without coupling its updates to other skills.

## Considered Options

- Independent per-skill releases.

No other evaluated option was recorded.

## Decision Outcome

Chosen option: independent per-skill releases.
The person confirmed the reason: avoid coupling one skill's acquisition and updates to the others.

### Consequences

- Each own offer names a `skill/<slug>/vX.Y.Z` tag.
- Each tagged tree includes its skill, applicable license, changelog and release notes.
- The index revision advances separately from skill versions.
