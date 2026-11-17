# master 1.4.0

`/master <task>` hands a whole task to the current agent. It decides whether to do the work alone or delegate it to Claude Code, Codex or Antigravity agents; it picks each agent's model and effort from the person's profile and the remaining quota; it keeps its own tab whole, opens the agents in another tab with an even layout, launches them unrestricted with a bounded brief, follows every one and reports each part with its evidence.

Version 1.4.0 adds step 0: when the skill loads, it checks whether this repo already allows the commands the skill runs, asks the person about what is missing, low and high risk apart, and writes only the chosen rules in the repo's Claude Code or Codex settings, never in the global ones. The needs are declared in `permissions.json` and checked by `scripts/permissions.mjs`, which needs Node; without it the skill says so and goes on. Every 1.3.0 rule stays.

Acquire the whole `skills/orchestration/master/` directory, including `references/`, from `Tacuchi/agent-skills` once the ref `skill/master/v1.4.0` exists. It works alone; the `coordinating-agents` skill adds the detailed supervision cycle when it is installed.

Owner: Tacuchi. License: MIT, in the `LICENSE` file of this directory. The ref and its remote publication are created after this change.
