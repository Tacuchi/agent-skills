# master 1.2.0

`/master <task>` hands a whole task to the current agent. It decides whether to do the work alone or delegate it to Claude Code, Codex or Antigravity agents; it picks each agent's model and effort from the person's profile and the remaining quota; it keeps its own tab whole, opens the agents in another tab with an even layout, launches them unrestricted with a bounded brief, follows every one and reports each part with its evidence.

Version 1.2.0 covers three more orchestrators. Paradev is detected by its environment and driven with its `superset` CLI, which can open a tab, cut panes and give them equal space. T3 Code runs each agent as a thread and AgentsRoom gives each agent its own tab, so in both the master's view is never split and there is no layout to build. These three were read in their help or tool catalog and not exercised. Orca was measured again on macOS 1.4.258, where a tab that is not shown reports a default size. Every 1.1.0 rule stays.

Acquire the whole `skills/orchestration/master/` directory, including `references/`, from `Tacuchi/agent-skills` once the ref `skill/master/v1.2.0` exists. It works alone; the `coordinating-agents` skill adds the detailed supervision cycle when it is installed.

Owner: Tacuchi. License: MIT, in the `LICENSE` file of this directory. The ref and its remote publication are created after this change.
