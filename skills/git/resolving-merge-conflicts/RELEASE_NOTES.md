# resolving-merge-conflicts 1.2.1

Resolves a merge already in progress: it inspects base, ours and theirs, resolves paths one at a time without touching foreign work, stops on ambiguous hunks and runs the merged checkout's build and tests before proposing an approved commit. It needs no other skill; the skills it mentions are optional.

Version 1.2.1 narrows the low-risk permission rule to `permissions.mjs check`: the earlier rule also let an agent run `apply` and write allow rules the person never chose. Remove the broader rule from the host settings if an earlier version saved it.

Acquire the whole `resolving-merge-conflicts` directory from `Tacuchi/agent-skills` once the ref `skill/resolving-merge-conflicts/v1.2.1` exists.

Owner: Tacuchi. License: MIT, in the `LICENSE` file of this directory. The ref and its remote publication are created after this change.
