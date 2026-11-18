# master 1.4.1

`/master <task>` hands a whole task to the current agent. It decides whether to do the work alone or delegate it to Claude Code, Codex or Antigravity agents; it picks each agent's model and effort from the person's profile and the remaining quota; it keeps its own tab whole, opens the agents in another tab with an even layout, launches them unrestricted with a bounded brief, follows every one and reports each part with its evidence.

Version 1.4.1 narrows the low-risk permission rule to `permissions.mjs check`: the earlier rule also let an agent run `apply` and write allow rules the person never chose. Remove the broader rule from the host settings if an earlier version saved it.

Acquire the whole `skills/orchestration/master/` directory, including `references/`, from `Tacuchi/agent-skills` once the ref `skill/master/v1.4.1` exists. It works alone; the `coordinating-agents` skill adds the detailed supervision cycle when it is installed.

Owner: Tacuchi. License: MIT, in the `LICENSE` file of this directory. The ref and its remote publication are created after this change.
