# reviewing-code changelog

## [2.0.0] — 2026-11-16

- The `description` narrows the skill to diff hygiene and readiness. It drops the bare 'review this' trigger and says it is not for hunting bugs or judging a change's logic, safety or performance, which a quality review skill or the host's code review covers. The text a host matches to activate it changes, so this is a major version. The rules are unchanged.

## [1.1.0] — 2026-11-14

- New section "Review by refutation": attack what the change promises with concrete inputs, cover instead of sampling, ask what an unmatched argument does, check findings by running them, weigh suggestions before applying them, and confirm that a delegated reviewer ran.
- The closure gate flags a check relaxed so that it passes.
- The confirmation is asked with the host's structured question tool when it has one.

## [1.0.0] — 2026-09-29

- First public version, copied from the author's own code review convention and generalized: the harness-specific question mechanism was removed, the decision record labels are in English, and mentions of other skills use the new names and are optional.
