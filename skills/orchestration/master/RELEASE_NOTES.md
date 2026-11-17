# master 1.3.0

`/master <task>` hands a whole task to the current agent. It decides whether to do the work alone or delegate it to Claude Code, Codex or Antigravity agents; it picks each agent's model and effort from the person's profile and the remaining quota; it keeps its own tab whole, opens the agents in another tab with an even layout, launches them unrestricted with a bounded brief, follows every one and reports each part with its evidence.

Version 1.3.0 sharpens how the model and the effort are chosen. The model comes first and the effort second; a part that keeps failing moves to a stronger model instead of a higher effort; a tie between vendors is broken with independent benchmark scores for coding and agentic work; and every model ID and its accepted effort levels are confirmed before launch. `references/launch.md` documents two public sources for that: models.dev, free and without a key, exercised on 2026-11-17, and the Artificial Analysis MCP, free after sign-in, read and not exercised. The master also keeps its own model notes: what each model did on each kind of work, offered at the end of a run and saved only after the person approves the exact draft, in the host's memory tool or in the profile. Every 1.2.0 rule stays.

Acquire the whole `skills/orchestration/master/` directory, including `references/`, from `Tacuchi/agent-skills` once the ref `skill/master/v1.3.0` exists. It works alone; the `coordinating-agents` skill adds the detailed supervision cycle when it is installed.

Owner: Tacuchi. License: MIT, in the `LICENSE` file of this directory. The ref and its remote publication are created after this change.
