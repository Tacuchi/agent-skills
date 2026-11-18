# Architecture of agent-skills

Reviewed on 2026-11-18 (commit `bbac7d3`).

This document gives the overview: which parts exist, how they talk to each other and which rules never break. It covers the catalog, repository scripts, permission step, per-skill releases and CI. It does not describe each skill's subject or every host's acquisition mechanism. All values are defaults; nothing here was measured on a particular machine. There is no repository-wide version: each own skill has its own version tag.

In short:

- A catalog of independent agent skills, each acquired by its own path and per-skill tag.
- Maintainers edit it; people pick one skill at a time through a compatible agent host.
- Its catalog command talks only to local Git; CI runs on GitHub Actions.
- Offers live in `catalog/index.json`; skill files and release history live in Git.
- An own offer counts only when its tag exists locally with the skill and its release files.

## 1. Purpose and quality goals

agent-skills is a catalog of independent agent skills organized by domain. People select a source, one skill path and an exact ref. The catalog also supports external references with their own upstream owners. Its command checks the editorial index against local Git trees and keeps the visible table consistent.

What it is not:

- A collective skill installer or an automatic update service.
- A runtime service shared by all skills.
- Proof that a remote release or a host acquisition has succeeded, or of what a data/permissions claim means ([catalog validation guide](docs/catalog-validation.md#what-the-checker-does-not-prove)).

| Goal | Scenario |
|---|---|
| Independent acquisition | Every own offer names one `SKILL.md` path and a matching per-skill tag. |
| Reproducible release content | The checker rejects a tag missing the skill, license, changelog or release notes. |
| Honest permissions metadata | An unverified offer must say `not verified`; verified evidence needs an immutable reference. |

Two more goals, traceable retirement and consistent discovery, are in the [catalog validation guide](docs/catalog-validation.md#more-quality-goals).

## 2. Context and scope

![Context diagram of agent-skills](docs/architecture/context.svg)

[Interactive version](https://tacuchi.github.io/agent-skills/architecture/context.html).

| External interface | Direction | When it happens |
|---|---|---|
| Maintainer | Inbound, local | Edits the index or skill files, then runs validation. |
| Agent host and person | Outbound, selected files | The person chooses an individual path and ref through a compatible host. No repository installer performs this step. |
| Local Git | Local subprocess | Catalog validation checks refs, tagged trees and the previous index revision. |
| GitHub Actions | Inbound, repository events | A push to any branch or a pull request starts the Catalog workflow. |
| Upstream project | Metadata reference | An external offer names a fixed upstream source and ref. The checker does not fetch it. |

## 3. Building blocks

![Container diagram of agent-skills](docs/architecture/containers.svg)

[Interactive version](https://tacuchi.github.io/agent-skills/architecture/containers.html).

The catalog is an on-demand Node process over repository files, not a deployed application.
The lower diagram boundary represents a consuming project after a skill has been acquired.
Only skills that include a permission manifest use that permission path.

| Block | Responsibility | Code |
|---|---|---|
| Editorial index | Names offers, source refs, lifecycle state, license and verification metadata. | `catalog/index.json` |
| Skill directories | Carry each skill's instructions, history, license and any supporting files. | `skills/<domain>/<slug>/` |
| Catalog command | Validates metadata and tagged content; compares or regenerates the marked README block. | `scripts/catalog.mjs` |
| Local Git history | Supplies immutable skill trees and the index revision baseline. | Git refs and objects, read by `scripts/catalog.mjs` |
| Permission manifest and script | The manifest declares command or web needs and risk tiers; the script reports questions and applies only the chosen project configuration. | Individual `permissions.json` files and `scripts/permissions.mjs` copies |
| Tests | Check catalog, skill contracts, language, permissions and bundled helpers. | `test/` |
| Catalog workflow | Runs repository tests and the catalog check on GitHub Actions. | `.github/workflows/catalog.yml` |

Rules that never break:

- An own path has the form `skills/<domain>/<slug>/SKILL.md`; its domain must match the index.
- Own slugs are unique across domains.
- An own ref has the form `skill/<slug>/vX.Y.Z` and must exist as a local Git tag.
- The tagged `SKILL.md` is a regular `100644` file with `name` and `description` frontmatter.
- Active own entries require their release files in the checkout and tag; retired entries require the historical tag.
- Editorial offer changes require a higher index revision. Formatting-only changes do not.
- The README contains exactly one catalog block, bounded by `catalog:start` and `catalog:end` comments.
- A permission check writes nothing. Rule changes require an explicit `apply` command with declared need IDs.
- Permission scripts never write global host configuration. Antigravity has no project-rule write path.

## 4. Runtime view

Validate or regenerate the catalog:

1. Run `node scripts/catalog.mjs --check` or `node scripts/catalog.mjs` from the checkout.
2. The command resolves the repository from its own script location and reads the JSON index.
3. It checks schema, IDs, domains, sources, refs, permissions metadata and retirement fields.
4. For each own offer, it reads the local tag and its tree, including license and release files.
5. It compares the index with the previous commit and requires a higher revision when the editorial offer changes.
6. It renders active and retired rows, then compares the single README block.
7. Check mode fails on a mismatch with exit code 1; generation replaces only that block.

Each step in full is in the [catalog validation guide](docs/catalog-validation.md#full-walkthrough-validate-or-regenerate-the-catalog). Loading a skill with the permission step is walked through in the [permission step guide](docs/permissions.md).

## 5. Deployment view

The repository has no collective package manifest or server entry point.
CI checks the checkout; acquired skills run through their consuming hosts.

| What | Default | When it applies | How to change it |
|---|---|---|---|
| Validation runtime | Node.js 22 and Git on Linux CI | Catalog workflow | Change the workflow's runtime configuration. |
| Catalog source | `catalog/index.json`, schema 1 | Every catalog command | Edit its entries and advance the revision for editorial changes. |
| README generation | Replace only the marked table block | Run without `--check` | Pass `--check` for validation without writing. |
| Own release ref | `skill/<slug>/vX.Y.Z` | Every own offer, including retired offers | Create the individual tag through the separate release process, then update the index. |
| CI checkout | Full Git history, `fetch-depth: 0` | Catalog workflow | Keep required tags and history available when changing checkout behavior. |
| Permission rules | Project files of each host, never global ones | A participating skill's chosen `apply` | Pass `--root`; the [permission step guide](docs/permissions.md#where-rules-are-written) lists every file. |

Requirements: Node.js and Git for repository validation; CI selects Node.js 22.
Each skill declares additional tools for its own work. Those tools are not collective catalog dependencies.

Release by tag is separate from validation; the [catalog validation guide](docs/catalog-validation.md#release-by-tag) says what each side does.

## 6. Cross-cutting concepts

### Data and privacy

| Question | Answer |
|---|---|
| What leaves the machine | Catalog validation invokes local Git and reads local files; it makes no network request. Pushing repository changes sends committed files to GitHub and starts CI. Acquisition requests and skill operations depend on the selected host and skill. |
| What does not leave | The catalog command sends no installed skill copy or host settings. The permission helper reads host settings locally and emits a JSON report to its caller. Individual skills can declare separate network needs. |
| When | Catalog validation is explicit. GitHub runs CI on pushes and pull requests. A participating skill checks permissions when its instructions load; writing rules follows the person's chosen option. |
| Where it is stored and for how long | The index, skill files and release history stay in Git. Permission rules stay in project host files; local skip choices stay in the ignored state directory. The scripts define no retention deadline or automatic expiry. |
| How to see it | Inspect the index, generated catalog table, local Git tags and workflow logs. Permission checks return the needs, proposed targets and choices as JSON. A verified metadata row names its evidence URL. |
| How to turn it off | Stop invoking the catalog commands. Manage acquired skills through the host. Skip permission writes or keep prompting. Retiring a catalog entry changes the offer, not an installed copy. The workflow has no runtime disable flag. |

### Local security

- Catalog paths must stay inside the repository and cannot contain traversal segments.
- Source and verification URLs require HTTPS without embedded credentials.
- Verified metadata needs an evidence URL anchored to a commit or the offer's version tag.
- URL anchoring is not a review of the upstream content or its permissions behavior.
- Permission manifests distinguish low-risk and high-risk needs; high-risk choices recommend asking every time.
- `apply` rejects IDs the skill did not declare.
- Invalid host configuration produces an error instead of replacing it with fabricated defaults.
- Allowing a command in the host does not authorize a task action by itself.

### Persistence

- JSON stores the catalog format and its independent editorial revision.
- Markdown and support files make up each skill's separately tagged release tree.
- Host rule files store only chosen permission additions; skip state records selected need IDs.
- No catalog database, background process or automatic installation synchronization exists.

## 7. Decisions

Decision records live in [`docs/decisions/`](docs/decisions/).
The person confirmed these three reasons on 2026-11-18.

| Decision | Record |
|---|---|
| Release every skill independently | [0001](docs/decisions/0001-release-skills-independently.md) |
| Preserve retired offers in the catalog | [0002](docs/decisions/0002-preserve-retired-offers.md) |
| Make host-specific permission rules opt-in | [0003](docs/decisions/0003-make-permission-rules-opt-in.md) |

Not recorded yet:

- Why the Catalog workflow runs on every branch without documentation path filters.
- Why permission helpers are copied into each participating skill instead of shared at runtime.

## Appendix: evidence

Line numbers refer to commit `bbac7d3`. Every row cites code or configuration; the text above does not link to the code on purpose.

| Section | Evidence |
|---|---|
| 1. Goals | `catalog/index.json:2`, `catalog/index.json:6-18`, `scripts/catalog.mjs:69-114`, `scripts/catalog.mjs:125-130`, `scripts/catalog.mjs:172-178` |
| 2. Context | `scripts/catalog.mjs:28-33`, `scripts/catalog.mjs:96-100`, `scripts/catalog.mjs:154-178`, `.github/workflows/catalog.yml:3-19`, `skills/git/git-conventions/SKILL.md:8-18` |
| 3. Blocks | `catalog/index.json:6-18`, `scripts/catalog.mjs:103-130`, `scripts/catalog.mjs:137-151`, `skills/git/git-conventions/permissions.json:1-34`, `.github/workflows/catalog.yml:8-19` |
| 3. Rules | `scripts/catalog.mjs:36-40`, `scripts/catalog.mjs:48-56`, `scripts/catalog.mjs:103-130`, `scripts/catalog.mjs:162-178`, `skills/git/git-conventions/scripts/permissions.mjs:446-468` |
| 4. Runtime | `scripts/catalog.mjs:154-187`, `skills/git/git-conventions/scripts/permissions.mjs:320-342`, `skills/git/git-conventions/scripts/permissions.mjs:351-399`, `skills/git/git-conventions/scripts/permissions.mjs:446-468` |
| 5. Deployment | `.github/workflows/catalog.yml:3-19`, `scripts/catalog.mjs:103-130`, `scripts/catalog.mjs:172-187`, `skills/git/git-conventions/scripts/permissions.mjs:142-170`, `skills/git/git-conventions/scripts/permissions.mjs:281-306` |
| 6. Privacy | `scripts/catalog.mjs:21-40`, `scripts/catalog.mjs:59-66`, `scripts/catalog.mjs:154-189`, `skills/git/git-conventions/scripts/permissions.mjs:57-65`, `skills/git/git-conventions/scripts/permissions.mjs:404-468` |
| 7. Decisions | `scripts/catalog.mjs:93-114`, `scripts/catalog.mjs:125-130`, `skills/git/git-conventions/scripts/permissions.mjs:351-383`, `skills/git/git-conventions/scripts/permissions.mjs:446-468`. These establish behavior; the person confirmed the reasons on 2026-11-18. |
