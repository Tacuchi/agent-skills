# Permission step guide

This guide holds the detail of the permission step that the [architecture overview](../ARCHITECTURE.md) summarizes. Only skills that include a permission manifest use it.

## Walkthrough: load a skill that includes the permission step

1. The host reads the acquired skill's instructions and runs its permission script's `check` command.
2. The script loads that skill's manifest and reads existing project and global host permissions.
3. It reports covered, missing, unsupported and previously declined needs.
4. It groups missing needs by low or high risk and offers the corresponding choices.
5. The person chooses whether to keep prompting, apply project rules or remember a local skip.
6. Only the chosen `apply` command writes settings, rules or skip state.
7. Codex writes require project trust. Antigravity receives a notice and no project-rule write.
8. The host retains control over command execution; the permission script does not execute the declared commands.

## Where rules are written

| What | Default | When it applies | How to change it |
|---|---|---|---|
| Permission target project | Current folder; nearest Git root for applicable host rules | A participating skill's permission command | Pass `--root`. |
| Claude Code rule files | Git-root `.claude/settings.local.json`; session-root `.claude/settings.json` | Chosen local or shared apply | Choose the scope and project root. |
| Codex rule file | Git-root `.codex/rules/agent-skills.rules` | Approved command rules in a trusted project | Choose approved needs; start another Codex session to load them. |
| Local skip state | `.agent-skills/permissions-state.json`, with its own ignore file | Chosen `--dont-ask` option | Choose that option for the declared need IDs. |
| Antigravity project rules | Unsupported | Permission check or apply | Review the reported needs in the host; no project rules are written. |
