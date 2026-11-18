# Publishing the documentation

Read this before proposing a push. A commit that changes only documentation can still start a build or a deployment.

## Before the push

1. Read the workflows of the repository, in `.github/workflows/`.
2. For each one that starts on a push to the branch you are about to push, see what it does and whether a path filter leaves the documentation out.
3. When a push would start a build, a test matrix or a deployment and nothing filters the documentation, say so before proposing the push. Name the workflow and what it would do.

Never push to find out. A deployment that restarts a service is not undone by a later commit.

## Leave the documentation out of the trigger

The fix is a path filter on the trigger, under `push` and, when present, under `pull_request`:

```yaml
on:
  push:
    branches: [main]
    paths-ignore:
      - "docs/**"
      - "README.md"
      - "ARCHITECTURE.md"
```

- Editing a pipeline needs the person's explicit yes. Show the exact lines and ask with a structured question.
- Keep `workflow_dispatch` and every other trigger as they are.
- Check that the file still parses before committing it.

## The push that carries the filter

That push still starts the workflow once, because the workflow file is not documentation. GitHub compares the whole pushed range, so one changed file outside the filter is enough.

Ask the person which they prefer:

- **One run now.** It proves the edited workflow still works. For a deployment, it restarts the service with the same code.
- **No run.** The last commit of the push carries `[skip ci]` in its message. Nothing runs, and the edited workflow is first exercised by the next code change.

`[skip ci]` must be in the last commit of the push. If another commit lands on top before pushing, that one needs it too.

## The documentation may cite the workflow

After editing a workflow, run `check`. The edit moves the lines below it and changes the trigger.

- A `moved` citation is refreshed by the re-pin.
- A `stale` citation on the trigger means a claim changed too: "every push deploys" is no longer true. Correct the sentence, point the row at the new lines and re-pin with `--reviewed`, as [update.md](update.md) says.
- A diagram box that cites the trigger is regenerated, as [diagrams.md](diagrams.md) says.

Commit the workflow first: the re-pin needs the cited file committed.

## After the push

Confirm what ran. When the `gh` command is available:

```sh
gh run list --limit 3
```

Compare the commit of the newest run with the commit you pushed. A run on your commit that you did not expect is reported at once, with its link.

## Interactive diagrams

GitHub Pages is a separate decision, only for a public repository. [diagrams.md](diagrams.md) has its rules.
