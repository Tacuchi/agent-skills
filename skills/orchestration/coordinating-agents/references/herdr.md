# Herdr adapter

Herdr is a terminal multiplexer (workspaces, tabs, panes) with an agent layer that detects states from the screen. Checked against `herdr` 0.9.0 help. Run `herdr agent --help`, `herdr pane --help`, `herdr tab --help` and `herdr <group> <subcommand> --help` for the operations you use; the installed help wins over this file.

## Detect

- Inside a Herdr pane, `HERDR_ENV` is `1` and `HERDR_PANE_ID`, `HERDR_TAB_ID` and `HERDR_WORKSPACE_ID` identify where you are.
- If `herdr` is missing, explain the precondition and stop.

## Primitives

| Primitive | Herdr mechanism |
|---|---|
| Locate | `herdr tab list`, `herdr pane list`, `herdr agent list`, `herdr agent get <target>`; `herdr tab get <id>` or `herdr pane get <id>` on ambiguity. |
| Start | `herdr agent start <name> --kind <type> --pane <id>`, in a pane at its interactive shell prompt. |
| Verify | `herdr pane read <id> --source visible` or `herdr agent read <target> --source visible`. |
| Send | `herdr agent prompt <target> "<task>"`. |
| Wait | `herdr agent wait <target> --until working --until idle --until blocked --until done --timeout <ms>`. |
| Read | `herdr agent read <target> --source recent` (or `recent-unwrapped`), `herdr pane read <id> --source visible`. |
| Answer | `herdr agent send-keys <target> <key>` or `herdr pane send-keys <id> <key>`. |
| Isolate | Panes share the working directory unless you create a worktree (check `herdr worktree --help`). |
| Relocate | `herdr tab list`/`herdr pane list` plus the pane identifier you kept; `herdr agent explain <id>`. |

States are Herdr's own: `working`, `blocked`, `idle`, `done`, `unknown`. They come from screen detection; `herdr agent explain` shows why a state was chosen.

## One workspace per project

When the person agrees on a destination and a layout for a project, keep one Herdr workspace per project and find it again instead of creating another:

1. `herdr workspace list` and match the project by `label`. Herdr 0.9.0 lists no `cwd` per workspace, so confirm the match with `herdr pane list --workspace <id>`: one pane's `cwd` or `foreground_cwd` must be in the project folder. A label without such a pane, or used by two workspaces, is not the project's: report it and leave it alone.
2. Only if none matches, `herdr workspace create --cwd <dir> --label <label> --no-focus`.
3. `herdr pane split --workspace <id> --cwd <dir> --no-focus` for each extra agent the layout calls for.
4. `herdr agent start <name> --kind <type> --pane <pane>` in each pane, as in **Start**.

Never rename or close a workspace to make it match: a label someone edited is theirs.

## Traps

- **Layout.** Create a tab (`herdr tab create`) or split a pane (`herdr pane split`) only once the destination and the layout are agreed. To split a tab evenly between N agents, `--ratio` sets the fraction the split pane keeps: the first cut goes at 1/N, the next at 1/(N-1) on the new pane, and so on. Check the layout with `herdr pane layout` and fix it with `herdr pane resize --direction <direction> --amount <ratio delta>`.
- **Banner.** A narrow pane truncates the banner: read it with the layout already fixed or with `herdr pane zoom <id>`, and undo the zoom afterwards.
- **Start.** `--kind` values vary between versions: check the list in the help. Model and effort go only as the agent's native arguments after `--`; confirm them on the screen, because Herdr does not report them.
- **Send.** `--wait` waits for a later state, but it does not identify the turn: if the agent was already working, it may match the end of another task. `agent_prompt_stalled` means no activity started, not that the prompt was lost; read the pane before resending.
- **Blocked.** `herdr agent prompt` rejects sends to an agent that is already blocked (`agent_blocked`). After the person's written choice, send only the keys the visible dialog requires.
- **One signal.** `herdr pane wait-output` serves one specific visible signal, not to credit the whole task.
- **Recovery.** After a restart, agent names may be lost and a moved pane gets a new identifier. Use `herdr pane get <id>` and `herdr pane read <id> --source visible` to check it is the expected session and task before following it again.
