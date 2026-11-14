# master changelog

## [1.1.0] — 2026-11-14

- The master's own tab stays whole. Every agent goes in another tab, created for the run and named after the task, with up to four agents per tab; a single agent still gets its own tab. The only exception is the person asking for another placement in the current request, and a profile cannot override it. The layout table now counts agents only.
- It works in any orchestrator or agentic development environment (ADE). Beyond Herdr and Orca, `references/layouts.md` carries a primitives table (own pane, new tab, split, measure, even out, send and read, close) to answer from the installed help, with fallbacks that never split the master's tab. The `description` names T3 Code among the examples.
- `references/layouts.md` was measured again on `hc` 0.1.21 and `herdr-app` 0.1.15: `tab.new --folder` starts the terminal in that folder, a split pane starts in the current folder of the pane that was cut, a pane in a hidden tab reports a stale size, and `layout.resize --weight` evens out a row. Orca stays as measured on 1.4.245.
- The brief forbids `git stash` and asks agents to keep plan, task and ticket identifiers out of code, tests and user-facing text.
- Reserved requests go to the person through the host's structured question tool when it has one, the recommended option first.
- Following: a long brief travels as a file, heavy builds take turns, a reviewer is briefed to refute what the change promises, and an agent that died or returned nothing produced no result.
- `references/launch.md`: the launch flags were read again against Claude Code 2.1.325, Codex 0.167.0 and Antigravity CLI 1.5.4.
- `references/profile.md`: the `Placement` key becomes `Agents' tabs`.

## [1.0.0] — 2026-11-03

- First version. `/master <task>` turns the current agent into the master of the task: it reads the person's profile, detects Herdr or Orca and its own pane, decides whether to work alone or delegate, reads the remaining quota, picks each agent's model and effort, lays the panes out evenly, launches the agents unrestricted with a bounded brief, follows them and reports with evidence.
- Invoking `/master` authorizes, for that run only, unrestricted launches inside the task's folder, quota above the profile's floor and answers to routine questions. Commits, publications, destructive changes, production data, quota resets, remote placement and other people's panes stay with the person.
- Even layouts: rows of equal height and panes of equal width inside each row. Only 1, 2, 3 (two on top, one below), 4 (two rows of two) and multi-tab combinations, because both orchestrators halve a pane with no size option.
- `references/layouts.md`: cut orders and measurements for Herdr (`hc` 0.1.17 with the Herdr app) and Orca 1.4.245, including the split folder trap in Herdr and the inverted split directions in Orca.
- `references/launch.md`: unrestricted, model and effort flags for Claude Code 2.1.317, Codex 0.166.0 and Antigravity CLI 1.4.12, and how each provider's quota windows map to the agents.
- `references/profile.md`: defaults without a profile and the profile format.
