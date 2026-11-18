# creating-tools 1.1.1

Organizes auxiliary developer tools under `docs/tools/<tool>/` with a README contract, immutable timestamped runs and an `output/latest` pointer. It ships two dependency-free Node scripts, `scaffold-tool.mjs` and `record-run.mjs`, and a README template. It needs no other skill.

Version 1.1.1 narrows the low-risk permission rule to `permissions.mjs check`: the earlier rule also let an agent run `apply` and write allow rules the person never chose. Remove the broader rule from the host settings if an earlier version saved it.

Acquire the whole `creating-tools` directory from `Tacuchi/agent-skills` once the ref `skill/creating-tools/v1.1.1` exists.

Owner: Tacuchi. License: MIT, in the `LICENSE` file of this directory. The ref and its remote publication are created after this change.
