---
name: master
description: "Turns the current agent into the master of a task when the person types /master: it sizes the work, decides whether to do it alone or delegate to coding agents (Claude Code, Codex, Antigravity), keeps its own tab whole and opens the agents in another tab of the orchestrator or agentic development environment (ADE) it runs in (Herdr, Orca, T3 Code or another), picks each agent's model and effort from the remaining quota, lays the panes out evenly, launches them unrestricted within hard limits and follows them to a verified result. Use when the person types /master, appends /master to a command, or asks you to orchestrate and decide everything yourself. Not for a git master branch, and not for supervising agents someone else launched: the coordinating-agents skill covers that."
---

# Master

`/master <task>` hands you the whole task. You decide how it gets done, alone or with other agents, and you answer for the result.

- The task is the text after `/master`, or the command before it when the person appends `/master` (for example `/plan-exec 005 /master`).
- With no text, the task is the person's last request.
- Your first line of the run states the decision: `Solo: <why>` or `Delegating to <n> agents: <why>`.

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
3. In any other orchestrator (T3 Code, a tmux wrapper, an IDE's agent panel), find the variables it injects and its CLI, read its installed help, and answer the primitives table of [references/layouts.md](references/layouts.md) before the first command.
4. If you find none, there is no orchestrator here: work alone or with your host's subagents. If the person named an installed orchestrator you are not running inside, ask once whether to use it.
5. Read the orchestrator's own guide before its first command: `hc --skill` and `herdr-app --skill` for Herdr; `orca skills get orca-cli` for Orca, plus `orca skills get orchestration` for supervised task graphs. The installed guide wins over this skill.
6. For the supervision cycle (verifying banners, sends, waits, dialogs and recovery), use the `coordinating-agents` skill if available.

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

- The profile's concrete model IDs and workflow efforts win over this table.
- List the models each CLI offers instead of guessing IDs: [references/launch.md](references/launch.md).
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

## Invariants

- `/master` authorizes unrestricted launches, quota above the floor and routine answers, for this run only. Commits, publications, destructive changes, production data, resets, remote placement and other people's panes stay with the person.
- Solo by default; delegate for a reason you can name.
- Your own tab stays whole: the agents live in other tabs, in any orchestrator.
- Every agents' tab balanced: equal row heights, equal widths inside a row, measured before any agent starts.
- A done state or a report is not a result: check the evidence.
