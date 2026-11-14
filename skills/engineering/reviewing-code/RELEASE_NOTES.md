# reviewing-code 1.1.0

Publishes the diff review and task closure discipline: atomic single-intent diffs, propose-then-execute, a closure quality gate over comments, complexity, dead code and anti-patterns, branch verification before editing, and records of non-obvious decisions and new dependencies. It needs no other skill; the skills it mentions are optional complements.

Version 1.1.0 adds review by refutation: the reviewer states what the change promises and tries to break it with concrete inputs, traces every consumer instead of sampling, and checks each finding by running it. A delegated review that did not run counts as no review, and a check relaxed so that it passes is flagged at closure.

Acquire the whole `reviewing-code` directory from `Tacuchi/agent-skills` once the ref `skill/reviewing-code/v1.1.0` exists.

Owner: Tacuchi. License: MIT, in the `LICENSE` file of this directory. The ref and its remote publication are created after this change.
