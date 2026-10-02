# coordinating-agents changelog

## [1.1.0] — 2026-10-01

- **Locate** uses a project registry when the environment exposes one (a CLI that lists projects with their folders) to pick the destination, and opens the agent in that project's folder.
- `references/herdr.md` describes one workspace per project: match by label, confirm with `pane list` because Herdr 0.9.0 lists no `cwd` per workspace, create with `--cwd` only when none matches, then `pane split --cwd` and `agent start`. Creating a workspace still needs the agreed destination and layout, and nothing is renamed or closed.

## [1.0.0] — 2026-09-30

- First version, succeeding `herdr-coordination` 2.0.0. The cycle, the human-authorization boundary and the state table are now orchestrator-agnostic; the `description` names the supported orchestrators instead of Herdr only.
- One reference file per orchestrator, read only for the one in use: Herdr (all the rules of `herdr-coordination` 2.0.0), Orca, teamctl and Dorothy. Any other orchestrator is mapped from its own help through a primitives table.
- Launching an agent with permissions skipped, a higher autonomy level or a remote placement counts as wider access and goes back to the person.
