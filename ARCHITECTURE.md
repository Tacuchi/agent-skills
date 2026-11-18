# Architecture of agent-skills

Reviewed on 2026-11-18 (commit `af92ba0`).

This document gives the overview: which parts exist, how they talk to each other and which rules never break. It covers the catalog, repository scripts, permission step, per-skill releases and CI. It does not describe each skill's subject or every host's acquisition mechanism. All values are defaults; nothing here was measured on a particular machine. There is no repository-wide version: each own skill has its own version tag.

## 1. Purpose and quality goals

agent-skills is a catalog of independent agent skills organized by domain. People select a source, one skill path and an exact ref. The catalog also supports external references with their own upstream owners. Its command checks the editorial index against local Git trees and keeps the visible table consistent.

What it is not:

- A collective skill installer or an automatic update service.
- A runtime service shared by all skills.
- Proof that a remote release or a host acquisition has succeeded.
- A verification of the meaning of a data/permissions claim: the checker validates its evidence URL's anchoring.

| Goal | Scenario |
|---|---|
| Independent acquisition | Every own offer names one `SKILL.md` path and a matching per-skill tag. |
| Reproducible release content | The checker rejects a tag missing the skill, license, changelog or release notes. |
| Honest permissions metadata | An unverified offer must say `not verified`; verified evidence needs an immutable reference. |
| Traceable retirement | A retired offer keeps its historical ref and must state its retirement reason. |
| Consistent discovery | CI rejects a README catalog block that differs from the JSON index. |

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
| Permission manifests | Declare command or web needs and their risk tiers for participating skills. | Individual `permissions.json` files |
| Permission script | Reads host rules, reports questions and applies only the chosen project configuration. | Individual `scripts/permissions.mjs` copies |
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
5. It compares the index with `HEAD`, or with `HEAD^` when the working index already matches `HEAD`.
6. It requires an index revision increase when the editorial offer changes.
7. It renders active and retired rows, then compares the single README block.
8. Check mode fails on a mismatch. Generation replaces only that block when it differs.
9. Any validation error reaches stderr and gives the command exit code 1.

Load a skill that includes the permission step:

1. The host reads the acquired skill's instructions and runs its permission script's `check` command.
2. The script loads that skill's manifest and reads existing project and global host permissions.
3. It reports covered, missing, unsupported and previously declined needs.
4. It groups missing needs by low or high risk and offers the corresponding choices.
5. The person chooses whether to keep prompting, apply project rules or remember a local skip.
6. Only the chosen `apply` command writes settings, rules or skip state.
7. Codex writes require project trust. Antigravity receives a notice and no project-rule write.
8. The host retains control over command execution; the permission script does not execute the declared commands.

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
| Permission target project | Current folder; nearest Git root for applicable host rules | A participating skill's permission command | Pass `--root`. |
| Claude Code rule files | Git-root `.claude/settings.local.json`; session-root `.claude/settings.json` | Chosen local or shared apply | Choose the scope and project root. |
| Codex rule file | Git-root `.codex/rules/agent-skills.rules` | Approved command rules in a trusted project | Choose approved needs; start another Codex session to load them. |
| Local skip state | `.agent-skills/permissions-state.json`, with its own ignore file | Chosen `--dont-ask` option | Choose that option for the declared need IDs. |
| Antigravity project rules | Unsupported | Permission check or apply | Review the reported needs in the host; no project rules are written. |

Requirements: Node.js and Git for repository validation; CI selects Node.js 22.
Each skill declares additional tools for its own work. Those tools are not collective catalog dependencies.

Release by tag is separate from validation.
The checker proves local tagged contents; it neither creates tags nor prepares GitHub Releases.
The per-skill release notes supply the text for the separately prepared release.
No current repository workflow publishes those releases.

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

Line numbers refer to commit `af92ba0`. Every row cites code or configuration; the text above does not link to the code on purpose.

| Section | Evidence |
|---|---|
| 1. Goals | `catalog/index.json:1-18`, `scripts/catalog.mjs:69-114`, `scripts/catalog.mjs:125-130`, `scripts/catalog.mjs:172-178` |
| 2. Context | `scripts/catalog.mjs:28-33`, `scripts/catalog.mjs:96-100`, `scripts/catalog.mjs:154-178`, `.github/workflows/catalog.yml:3-19`, `skills/git/git-conventions/SKILL.md:8-18` |
| 3. Blocks | `catalog/index.json:1-18`, `scripts/catalog.mjs:103-130`, `scripts/catalog.mjs:137-151`, `skills/git/git-conventions/permissions.json:1-34`, `.github/workflows/catalog.yml:8-19` |
| 3. Rules | `scripts/catalog.mjs:36-40`, `scripts/catalog.mjs:48-56`, `scripts/catalog.mjs:103-130`, `scripts/catalog.mjs:162-178`, `skills/git/git-conventions/scripts/permissions.mjs:443-465` |
| 4. Runtime | `scripts/catalog.mjs:154-187`, `skills/git/git-conventions/scripts/permissions.mjs:317-339`, `skills/git/git-conventions/scripts/permissions.mjs:348-396`, `skills/git/git-conventions/scripts/permissions.mjs:443-465` |
| 5. Deployment | `.github/workflows/catalog.yml:3-19`, `scripts/catalog.mjs:103-130`, `scripts/catalog.mjs:172-187`, `skills/git/git-conventions/scripts/permissions.mjs:139-167`, `skills/git/git-conventions/scripts/permissions.mjs:278-303` |
| 6. Privacy | `scripts/catalog.mjs:21-40`, `scripts/catalog.mjs:59-66`, `scripts/catalog.mjs:83-100`, `scripts/catalog.mjs:154-189`, `skills/git/git-conventions/scripts/permissions.mjs:57-65`, `skills/git/git-conventions/scripts/permissions.mjs:278-303`, `skills/git/git-conventions/scripts/permissions.mjs:348-380`, `skills/git/git-conventions/scripts/permissions.mjs:401-465` |
| 7. Decisions | `scripts/catalog.mjs:93-114`, `scripts/catalog.mjs:125-130`, `skills/git/git-conventions/scripts/permissions.mjs:348-380`, `skills/git/git-conventions/scripts/permissions.mjs:443-465`. These establish behavior; the person confirmed the reasons on 2026-11-18. |
