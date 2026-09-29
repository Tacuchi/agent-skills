---
name: reviewing-code
description: "Use when reviewing a diff, doing pre-merge cleanup, or deciding whether a change is ready — triggers on 'review this', 'clean up', 'is this ready', 'before I commit', or the closure of a task — even when the user does not say 'review'. Enforces minimal, reviewable, atomic changes: one concern per diff (refactor separate from feature), split changes touching >5 files into atomic sub-steps, show a short diff and confirm before applying, verify the branch before each edit. Runs a closure quality gate over the diff: redundant comments, cognitive complexity, anti-patterns, dead code; record only non-obvious decisions; register new dependencies immediately. Propose-first and read-only by default. Optional complements, if available: the `coding-standards` skill (and the matching stack skill) for the authoring rules; the `security-practices` skill for secrets/SQL-injection/PII findings; the `git-conventions` skill for the commit itself."
---

# reviewing-code — Diff review and task closure

## Purpose

The discipline of **reviewing a change** before applying or integrating it: the diff must be atomic, reviewable and clean. It triggers on "review this", "is it ready?", "clean up", task closure — **not** while writing code (that is the `coding-standards` skill, if available). It contributes the review criteria; the consumer writes the code and the commit.

## Knowledge

### Atomic, single-intent diff

- **One concern per diff** — separate refactor from feature from fix. A mixed change gets split into distinct commits/diffs.
- **>5 touched files → atomic sub-steps** — decompose into small, reviewable steps, never a mega-diff.
- Massive refactors (rename, file moves, reformatting) go **in their own isolated diff**, never mixed with new logic.
- Extracting a repeated pattern to `shared/` (FE) or `common/`/`util/` (BE) is proposed as a **separate diff**, never embedded in the feature.

### Propose-then-execute

- Show a **short diff** and confirm with the requester before applying. By default the review is **read-only**.
- Never apply sweeping unrequested rewrites. If the scope grows, pause and ask the user.
- In plan-mode / read-only sandboxes: describe what would be done, do not edit.

### Closure quality gate

Before declaring a task closed, inspect the diff (skipped when no source is dirty):

- **Redundant comments** — a comment repeating the code gets deleted; comments only explain the "why".
- **Cognitive complexity** — deep nesting, long methods, convoluted conditionals → simplify (early returns, extract method). If available, see the `coding-standards` skill.
- **Dead code** — unused imports/variables/branches, leftover `console.log`/`System.out.println` debugging, declared-but-unused dependencies (e.g. ModelMapper/Dozer declared and never used).
- **Anti-patterns** — silenced errors (`catchError(() => of([]))`, try/catch returning a mock), `e.printStackTrace()`, hidden fallbacks, committed prod secrets/creds (the latter: flag with a comment, never replace; if available, see the `security-practices` skill).

### Branch verification before editing

- Verify the branch **before every Edit** — the user may have switched it by hand; never assume.
- Wrong branch + clean tree → propose checkout (still confirm).
- Wrong branch + dirty → **pause** for manual resolution (never auto stash/reset/checkout/clean).
- The branch model detail and the multi-repo cross gate: if available, see the `git-conventions` skill.

### Decision and dependency record

- Record **only non-obvious decisions** as `DEC-NNN` / `ADR-NNN` (`**Decision**:` + `**Why**:`, 3-6 lines). Prose format: if available, see the `technical-writing` skill.
- **New dependency → register it immediately** (DEPENDENCIES.md or the project's equivalent); never leave it implicit in the diff.

### Functional verification of the change

- A bugfix must carry a **regression test** that fails before and passes after the fix. Command and level per stack: if available, see the `software-testing` skill.
- Confirm the change does what the task asks, not merely that it compiles.

## Output

None of its own on disk. The skill contributes the review criteria; the consumer applies the diff (propose-first), and the commit follows the repository's conventions (the `git-conventions` skill, if available).
