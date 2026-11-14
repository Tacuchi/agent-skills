# git-conventions 1.1.0

Sets safe git rules: read-only operations are always allowed, commits are proposed with exact paths and a one-line message and run only after approval, and push, amend, force, merge, rebase or reset need an explicit request. It verifies the declared branch and dirty state before editing. It needs no other skill; the skills it mentions are optional.

Version 1.1.0 commits with an explicit pathspec, so that nothing staged by the user or by another session enters the commit. It asks for approval with a structured question when the host has that tool, verifies the branch at the start of every round of edits, keeps process names out of commit messages and adds a short list of git commands that mislead.

Acquire the whole `git-conventions` directory from `Tacuchi/agent-skills` once the ref `skill/git-conventions/v1.1.0` exists.

Owner: Tacuchi. License: MIT, in the `LICENSE` file of this directory. The ref and its remote publication are created after this change.
