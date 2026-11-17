# reviewing-code 2.0.0

Publishes the diff review and task closure discipline: atomic single-intent diffs, propose-then-execute, a closure quality gate over comments, complexity, dead code and anti-patterns, branch verification before editing, and records of non-obvious decisions and new dependencies. It needs no other skill; the skills it mentions are optional complements.

Version 1.1.0 adds review by refutation: the reviewer states what the change promises and tries to break it with concrete inputs, traces every consumer instead of sampling, and checks each finding by running it. A delegated review that did not run counts as no review, and a check relaxed so that it passes is flagged at closure.

Version 2.0.0 changes only the `description`: it narrows the skill to diff hygiene and readiness, drops the bare 'review this' trigger, and points bug and quality reviews to a quality review skill or the host's code review. The text a host matches to activate it changes; that is why it is a major version. The rules are the same as in 1.1.0.

Acquire the whole `reviewing-code` directory from `Tacuchi/agent-skills` once the ref `skill/reviewing-code/v2.0.0` exists.

Owner: Tacuchi. License: MIT, in the `LICENSE` file of this directory. The ref and its remote publication are created after this change.
