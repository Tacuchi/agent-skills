---
name: git-conventions
description: "Use whenever git is involved — committing, saving or staging changes, writing a commit message, branching, or any history/publish operation — in any repository, even when the user just says 'save this' or 'commit'. Commit messages: one line (what, not how), optional Conventional Commits prefix; propose exact paths and message first, commit only after approval. Verify the declared branch and dirty state before edits or branch switches; an isolation worktree's branch is valid when the work owns it. Never push, --amend, --no-verify, --force, or merge/rebase/reset/cherry-pick without an explicit request, and never add Co-Authored-By or model-signature trailers. Use the repository's declared branch, not branch names borrowed from other repos. Read-only git is allowed. For an in-progress merge, use the `resolving-merge-conflicts` skill if available; the `technical-writing` skill, if available, covers the commit/PR prose; the `reviewing-code` skill, if available, covers diff discipline."
---

# git-conventions — Safe git and commit conventions

## Purpose

Operate git in a **safe, controlled** way: propose commits, respect the branch model, and **never** run destructive or publishing operations without the user's explicit request.

## Knowledge

### Operations forbidden without an explicit user request

Closed list. The AI **never** runs them on its own initiative:

- `git commit` (includes `--amend`)
- `git push` (includes `--force` / `-f`)
- `git merge` · `git rebase` · `git cherry-pick`
- `git tag` (create or edit)
- `git reset --hard` · `git restore .` · `git checkout -- .` · `git clean -fd` · `git stash` (when there is uncommitted work)

And **always** forbidden, even when the user asks for a commit: `--no-verify` (respect the pre-commit hooks), `--force`, `Co-Authored-By` trailers, model signatures.

Facing a wrong branch or a needed-but-unrequested commit: **hand control back to the user** — the user decides, never the AI. A merge already in progress may be resolved (if the `resolving-merge-conflicts` skill is available, it covers that), but starting a new merge still requires the person's request.

### Read-only operations (always allowed, no asking)

`status` · `log` · `diff` · `branch --show-current` · `branch -a` · `rev-parse` · `show` · `ls-files -u` · `merge-base`.

### Commits — propose-then-execute

On any commit request or trigger ("commit this", "save the changes"):

1. Resolve the repo state (what changed, on which branch), inspect `git diff --cached` and identify the exact files belonging to this work. Do not include another person's changes.
2. **Propose** those paths and the commit message (canonical format below). Never commit until the user approves.
3. Stage only the approved paths, recheck the staged diff and branch, then run `git commit -m "<msg>"` after approval. Respect hooks (no `--no-verify`).
4. Nothing to commit → silent skip; report in chat.

**Exact message**: if the user provides `-m "..."`, use that message instead of proposing another; it does not authorize unrelated paths. Still confirm which paths are included, verify branch and hooks, and ask before committing unless the same request explicitly approved that exact change.

### Canonical message format

- **A single line**, short (≤72 chars suggested), descriptive (what changes, not how).
- Conventional Commits prefix **optional** (`feat:` `fix:` `docs:` `chore:` `refactor:` `test:`).
- **Forbidden**: multi-line/body, `Co-Authored-By` trailers, model signatures, emojis (unless explicitly requested), `--no-verify`.

Valid:
```
add email validation to sign-up
feat: new CSV export endpoint
fix: timeout when loading listings
```

The message's prose follows plain technical-writing rules (short sentence, "what + why", no jargon); if the `technical-writing` skill is available, it covers them. Never duplicated here.

### Branch model

Use the repository's declared base and work branch, not a branch inferred from the current checkout. Do not impose one repository's branch names or a shared multi-repo name on unrelated repos. An acquired isolation worktree may use its own declared branch name.

### Branch verification before editing (gate)

Never assume the expected branch from the current one (the user may have switched it by hand). Before creating/resuming work or starting to edit, read the repo's instructions or task's declared branch, then verify `git branch --show-current` and `git status --porcelain` **in each affected checkout** against that declaration (or the owning isolation worktree). If no branch is declared, ask rather than invent one:

- **Wrong + clean** → propose `git checkout <branch>` (still confirm; never create/switch silently).
- **Wrong + dirty** (uncommitted changes) → **PAUSE** for manual resolution. Never auto `stash`/`reset`/`checkout`/`clean`.
- **Analysis turning into edits** → propose creating the declared work branch before the first Edit; switching a clean checkout still needs confirmation.
- **Multi-repo**: check each source against its *own* declaration; the workspace checkout is not a proxy. Recheck branch and dirty state before a Git mutation in a shared clone.

## Output

Nothing on disk beyond the commits. It produces commits **only** when the user approves; never push, tag, or merge without an explicit request.
