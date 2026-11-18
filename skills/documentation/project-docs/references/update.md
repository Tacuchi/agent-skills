# `update <repo>`

Brings an existing published set up to date after a release or a code change. It edits only what the findings and the change touch. Read [format.md](format.md) before editing a file.

## 1. See what went stale

```sh
node <skill dir>/scripts/check.mjs --repo <repo> --json
```

Keep `pin.commit` from the answer: it is the commit the document was last reviewed against.

## 2. Read the change since the pin

```sh
git log --oneline <pin>..HEAD
git diff --stat <pin>..HEAD
```

Read also the release notes or the changelog when the repository has them, and compare `pin.version` with `project_version`.

## 3. Handle each finding

| Code | What it means | What to do |
|---|---|---|
| `stale` | The cited lines changed or are gone | Compare `git show <pin>:<path>` with the file now. If the claim still holds, point the row at the lines that prove it today. If it changed, correct the section. If it is gone, remove or replace the claim |
| `moved` | The same lines are elsewhere in the file | Nothing by hand: the re-pin of step 6 rewrites the range |
| `too-many-citations` | A row cites more than five ranges | Keep the five that prove the section and drop the rest |
| `volatile-citation` | A cited range covers a version or revision line | Narrow the range so that line stays out |
| `self-citation` | The row cites the documentation itself | Replace it with code or configuration that proves the same claim. If nothing does, ask the person or reword the claim |
| `missing-at-pin`, `out-of-range` | The row never matched | Fix the path or the range |
| `version-behind` | The project moved to a newer version | Nothing by hand: the re-pin updates the header |
| `diagram-source-stale` | Code that a diagram box cites changed | See whether a box, an arrow or a label is now wrong. Regenerate that diagram either way, following [diagrams.md](diagrams.md) |
| `diagram-source-moved` | Cited code moved inside its file | Nothing: the links of the page point at the diagram's own commit |
| `diagram-self-citation` | A diagram box cites the documentation itself | Cite the code or the manifest that proves the box, then regenerate that diagram |
| `diagram-missing-file` | A diagram lacks its page or its image | Generate or export it |
| `broken-link`, `broken-anchor` | A relative link leads nowhere | Fix the link or the heading |
| `local-path`, `secret-pattern`, `private-term` | Private data in the published set | Remove it and convert it with the table of [format.md](format.md). For a secret, tell the person at once: it may need to be revoked |
| `over-budget`, `long-table` | The document or a table grew past the budget | Move the detail to a guide, `docs/<topic>.md`, link it from the sentence it left, and keep every fact |
| `no-summary` | The summary list before section 1 is missing | Write it: up to five lines |
| any other `structure` code | A piece or a required shape is missing | Restore the shape of [format.md](format.md) |

When you cannot tell whether a claim still holds, ask the person with a structured question that quotes the claim and names the file that changed.

## 4. Look for what nobody cites

A change can add something no row mentions. Read the changed files of step 2 for:

- a new module or top-level folder;
- a new command, port, environment variable or stored file;
- a new external service or network call;
- a dependency that changes what leaves the machine.

Add each to its section and to the appendix. Change a diagram only when a box, an arrow or a label changes.

## 5. Add decisions

Add a record for each new decision with a stated reason. Never rewrite an accepted record: write a new one and mark the old one `superseded by NNNN`.

## 6. Re-pin

The cited code must already be committed; do not commit or stash it on the person's behalf. Then move the pin to `HEAD`:

```sh
node <skill dir>/scripts/check.mjs --repo <repo> --repin --json
```

- It rewrites the commit in the header and in the appendix, the date, the version and every moved range. It never touches a diagram.
- It refuses while a citation is stale or does not match the old pin. After you handled every such finding in step 3 and rewrote those rows to today's lines, run it with `--reviewed`: that flag states that you reviewed them, and each row is then judged at `HEAD` alone. The answer lists what it accepted under `repin.accepted`; read that list and make sure every row in it is one you reviewed or added.
- A row that cites code added after the old pin needs `--reviewed` for the same reason: it did not exist at that commit.
- It refuses when a cited file has uncommitted changes. Tell the person which files; do not commit them yourself.

Run `check` again. The work ends at exit code 0.

## 7. Hand over

1. Report section by section: what changed and why, and what you left as it was.
2. Propose the commit with its exact paths and a one-line message, as a structured question. Commit only after the person approves. Never push unless they ask.
3. Before any push, follow [publishing.md](publishing.md): a push of documentation can start a build or a deployment.
