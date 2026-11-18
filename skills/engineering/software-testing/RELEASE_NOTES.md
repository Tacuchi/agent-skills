# software-testing 1.2.1

Publishes the test strategy: it asks before running any runner, requires a red-then-green regression test for every bugfix, proves a preexisting failure against an untouched base, treats low coverage as a gap, picks the unit/integration/full level and resolves the command from the repository's own wrapper and scripts. It needs no other skill; the skills it mentions are optional complements.

Version 1.2.1 narrows the low-risk permission rule to `permissions.mjs check`: the earlier rule also let an agent run `apply` and write allow rules the person never chose. Remove the broader rule from the host settings if an earlier version saved it.

Acquire the whole `software-testing` directory from `Tacuchi/agent-skills` once the ref `skill/software-testing/v1.2.1` exists.

Owner: Tacuchi. License: MIT, in the `LICENSE` file of this directory. The ref and its remote publication are created after this change.
