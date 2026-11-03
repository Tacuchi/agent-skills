# Even layouts in Herdr and Orca

Read this before the first split. Checked on macOS on 2026-11-03 against `hc` 0.1.17 with the Herdr app, and against Orca 1.4.245. The installed help wins over this file; the observed behavior wins over the help.

## Why only these layouts

Both orchestrators split a pane exactly in half and accept no size, ratio or resize argument. Measured in a Herdr tab 129 columns wide:

| Cuts | Result | Even |
|---|---|---|
| A right | 62 / 62 | yes |
| A right, then the new pane right | 62 / 29 / 29 | no |
| A right, then each half down | four panes of 62 × 15 | yes |
| A down, then the top pane right | 62 + 62 on top, 129 below, all 15 rows | yes |

Orca behaves the same way (four panes of 60 × 30 for two rows of two). Three equal columns cannot be built from either CLI. Dragging a divider with the mouse would work, but it drives the person's desktop, so the master never does it.

## Minimum pane size

The profile sets the minimum (default 60 columns × 14 rows). Measure the tab before cutting: one pane that fills the tab tells you its size. If the layout for the pane count would give a pane below the minimum, use fewer panes per tab and open another tab with one of the even layouts.

## Cut order per pane count

Name the first pane A. Every cut halves the pane named in it.

| Panes | Cuts |
|---|---|
| 2 | A side by side → B |
| 3 | A stacked → C (below); then A side by side → B. Top: A and B; bottom: C, full width |
| 4 | A side by side → B; A stacked → C; B stacked → D |

When your own pane shares the tab, it is A.

## Herdr

- **Your pane.** In `herdr-app ls`, find the entry whose `terminal` equals `$HC_TERMINAL_ID`; its `pane` is A.
- **A new tab.** `herdr-app do tab.new --name <task> --space <space id> --folder <dir>` prints the new `tab` and `terminal`; read `herdr-app ls` for its pane. A new tab is shown at once, so create one only when the run needs it.
- **Cut.** `herdr-app do pane.split --direction right|down --pane <pane id>`: `right` puts the new pane side by side, `down` stacks it below. It prints the new `pane` and `terminal`; the terminal address works with every `hc` command.
- **Measure.** `hc get <terminal>` prints `cols` and `rows`.
- **Folder trap.** A split pane starts in the space's folder (`herdr-app ls` → `folder`), not in the folder of the pane you cut. Start the agent with `cd '<dir>' && <command>` and check `foreground.cwd` in `hc get <terminal>`.
- **Start.** `hc send <terminal> "cd '<dir>' && <agent command>"`, then `hc wait <terminal>` and `hc read <terminal> --lines 0` to read the banner.
- **Avoid `hc run` for visible panes.** `hc run --bg --label herdr.tab=<tab>` also halves the focused pane without letting you choose where, and the terminal is your child: it ends when you end unless started with `--outlive-parent`. Use it for hidden workers only.
- **Close.** `herdr-app do pane.close --pane <id>` gives the space back to the sibling pane; `herdr-app do tab.close --id <tab>` closes a tab you created.

## Orca

- **Your pane.** `$ORCA_TERMINAL_HANDLE` is A.
- **A new tab.** `orca terminal create --worktree <selector> --title <task> --json`; the handle is in `result.terminal.handle`. The folder must be an Orca project (`orca project list`); registering a folder is durable, so ask the person first.
- **Cut.** `orca terminal split --terminal <handle> --direction vertical|horizontal --json`; the new handle is in `result.split.handle`. On macOS 1.4.245 and Windows 1.4.218, `vertical` puts the new pane side by side and `horizontal` stacks it below, the opposite of what the guide says. Measure after the first cut before repeating it.
- **Measure.** `orca terminal send --terminal <handle> --text "stty size" --enter`, then `orca terminal read --terminal <handle>`: it prints rows, then columns. Do it while the panes still hold plain shells.
- **Start.** `orca terminal send --terminal <handle> --text "cd '<dir>' && <agent command>" --enter`, then `orca terminal wait --terminal <handle> --for tui-idle --timeout-ms 90000` and read `wait.satisfied`.
- **Layout tree.** `orca terminal list --worktree <selector> --include-visual-layouts --json` shows the split tree without sizes; use it to find panes, and `stty size` to check evenness.
- **Close.** `orca terminal close --terminal <handle> --tab` closes a whole tab you created. Never close `$ORCA_TERMINAL_HANDLE`.

## Check before launching

1. Measure every pane.
2. Inside each row, every pane must have the same columns, give or take one for the divider.
3. Every row must have the same rows, give or take one.
4. If a check fails, close the panes you created in that tab and rebuild with the cut order above.
