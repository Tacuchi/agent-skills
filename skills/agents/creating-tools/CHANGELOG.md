# creating-tools changelog

## [1.1.1] — 2026-11-18

- Security: the low-risk permission rule now covers only `permissions.mjs check`. It covered the whole script, so an agent could also run `apply` and write allow rules the person never chose. `validate` refuses a manifest that allows the script any other way. Found by the Snyk audit on skills.sh. A broader rule saved earlier stays in the host settings until it is removed by hand.

## [1.1.0] — 2026-11-17

- Step 0, "Permissions this skill uses": when the skill loads, `scripts/permissions.mjs check` compares the needs declared in `permissions.json` with the project and global configuration of Claude Code, Codex and Antigravity. Missing low-risk needs go in one structured question (only for me in this repo, recommended; shared in this repo; skip for now; don't ask again in this repo) and high-risk needs in another, where "Ask every time" is recommended. `apply` writes only what the person chose: in Claude Code to `.claude/settings.local.json` at the git root or `.claude/settings.json` of the session folder; in Codex to `.codex/rules/agent-skills.rules`, only when Codex trusts the project; nothing for Antigravity, which has no per-project permissions. It never writes the global configuration. "Don't ask again" is kept in `.agent-skills/permissions-state.json`, in a folder that ignores itself in git. If the check cannot run, the skill says so and goes on.
- The hosts were probed on 2026-11-17: Claude Code applies a local rule without a restart, and Codex loads project rules only in trusted projects; `codex execpolicy check` accepts the generated rules.
- Declared needs: the permission check and `scaffold-tool.mjs` with low risk; `record-run.mjs` with high risk, because it runs whatever command it wraps. The scripts are run with the absolute folder of the skill, the form the rules allow.

## [1.0.0] — 2026-09-29

- First public version, copied from the author's own convention creating-tools and generalized: the mentions of the author's workflow harness were removed, and the scripts' messages, the comments and the README template were translated to English without changing their behavior.
