# software-testing 1.1.0

Publishes the test strategy: it asks before running any runner, requires a red-then-green regression test for every bugfix, proves a preexisting failure against an untouched base, treats low coverage as a gap, picks the unit/integration/full level and resolves the command from the repository's own wrapper and scripts. It needs no other skill; the skills it mentions are optional complements.

Version 1.1.0 adds how to make a test bite: a green suite proves little until a broken version turns it red. It asks for one mutation per guarantee, tests of the real caller, doubles that keep the invariants of what they replace, and floors against checks that pass with nothing to check.

Acquire the whole `software-testing` directory from `Tacuchi/agent-skills` once the ref `skill/software-testing/v1.1.0` exists.

Owner: Tacuchi. License: MIT, in the `LICENSE` file of this directory. The ref and its remote publication are created after this change.
