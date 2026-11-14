# software-testing changelog

## [1.1.0] — 2026-11-14

- New section "Make the test bite": mutate each guarantee and expect red, test the caller and the real entry point, keep doubles no more permissive than the real thing, treat a relaxed check as suspect, set floors against vacuous passes and write fixtures that do not age.
- Reproduce before fixing: the fix is chosen from a reproduction, not from a hypothesis.
- Read the runner's own exit code, not the code of the last command in a pipe.

## [1.0.0] — 2026-09-29

- First public version, copied from the author's own convention testing and generalized: the harness-specific question mechanism, facts and examples from the company's repositories and company-specific skill names were removed; examples and prompts are in English with neutral names.
