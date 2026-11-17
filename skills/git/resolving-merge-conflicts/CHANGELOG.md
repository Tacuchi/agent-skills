# resolving-merge-conflicts changelog

## [1.2.0] — 2026-11-17

- Step 0, "Permissions this skill uses": when the skill loads, `scripts/permissions.mjs check` compares the needs declared in `permissions.json` with the project and global configuration of Claude Code, Codex and Antigravity. Missing low-risk needs go in one structured question (only for me in this repo, recommended; shared in this repo; skip for now; don't ask again in this repo) and high-risk needs in another, where "Ask every time" is recommended. `apply` writes only what the person chose: in Claude Code to `.claude/settings.local.json` at the git root or `.claude/settings.json` of the session folder; in Codex to `.codex/rules/agent-skills.rules`, only when Codex trusts the project; nothing for Antigravity, which has no per-project permissions. It never writes the global configuration. "Don't ask again" is kept in `.agent-skills/permissions-state.json`, in a folder that ignores itself in git. If the check cannot run, the skill says so and goes on.
- The hosts were probed on 2026-11-17: Claude Code applies a local rule without a restart, and Codex loads project rules only in trusted projects; `codex execpolicy check` accepts the generated rules.
- Declared needs, all low risk: the permission check and read-only git (`git status`, `git diff`, `git log`, `git branch --show-current`). Commit, merge and every other write are never declared: the host keeps asking for them.

## [1.1.0] — 2026-11-14

- New section "What a clean auto-merge can still break": silent drops and duplicates, deletions brought back by crossed bases, markers already committed, `git checkout --ours` leaving the path unmerged, and line endings that make every line look changed.

## [1.0.0] — 2026-09-29

- First public version, copied from the author's own convention resolving-merge-conflicts and generalized: the company branch-flow reference and the workspace-session wording.
