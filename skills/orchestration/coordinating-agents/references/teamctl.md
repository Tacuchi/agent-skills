# teamctl adapter

teamctl is a CLI plus a TUI (`teamctl ui`) that runs a declared team of agents in detached tmux sessions and connects them through a mailbox server. Checked against the project's repository documentation (github.com/Alireza29675/teamctl); the CLI was not run. Read `teamctl --help` and the subcommand help before acting; the installed help wins over this file.

## Detect

- The team is declared in `.team/team-compose.yaml` and `projects/*.yaml` (managers, workers, `reports_to`, channels).
- If `teamctl` is missing or there is no team file, explain the precondition and stop.

## Primitives

| Primitive | teamctl mechanism |
|---|---|
| Locate | `teamctl status`, `teamctl ps`, `teamctl inspect`; agents are addressed as `<project>:<agent>`. |
| Start | Declare the agent in the YAML, then `teamctl up` or `teamctl reload`. |
| Verify | `teamctl validate` and `teamctl inspect` for `model`, `effort`, `permission_mode` and `autonomy`; then read the agent's logs. |
| Send | `teamctl send <project>:<agent> "<task>"` drops the task in the agent's mailbox. |
| Wait | No state detection: poll `teamctl status` (inbox depth) and `teamctl mail`. |
| Read | `teamctl logs`, `tail -f` on the agent log, the agent's replies. |
| Answer | Approval requests: `teamctl approvals`, then `teamctl approve <id>` or `teamctl deny <id>`. |
| Isolate | Agents share `project.cwd`; a worktree per agent is only a convention in role prompts. |
| Relocate | Each agent keeps a fixed session and resumes it after `down`/`up`; `--fresh` starts a new conversation. |

State mapping: teamctl reports supervisor state and mailbox depth, not agent activity. Treat every agent as `unknown` until its logs or its reply show `working`, `idle` or `done`. A pending approval request is `blocked`.

## Traps

- **Changing the team.** Editing the YAML, `teamctl up`, `reload` and `down` change running agents: agree on them with the person first. `--fresh` discards the agent's conversation, so treat it as irreversible.
- **Autonomy.** `autonomy` (`full`, `low_risk_only`, `proposal_only`) and `permission_mode` decide what an agent may do without asking. Raising either one is wider access: it needs the person's explicit answer.
- **Approvals.** An agent's `request_approval` reaches the approval queue, and unanswered requests default to deny. `teamctl approve <id>` is the person's answer to **that** request: run it only after their written choice, or let them approve in the TUI or their notification channel.
- **Mailbox.** A successful `send` proves the message is queued, not read. Delivery to Claude uses a channel push and to Codex or Gemini a tmux nudge; check the logs before resending.
- **Keys.** There is no send-keys command. `teamctl attach` opens the tmux session for manual use by the person.
- **Recovery.** After `down`/`up`, a crash or a reboot, read the agent's log to see the last task it received before sending anything new.
