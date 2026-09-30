# coordinating-agents changelog

## [1.0.0] — 2026-09-30

- First version, succeeding `herdr-coordination` 2.0.0. The cycle, the human-authorization boundary and the state table are now orchestrator-agnostic; the `description` names the supported orchestrators instead of Herdr only.
- One reference file per orchestrator, read only for the one in use: Herdr (all the rules of `herdr-coordination` 2.0.0), Orca, teamctl and Dorothy. Any other orchestrator is mapped from its own help through a primitives table.
- Launching an agent with permissions skipped, a higher autonomy level or a remote placement counts as wider access and goes back to the person.
