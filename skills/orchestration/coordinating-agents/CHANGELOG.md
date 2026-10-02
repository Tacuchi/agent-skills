# coordinating-agents changelog

## [1.2.0] — 2026-10-02

- The observed behavior wins over the installed help when they differ; the coordinator tells the person, with the version and platform.
- The coordinator identifies its own pane and leaves it out of every split, close, resize and send.
- **Locate** builds an agreed layout in two passes (plain shells, then agents), checks the first split, lists the layout before retrying a create, split or close that failed or timed out, and closes only idle shells it created.
- **Start** prefers typing the agent's command into a ready shell, and checks the count per agent type after a multi-agent start.
- **Verify** reads the indicator again after a mode switch inside the agent; **Follow** reads the field that says whether a wait was met and waits on several agents in parallel.
- Delegated routine questions: when the person delegates them in writing, the coordinator answers the ones that touch no reserved effect and that the agreement backs, checks receipt and lists them in its next summary; a doubt still goes to the person. Faced with a commit offer, it may pick the option that does not commit and collect the commits for the person. Reserved effects keep needing the person's answer to each request.
- **Delegate** asks agents to keep raising their flow decisions as questions, because an agent told not to ask answers its own decisions unreviewed.
- Questions: an option marked as recommended is the agent's opinion; a dialog that needs keys a text-only orchestrator cannot send goes to the person; closing a pane to relaunch its agent is agreed first.
- New `references/agent-types.md`: how Codex and Claude Code ask questions, and the effort change of Codex Plan mode.
- `references/orca.md` adds the Windows 1.4.217–1.4.218 findings: inverted split directions, the split `--command` timeout, `result.split.handle`, sizes without a resize command, equalizing with `computer drag`, text-only sends, `close --tab`, own-pane variables and PowerShell pitfalls.

## [1.1.0] — 2026-10-01

- **Locate** uses a project registry when the environment exposes one (a CLI that lists projects with their folders) to pick the destination, and opens the agent in that project's folder.
- `references/herdr.md` describes one workspace per project: match by label, confirm with `pane list` because Herdr 0.9.0 lists no `cwd` per workspace, create with `--cwd` only when none matches, then `pane split --cwd` and `agent start`. Creating a workspace still needs the agreed destination and layout, and nothing is renamed or closed.

## [1.0.0] — 2026-09-30

- First version, succeeding `herdr-coordination` 2.0.0. The cycle, the human-authorization boundary and the state table are now orchestrator-agnostic; the `description` names the supported orchestrators instead of Herdr only.
- One reference file per orchestrator, read only for the one in use: Herdr (all the rules of `herdr-coordination` 2.0.0), Orca, teamctl and Dorothy. Any other orchestrator is mapped from its own help through a primitives table.
- Launching an agent with permissions skipped, a higher autonomy level or a remote placement counts as wider access and goes back to the person.
