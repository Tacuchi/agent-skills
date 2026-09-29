# Contributing

This personal repository publishes independent skills under `skills/<domain>/<slug>/SKILL.md` and may include curated references to external projects. No offer is added just because it exists in another catalog. Before proposing a skill, describe its contract, its domain, its source and how it is used; its content and its acceptance belong to its own initiative.

All content is written in English: documentation, skills, references, assets, changelogs, release notes, script messages and tests. `test/language-policy.test.mjs` enforces it.

## An own offer

Each own skill needs an identifiable owner; `SKILL.md` as a regular file (not a symlink), with `name` and `description` frontmatter, also in the tag; an applicable license (a `LICENSE` file in its directory, or an **explicit** inheritance of the root MIT in the index); a per-skill `CHANGELOG.md`; and per-skill release notes (`RELEASE_NOTES.md`). Declare known data and permissions with the provenance of the verification, or mark them as unverified. Register its path and exact acquirable ref in `catalog/index.json`. The tag `skill/<slug>/vX.Y.Z` must point to a commit that contains the skill, its license and its history; the matching GitHub Release uses that tag and that skill's notes. There are no implicit collective releases.

An offer change (a new offer, a ref or status update, a retirement, visible metadata) increments the index `revision`, independently of the skill versions. An internal content change that does not change the offer does not need that increment. Update the README with `node scripts/catalog.mjs` and run `node --test && node scripts/catalog.mjs --check` before proposing the change. Publishing on GitHub and checking the Release are operational steps separate from this local validation.

## External references and retirement

An external reference identifies the project, the URL/ref and the upstream lifecycle owner; it gets no tag, license or local release from this repository. Before setting `data_permissions.status: verified`, a person must review at the source **what the summary claims** (data and permissions), not just that a link exists: `evidence_url` must point to a permalink with a commit SHA or to the offer's tag. The checker validates the anchoring of the URL, not its content or the human review. When an offer is retired, keep its source and historical ref in the index with `retirement_reason`, bump the revision and regenerate the README. Retiring or updating a row only changes the editorial offer: it does not change existing installations or sync other catalogs.

## Index fields

`schema_version` identifies the format, and `revision` starts at 1. `entries` starts empty. Each entry uses `id`, `name`, `domain`, `type` (`own` or `external`), `source_url`, `path` to a `SKILL.md`, a fixed `ref`, `lifecycle_owner`, `status` (`active` or `retired`) and `data_permissions` with `status` (`unverified` or `verified`), `summary` and, only when verification is claimed, an HTTPS `evidence_url` anchored to a commit SHA or to the offer's tag. Without verification, `summary` is literally `not verified`. Retired entries add `retirement_reason` and keep their historical source and ref.

An own entry adds `license: "root"` to inherit the root MIT explicitly (or the path `skills/<domain>/<slug>/LICENSE`), `changelog` to its `CHANGELOG.md` and `release_notes` to its `RELEASE_NOTES.md`. Its `ref` must be the tag `skill/<slug>/vX.Y.Z`. An external entry uses a fixed upstream ref, a `vX.Y.Z` version or a hexadecimal commit, and an upstream skill path; it gets no own release fields. The local checker inspects the tagged Git tree of active and retired own entries, but it does not query GitHub Releases or validate a real acquisition by a host: both need the operational pass of the content initiative.

## Acquisition channel

Read the index and the `SKILL.md` of the specific path before choosing. Acquire only that path, through the host tools that accept that source and that ref; check that host's requirements. Use `skills.sh` only after showing that it accepts the individual path; that compatibility is not assumed. Acquisition and any uninstall are explicit decisions of the person and of their host's manager.
