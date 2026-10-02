# Orca adapter

Orca is a desktop agent IDE with an `orca` CLI (`--json`) that talks to the running app. Checked against `orca` 1.4.212 on macOS and 1.4.217–1.4.218 on Windows 11. The binary serves its own version-matched guides; this file only maps them onto the cycle and names the traps.

## Resolve the executable and load its guide

1. Choose the executable once: `ORCA_CLI_COMMAND` if it is set; `orca-dev` in a dev checkout that exposes `ORCA_DEV_REPO_ROOT`; `orca-ide` on Linux outside an Orca terminal; otherwise `orca`. On Linux outside Orca, bare `orca` usually starts the GNOME screen reader, so never run it there.
2. Load the guide for the layer you need before the first command:
   - Supervised work (runs, tasks, dispatches, ask/reply, gates): `<executable> skills get orchestration`.
   - Terminals, worktrees and unsupervised handoffs: `<executable> skills get orca-cli`.
3. Follow that guide's syntax and action gates. This skill adds the human-authorization boundary and the verification discipline on top.
4. If the executable fails, report its exact error and stop; do not switch to another executable.
5. Inside an Orca terminal, `ORCA_TERMINAL_HANDLE`, `ORCA_TAB_ID` and `ORCA_WORKTREE_ID` identify your own pane, tab and worktree.

## Primitives

| Primitive | Orca mechanism |
|---|---|
| Locate | `status`, `worktree list`, `terminal list --worktree active --include-visual-layouts`; supervised: `orchestration worker-list`. |
| Start | `terminal create --command "<agent>"`; for a layout, `terminal create` and `terminal split` with no `--command`, then `terminal send --text "<agent>" --enter`; supervised: `orchestration run-create`, then `orchestration worker-start --spec "<task>" --worktree <placement> --agent <type>`. |
| Verify | Compare `launch.requested` with `launch.effective` in the start receipt, then read the terminal; for a layout, group `terminal list` by `agentIdentity`. |
| Send | `terminal send --text "<task>" --enter --wait-submit <seconds>`; supervised: the spec, or `orchestration send`. |
| Wait | `terminal wait --for tui-idle --timeout-ms <ms>`, then read `wait.satisfied`; supervised: `orchestration check --wait --types "worker_done,escalation,question"`. |
| Read | `terminal read`; supervised: the worker's messages and `worker-list`. |
| Answer | Terminal dialog: `terminal send`; supervised question: `orchestration reply --id <message_id>`, then `check --ack <delivery_id>`. |
| Isolate | Current worktree, a new worktree per task, or a folder workspace; `--on <environment>` places work remotely. |
| Relocate | Re-list terminals or workers; supervised work is addressed by Dispatch ID. |

State mapping:

- `working`: a turn in progress (`turn_started` without a later idle).
- `blocked`: a worker `question` or `escalation`, a gate awaiting resolution, or a permission dialog read on the terminal.
- `idle`: `tui-idle` on the terminal. It is not `done`: read the terminal.
- `done`: a `worker_done` with outcome `succeeded` or `failed`.
- `unknown`: liveness `unverifiable`, a timeout or an empty `check`.

## Traps

- **Model and effort.** `--model` and `--effort` exist only for some agent types; report the value from `launch.effective`, never from the requested arguments.
- **Send receipt.** `accepted: true` and `input_accepted` prove acceptance, not a started turn; `turn_started` is the proof of submission. After an ambiguous failure, repeat the exact command with `--retry-request <id>` instead of resending.
- **Wait result.** A timed-out `terminal wait` prints a normal result: `wait.satisfied` decides. Agent start-up can take more than a minute; `--timeout-ms 90000` is a reasonable first wait.
- **Permission dialogs.** A prompt inside the agent's own UI has no dedicated state: read the terminal before treating `tui-idle` as idle.
- **Questions and gates.** A worker `question` about a reserved effect, and any gate resolution, are the person's decisions: take them to the person before `reply` or resolving the gate.
- **Remote placement.** `--on <environment>` sends work to another machine: that is wider access, so it needs the person's explicit answer.
- **Absence.** A timeout, an empty `check` or `unverifiable` liveness authorizes no stop, retry, release or duplicate launch; keep waiting or inspect, as the guide requires.
- **Handles.** Handles do not survive a restart: re-list, address exactly one handle, and never send to the old and the new one both. `terminal create` returns the handle in `result.terminal.handle`, but `terminal split` returns it in `result.split.handle`.
- **Split direction.** The guide says `horizontal` splits left/right and `vertical` top/bottom; Windows 1.4.218 does the opposite. Check the first split in the layout before repeating it.
- **Split with a command.** On Windows 1.4.218, `terminal split --direction vertical --command <cmd>` answers `Timed out waiting for split pane handle`: the first call creates the pane without running the command, and later calls create nothing. Split without `--command` and start the agent with `terminal send`.
- **Sizes.** Every split halves the pane, with no size option, and the CLI cannot move, swap or resize panes. Three columns cut in a row end at 50/25/25. Leave that layout as it is, or equalize it with one `computer drag` of the first border to a third of the panes' width, once the person agrees, since it drives their desktop:
  - get the pid and window id from `computer list-apps` and `computer list-windows --app Orca`, again after every Orca restart;
  - run `terminal switch --terminal <h>` first, because the screenshot shows the active tab;
  - with `scale: 1` in `computer get-app-state`, screenshot pixels match window coordinates;
  - a locked screen yields a lock-screen capture, so the drag cannot work.
- **Keys.** `terminal send` sends text only: there is no Esc or Shift+Tab. Relaunching an agent means closing its pane and creating another.
- **Closing.** `terminal close --terminal <h> --tab` closes a whole tab from 1.4.218; on 1.4.217, close the panes one by one. Read each pane's `preview` in `terminal list` before closing it, and never close `ORCA_TERMINAL_HANDLE`. A pane just closed may still appear in `terminal list` for a moment.
- **PowerShell scripts.** A function named `H` never receives its argument, because `H` is the alias of `Get-History`. Write `"${h}:"`, not `"$h:"`, inside a string. `Start-ThreadJob` with `Wait-Job | Receive-Job` waits on several terminals at once.
