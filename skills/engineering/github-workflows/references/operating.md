# `status`, `deploy` and `rollback`

All three go through the `gh` command and need its session. The script reads and decides; you ask the person.

## `status <repo>`

```sh
node <skill dir>/scripts/ops.mjs status --repo <repo> --json
```

- `runs` are the latest runs, newest first. `deployed` is the commit of the last successful deployment and its run.
- `failed` names the job and the step of the newest failed run, with an excerpt of its log.
- Exit code 2 means `gh` is missing, has no session or failed. Say so. Never report "no runs" from an error.

## `deploy <repo>`

1. Run it without a confirmation:

   ```sh
   node <skill dir>/scripts/ops.mjs deploy --repo <repo> --ref <branch or tag> --json
   ```

   It exits with code 3 and prints a plan and a token. Nothing has started.
2. Show the plan to the person with a structured question: the repository, the workflow, the exact commit and what restarts. The option that deploys is never the recommended one unless the person asked for this deployment.
3. Only with their yes, run it again with `--confirm <token>`. It starts the workflow, follows the run and exits by its result.
4. Report the result and the link of the run. On a failure, show the step and its error.

The token belongs to that plan. If the branch moves in between, the script refuses and you start again from step 1.

`--ref` is a branch or a tag: GitHub does not start a workflow on a bare commit. To put an older commit back, use `rollback`.

## `rollback <repo>`

Same three steps, with `rollback`:

```sh
node <skill dir>/scripts/ops.mjs rollback --repo <repo> --json
node <skill dir>/scripts/ops.mjs rollback --repo <repo> --run <run id> --json
```

- Without `--run` it picks the last successful deployment before the one deployed now. With `--run` it takes that run.
- It runs that earlier run again. That rebuilds the image of that commit and moves the `latest` tag back. Say so in the question.
- When there is no earlier good run, it refuses. Tell the person; do not pick another by hand.
- After a rollback the branch is ahead of what is deployed. Say that the next push deploys the newer code again.

## What stays outside

Settings of the target itself, such as its environment or its domains, are not changed from here.
