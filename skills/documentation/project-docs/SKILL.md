---
name: project-docs
description: "Documents a repository in a fixed, publishable format and keeps it current: a standard-order README, an ARCHITECTURE.md with seven numbered sections and an evidence appendix pinned to a commit, two Archify diagrams (context and containers) and decision records in docs/decisions/. Use when the person asks to document a project or repo, write or refresh ARCHITECTURE.md, record architecture decisions, or bring the docs up to date after a release or a code change. Three commands: `generate <repo>` builds everything for a repo that has no ARCHITECTURE.md, `update <repo>` fixes only what went stale, `check <repo>` is read-only and reports stale evidence, broken links and private data. Runs only on request and never publishes values measured on one machine. Not for a single diagram (the `system-diagrams` skill, if available, covers that), for prose style alone (the `technical-writing` skill, if available), for API reference or for documentation sites."
---

# project-docs — Document a repository and keep it current

## Step 0 — Permissions this skill uses

Run this once, when the skill loads and before its other steps. It keeps the session from stopping on a prompt for a command this skill is known to run. It is not a security check: the host and its hooks still decide.

1. Run `node <skill dir>/scripts/permissions.mjs check --root <session folder> --host <claude|codex|agy>`. `<skill dir>` is the folder of this `SKILL.md`; `<session folder>` is the folder where the session started; the host is the one you run in.
2. If `node` is missing or the command fails, say so, list the needs in `<skill dir>/permissions.json` and go on with the skill.
3. Read `hosts.<host>` in the output. Show its `notice` when there is one.
4. Ask each entry of its `questions` with the host's structured question tool, in the person's language: its `text`, then its options in the given order, the one marked `recommended` first. Low-risk and high-risk needs are separate questions; ask them separately and never recommend allowing a high-risk need.
5. Run the `command` of the option the person chose, exactly as given. An option without a command writes nothing. Write nothing the person did not choose.
6. Tell the person the `applies` line of the result: whether the change works now or after a restart. If the command fails, say so and go on.
7. After "Skip for now", do not run this step again in the session.

## Commands

Every command runs only when the person asks, and takes the path of a local git repository. Without a path, use the current folder when it is a git repository; otherwise ask for it.

| Command | When | What it does |
|---|---|---|
| `generate <repo>` | The repository has no `ARCHITECTURE.md` | Builds the whole published set and proposes the commit |
| `update <repo>` | The published set already exists | Finds what went stale and edits only that |
| `check <repo>` | Any time | Reads and reports; edits nothing |

Start every command with the facts of the repository:

```sh
node <skill dir>/scripts/check.mjs --repo <repo> --preflight --json
```

Read its answer before anything else:

- `git: false`: stop. The path is not a git repository.
- `generate` with `architecture: true`: stop and name `update`. Nothing is generated over an existing `ARCHITECTURE.md`.
- `update` with `architecture: false`: stop and name `generate`.
- `dirty: true`: show the pending changes and ask before editing.
- `shallow: true`: say that the pinned commit may be missing and that `git fetch --unshallow` brings the history.
- `private_terms: null`: say once that own domains and device names are not being checked, and where the example list goes.
- `preferences`: when it names a file, read it before asking anything. An answer written there is the person's: use it, do not ask it again, and say at the handover which answers came from that file.
- `archify: null` or `chrome: null`: say what is missing before any work. [references/diagrams.md](references/diagrams.md) says how to go on. The same file says what an `archify_version` older than 3.3 means.

### `check <repo>`

```sh
node <skill dir>/scripts/check.mjs --repo <repo> --json
```

- It needs no model and no network. Exit code 0 is clean, warnings included; 1 is findings; 2 is a usage or environment problem, explained in `error.message`.
- Report the findings in the person's language, errors first, each with its file, section and code. Then say which command fixes them.
- `check` never edits. When the person wants the findings fixed, that is `update`.

### `generate <repo>` and `update <repo>`

Each has its own procedure. Read it whole before the first edit and follow its steps in order:

- `generate`: [references/generate.md](references/generate.md)
- `update`: [references/update.md](references/update.md)

## Rules that never break

1. Nothing measured on one machine goes into a published file: no memory figures, uptimes, absolute home paths, own domains, device names or installed versions.
2. Every claim is backed by a citation to code or configuration at the pinned commit. The documentation set is never its own evidence.
3. A reason nobody stated is written as "Not recorded yet", never invented.
4. `update` edits only the sections its findings and the change touch.
5. Nothing is overwritten without being read first; `generate` never runs over an existing `ARCHITECTURE.md`.
6. Commits are proposed with paths and a one-line message; pushing and turning on GitHub Pages need the person's explicit yes, and Pages is offered only for a public repository.
7. The work ends with `check` exiting 0.

## Questions

- Ask every question and every approval with the host's structured question tool: the recommended option first, each option with what it does.
- Each question stands alone: name the repository, the file and the thing asked about, because the person may see only the question.
- Without that tool, ask with a labeled list of options.
- `generate` asks one round of at most four questions, and only about what the code does not answer.
- Never ask what the repository or the preferences file already answers.

## Where to read next

- Before writing or reviewing any published file, read [references/format.md](references/format.md): the three pieces, their rules and the exact shapes `check` reads.
- Before creating or changing a diagram, read [references/diagrams.md](references/diagrams.md).
- Before proposing a push, read [references/publishing.md](references/publishing.md): a push of documentation can start a build or a deployment.
- Start each file from its template: [ARCHITECTURE.md](assets/ARCHITECTURE.md.template), [README.md](assets/README.md.template) and [a decision record](assets/decision.md.template).
- To keep own domains and device names out of the published set, copy [the private terms example](assets/private-terms.example.txt) where its first lines say.
- To stop answering the same questions in every repository, copy [the preferences example](assets/preferences.example.md) where its first lines say.
