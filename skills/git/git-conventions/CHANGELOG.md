# git-conventions changelog

## [1.2.0] — 2026-11-17

- Step 0, "Permissions this skill uses": when the skill loads, `scripts/permissions.mjs check` compares the needs declared in `permissions.json` with the project and global configuration of Claude Code, Codex and Antigravity. Missing low-risk needs go in one structured question (only for me in this repo, recommended; shared in this repo; skip for now; don't ask again in this repo) and high-risk needs in another, where "Ask every time" is recommended. `apply` writes only what the person chose: in Claude Code to `.claude/settings.local.json` at the git root or `.claude/settings.json` of the session folder; in Codex to `.codex/rules/agent-skills.rules`, only when Codex trusts the project; nothing for Antigravity, which has no per-project permissions. It never writes the global configuration. "Don't ask again" is kept in `.agent-skills/permissions-state.json`, in a folder that ignores itself in git. If the check cannot run, the skill says so and goes on.
- The hosts were probed on 2026-11-17: Claude Code applies a local rule without a restart, and Codex loads project rules only in trusted projects; `codex execpolicy check` accepts the generated rules.
- Declared needs, all low risk: the permission check and read-only git (`git status`, `git diff`, `git log`, `git branch --show-current`). Commit, push, merge, reset and every other write are never declared: the host keeps asking for them.

## [1.1.0] — 2026-11-14

- The commit runs as `git add -- <paths> && git commit -m "<msg>" -- <paths>`: the pathspec keeps out what the user or another session staged, also between the check and the commit. Files that someone else staged are shown and asked about, never unstaged.
- The proposal is asked with the host's structured question tool when it has one, the recommended option first.
- The message names the change, not the process that produced it: no session names, plan or task numbers, unless the repository asks for a ticket id.
- The branch is verified again before the first write of every round of edits.
- New section "Commands that mislead": `git -C` over `cd`, the log before a push, upstreams inherited from a remote ref, `git pull` with several refspecs, reverting a merge, and tool errors read as absence.
- A precondition is read in its own command, never chained to the commit it gates.

## [1.0.0] — 2026-09-29

- First public version, copied from the author's own convention git-conventions and generalized: the company branch flow and the workspace-manager wording, with examples translated to English.
