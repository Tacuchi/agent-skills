# creating-tools 1.1.0

Organizes auxiliary developer tools under `docs/tools/<tool>/` with a README contract, immutable timestamped runs and an `output/latest` pointer. It ships two dependency-free Node scripts, `scaffold-tool.mjs` and `record-run.mjs`, and a README template. It needs no other skill.

Version 1.1.0 adds step 0: when the skill loads, it checks whether this repo already allows the commands the skill runs, asks the person about what is missing, low and high risk apart, and writes only the chosen rules in the repo's Claude Code or Codex settings, never in the global ones. The needs are declared in `permissions.json` and checked by `scripts/permissions.mjs`, which needs Node; without it the skill says so and goes on. Every 1.0.0 rule stays.

Acquire the whole `creating-tools` directory from `Tacuchi/agent-skills` once the ref `skill/creating-tools/v1.1.0` exists.

Owner: Tacuchi. License: MIT, in the `LICENSE` file of this directory. The ref and its remote publication are created after this change.
