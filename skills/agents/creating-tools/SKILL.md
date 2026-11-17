---
name: creating-tools
description: "Use when authoring an auxiliary developer tool — a one-off automation, data generator, migration helper, scaffolder, seed/fixture script, CI/CD helper, or reusable config — i.e. support tooling that is NOT product business logic; also whenever such a tool's runs, logs, or outputs need a consistent home. Creates and organizes the tool under docs/tools/<tool>/ with a README, the code (or a pointer to it in a source repo), timestamped run logs (runs/<ts>/), and results (output/), and creates docs/tools if missing. Stack-agnostic; works in any repo. Ships scaffold-tool and record-run scripts. For the tool's code quality, the `coding-standards` skill (and the matching stack skill) helps if available; for safe commits, the `git-conventions` skill if available; for the README prose, the `technical-writing` skill if available; for secrets or SQL, the `security-practices` skill if available — DB mutations are never run inline (SQL goes to a versioned script the user applies)."
---

# creating-tools — Authoring and organizing auxiliary tools

## Step 0 — Permissions this skill uses

Run this once, when the skill loads and before its other steps. It keeps the session from stopping on a prompt for a command this skill is known to run. It is not a security check: the host and its hooks still decide.

1. Run `node <skill dir>/scripts/permissions.mjs check --root <session folder> --host <claude|codex|agy>`. `<skill dir>` is the folder of this `SKILL.md`; `<session folder>` is the folder where the session started; the host is the one you run in.
2. If `node` is missing or the command fails, say so, list the needs in `<skill dir>/permissions.json` and go on with the skill.
3. Read `hosts.<host>` in the output. Show its `notice` when there is one.
4. Ask each entry of its `questions` with the host's structured question tool, in the person's language: its `text`, then its options in the given order, the one marked `recommended` first. Low-risk and high-risk needs are separate questions; ask them separately and never recommend allowing a high-risk need.
5. Run the `command` of the option the person chose, exactly as given. An option without a command writes nothing. Write nothing the person did not choose.
6. Tell the person the `applies` line of the result: whether the change works now or after a restart. If the command fails, say so and go on.
7. After "Skip for now", do not run this step again in the session.

## Purpose

Create **auxiliary tools/utilities** (scripts, CLIs, helpers, generators, reusable configs) with a consistent structure under `docs/tools/<tool>/`: the code (or a pointer to its repo), a README, per-run logs and the results. It covers **support tooling** — never product code. Reusable at any time, in any repo; **it creates `docs/tools` if missing**. It contributes the structure and the lifecycle; the tool's code is written by the consumer (following the `coding-standards` skill, if available).

## Knowledge

### Tool vs product code

A **tool** is a support artifact, never business logic of the final product:

- Seed/fixture scripts for local development.
- Auxiliary CLIs (`validate-schema.js`, `sync-env.sh`).
- CI/CD helpers (deploy, config linters).
- Generators/scaffolders for repetitive tasks.
- Reusable configs (environment templates, test fixtures).

If the artifact is product business logic → **it is not a tool** (this skill does not apply).

### On-disk structure — `docs/tools/<tool>/`

One folder per tool, with a **short, clear, descriptive** name (kebab-case; **no `NNN` numbering** — addressed by name):

```
docs/tools/
├── README.md                      # tool index (table)
└── <tool-slug>/
    ├── README.md                  # the tool's contract (see assets/README.template.md)
    ├── <code>                     # only if the tool is self-contained
    ├── runs/                       # one run = one immutable folder
    │   └── <YYYY-MM-DD_HH-MM-SS>/
    │       ├── command.txt         # exact command + args + exit_code
    │       ├── run.log             # captured stdout/stderr
    │       └── output/             # results of THAT run
    └── output/
        └── latest -> ../runs/<latest>/output
```

- **`runs/` is immutable**: every execution creates its timestamped folder; never overwritten. `output/latest` points at the most recent one.

### Where does the code live? Two models (the README declares it)

| Model | Code | docs/tools/<tool>/ | When |
|---|---|---|---|
| **code-in-repo** (default) | in the source repo (`scripts/`, `tools/`, `bin/`) | README (with `Repo`+`Path`) + `runs/` + `output/` | the tool belongs to a concrete source |
| **self-contained** | inside `docs/tools/<tool>/` | code + README + `runs/` + `output/` | a workspace utility, not tied to one repo |

### Lifecycle (checklist)

1. **Create** the structure: `node scaffold-tool.mjs <slug>` → creates `docs/tools/<slug>/` + `runs/` + `output/` + `README.md` from the template (and `docs/tools` if missing; never clobbers an already-edited README).
2. **Write** the tool's code (in the source repo, or self-contained) — following the `coding-standards` skill and the stack skill, if available.
3. **Document** the README: purpose, usage, parameters, inputs/outputs, dependencies, examples.
4. **Run** via `node record-run.mjs <slug> -- <cmd…>` → archives `runs/<ts>/{command.txt, run.log, output/}` and moves `output/latest`.
5. **Register** the tool in the `docs/tools/README.md` index (the scaffolder does it).

### Bundled scripts (prefer them over regenerating by hand)

- **`node scripts/scaffold-tool.mjs <slug> [--type T] [--repo ALIAS] [--path REL]`** — creates the idempotent structure + the README from `assets/README.template.md`. Run `--help` for the flags.
- **`node scripts/record-run.mjs <slug> -- <cmd> [args…]`** — runs the command, captures `command.txt` + `run.log` + `output/` under `runs/<ts>/`, exports `RUN_OUTPUT_DIR` (absolute) so the tool writes there, and updates `output/latest`.

> Single-source Node (no deps): they run identically on native Windows, macOS and Linux — always invoked with `node` (no bash dependency).

Run them as `node <skill dir>/scripts/<script>.mjs`, with the absolute folder of this `SKILL.md`: that is the form the rules of step 0 allow.

### Self-contained tools: declare dependencies

A tool that fails silently for a missing binary is worse than no tool. Check dependencies at start:

```bash
command -v jq >/dev/null 2>&1 || { echo "jq required: brew install jq" >&2; exit 1; }
```

Shell: `set -euo pipefail`, quoted variables, shellcheck-friendly. Other languages: follow the stack skill (explicit types, explicit error handling, docstring/Javadoc on the public surface).

### Git and DB

- **Git-safe** (the `git-conventions` skill, if available, has the detail): verify the expected branch before writing; propose the commit; never `push`/`--amend`/`--no-verify`. If the tool modifies an existing file, read it whole first.
- **DB** (the `security-practices` and `sql-authoring` skills, if available, have the detail): a tool may **generate** a `.sql`, but it **never executes it** against the DB (mutations go to a versioned script the user applies; DB via MCP = read-only).

## Output

Per tool, under `docs/tools/<tool>/`:

- **README.md** — the contract (template in `assets/README.template.md`).
- **code** — in the source repo (code-in-repo) or here (self-contained); the README says which.
- **runs/<ts>/** — `command.txt` + `run.log` + `output/` per execution (immutable).
- **output/latest** — pointer to the latest run.
- A row in the **`docs/tools/README.md`** index.

It creates `docs/tools/` if missing. It writes in no other `docs/` folder.
