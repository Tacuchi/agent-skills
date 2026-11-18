---
name: github-workflows
description: "Reviews, creates and standardizes GitHub Actions workflows, and operates deployments through the gh command. Use when the person asks what a push will start, why a workflow ran or failed, to add or fix a CI or deployment workflow, to deploy by hand, to see what is deployed or to roll back. Six commands: `check <repo>` is read-only and reports what each workflow starts on and where it leaves the pattern; `generate <repo>` creates a missing workflow from a template; `update <repo>` brings existing workflows to the pattern; `status <repo>` shows the last runs and the deployed commit; `deploy <repo>` and `rollback <repo>` act on production and always ask first. Runs only on request. Not for other CI providers, for the orchestrator's own settings or for pipeline security audits."
---

# github-workflows — Review, write and operate GitHub Actions workflows

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

| Command | What it does | Reaches production |
|---|---|---|
| `check <repo>` | Reads the workflows: what starts each one, what it does and where it leaves the pattern | No |
| `generate <repo>` | Creates a missing workflow from a template | Not until it is pushed |
| `update <repo>` | Brings existing workflows to the pattern | Not until it is pushed |
| `status <repo>` | Last runs, the deployed commit and, for a failed run, the step and its error | No |
| `deploy <repo>` | Starts the deployment workflow by hand and follows it | Yes |
| `rollback <repo>` | Runs the last good deployment again and follows it | Yes |

### `check <repo>`

```sh
node <skill dir>/scripts/check.mjs --repo <repo> --json
```

- It needs no network and edits nothing. Exit code 0 is no errors, warnings included; 1 is errors; 2 is a usage or environment problem.
- For each workflow, say what starts it, what it does and whether a push of documentation alone would run it. Then the findings, errors first, each with its file, line and code.
- [references/pattern.md](references/pattern.md) explains every code and its fix.

### `generate <repo>` and `update <repo>`

Read [references/authoring.md](references/authoring.md) whole before the first edit and follow its steps in order.

### `status <repo>`, `deploy <repo>` and `rollback <repo>`

Read [references/operating.md](references/operating.md) first. `deploy` and `rollback` restart a running service: they never run without the person's yes to the plan the script prints.

## Rules that never break

1. Nothing that reaches production runs without the person's explicit yes, given to a plan that names the repository, the commit and what restarts.
2. A workflow is never edited without showing the exact lines first.
3. `update` changes only the lines a finding names.
4. A workflow the checker cannot read is reported as unreadable, never as clean.
5. A template is filled from the repository or from the person's answers, never from a guess.
6. An error from `gh` is an error, never an empty list.

## Questions

- Ask every question and every approval with the host's structured question tool: the recommended option first, each option with what it does.
- Each question stands alone: name the repository, the workflow and the commit, because the person may see only the question.
- Without that tool, ask with a labeled list of options.
- Never recommend an option that reaches production over one that does not, unless the person asked for the deployment.

## Where to read next

- Before a push that touches a workflow, or a push to a branch whose workflows deploy, read [references/pushing.md](references/pushing.md).
- Start each new workflow from its template: [tests](assets/ci.yml.template), [deployment](assets/deploy.yml.template) or [publication](assets/publish.yml.template).
