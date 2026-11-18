# git-conventions 1.3.0

Sets safe git rules: read-only operations are always allowed, commits are proposed with exact paths and a one-line message and run only after approval, and push, amend, force, merge, rebase or reset need an explicit request. It verifies the declared branch and dirty state before editing. It needs no other skill; the skills it mentions are optional.

Version 1.3.0 adds "What a push starts": before a requested push the agent reads the workflows that push would start, says what would run and names a deployment before pushing; for documentation alone it offers a path filter; and after the push it checks what ran. It comes from a push of documentation that would have redeployed three services. Every 1.2.0 rule stays.

Acquire the whole `git-conventions` directory from `Tacuchi/agent-skills` once the ref `skill/git-conventions/v1.3.0` exists.

Owner: Tacuchi. License: MIT, in the `LICENSE` file of this directory. The ref and its remote publication are created after this change.
