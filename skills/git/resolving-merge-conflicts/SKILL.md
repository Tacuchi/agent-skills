---
name: resolving-merge-conflicts
description: "Use when a Git merge is in progress, a file has merge conflict markers, or the user asks to resolve, resume, or diagnose merge conflicts in any repository. Inspect the merge base, ours, theirs and their intent before choosing; resolve selected files incrementally, preserve unrelated changes, ask about ambiguous hunks, and run the merged checkout's build and tests before proposing an approved commit. Works with Git alone, including after an interrupted merge. For general commit/branch rules, use the `git-conventions` skill if available; follow the repository's own instructions for branch directions."
---

# Resolving merge conflicts

## Boundary

Resolve a **merge already in progress** in the affected Git checkout. A request
to *start* a merge is a separate decision: inspect the branch and ask for its
explicit authorization first. This skill uses Git and the repository's own
instructions and runners; no workspace manager, plugin or particular host
installation is required. Do not resolve a rebase or cherry-pick
as if it were a merge (`REBASE_HEAD` / `CHERRY_PICK_HEAD` have different exits).

## Inspect before editing

1. In the affected checkout, run `git status --short --branch`, `git status`,
   `git rev-parse --git-path MERGE_HEAD` and check that the returned file exists.
   Read `git rev-parse HEAD`, `git rev-parse MERGE_HEAD`,
   `git ls-files -u` and `git diff --name-only --diff-filter=U`.
   If there is no `MERGE_HEAD`, report the actual state; if it exists but no
   unmerged paths remain, resume at the closing checks (not a new merge).
2. `git merge-base --all HEAD MERGE_HEAD` identifies ancestry. **Several bases**
   mean the index's `:1:` may be Git's *virtual* base: inspect each base with
   `git show <base>:<path>` where present, and ask if their intent is unclear.
   With one base, `git show :1:<path>` is the index base. For each unmerged path
   inspect `git ls-files -u -- <path>` and `git show :2:<path>` (ours, current
   branch) / `git show :3:<path>` (theirs, incoming branch); a missing stage
   denotes add/delete and cannot be selected as a file. Binary paths need
   explicit evidence for retaining an intact side or deleting the file.
3. Read the neighboring code, relevant commits (`git log --oneline --all --
   <path>`) and repository instructions. Identify what each side intended,
   including a rename or a deletion; never choose a whole side just because it
   is shorter. Inventory cleanly merged files that depend on the conflict, plus
   pre-existing staged, unstaged and untracked work. Name foreign work before
   any edit; do not overwrite, stash, reset, clean or stage it.

## Resolve in small, reversible steps

- For an unambiguous path, edit only that path to integrate both intents;
  preserve encoding, line endings and executable mode. A justified intact-side
  selection for a binary or add/delete conflict still needs the user's intended
  result. Check `git diff --check -- <path>`, inspect the file and stage only
  this resolved path with `git add -- <path>` (or `git rm -- <path>` for a
  justified deletion). Never stage all files with `git add .`.
- A subset is enough: rerun `git ls-files -u` and `git status` after each
  application. Record what was resolved, what remains and what was untouched;
  the index plus `MERGE_HEAD` are the resume state after an interruption.
  Resolve another path later without reapplying work already staged.
- If the right behavior, a binary side, a missing stage or a semantic adjustment
  is ambiguous, **stop on that path** and show base/ours/theirs with the
  consequence of each plausible choice. Wait for the person's written decision;
  leave `MERGE_HEAD`, index and files intact. You may continue independent,
  unambiguous paths first. To change a cleanly merged related file, inspect its
  staged and worktree versions and establish ownership before editing/staging it.
- If the merge itself must be abandoned, explain the effect and request separate
  authorization for `git merge --abort`; never use it as an automatic recovery.

## Close only after checking the *merged* checkout

1. `git ls-files -u` must be empty; `git diff --check` and
   `git diff --cached --check` must pass. Read `git status`,
   `git diff --cached --stat` and `git diff --cached` for the whole merge,
   including changes Git staged automatically. Identify any unrelated staged
   files and unstaged/untracked work; do not include somebody else's work.
   The test runner reads the worktree: if it differs materially from the staged
   merge, reconcile your own changes and pause on foreign changes rather than
   claiming the staged result was tested.
2. Discover the **versioned** build and test commands of the destination repo
   (its pipeline, package scripts, wrapper or instructions). Run both on this
   merged checkout, not on the source branch. If a command is undeclared or
   cannot run, report the blocker and leave the merge open. If a failure is
   claimed pre-existing, demonstrate it with the same command on an untouched
   base separately; do not discard the merge to test that claim. After fixes,
   rerun affected checks and inspect status and index again.
3. Propose the exact included paths, one-line message and results of **both**
   commands. Ask the person to approve the merge commit; do not create it while
   awaiting approval. Once explicitly approved, recheck `MERGE_HEAD`, branch,
   `git ls-files -u` and staged paths, then commit with normal hooks (no
   `--no-verify`, amend or push). If state changed, stop and re-inspect instead
   of using a stale approval. Report the new commit or, if still pending, the
   remaining paths and next action.
