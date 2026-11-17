---
name: git-conventions
description: "Use whenever git is involved — committing, saving or staging changes, writing a commit message, branching, or any history/publish operation — in any repository, even when the user just says 'save this' or 'commit'. Commit messages: one line (what, not how), optional Conventional Commits prefix; propose exact paths and message first, commit only after approval. Verify the declared branch and dirty state before edits or branch switches; an isolation worktree's branch is valid when the work owns it. Never push, --amend, --no-verify, --force, or merge/rebase/reset/cherry-pick without an explicit request, and never add Co-Authored-By or model-signature trailers. Use the repository's declared branch, not branch names borrowed from other repos. Read-only git is allowed. For an in-progress merge, use the `resolving-merge-conflicts` skill if available; the `technical-writing` skill, if available, covers the commit/PR prose; the `reviewing-code` skill, if available, covers diff discipline."
---

# git-conventions — Safe git and commit conventions

## Step 0 — Permissions this skill uses

Run this once, when the skill loads and before its other steps. It keeps the session from stopping on a prompt for a command this skill is known to run. It is not a security check: the host and its hooks still decide.

1. Run `node <skill dir>/scripts/permissions.mjs check --root <session folder> --host <claude|codex|agy>`. `<skill dir>` is the folder of this `SKILL.md`; `<session folder>` is the folder where the session started; the host is the one you run in.
2. If `node` is missing or the command fails, say so, list the needs in `<skill dir>/permissions.json` and go on with the skill.
3. Read `hosts.<host>` in the output. Show its `notice` when there is one.
4. Ask each entry of its `questions` with the host's structured question tool, in the person's language: its `text`, then its options in the given order, the one marked `recommended` first. Low-risk and high-risk needs are separate questions; ask them separately and never recommend allowing a high-risk need.
5. Run the `command` of the option the person chose, exactly as given. An option without a command writes nothing. Write nothing the person did not choose.
6. Tell the person the `applies` line of the result: whether the change works now or after a restart. If the command fails, say so and go on.
7. After "Skip for now", do not run this step again in the session.

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

1. Resolve the repo state (what changed, on which branch), inspect `git diff --cached` and identify the exact files belonging to this work. Do not include another person's changes. If files outside this work are already staged, show them and ask; never unstage them yourself.
2. **Propose** those paths and the commit message (canonical format below). Never commit until the user approves. Ask with the host's structured question tool when it has one, the recommended option first (commit as proposed, adjust, do not commit); otherwise as a labeled list.
3. After approval, recheck the branch, then stage and commit the approved paths in one command with an explicit pathspec, and check the result with `git log -1 --stat`. Respect hooks (no `--no-verify`).

   ```
   git add -- <paths> && git commit -m "<msg>" -- <paths>
   ```

   The pathspec keeps out whatever the user or another session staged, also between your check and your commit; a bare `git commit` takes the whole index.
4. Nothing to commit → silent skip; report in chat.

Read a precondition in its own command and decide with its result in front of you: a check chained to the commit it should gate cannot stop it.

**Exact message**: if the user provides `-m "..."`, use that message instead of proposing another; it does not authorize unrelated paths. Still confirm which paths are included, verify branch and hooks, and ask before committing unless the same request explicitly approved that exact change.

### Canonical message format

- **A single line**, short (≤72 chars suggested), descriptive (what changes, not how).
- Name the change, not the process that produced it: no session names, plan or task numbers, unless the repository's convention asks for a ticket id.
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

Never assume the expected branch from the current one (the user may have switched it by hand). Before creating/resuming work or starting to edit, read the repo's instructions or task's declared branch, then verify `git branch --show-current` and `git status --porcelain` **in each affected checkout** against that declaration (or the owning isolation worktree). Verify again before the first write of **every round of edits**, even when the previous round ended well: between two turns the user may have merged and left the checkout on an integration branch. If no branch is declared, ask rather than invent one:

- **Wrong + clean** → propose `git checkout <branch>` (still confirm; never create/switch silently).
- **Wrong + dirty** (uncommitted changes) → **PAUSE** for manual resolution. Never auto `stash`/`reset`/`checkout`/`clean`.
- **Analysis turning into edits** → propose creating the declared work branch before the first Edit; switching a clean checkout still needs confirmation.
- **Multi-repo**: check each source against its *own* declaration; the workspace checkout is not a proxy. Recheck branch and dirty state before a Git mutation in a shared clone.
- **On an integration branch with edits already made** → stop and ask; never "edit now and move it later".

### Commands that mislead

- **`git -C <path>` over `cd`** in a compound command: a `cd` that persists or fails sends the next commit to the wrong repository.
- **Before a requested push**, list what will go with `git log origin/<branch>..HEAD`: other sessions may have left commits there.
- **A branch created from a remote ref tracks it.** After `git branch feature/x origin/<production>` (or `git worktree add -b`), a bare `git push` targets that remote branch. Run `git branch --unset-upstream` at once and check with `git rev-parse --abbrev-ref <branch>@{upstream}`.
- **`git pull` with several refspecs** makes an octopus merge, which can fast-forward the current branch to another branch's tip. Propose `git config pull.ff only` for repositories with a protected branch; a new clone does not inherit it.
- **Reverting a merge.** `git revert -m <n>` keeps parent `n`: check which parent is the release line before choosing. Merging the same branch again later brings nothing back until the revert itself is reverted; verify by content (`git diff`), not by ancestry.
- **A tool error is not evidence of absence.** `git rev-parse --short <a> <b>` fails with two refs whether or not they exist. Check one ref at a time with `git rev-parse --verify --quiet <ref>`.

## Output

Nothing on disk beyond the commits. It produces commits **only** when the user approves; never push, tag, or merge without an explicit request.
