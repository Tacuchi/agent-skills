# Paradev adapter

Paradev is a desktop app that runs agents in workspaces with tabs and panes. Its CLI is `superset`, with `paradev` as an alias, and both are on the `PATH` of its own terminals. Checked against the `--help` of `superset` 2.0.8 on macOS on 2026-11-14; no command was exercised, because the CLI answered `Not logged in`. Read `superset <command> --help` before acting; the installed help wins over this file.

## Detect

- Inside a Paradev terminal `SUPERSET_TERMINAL_ID` is set, and `SUPERSET_PANE_ID`, `SUPERSET_TAB_ID` and `SUPERSET_WORKSPACE_ID` name your own pane, tab and workspace. The names come from its shell wrappers; they were not observed in a live terminal.
- If the CLI is missing, or it answers `Not logged in`, explain the precondition and stop: signing in with `superset auth login` is the person's step.

## Primitives

| Primitive | Paradev mechanism |
|---|---|
| Locate | `superset snapshot` (every workspace, its terminals, the agent in each and its state, and the pane layout), `superset panes list --workspace <id>`, `superset terminals list`. |
| Start | A plain shell in a pane, then the agent's command typed with `superset terminals send --terminal <id> --text "<command>"`. An agent session in a workspace: `superset agents create`. |
| Verify | `superset terminals read --terminal <id>` for the banner; `superset agents explain` says why an agent shows a state. |
| Send | `superset terminals send --terminal <id> --text "<task>"`; `--no-submit` stages the text without pressing Enter. |
| Wait | `superset terminals send --wait --until settled\|idle\|blocked\|working --timeout <seconds>`, `superset agents wait`, or `superset terminals wait --match <regex>` for one printed signal. |
| Read | `superset terminals read --terminal <id> --max-lines <n>`; `superset agents read` for the agent's own transcript. |
| Answer | `superset terminals send --keys <keys>` for a dialog (a character, `esc`, `enter`, `tab`, `shift+tab`, arrows, `ctrl+<letter>`); `--text` for a text answer. |
| Place | `superset panes new-tab --workspace <id>` opens the agents' tab; `superset panes split --pane <id> --direction right\|left\|down\|up` cuts a pane; `superset panes equalize --tab <id>` gives the panes of a tab equal space; `superset panes resize --pane <id> --ratio <0.05 to 0.95>` sets one pane's share. |
| Isolate | A workspace checks out its branch in its own worktree by default; `--checkout local` uses the project's checkout as it is. |
| Relocate | `superset snapshot` and `superset panes list` by the ids you kept. `superset panes close --keep-terminal` keeps a terminal running without its pane. |

State mapping, with the names its help uses:

- `working` → `working`.
- `blocked` → `blocked`.
- `idle` → `idle`.
- `settled` (finished its turn or needs input) → read the screen: it is `done` or `blocked`.
- `starting`, `exited` or no state at all → `unknown` until you read the screen.

## Traps

- **Not exercised.** Every mapping above comes from the help. Check the result of the first tab, the first split and the first measurement before repeating them, and tell the person what differs.
- **Own tab.** Never pass `$SUPERSET_PANE_ID` to `panes split`: open the agents' tab with `panes new-tab`. It is selected only with `--focus`.
- **Even layout.** After the cuts, run `panes equalize --tab <id>`, then measure every pane: `stty size` typed into a plain shell and read back with `terminals read`.
- **Cloud by default.** `workspaces create` and the `terminals` commands default to the cloud when the account has cloud workspaces: pass `--local`. A cloud workspace or another `--host` is a remote placement, which is wider access.
- **A workspace created with an agent** (`workspaces create --agent <id> --prompt "<task>"`) starts work at once, with the app's defaults for permissions. Read the banner before reporting a mode.
- **Automations and tasks.** `superset automations` and `superset tasks` schedule or assign work beyond the current run: they are the person's decisions.
