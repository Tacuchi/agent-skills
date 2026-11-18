# project-docs 1.1.0

Documents a repository in a fixed, publishable format and keeps it current. `generate <repo>` builds a standard-order README, an `ARCHITECTURE.md` with an evidence appendix pinned to a commit, two diagrams and the decision records. `update <repo>` finds what went stale after a release or a code change and proposes only those edits. `check <repo>` is read-only: it reports stale evidence, broken links and private data.

Everything runs on request, inside an agent session. Nothing measured on one machine is published, every claim cites code at a pinned commit, and commits are proposed, never made on the person's behalf.

Version 1.1.0 makes the published document shorter: `ARCHITECTURE.md` has a budget of 1,200 to 1,500 words, a summary list and tables of up to seven rows, and `check` warns when it grows past them. It also keeps the evidence smaller and steadier: `check` warns above five citations in a row and when a citation covers a version or revision line. A preferences file stores the answers you give the same way in every repository. The low-risk permission rule now covers only the permission check: the earlier rule also let an agent write allow rules you never chose, so remove it from the host settings if an earlier version saved it.

It needs Node 22 or newer and git. Diagrams are drawn with Archify, a separate tool, and exported with the Chrome already installed; without them the skill says what is missing before it starts. It needs no other skill; the skills it mentions are optional.

Acquire the whole `project-docs` directory from `Tacuchi/agent-skills` once the ref `skill/project-docs/v1.1.0` exists.

Owner: Tacuchi. License: MIT, in the `LICENSE` file of this directory. The ref and its remote publication are created after this change.
