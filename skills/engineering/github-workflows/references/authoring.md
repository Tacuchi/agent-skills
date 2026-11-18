# `generate <repo>` and `update <repo>`

Both write workflow files. Neither pushes. Read [pattern.md](pattern.md) for the rules and [pushing.md](pushing.md) before proposing a push.

## Before either

1. Run `check` and read its answer.
2. Find the branch the repository declares for work. If none is declared, ask.
3. If the repository has pending changes, show them and ask before editing.

## `generate <repo>`

For a repository that lacks a workflow it needs.

1. Decide which one is missing: tests, deployment or publication. When more than one fits, ask.
2. Read the repository for what the template needs: how the tests run, the runtime and its version, whether there is a `Dockerfile`, the name of the image, the default branch.
3. Ask only what the repository does not answer, in one round: where it deploys, the names of the secrets, how the target reports health.
4. Copy the template and fill every placeholder. A placeholder nobody could fill stays out: remove that step and say so.
5. Run `check` on the result. Fix until it has no errors.
6. Show the whole new file and propose the commit, as a structured question.

Never write a secret, a private address or an identifier into a workflow. Those go in the repository secrets, by name.

## `update <repo>`

For workflows that exist and leave the pattern.

1. For each finding, read the workflow around its line.
2. Write the smallest change that fixes it, in the style the file already has: its indentation, its comments, its step names.
3. For `no-health-check`, model the new step on the deployment step of the same file: the same target, the same secrets. If the file does not show how the target reports health, ask.
   - Before proposing a probe of a public address, request it once and read the answer. A redirect to a login or to an access proxy means the probe would never reach the service: do not write it.
   - When the image declares no health check, the target cannot report the service as healthy. Say so and offer the real options: a health check in the image, or leaving the finding open. Never write a check that cannot fail.
4. Show the exact lines, before and after, and ask. Editing a pipeline always needs its own yes.
5. After the edit, run `check`. The work ends with no errors.
6. Propose the commit. For the push, follow [pushing.md](pushing.md): a changed workflow runs once when it is pushed.

A finding you decide not to fix is reported with the reason. A warning may stay when the person says so.
