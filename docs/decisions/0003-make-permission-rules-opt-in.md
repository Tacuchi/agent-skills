---
status: accepted
date: 2026-11-18
---

# Make host-specific permission rules opt-in

Recorded on 2026-11-18 from the reason confirmed by the person on that date.
The permission helper separates read-only checks from applying the chosen project rules.

## Context and Problem Statement

Some skills repeatedly invoke commands that a host may ask the person to approve.
Host permission models differ, and permission declarations need an explicit review step.

## Considered Options

- Offer project permission rules after a read-only check and the person's choice.
- Keep prompting for every command; this remains an offered option.

## Decision Outcome

Chosen option: opt-in host-specific project rules.
The person confirmed the reason: make recurring commands reviewable and reduce prompts while the host keeps control.

### Consequences

- Checking permissions does not apply rules.
- The person chooses the scope and declared needs before an apply command writes them.
- High-risk needs recommend asking each time.
- Antigravity receives a notice because it has no project permission-rule write path.
