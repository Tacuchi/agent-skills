# The pattern

Read this to understand a finding of `check` or to review a workflow by hand.

## What every workflow follows

| Code | Level | What it means | Fix |
|---|---|---|---|
| `unreadable` | error | The checker could not read the file as YAML. Its line is in the finding | Fix the syntax. If the file is valid and uses a construct the checker does not read, say so and review it by hand |
| `inline-secret` | error | A value that looks like a secret is written in the file | Move it to the repository secrets and tell the person: it may need to be revoked |
| `docs-trigger` | error for deployment and publication, warning for tests | A push that changes only documentation starts it | Add the path filter of [pushing.md](pushing.md) |
| `no-permissions` | warning | It writes somewhere and declares no `permissions` | Declare the smallest set the job uses, on that job |

## What a deployment workflow follows too

| Code | Level | What it means | Fix |
|---|---|---|---|
| `no-concurrency` | error | Two deployments can run at once | A `concurrency` group per branch |
| `cancels-in-progress` | error | A new push cancels the deployment under way | `cancel-in-progress: false` |
| `build-before-tests` | error | The image is built without waiting for the tests | `needs` from the build job to the test job |
| `mutable-tag` | error | No image tag carries the commit | Tag the image with the commit hash; `latest` may stay as a second tag |
| `no-health-check` | error | Nothing verifies the service after deploying | A step that asks the target for the state and fails when it is not healthy |
| `no-manual-trigger` | warning | It cannot be started by hand | `workflow_dispatch` |
| `fails-without-secrets` | warning | Without the target's secrets the deployment step fails | Guard the step with an `if` on the presence of its secrets |

## What kind a workflow is

- **deployment**: it builds and pushes an image, or calls a deployment, on a push.
- **publication**: it starts on a release.
- **tests**: it only runs checks.
- **other**: anything else. Only the rules for every workflow apply.

## Judgment the checker does not have

- Whether the health step asks the right thing. It only sees that a step exists and can fail.
- Whether a probe reaches the service. A request to a public address that sits behind a login or an access proxy is answered by that proxy: it proves the proxy, and passes while the service is down.
- Whether a secret is really a secret. It matches common shapes.
- Whether the tests are enough. It only sees that they run first.
