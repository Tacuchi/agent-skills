# coordinating-agents changelog

## [1.6.1] — 2026-11-18

- Security: the low-risk permission rule now covers only `permissions.mjs check`. It covered the whole script, so an agent could also run `apply` and write allow rules the person never chose. `validate` refuses a manifest that allows the script any other way. Found by the Snyk audit on skills.sh. A broader rule saved earlier stays in the host settings until it is removed by hand.

## [1.6.0] — 2026-11-17

- Step 0, "Permissions this skill uses": when the skill loads, `scripts/permissions.mjs check` compares the needs declared in `permissions.json` with the project and global configuration of Claude Code, Codex and Antigravity. Missing low-risk needs go in one structured question (only for me in this repo, recommended; shared in this repo; skip for now; don't ask again in this repo) and high-risk needs in another, where "Ask every time" is recommended. `apply` writes only what the person chose: in Claude Code to `.claude/settings.local.json` at the git root or `.claude/settings.json` of the session folder; in Codex to `.codex/rules/agent-skills.rules`, only when Codex trusts the project; nothing for Antigravity, which has no per-project permissions. It never writes the global configuration. "Don't ask again" is kept in `.agent-skills/permissions-state.json`, in a folder that ignores itself in git. If the check cannot run, the skill says so and goes on.
- The hosts were probed on 2026-11-17: Claude Code applies a local rule without a restart, and Codex loads project rules only in trusted projects; `codex execpolicy check` accepts the generated rules.
- Declared needs, low risk: the permission check, reading Herdr terminals (`hc get`, `hc read`, `hc wait`, `hc ls`, `hc --skill`), the Herdr window (`herdr-app`) and `openusage`. High risk: `hc send`, `hc keys` and `hc run`, because typing into a terminal is how agents are launched with their permission prompts skipped.

## [1.5.0] — 2026-11-14

- Three new adapters: `references/paradev.md` (the `superset` CLI: snapshot, terminals, panes), `references/t3code.md` (the `t3` CLI and the T3 tools: each agent is a thread) and `references/agentsroom.md` (MCP tools: each spawned agent gets its own tab and the person confirms every spawn). They were written from the help of `superset` 2.0.8 and `t3` 0.1.9 and from the tool catalog of AgentsRoom 1.270.0; nothing was exercised, and each file says so.
- The `description` names Paradev and AgentsRoom, and **Locate** says that where agents are threads or get a tab each from the app there is nothing to split.
- `references/orca.md` was measured again on macOS 1.4.258: the guide now agrees with the split directions, a tab opens without the focus, a pane in a tab that is not shown reports 24 × 80 or a stale size, and the help adds `orca agent launch`.

## [1.4.0] — 2026-11-14

- The coordinator keeps its own tab whole: panes for agents are created in another tab, in any orchestrator, and when the orchestrator cannot open a tab the person opens it. The only exception is the person asking for another placement in the current request. The primitives table gains **Place**.
- The `description` names agentic development environments (ADE) and T3 Code among the orchestrators mapped from their own help.
- Reserved requests go to the person through the host's structured question tool when it has one, so that picking one option is the whole answer.
- Agents that share a clone are told not to use `git stash`; a wait for an output signal must not match the echo of the coordinator's own prompt; an agent that died or returned nothing produced no result.
- `references/herdr.md` was measured again on `hc` 0.1.21 and `herdr-app` 0.1.15: the agents' tab with `tab.new`, the folder a split pane starts in, stale sizes in a hidden tab and `layout.resize --weight`.
- `references/orca.md`: the coordinator's own handle is never split; split timeouts and `--retry-split`; stuck workers seen on Windows 11.
- `references/agent-types.md`: the launch flags were read again against Claude Code 2.1.325, Codex 0.167.0 and Antigravity CLI 1.5.4.

## [1.3.0] — 2026-11-03

- `references/herdr.md` covers herdr-core first: `hc` 0.1.17 for agents and `herdr-app` 0.1.12 for the window, detected by `HC_TERMINAL_ID`. It maps the primitives and the five states (`error` reads as `unknown`), keeps one space per project, and names the traps measured on macOS: splits halve with no resize, a split pane starts in the space's folder, `hc run` children end with their parent and land without a chosen place, an unsent first message, sends refused to a blocked program, waits that time out as check-ins, and tagged child reports. The older `herdr` multiplexer keeps every 1.2.0 rule in its own section.
- **Locate** keeps every tab even: rows of equal height and panes of equal width inside each row. When splits only halve, it builds two side by side, three as two on top and one full-width below, four as two rows of two, more in another tab, and measures every pane before starting agents.
- **Start** reads the remaining quota with a usage tool when one is installed; running a provider dry, a reset or paid credits is a spend of quota/resources.
- The human boundary accepts a command whose published contract makes its invocation the written answer to named effects for one run, such as the `master` skill's unrestricted launches; every other reserved effect still goes back to the person.
- `references/orca.md` adds macOS 1.4.245: split directions are inverted there too and the layout tree reports the requested direction, `terminal create` needs a registered project, `stty size` measures panes, an even cut order replaces resizing, and `computer` commands need the Accessibility permission.
- `references/agent-types.md` adds Claude Code 2.1.317, Codex 0.166.0 and Antigravity CLI 1.4.12: model, effort and unrestricted flags, and Antigravity's modes.
- The `description` points to the `master` skill for taking over a whole task.

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
