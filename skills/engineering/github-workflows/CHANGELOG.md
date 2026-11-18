# github-workflows changelog

## [1.0.0] — 2026-11-18

- First public version. Six commands, all on request and all taking the path of a repository: `check` reads the workflows and reports what each one starts on and where it leaves the pattern; `generate` creates a missing workflow from a template; `update` brings existing workflows to the pattern; `status` shows the last runs and the deployed commit; `deploy` and `rollback` act on production and always ask first.
- `scripts/check.mjs` needs no network. It reads the workflow files with its own reader for the part of YAML they use, and reports a file it cannot read as unreadable, never as clean.
- `scripts/ops.mjs` works through the `gh` command. `deploy` and `rollback` print a plan and a token first, and act only when that token comes back.
- Step 0, "Permissions this skill uses": reading is low risk; the operations script is high risk.
