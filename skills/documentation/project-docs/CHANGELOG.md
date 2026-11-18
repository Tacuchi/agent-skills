# project-docs changelog

## [1.1.0] — 2026-11-18

- Budget: `ARCHITECTURE.md` is now an overview of 1,200 to 1,500 words before the appendix, with a summary list of up to five lines, tables of up to seven rows and the five decisions that weigh most. Detail that does not fit moves to a guide and is never deleted. `check` warns with `over-budget`, `long-table` and `no-summary`. A trial on a real repository went from 2,713 to 1,437 words with no fact lost.
- `check` warns with `too-many-citations` when a row of the appendix cites more than five ranges. Long rows went stale at almost every change.
- `check` warns with `volatile-citation` when a cited range covers a line that states a version or a revision. Such a range goes stale at every release.
- Preferences file: `~/.config/agent-skills/project-docs/preferences.md` holds the answers the person gives the same way in every repository, such as the contribution policy. `--preflight` reports it as `preferences`, the skill reads it before asking, and `generate` offers once to save it. Turning on GitHub Pages, committing and pushing are never answered by that file.
- Security: the low-risk permission rule now covers only `permissions.mjs check`. It covered the whole script, so an agent could also run `apply` and write allow rules the person never chose. `validate` refuses a manifest that allows the script any other way. Found by the Snyk audit on skills.sh. A broader rule saved earlier stays in the host settings until it is removed by hand.

## [1.0.1] — 2026-11-18

- Fix: a tag that names one part of a repository, such as `skill/demo/v1.0.0` or `demo@1.0.0`, is no longer read as the version of the project. Only a bare version tag counts, such as `v1.2.0`. `check` reported `bad-header` in a repository that releases each part with its own tag.

## [1.0.0] — 2026-11-18

- First public version. Three commands, all on request and all taking the path of a repository: `generate` documents a repository that has no `ARCHITECTURE.md`, `update` fixes only what went stale, and `check` reads without editing.
- The published set is a standard-order `README.md`, an `ARCHITECTURE.md` with seven numbered sections and an evidence appendix pinned to a commit, two Archify diagrams (context and containers) and decision records in `docs/decisions/`.
- `scripts/check.mjs` needs no model and no network. It compares every citation of the appendix and of the diagram sources with the code, and checks structure, relative links, the project version and private data. Exit code 0 is clean, 1 is findings, 2 is a usage or environment problem.
- Not checked: whether a diagram page and its image were regenerated after their source changed. The page carries no hash of its source, so `check` compares only the code each box cites.
- `scripts/export-svg.mjs` exports the SVG of a diagram page with the Chrome already installed, through its debugging protocol and a temporary profile. It needs no library.
- Publishing: before a push, the skill reads the workflows and says when documentation alone would start a build or a deployment. It offers a path filter for the trigger and explains the one run the filter itself causes and how `[skip ci]` avoids it.
- A header needs a version only when the project declares one.
- Step 0, "Permissions this skill uses": declared needs, all low risk, are the permission check, the two scripts and read-only git.
