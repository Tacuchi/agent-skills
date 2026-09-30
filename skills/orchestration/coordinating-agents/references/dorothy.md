# Dorothy adapter

Dorothy is a desktop app that runs one terminal per agent and exposes an MCP server (`mcp-orchestrator`) with tools to drive them. Checked against the project's README (github.com/Charlie85270/Dorothy); the tools were not called. List the server's tools and their parameter schemas before acting; the installed schema wins over this file.

## Detect

- The `mcp-orchestrator` tools are available in the host (for example `list_agents`).
- If they are not, explain the precondition and stop.

## Primitives

| Primitive | Dorothy mechanism |
|---|---|
| Locate | `list_agents`, `get_agent(id)`. |
| Start | `create_agent(projectPath, name, skipPermissions, ...)`, then `start_agent(id, prompt, model)`. |
| Verify | `get_agent(id)` and `get_agent_output(id)`; read the banner in the output. |
| Send | `send_message(id, message)` types into the agent's terminal. |
| Wait | `wait_for_agent(id, timeoutSeconds, pollIntervalSeconds)`. |
| Read | `get_agent_output(id, lines)`. |
| Answer | `send_message(id, <the authorized option>)`. |
| Isolate | One terminal per agent; worktree support is claimed but not verified, so assume a shared checkout. |
| Relocate | Agent records persist across app restarts; conversation resume is not verified. |

State mapping: Dorothy parses states from output patterns, so treat them as heuristics.

- `running` → `working`.
- `waiting` → `blocked`.
- `idle` → `idle`.
- `completed` → `done`.
- `error` → `done` with a failure: read the output.
- Any other value, or a `wait_for_agent` timeout → `unknown`.

## Traps

- **Permissions skipped by default.** `create_agent` defaults `skipPermissions` to `true`, which starts the agent with its permission prompts disabled. Pass `skipPermissions: false` unless the person explicitly authorized skipping permissions for that agent.
- **Sending starts work.** `send_message` auto-starts an idle agent: it is a new instruction, never a status probe.
- **Model and effort.** `start_agent` takes only a model name and no effort; confirm the model in the output.
- **Answers are text.** A `waiting` agent is answered by typing text into its terminal: send only the option the person wrote, then read the output to confirm receipt.
- **Delegation.** Tasks routed through Dorothy's "Super Agent" or its kanban (`assign_task`, `mark_task_done`) still need the checks in this skill: a task marked done is not a verified deliverable.
