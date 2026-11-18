# Catalog validation guide

This guide holds the detail of the catalog command that the [architecture overview](../ARCHITECTURE.md) summarizes.

## What the checker does not prove

The checker does not verify the meaning of a data/permissions claim: it validates the anchoring of its evidence URL.

## More quality goals

| Goal | Scenario |
|---|---|
| Traceable retirement | A retired offer keeps its historical ref and must state its retirement reason. |
| Consistent discovery | CI rejects a README catalog block that differs from the JSON index. |

## Full walkthrough: validate or regenerate the catalog

1. Run `node scripts/catalog.mjs --check` or `node scripts/catalog.mjs` from the checkout.
2. The command resolves the repository from its own script location and reads the JSON index.
3. It checks schema, IDs, domains, sources, refs, permissions metadata and retirement fields.
4. For each own offer, it reads the local tag and its tree, including license and release files.
5. It compares the index with `HEAD`, or with `HEAD^` when the working index already matches `HEAD`.
6. It requires an index revision increase when the editorial offer changes.
7. It renders active and retired rows, then compares the single README block.
8. Check mode fails on a mismatch. Generation replaces only that block when it differs.
9. Any validation error reaches stderr and gives the command exit code 1.

## Release by tag

Release by tag is separate from validation.
The checker proves local tagged contents; it neither creates tags nor prepares GitHub Releases.
The per-skill release notes supply the text for the separately prepared release.
No current repository workflow publishes those releases.
