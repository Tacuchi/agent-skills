# git-conventions changelog

## [1.1.0] — 2026-11-14

- The commit runs as `git add -- <paths> && git commit -m "<msg>" -- <paths>`: the pathspec keeps out what the user or another session staged, also between the check and the commit. Files that someone else staged are shown and asked about, never unstaged.
- The proposal is asked with the host's structured question tool when it has one, the recommended option first.
- The message names the change, not the process that produced it: no session names, plan or task numbers, unless the repository asks for a ticket id.
- The branch is verified again before the first write of every round of edits.
- New section "Commands that mislead": `git -C` over `cd`, the log before a push, upstreams inherited from a remote ref, `git pull` with several refspecs, reverting a merge, and tool errors read as absence.
- A precondition is read in its own command, never chained to the commit it gates.

## [1.0.0] — 2026-09-29

- First public version, copied from the author's own convention git-conventions and generalized: the company branch flow and the workspace-manager wording, with examples translated to English.
