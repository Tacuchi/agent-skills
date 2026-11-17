# coordinating-agents 1.6.0

Coordinates coding agents under any multi-agent orchestrator through its current help, verification of the effective model, effort and permission mode, and following states, questions and restarts. An accepted send does not prove receipt or result; permissions and reserved effects need a written answer from the person and a check afterwards. Reference files for Herdr, Orca, Paradev, T3 Code, AgentsRoom, teamctl and Dorothy map each one onto the same cycle.

Version 1.6.0 adds step 0: when the skill loads, it checks whether this repo already allows the commands the skill runs, asks the person about what is missing, low and high risk apart, and writes only the chosen rules in the repo's Claude Code or Codex settings, never in the global ones. The needs are declared in `permissions.json` and checked by `scripts/permissions.mjs`, which needs Node; without it the skill says so and goes on. Every 1.5.0 rule stays.

Acquire the whole `skills/orchestration/coordinating-agents/` directory, including `references/`, from `Tacuchi/agent-skills` once the ref `skill/coordinating-agents/v1.6.0` exists; it works with no other harness and no other offer.

Owner: Tacuchi. License: MIT, in the `LICENSE` file of this directory. The ref and its remote publication are created after this change.
