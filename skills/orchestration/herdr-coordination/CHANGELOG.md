# herdr-coordination changelog

## [2.0.0] — 2026-09-29

- The skill and its history are now in English. The `description` the host uses to activate it changes, so this is a major version. The rules are unchanged.

## [1.1.0] — 2026-09-29

- Even split of a tab between N agents (`--ratio` at 1/N, `pane layout`, `pane resize`), and reading the banner with the layout fixed or with zoom.
- Dialogs with several tabs are read in full without choosing, reading again after each key, and are sent only with the review complete.
- An earlier general authorization does not answer a specific request; if the host blocks sending to another agent's dialog, the person answers in their pane.

## [1.0.1] — 2026-09-29

- Quotes the frontmatter `description`: the unquoted `: ` was invalid YAML, and strict installers (the `skills` CLI) skipped the skill.

## [1.0.0] — 2026-09-29

- First standalone guide to coordinating Herdr agents: the pane as the source of truth, verifiable delegation, recovery and explicit human authorizations.
