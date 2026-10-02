# Tacuchi's Agent Skills

A personal repository to discover independent skills organized by domain, plus curated external references. The current offers are listed in the catalog below; an own offer uses `skills/<domain>/<slug>/SKILL.md`. Choosing one path never requires acquiring the others.

Check the source, the ref and the data/permissions of each offer before deciding. Use your host's acquisition mechanism if it supports the source and the individual path. This repository installs or updates nothing by itself; compatibility with a given channel is checked when each skill is published.

## Catalog

<!-- catalog:start -->
Index revision: **9** (schema 1).

### Active offers

| Skill | Domain | Type | Source | Path | Ref | Lifecycle | Data/permissions |
| --- | --- | --- | --- | --- | --- | --- | --- |
| UI authoring | design | own | https://github.com/Tacuchi/agent-skills | skills/design/ui-authoring/SKILL.md | skill/ui-authoring/v2.0.0 | Tacuchi | not verified |
| System diagrams | architecture | own | https://github.com/Tacuchi/agent-skills | skills/architecture/system-diagrams/SKILL.md | skill/system-diagrams/v2.0.0 | Tacuchi | not verified |
| SQL authoring | data | own | https://github.com/Tacuchi/agent-skills | skills/data/sql-authoring/SKILL.md | skill/sql-authoring/v2.0.0 | Tacuchi | not verified |
| Coordinating agents | orchestration | own | https://github.com/Tacuchi/agent-skills | skills/orchestration/coordinating-agents/SKILL.md | skill/coordinating-agents/v1.1.0 | Tacuchi | not verified |
| Authoring skills | agents | own | https://github.com/Tacuchi/agent-skills | skills/agents/authoring-skills/SKILL.md | skill/authoring-skills/v1.0.0 | Tacuchi | not verified |
| Creating tools | agents | own | https://github.com/Tacuchi/agent-skills | skills/agents/creating-tools/SKILL.md | skill/creating-tools/v1.0.0 | Tacuchi | not verified |
| Coding standards | engineering | own | https://github.com/Tacuchi/agent-skills | skills/engineering/coding-standards/SKILL.md | skill/coding-standards/v1.0.0 | Tacuchi | not verified |
| Reviewing code | engineering | own | https://github.com/Tacuchi/agent-skills | skills/engineering/reviewing-code/SKILL.md | skill/reviewing-code/v1.0.0 | Tacuchi | not verified |
| Software testing | engineering | own | https://github.com/Tacuchi/agent-skills | skills/engineering/software-testing/SKILL.md | skill/software-testing/v1.0.0 | Tacuchi | not verified |
| Security practices | engineering | own | https://github.com/Tacuchi/agent-skills | skills/engineering/security-practices/SKILL.md | skill/security-practices/v1.0.0 | Tacuchi | not verified |
| Version evolution | engineering | own | https://github.com/Tacuchi/agent-skills | skills/engineering/version-evolution/SKILL.md | skill/version-evolution/v1.0.0 | Tacuchi | not verified |
| Critical thinking | engineering | own | https://github.com/Tacuchi/agent-skills | skills/engineering/critical-thinking/SKILL.md | skill/critical-thinking/v1.0.0 | Tacuchi | not verified |
| Git conventions | git | own | https://github.com/Tacuchi/agent-skills | skills/git/git-conventions/SKILL.md | skill/git-conventions/v1.0.0 | Tacuchi | not verified |
| Resolving merge conflicts | git | own | https://github.com/Tacuchi/agent-skills | skills/git/resolving-merge-conflicts/SKILL.md | skill/resolving-merge-conflicts/v1.0.0 | Tacuchi | not verified |
| Java Spring standards | backend | own | https://github.com/Tacuchi/agent-skills | skills/backend/java-spring-standards/SKILL.md | skill/java-spring-standards/v1.0.0 | Tacuchi | not verified |
| Angular standards | frontend | own | https://github.com/Tacuchi/agent-skills | skills/frontend/angular-standards/SKILL.md | skill/angular-standards/v1.0.0 | Tacuchi | not verified |
| Technical writing | documentation | own | https://github.com/Tacuchi/agent-skills | skills/documentation/technical-writing/SKILL.md | skill/technical-writing/v1.0.0 | Tacuchi | not verified |

### Retired offers

| Skill | Domain | Type | Source | Path | Ref | Lifecycle | Data/permissions | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Herdr coordination | orchestration | own | https://github.com/Tacuchi/agent-skills | skills/orchestration/herdr-coordination/SKILL.md | skill/herdr-coordination/v2.0.0 | Tacuchi | not verified | Superseded by coordinating-agents, which generalizes it to any orchestrator and keeps its Herdr rules in references/herdr.md. |
<!-- catalog:end -->

The editorial index is [`catalog/index.json`](catalog/index.json). Each offer states its URL, location and exact ref; retired ones keep their reason and history. The block above is generated with `node scripts/catalog.mjs` and compared with `node scripts/catalog.mjs --check`.

To look at an offer, open its source and the `SKILL.md` path at the ref shown. To acquire a single skill, select that path in a host that accepts the source and the ref; confirm the compatible channel in that skill's own initiative. `skills.sh` is used only after checking that it supports the individual path. Updating or retiring an index row changes no installed copy: the host and its person stay in control.

