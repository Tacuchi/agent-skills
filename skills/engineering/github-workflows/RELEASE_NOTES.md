# github-workflows 1.0.2

Reviews, creates and standardizes GitHub Actions workflows, and operates deployments through the `gh` command. `check <repo>` is read-only: it says what each workflow starts on, whether a push of documentation alone would run it, and where it leaves the pattern. `generate <repo>` and `update <repo>` write workflows from templates and show the exact lines before any edit. `status <repo>` shows the last runs and the deployed commit. `deploy <repo>` and `rollback <repo>` act on production and never run without the person's explicit yes to a plan that names the commit.

Version 1.0.2 narrows the low-risk permission rule to `permissions.mjs check`: the earlier rule also let an agent run `apply` and write allow rules the person never chose. Remove the broader rule from the host settings if an earlier version saved it.

Everything runs on request. It needs Node 22 or newer, git and, for the operations, the `gh` command with a session. It needs no other skill; the skills it mentions are optional.

Acquire the whole `github-workflows` directory from `Tacuchi/agent-skills` once the ref `skill/github-workflows/v1.0.2` exists.

Owner: Tacuchi. License: MIT, in the `LICENSE` file of this directory. The ref and its remote publication are created after this change.
