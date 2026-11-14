# resolving-merge-conflicts 1.1.0

Resolves a merge already in progress: it inspects base, ours and theirs, resolves paths one at a time without touching foreign work, stops on ambiguous hunks and runs the merged checkout's build and tests before proposing an approved commit. It needs no other skill; the skills it mentions are optional.

Version 1.1.0 adds what a merge with no reported conflict can still break: code dropped or duplicated by the auto-merge, deletions that come back with crossed bases and markers committed earlier. The merged tree is built even when no path conflicted.

Acquire the whole `resolving-merge-conflicts` directory from `Tacuchi/agent-skills` once the ref `skill/resolving-merge-conflicts/v1.1.0` exists.

Owner: Tacuchi. License: MIT, in the `LICENSE` file of this directory. The ref and its remote publication are created after this change.
