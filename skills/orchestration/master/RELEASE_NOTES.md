# master 1.1.0

`/master <task>` hands a whole task to the current agent. It decides whether to do the work alone or delegate it to Claude Code, Codex or Antigravity agents; it picks each agent's model and effort from the person's profile and the remaining quota; it lays the panes out evenly, launches the agents unrestricted with a bounded brief, follows every pane and reports each part with its evidence.

Version 1.1.0 keeps the master's own tab whole: the agents always open in another tab, created for the run, and the even layouts are built there. It also works in any orchestrator or agentic development environment (ADE): Herdr and Orca keep their measured sections, and any other one, such as T3 Code, is mapped from its installed help through a primitives table, with fallbacks that never split the master's tab. The Herdr notes were measured again on `hc` 0.1.21 and `herdr-app` 0.1.15, where a row can be evened out with `layout.resize --weight` and a hidden tab reports stale sizes. The brief now forbids `git stash` and keeps plan identifiers out of code, and reserved requests reach the person as a structured question when the host has that tool. Every 1.0.0 authorization rule stays.

Acquire the whole `skills/orchestration/master/` directory, including `references/`, from `Tacuchi/agent-skills` once the ref `skill/master/v1.1.0` exists. It works alone; the `coordinating-agents` skill adds the detailed supervision cycle when it is installed.

Owner: Tacuchi. License: MIT, in the `LICENSE` file of this directory. The ref and its remote publication are created after this change.
