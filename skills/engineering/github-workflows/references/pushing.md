# What a push starts

Read this before a push that touches a workflow, and before a push to a branch whose workflows deploy.

## Before the push

1. Run `check`. For each workflow, `triggers` says what starts it and `docs_push_runs` whether documentation alone would.
2. Say what the push would run: tests, a build or a deployment. Name a deployment before pushing.
3. Never push to find out. A deployment that restarts a service is not undone by a later commit.

## Leave the documentation out

The filter goes on the trigger, under `push` and, when present, under `pull_request`:

```yaml
on:
  push:
    branches: [main]
    paths-ignore:
      - "docs/**"
      - "README.md"
      - "ARCHITECTURE.md"
```

Keep every other trigger as it is.

## The push that changes a workflow

That push starts the workflow once, because the workflow file is not documentation: GitHub compares the whole pushed range, and one changed file outside the filter is enough.

Ask the person which they prefer:

- **One run now.** It proves the edited workflow. For a deployment, it restarts the service with the same code.
- **No run.** The message of the last commit of the push carries `[skip ci]`. Nothing runs, and the edited workflow is first exercised by the next change of code.

When several repositories are pushed, push first one that does not deploy and confirm that nothing started.

## After the push

```sh
gh run list --limit 3
```

Compare the commit of the newest run with the commit you pushed. Report at once a run nobody expected, with its link.
