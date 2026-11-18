# github-workflows changelog

## [1.0.2] — 2026-11-18

- Security: the low-risk permission rule now covers only `permissions.mjs check`. It covered the whole script, so an agent could also run `apply` and write allow rules the person never chose. `validate` refuses a manifest that allows the script any other way. Found by the Snyk audit on skills.sh. A broader rule saved earlier stays in the host settings until it is removed by hand.

## [1.0.1] — 2026-11-18

- Fix: `scripts/ops.mjs` did nothing when it was reached through a symbolic link, which is how an installed skill is reached. `status`, `deploy` and `rollback` exited with code 0 and printed nothing. The script now compares real paths to know it is the one being run, and a test runs every script of the skill through a link.
- `references/pattern.md`: a `docs-trigger` warning may stay when the tests of that workflow check the documentation itself.

## [1.0.0] — 2026-11-18

- First public version. Six commands, all on request and all taking the path of a repository: `check` reads the workflows and reports what each one starts on and where it leaves the pattern; `generate` creates a missing workflow from a template; `update` brings existing workflows to the pattern; `status` shows the last runs and the deployed commit; `deploy` and `rollback` act on production and always ask first.
- `scripts/check.mjs` needs no network. It reads the workflow files with its own reader for the part of YAML they use, and reports a file it cannot read as unreadable, never as clean.
- `scripts/ops.mjs` works through the `gh` command. `deploy` and `rollback` print a plan and a token first, and act only when that token comes back.
- Step 0, "Permissions this skill uses": reading is low risk; the operations script is high risk.
