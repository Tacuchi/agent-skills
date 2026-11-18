# git-conventions 1.3.1

Sets safe git rules: read-only operations are always allowed, commits are proposed with exact paths and a one-line message and run only after approval, and push, amend, force, merge, rebase or reset need an explicit request. It verifies the declared branch and dirty state before editing. It needs no other skill; the skills it mentions are optional.

Version 1.3.1 narrows the low-risk permission rule to `permissions.mjs check`: the earlier rule also let an agent run `apply` and write allow rules the person never chose. Remove the broader rule from the host settings if an earlier version saved it.

Acquire the whole `git-conventions` directory from `Tacuchi/agent-skills` once the ref `skill/git-conventions/v1.3.1` exists.

Owner: Tacuchi. License: MIT, in the `LICENSE` file of this directory. The ref and its remote publication are created after this change.
