# software-testing changelog

## [1.2.0] — 2026-11-17

- Step 0, "Permissions this skill uses": when the skill loads, `scripts/permissions.mjs check` compares the needs declared in `permissions.json` with the project and global configuration of Claude Code, Codex and Antigravity. Missing low-risk needs go in one structured question (only for me in this repo, recommended; shared in this repo; skip for now; don't ask again in this repo) and high-risk needs in another, where "Ask every time" is recommended. `apply` writes only what the person chose: in Claude Code to `.claude/settings.local.json` at the git root or `.claude/settings.json` of the session folder; in Codex to `.codex/rules/agent-skills.rules`, only when Codex trusts the project; nothing for Antigravity, which has no per-project permissions. It never writes the global configuration. "Don't ask again" is kept in `.agent-skills/permissions-state.json`, in a folder that ignores itself in git. If the check cannot run, the skill says so and goes on.
- The hosts were probed on 2026-11-17: Claude Code applies a local rule without a restart, and Codex loads project rules only in trusted projects; `codex execpolicy check` accepts the generated rules.
- Declared needs, all low risk: the permission check and the committed build and test wrappers and scripts (`./mvnw test`, `./mvnw verify`, `./gradlew`, and the `test` script of npm, pnpm or yarn).

## [1.1.0] — 2026-11-14

- New section "Make the test bite": mutate each guarantee and expect red, test the caller and the real entry point, keep doubles no more permissive than the real thing, treat a relaxed check as suspect, set floors against vacuous passes and write fixtures that do not age.
- Reproduce before fixing: the fix is chosen from a reproduction, not from a hypothesis.
- Read the runner's own exit code, not the code of the last command in a pipe.

## [1.0.0] — 2026-09-29

- First public version, copied from the author's own convention testing and generalized: the harness-specific question mechanism, facts and examples from the company's repositories and company-specific skill names were removed; examples and prompts are in English with neutral names.
