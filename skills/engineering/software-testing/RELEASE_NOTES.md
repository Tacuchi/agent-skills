# software-testing 1.2.0

Publishes the test strategy: it asks before running any runner, requires a red-then-green regression test for every bugfix, proves a preexisting failure against an untouched base, treats low coverage as a gap, picks the unit/integration/full level and resolves the command from the repository's own wrapper and scripts. It needs no other skill; the skills it mentions are optional complements.

Version 1.2.0 adds step 0: when the skill loads, it checks whether this repo already allows the commands the skill runs, asks the person about what is missing, low and high risk apart, and writes only the chosen rules in the repo's Claude Code or Codex settings, never in the global ones. The needs are declared in `permissions.json` and checked by `scripts/permissions.mjs`, which needs Node; without it the skill says so and goes on. Every 1.1.0 rule stays.

Acquire the whole `software-testing` directory from `Tacuchi/agent-skills` once the ref `skill/software-testing/v1.2.0` exists.

Owner: Tacuchi. License: MIT, in the `LICENSE` file of this directory. The ref and its remote publication are created after this change.
