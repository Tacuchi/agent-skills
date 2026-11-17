---
name: master
description: "Turns the current agent into the master of a task when the person types /master: it sizes the work, decides whether to do it alone or delegate to coding agents (Claude Code, Codex, Antigravity), keeps its own tab whole and opens the agents in another tab of the orchestrator or agentic development environment (ADE) it runs in (Herdr, Orca, Paradev, T3 Code, AgentsRoom or another), picks each agent's model and effort from the remaining quota, lays the panes out evenly, launches them unrestricted within hard limits and follows them to a verified result. Use when the person types /master, appends /master to a command, or asks you to orchestrate and decide everything yourself. Not for a git master branch, and not for supervising agents someone else launched: the coordinating-agents skill covers that."
---

# Master

`/master <task>` hands you the whole task. You decide how it gets done, alone or with other agents, and you answer for the result.

- The task is the text after `/master`, or the command before it when the person appends `/master` (for example `/plan-exec 005 /master`).
- With no text, the task is the person's last request.
- Your first line of the run states the decision: `Solo: <why>` or `Delegating to <n> agents: <why>`.

## Step 0 — Permissions this skill uses

Run this once, when the skill loads and before its other steps. It keeps the session from stopping on a prompt for a command this skill is known to run. It is not a security check: the host and its hooks still decide.

1. Run `node <skill dir>/scripts/permissions.mjs check --root <session folder> --host <claude|codex|agy>`. `<skill dir>` is the folder of this `SKILL.md`; `<session folder>` is the folder where the session started; the host is the one you run in.
2. If `node` is missing or the command fails, say so, list the needs in `<skill dir>/permissions.json` and go on with the skill.
3. Read `hosts.<host>` in the output. Show its `notice` when there is one.
4. Ask each entry of its `questions` with the host's structured question tool, in the person's language: its `text`, then its options in the given order, the one marked `recommended` first. Low-risk and high-risk needs are separate questions; ask them separately and never recommend allowing a high-risk need.
5. Run the `command` of the option the person chose, exactly as given. An option without a command writes nothing. Write nothing the person did not choose.
6. Tell the person the `applies` line of the result: whether the change works now or after a restart. If the command fails, say so and go on.
7. After "Skip for now", do not run this step again in the session.

## Invocation is the authorization

Invoking `/master` is the person's written authorization, for this run only, to:

- launch coding agents with their permission prompts skipped, inside the task's folder;
- spend provider quota on them while each provider stays above the profile's floor;
- answer the agents' routine questions yourself: a step, a route or a file location inside the task.

Everything else stays with the person, one request at a time, with its context and every visible option:

- commit, push, tag, publish or release;
- destructive or irreversible changes: deleting data or branches, `git reset --hard`, force pushes, dropping tables, `rm -rf`;
- production data, credentials and personal data of customers;
- quota resets, paid credits, or a provider below the floor;
- remote machines, and panes or agents you did not create.

Ask each of these with your host's structured question tool when it has one, the option you recommend first; otherwise as a labeled list.

When an agent's flow offers to commit among other options, pick the option that does not commit and collect the commits for the person's approval at the end.

## 1. Read the profile

1. Read `${XDG_CONFIG_HOME:-~/.config}/agent-skills/master.md` if it exists. It holds the person's defaults: models per role, effort per workflow step, quota floor, placement and minimum pane size.
2. Without a profile, use the defaults in [references/profile.md](references/profile.md). Read that file also when the person asks to create or change the profile.

## 2. Detect the orchestrator and your own pane

The orchestrator is whatever runs your terminal and can open more of them: a multiplexer or an agentic development environment (ADE). This skill works in any of them.

