# master changelog

## [1.3.0] — 2026-11-17

- Choosing model and effort gains explicit rules: effort comes from the profile's workflow step, then the profile's default for the agent, then the table; the model is picked before its effort, because a stronger model at a lower effort usually beats a weaker one at a higher effort; an agent that loops, ignores its limits or fails the same check twice moves one step up a ladder (next tier of the same CLI, then another vendor's strongest model only when notes or benchmarks rank it higher, then the master or the person) instead of a higher effort; the reviewer's vendor follows whoever wrote the final change; a tie between vendors is broken with model notes, then independent benchmark data with coding and agentic scores first, and without either by the provider with the most quota room; and every model ID and its accepted effort levels are confirmed before launch, never guessed.
- `references/launch.md` explains that models.dev lists base IDs: a CLI variant ending in its effort, such as `gemini-4-argon-high`, is queried without the suffix and launched with the full ID and no separate effort flag.
- These rules were tested on 2026-11-17 by giving the same scenario to Claude Code on claude-haiku-5-5 and to Codex on gpt-6.1-sol in Herdr; both found the undefined "stronger model", the missing tie-break without benchmarks and the suffixed IDs, which this version closes.
- `references/launch.md` adds a Model data section with two public sources: models.dev (`https://models.dev/api.json`, no key), queried with `jq` for the model ID, its accepted effort levels in `reasoning_options` and its limits, exercised on 2026-11-17; and the Artificial Analysis MCP (`https://mcp.artificialanalysis.ai/mcp`), free after sign-in with 200 tool calls a day for internal use with attribution, read on its public page and not exercised. A comparison is kept as a dated model note only when the person agrees.
- Model notes: the master reads what past runs showed per model, effort and kind of work before choosing, and at the end of a run offers one line per finding (and a recommendation when several notes agree) through the host's structured question tool: save, adjust or discard. It saves only after the person picks save, in the host's memory tool when one is installed, otherwise under the profile's new `Model notes` key. The profile wins over the notes, and the notes win over benchmark data.

## [1.2.0] — 2026-11-14

- Detection names three more orchestrators: Paradev by `SUPERSET_TERMINAL_ID` (its CLI is `superset`), AgentsRoom by `AGENTSROOM_AGENT_ID` (driven through its MCP tools) and T3 Code by its T3 tools (each agent is a thread). The `description` names them.
- `references/layouts.md` adds a section for each one. Paradev has tabs and panes with `panes new-tab`, `panes split`, `panes equalize` and `panes resize`. T3 Code and AgentsRoom have no panes to cut: each agent gets its own thread or tab, so the layout table does not apply. The three were read in their help or tool catalog and not exercised.
- Orca was measured again on macOS 1.4.258: `vertical` still puts the new pane side by side and the guide now says the same; a tab opens without the focus unless `--focus` is passed; a pane in a tab that is not shown reports 24 × 80, so the tab is shown with `terminal switch` before measuring. Four panes of 59 × 30 in two rows of two; a third cut in a row gives 59 / 28 / 28.

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
