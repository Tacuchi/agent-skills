# Tacuchi's Agent Skills

A personal repository to discover independent skills organized by domain, plus curated external references. The current offers are listed in the catalog below; an own offer uses `skills/<domain>/<slug>/SKILL.md`. Choosing one path never requires acquiring the others.

Check the source, the ref and the data/permissions of each offer before deciding. Use your host's acquisition mechanism if it supports the source and the individual path. This repository installs or updates nothing by itself; compatibility with a given channel is checked when each skill is published.

## Catalog

<!-- catalog:start -->
Index revision: **6** (schema 1).

### Active offers

| Skill | Domain | Type | Source | Path | Ref | Lifecycle | Data/permissions |
| --- | --- | --- | --- | --- | --- | --- | --- |
| UI authoring | design | own | https://github.com/Tacuchi/agent-skills | skills/design/ui-authoring/SKILL.md | skill/ui-authoring/v1.1.0 | Tacuchi | no verificados |
| System diagrams | architecture | own | https://github.com/Tacuchi/agent-skills | skills/architecture/system-diagrams/SKILL.md | skill/system-diagrams/v1.1.0 | Tacuchi | no verificados |
| SQL authoring | data | own | https://github.com/Tacuchi/agent-skills | skills/data/sql-authoring/SKILL.md | skill/sql-authoring/v1.1.0 | Tacuchi | no verificados |
| Herdr coordination | orchestration | own | https://github.com/Tacuchi/agent-skills | skills/orchestration/herdr-coordination/SKILL.md | skill/herdr-coordination/v1.1.0 | Tacuchi | no verificados |

### Retired offers

No retired offers.
<!-- catalog:end -->

The editorial index is [`catalog/index.json`](catalog/index.json). Each offer states its URL, location and exact ref; retired ones keep their reason and history. The block above is generated with `node scripts/catalog.mjs` and compared with `node scripts/catalog.mjs --check`.

To look at an offer, open its source and the `SKILL.md` path at the ref shown. To acquire a single skill, select that path in a host that accepts the source and the ref; confirm the compatible channel in that skill's own initiative. `skills.sh` is used only after checking that it supports the individual path. Updating or retiring an index row changes no installed copy: the host and its person stay in control.

## Acquiring one skill

Choose **a single** path of the repository `https://github.com/Tacuchi/agent-skills`, in a host that accepts a source, a path and an immutable ref. The ref of each offer is the one in the catalog table above.

- [ui-authoring](skills/design/ui-authoring/SKILL.md): `skills/design/ui-authoring/SKILL.md`; journey, screen and accessibility decisions. [Release notes](skills/design/ui-authoring/RELEASE_NOTES.md).
- [system-diagrams](skills/architecture/system-diagrams/SKILL.md): `skills/architecture/system-diagrams/SKILL.md`; evidence-backed diagrams with local rendering. [Release notes](skills/architecture/system-diagrams/RELEASE_NOTES.md).
- [sql-authoring](skills/data/sql-authoring/SKILL.md): `skills/data/sql-authoring/SKILL.md`; parametrized scripts and rollbacks for someone else to apply. [Release notes](skills/data/sql-authoring/RELEASE_NOTES.md).
- [herdr-coordination](skills/orchestration/herdr-coordination/SKILL.md): `skills/orchestration/herdr-coordination/SKILL.md`; verifiable coordination of panes and human authorizations. [Release notes](skills/orchestration/herdr-coordination/RELEASE_NOTES.md).

These paths share a repository, but each offer is acquired separately and declares its own license and history. The person creates the tags; after each tagged tree is validated, a GitHub Release is prepared **per tag** with its own notes. The local catalog only credits refs that exist in this checkout: checking the remote publication and acquiring from a compatible host are later operational steps.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the per-skill license, history and release contract. The repository's code is under Tacuchi's [MIT license](LICENSE); the license of each own skill is stated explicitly when it is published. External references keep their upstream owners and licenses.