1. If `HC_TERMINAL_ID` is set, you run inside Herdr: use `hc` for agents and `herdr-app` for the window. Your address is `$HC_TERMINAL_ID`.
2. If `ORCA_TERMINAL_HANDLE` is set, you run inside Orca. Your pane is that handle.
3. If `SUPERSET_TERMINAL_ID` is set, you run inside Paradev: its CLI is `superset`, with `paradev` as an alias. Your pane is `$SUPERSET_PANE_ID` and your tab `$SUPERSET_TAB_ID`.
4. If `AGENTSROOM_AGENT_ID` is set, you run inside AgentsRoom: it is driven through its MCP tools and gives each agent its own tab.
5. If your host offers T3 tools such as `orchestrator_capabilities` and `delegate_task`, you run inside T3 Code: each agent is a thread.
6. In any other orchestrator (a tmux wrapper, an IDE's agent panel), find the variables it injects and its CLI, read its installed help, and answer the primitives table of [references/layouts.md](references/layouts.md) before the first command.
7. If you find none, there is no orchestrator here: work alone or with your host's subagents. If the person named an installed orchestrator you are not running inside, ask once whether to use it.
8. Read the orchestrator's own guide before its first command: `hc --skill` and `herdr-app --skill` for Herdr; `orca skills get orca-cli` for Orca, plus `orca skills get orchestration` for supervised task graphs; `superset <command> --help` for Paradev; `capabilities_get` for AgentsRoom; `t3 thread --help` and the notes the app gives you for T3 Code. The installed guide wins over this skill.
9. For the supervision cycle (verifying banners, sends, waits, dialogs and recovery), use the `coordinating-agents` skill if available.

Your tab is yours alone: never split it, and keep your own pane out of every close and send.

## 3. Decide: alone or delegate

Do the task yourself by default. Delegate only for a reason you can name:

- two or more parts that can run in parallel without editing the same files;
- a long job (test suites, builds, migrations, wide refactors) that would block you;
- a model or vendor that fits a part better, such as a review by a different vendor than the implementer;
- your own provider is near its floor while another has room.

Stay solo when the task fits one context and one sequence, touches one area, or coordinating would cost more than it saves.

If the project has a structured workflow (spec, plan and plan-execution commands, or `docs/specs` and `docs/plans` trees), use it for specs, plans and plan execution: run its commands yourself or send them as a worker's first message. Use plain prompts for small direct tasks.

## 4. Check quota

1. If a usage tool is installed, read it before choosing: `openusage` prints JSON with the remaining percentage and reset time of each provider's session and weekly windows, without spending quota.
2. Skip a provider whose weekly remaining is below the profile's floor (default 15 %). When several fit, prefer the one with the most room.
3. Without a usage tool, say that quota is unknown and keep the number of agents low.

[references/launch.md](references/launch.md) maps each provider's quota windows to the agents that draw on them.

## 5. Choose model and effort

| Work | Model | Effort |
|---|---|---|
| Read, search, mechanical edits | fast tier | low to medium |
| Implement an agreed plan | strong general model | medium |
| Spec, design, ambiguous debugging | strongest model | high to xhigh |
| Independent review | a vendor different from the implementer's | high |

- The profile's concrete model IDs win over this table. For effort, use the profile's effort for the workflow step first, then the profile's default effort for that agent, then this table.
- Read your model notes before choosing: what past runs showed for each model, effort and kind of work. They live in the host's memory tool when one is installed, otherwise under the profile's `Model notes` key. The profile wins over them, and they win over benchmark data. When two notes disagree, the newer one wins; with no notes, go on without them.
- Pick the model first, then its effort: a stronger model at a lower effort usually beats a weaker model at a higher effort.
- When an agent loops, ignores its limits or fails the same check twice, relaunch that part one step up instead of raising the same model's effort:
  1. the next tier of the same CLI: fast tier, then general model, then strongest model;
  2. from the strongest model, another vendor's strongest model, only when model notes or benchmark data rank it higher for that kind of work;
  3. with no step left, do the part yourself or ask the person.
- The reviewer's vendor differs from whoever wrote the final change: if a relaunch moved the change to the reviewer's vendor, pick another reviewer.
- When the profile leaves two or more vendors open for a part, break the tie with model notes, then independent benchmark data, preferring coding and agentic scores over general ones. Without either, say so and pick the provider with the most quota room. Quota above the floor always comes first.
- Confirm each model ID and the effort levels it accepts before launching it, in the CLI's model list or in models.dev; never guess an ID. Launch with the ID the CLI lists.
- [references/launch.md](references/launch.md) has the model lists, the data sources and their commands.
- Pass model and effort as launch flags. Changing them inside a running agent can save them as the person's default.

## 6. Lay out the panes

Read [references/layouts.md](references/layouts.md) before the first split.

Two invariants:

- **Your own tab stays whole.** Never split it. Every agent goes in another tab that you create for the run and name after the task; a single agent still gets its own tab. The only exception is the person asking for another placement in the current request.
- **Every agents' tab ends even**: rows of equal height and, inside each row, panes of equal width. No pane may be larger than its neighbors with space left over.

A split halves the pane, so use only these layouts:

| Agents in the tab | Layout |
|---|---|
| 1 | the whole tab |
| 2 | two columns, or two rows if the tab is taller than wide |
| 3 | two rows: two panes on top, one full-width pane below |
| 4 | two rows of two |
| 5 to 8 | split across tabs with the patterns above: 3+2, 3+3, 4+3, 4+4 |

- Count agents only: your pane is in none of these tabs.
- Never cut three columns: halving leaves 50/25/25. Where the orchestrator can size panes, even out a row with that command instead of rebuilding it.
- After building the grid, measure every pane before launching any agent, while that tab is shown: a hidden tab can report stale sizes. If a row is uneven or a pane is below the minimum size, fix the layout first, using another tab if needed.
- Where agents are threads, or the app gives each one its own tab (T3 Code, AgentsRoom), there are no panes to cut: each agent gets its own thread or tab and the table does not apply.
- If the orchestrator cannot open a tab from its CLI or API, ask the person to open one and give you its handle, or use fewer agents through your host's subagents. Never split your own tab as a fallback.

## 7. Launch, brief and follow

1. Create the agents' tab, then build its whole grid with plain shells first.
2. In each shell, `cd` to the task folder, then type the agent's command with its unrestricted, model and effort flags from [references/launch.md](references/launch.md). A new pane may start in another folder.
3. Read each agent's banner and confirm model, effort and permission mode before sending its task.
4. Send each agent the brief below as its first task message. For a long brief, write it to a file outside the repository and send its path.
5. Wait on all agents in parallel. On each change, read the pane: answer routine questions, take reserved ones to the person.
6. Use what every pane reports to decide the next step the task asks for: chain the next part, reassign, or integrate and test yourself.
7. Verify each deliverable in the checkout (files, tests, build) before you call it done. An agent that died or returned nothing produced no result: an empty list of findings from a reviewer that did not run is not a clean review.

- Heavy builds and full test suites compete for one machine: give the agents turns instead of letting them all run at once.
- Brief a reviewer to refute what the change promises, with concrete inputs, and to check each finding by running it; "review the diff" finds less.

Brief, one per agent:

```text
Task: <one bounded goal>
Folder: <absolute path>. Write only: <files or areas>.
Done when: <command and its expected result>.
Limits: no commit, push, tag, publish or release; no git stash, reset --hard, force push, branch deletion or rm -rf; no production data or secrets; start no other agents.
Keep plan, task and ticket identifiers out of code, tests and user-facing text.
Ask me, the master, for any scope or route decision. Stop and report when done or stuck.
Report: <channel, e.g. hc send <master address> "<result>", or write <file> and send its path>.
```

## 8. Close and report

Close only the idle panes you created whose results you already collected, and an agents' tab you created once it holds nothing else; leave the rest for the person. Report in this shape:

```text
Master: <task>
Mode: solo | delegated (<n> agents)
- <pane> · <agent> <model> <effort> · <part> -> done | failed | pending · evidence: <test output, path>
Quota now: <provider> <weekly remaining %>
For you: <commits to approve, open questions, risks>
```

Example:

```text
Master: execute plan 005
Mode: delegated (2 agents)
- t2 · codex gpt-6.1-sol medium · phases 1-2 -> done · evidence: npm test 214/214, src/api/
- t3 · claude opus medium · phase 3 -> pending · evidence: waiting on a migration question
Quota now: codex 71 %, claude 93 %
For you: 2 commits proposed (phases 1 and 2); answer t3's migration question
```

### Offer model notes

When the run showed how a model handled a kind of work, offer to keep it for later runs:

1. Draft one line per finding: a part finished cleanly, an agent looped, ignored its limits, failed a check or needed a stronger model.
2. Search the existing notes first. Update the matching note instead of adding a near copy.
3. When several notes agree, also draft a recommendation for that kind of work, such as `ambiguous debugging: prefer <model> over <model>`.
4. Show the exact drafts and ask with your host's structured question tool: save, adjust or discard. Save only after the person picks save.
5. Save in the host's memory tool when one is installed; otherwise append to the profile under `Model notes`.

Note shape:

```text
<date> · <agent> <model> <effort> · <kind of work> -> <outcome> · evidence: <test output, path>
```

Example: `2026-11-17 · codex gpt-6.1-sol medium · rename a key across 40 files -> done first try · evidence: npm test 214/214`

Write what the model did, never task content, customer data or secrets.

## Invariants

- `/master` authorizes unrestricted launches, quota above the floor and routine answers, for this run only. Commits, publications, destructive changes, production data, resets, remote placement and other people's panes stay with the person.
- Solo by default; delegate for a reason you can name.
- Your own tab stays whole: the agents live in other tabs, in any orchestrator.
- Every agents' tab balanced: equal row heights, equal widths inside a row, measured before any agent starts.
- A done state or a report is not a result: check the evidence.
- Model notes are saved only after the person approves the exact draft.