## Acquiring one skill

Choose **a single** path of the repository `https://github.com/Tacuchi/agent-skills`, in a host that accepts a source, a path and an immutable ref. The ref of each offer is the one in the catalog table above.

- [ui-authoring](skills/design/ui-authoring/SKILL.md): `skills/design/ui-authoring/SKILL.md`; journey, screen and accessibility decisions. [Release notes](skills/design/ui-authoring/RELEASE_NOTES.md).
- [system-diagrams](skills/architecture/system-diagrams/SKILL.md): `skills/architecture/system-diagrams/SKILL.md`; evidence-backed diagrams with local rendering. [Release notes](skills/architecture/system-diagrams/RELEASE_NOTES.md).
- [sql-authoring](skills/data/sql-authoring/SKILL.md): `skills/data/sql-authoring/SKILL.md`; parametrized scripts and rollbacks for someone else to apply, including PostgreSQL bundles. [Release notes](skills/data/sql-authoring/RELEASE_NOTES.md).
- [coordinating-agents](skills/orchestration/coordinating-agents/SKILL.md): `skills/orchestration/coordinating-agents/SKILL.md`; verifiable coordination of agents under any orchestrator (Herdr, Orca, teamctl, Dorothy or another) and human authorizations. [Release notes](skills/orchestration/coordinating-agents/RELEASE_NOTES.md).
- [authoring-skills](skills/agents/authoring-skills/SKILL.md): `skills/agents/authoring-skills/SKILL.md`; writing and tuning an agent's SKILL.md. [Release notes](skills/agents/authoring-skills/RELEASE_NOTES.md).
- [creating-tools](skills/agents/creating-tools/SKILL.md): `skills/agents/creating-tools/SKILL.md`; scaffolding and archiving the runs of auxiliary developer tools. [Release notes](skills/agents/creating-tools/RELEASE_NOTES.md).
- [coding-standards](skills/engineering/coding-standards/SKILL.md): `skills/engineering/coding-standards/SKILL.md`; the stack-agnostic core of clean code. [Release notes](skills/engineering/coding-standards/RELEASE_NOTES.md).
- [reviewing-code](skills/engineering/reviewing-code/SKILL.md): `skills/engineering/reviewing-code/SKILL.md`; reviewing a diff before it is merged. [Release notes](skills/engineering/reviewing-code/RELEASE_NOTES.md).
- [software-testing](skills/engineering/software-testing/SKILL.md): `skills/engineering/software-testing/SKILL.md`; writing, structuring and running tests. [Release notes](skills/engineering/software-testing/RELEASE_NOTES.md).
- [security-practices](skills/engineering/security-practices/SKILL.md): `skills/engineering/security-practices/SKILL.md`; secrets, sensitive data, read-only database access and secure configuration. [Release notes](skills/engineering/security-practices/RELEASE_NOTES.md).
- [version-evolution](skills/engineering/version-evolution/SKILL.md): `skills/engineering/version-evolution/SKILL.md`; choosing supported versions and upgrading them step by step. [Release notes](skills/engineering/version-evolution/RELEASE_NOTES.md).
- [critical-thinking](skills/engineering/critical-thinking/SKILL.md): `skills/engineering/critical-thinking/SKILL.md`; pre-mortem and checks before acting on a plan or a conclusion. [Release notes](skills/engineering/critical-thinking/RELEASE_NOTES.md).
- [git-conventions](skills/git/git-conventions/SKILL.md): `skills/git/git-conventions/SKILL.md`; commits, branches and history operations. [Release notes](skills/git/git-conventions/RELEASE_NOTES.md).
- [resolving-merge-conflicts](skills/git/resolving-merge-conflicts/SKILL.md): `skills/git/resolving-merge-conflicts/SKILL.md`; resolving merge conflicts from the merge base. [Release notes](skills/git/resolving-merge-conflicts/RELEASE_NOTES.md).
- [java-spring-standards](skills/backend/java-spring-standards/SKILL.md): `skills/backend/java-spring-standards/SKILL.md`; Java and Spring Boot code. [Release notes](skills/backend/java-spring-standards/RELEASE_NOTES.md).
- [angular-standards](skills/frontend/angular-standards/SKILL.md): `skills/frontend/angular-standards/SKILL.md`; Angular and TypeScript code. [Release notes](skills/frontend/angular-standards/RELEASE_NOTES.md).
- [technical-writing](skills/documentation/technical-writing/SKILL.md): `skills/documentation/technical-writing/SKILL.md`; clear technical prose: commits, PRs, docs and notes. [Release notes](skills/documentation/technical-writing/RELEASE_NOTES.md).

These paths share a repository, but each offer is acquired separately and declares its own license and history. The person creates the tags; after each tagged tree is validated, a GitHub Release is prepared **per tag** with its own notes. The local catalog only credits refs that exist in this checkout: checking the remote publication and acquiring from a compatible host are later operational steps.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the per-skill license, history and release contract. The repository's code is under Tacuchi's [MIT license](LICENSE); the license of each own skill is stated explicitly when it is published. External references keep their upstream owners and licenses.
