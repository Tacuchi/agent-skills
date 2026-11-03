# master changelog

## [1.0.0] — 2026-11-03

- First version. `/master <task>` turns the current agent into the master of the task: it reads the person's profile, detects Herdr or Orca and its own pane, decides whether to work alone or delegate, reads the remaining quota, picks each agent's model and effort, lays the panes out evenly, launches the agents unrestricted with a bounded brief, follows them and reports with evidence.
- Invoking `/master` authorizes, for that run only, unrestricted launches inside the task's folder, quota above the profile's floor and answers to routine questions. Commits, publications, destructive changes, production data, quota resets, remote placement and other people's panes stay with the person.
- Even layouts: rows of equal height and panes of equal width inside each row. Only 1, 2, 3 (two on top, one below), 4 (two rows of two) and multi-tab combinations, because both orchestrators halve a pane with no size option.
- `references/layouts.md`: cut orders and measurements for Herdr (`hc` 0.1.17 with the Herdr app) and Orca 1.4.245, including the split folder trap in Herdr and the inverted split directions in Orca.
- `references/launch.md`: unrestricted, model and effort flags for Claude Code 2.1.317, Codex 0.166.0 and Antigravity CLI 1.4.12, and how each provider's quota windows map to the agents.
- `references/profile.md`: defaults without a profile and the profile format.
