# resolving-merge-conflicts 1.2.0

Resolves a merge already in progress: it inspects base, ours and theirs, resolves paths one at a time without touching foreign work, stops on ambiguous hunks and runs the merged checkout's build and tests before proposing an approved commit. It needs no other skill; the skills it mentions are optional.

Version 1.2.0 adds step 0: when the skill loads, it checks whether this repo already allows the commands the skill runs, asks the person about what is missing, low and high risk apart, and writes only the chosen rules in the repo's Claude Code or Codex settings, never in the global ones. The needs are declared in `permissions.json` and checked by `scripts/permissions.mjs`, which needs Node; without it the skill says so and goes on. Every 1.1.0 rule stays.

Acquire the whole `resolving-merge-conflicts` directory from `Tacuchi/agent-skills` once the ref `skill/resolving-merge-conflicts/v1.2.0` exists.

Owner: Tacuchi. License: MIT, in the `LICENSE` file of this directory. The ref and its remote publication are created after this change.
