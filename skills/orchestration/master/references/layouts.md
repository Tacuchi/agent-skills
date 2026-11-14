# Even layouts in any orchestrator

Read this before the first split. Checked on macOS: Herdr on 2026-11-14 against `hc` 0.1.21 and `herdr-app` 0.1.15 (first measured on 2026-11-03 against `hc` 0.1.17); Orca on 2026-11-03 against 1.4.245, not measured again on later versions. The installed help wins over this file; the observed behavior wins over the help.

## Where the agents go

- Your own tab stays whole: never split it, in any orchestrator.
- Create a tab for the agents, named after the task, and build the grid there. One agent still gets its own tab.
- Up to four agents share a tab; more go to further tabs with the same patterns.
- The pane a new tab starts with is A.

## Why these layouts

A split halves the pane in Herdr and in Orca. Measured in a Herdr tab 129 columns wide:

| Cuts | Result | Even |
|---|---|---|
| A right | 62 / 62 | yes |
| A right, then the new pane right | 62 / 29 / 29 | no |
| A right, then each half down | four panes of 62 × 15 | yes |
| A down, then the top pane right | 62 + 62 on top, 129 below, all 15 rows | yes |

Orca behaves the same way (four panes of 60 × 30 for two rows of two) and has no size command, so three equal columns cannot be built there. Herdr can size panes from `herdr-app` 0.1.15: the same weight on every pane of a row makes them equal (71 / 33 / 33 became 46 / 46 / 46 in a 148-column tab). The layouts below stay the default because they need no resizing and work in every orchestrator; use sizing to fix a row that came out uneven. Dragging a divider with the mouse would work, but it drives the person's desktop, so the master never does it.

## Minimum pane size

The profile sets the minimum (default 60 columns × 14 rows). Measure the tab before cutting: one pane that fills the tab tells you its size. If the layout for the agent count would give a pane below the minimum, use fewer agents per tab and open another tab with one of the even layouts.

## Cut order per agent count

Name the first pane of the agents' tab A. Every cut halves the pane named in it.

| Agents | Cuts |
|---|---|
| 2 | A side by side → B |
| 3 | A stacked → C (below); then A side by side → B. Top: A and B; bottom: C, full width |
| 4 | A side by side → B; A stacked → C; B stacked → D |

## Herdr

- **Your pane.** In `herdr-app ls`, the entry whose `terminal` equals `$HC_TERMINAL_ID` is your pane, and its tab is yours. Never pass that pane to `pane.split`.
- **The agents' tab.** `herdr-app do tab.new --name <task> --space <space id> --folder <dir>` prints the new `tab` and `terminal`; the terminal starts in `<dir>`, and `herdr-app ls` gives its pane, which is A. The new tab is shown at once.
- **Cut.** `herdr-app do pane.split --direction right|down --pane <pane id>`: `right` puts the new pane side by side, `down` stacks it below. It prints the new `pane` and `terminal`; the terminal address works with every `hc` command.
- **Measure.** `hc get <terminal>` prints `cols` and `rows`. Measure while the agents' tab is shown: a pane in a hidden tab reports a stale size, or 120 × 40 if it was never drawn. `herdr-app status` names the shown tab; `herdr-app do tab.select --id <tab>` shows one.
- **Even out.** `herdr-app do layout.resize --id <pane id> --weight <n>` sets a pane's share of its row. Give every pane of the row the same weight, then measure again.
- **Folder trap.** Where a split pane starts depends on the version: on `herdr-app` 0.1.15 it starts in the current folder of the pane you cut; on 0.1.12 it started in the space's folder. Start the agent with `cd '<dir>' && <command>` either way, and check `foreground.cwd` in `hc get <terminal>`.
- **Start.** `hc send <terminal> "cd '<dir>' && <agent command>"`, then `hc wait <terminal>` and `hc read <terminal> --lines 0` to read the banner.
- **Avoid `hc run` for visible panes.** `hc run --bg --label herdr.tab=<tab>` also halves the focused pane without letting you choose where, and the terminal is your child: it ends when you end unless started with `--outlive-parent`. Use it for hidden workers only.
- **Close.** `herdr-app do pane.close --pane <id>` gives the space back to the sibling pane; `herdr-app do tab.close --id <tab> --confirmed true` closes a tab you created, once its panes hold only idle shells.

## Orca

- **Your pane.** `$ORCA_TERMINAL_HANDLE` is your pane and `$ORCA_TAB_ID` your tab. Never split that handle.
- **The agents' tab.** `orca terminal create --worktree <selector> --title <task> --json`; the handle of its first pane, A, is in `result.terminal.handle`. The folder must be an Orca project (`orca project list`); registering a folder is durable, so ask the person first.
- **Cut.** `orca terminal split --terminal <handle> --direction vertical|horizontal --json`; the new handle is in `result.split.handle`. On macOS 1.4.245 and Windows 1.4.218, `vertical` puts the new pane side by side and `horizontal` stacks it below, the opposite of what the guide says. Measure after the first cut before repeating it.
- **Measure.** `orca terminal send --terminal <handle> --text "stty size" --enter`, then `orca terminal read --terminal <handle>`: it prints rows, then columns. Do it while the panes still hold plain shells.
- **Start.** `orca terminal send --terminal <handle> --text "cd '<dir>' && <agent command>" --enter`, then `orca terminal wait --terminal <handle> --for tui-idle --timeout-ms 90000` and read `wait.satisfied`.
- **Layout tree.** `orca terminal list --worktree <selector> --include-visual-layouts --json` shows the split tree without sizes; use it to find panes, and `stty size` to check evenness.
- **Close.** `orca terminal close --terminal <handle> --tab` closes a whole tab you created. Never close `$ORCA_TERMINAL_HANDLE`.

## Any other orchestrator

For an orchestrator with no section above (T3 Code, a tmux wrapper, an IDE's agent panel), read its installed help and answer every row before the first command:

| Primitive | Establish from the help |
|---|---|
| Own pane | Which variable or command names your pane and your tab, so you can leave them alone. |
| New tab | How to open a tab in a given folder, and what it returns as the handle of its first pane. |
| Split | How to cut a pane, in which directions, and whether it halves or takes a size. |
| Measure | How to read a pane's columns and rows. In a plain shell, `stty size` prints rows, then columns. |
| Even out | Whether a size, ratio or resize command exists. |
| Send and read | How to type into a pane and read its screen. |
| Close | How to close a pane and a tab you created. |

- If splits only halve, use the cut orders above. If a size can be set, give every pane of a row the same share and measure.
- If it has tabs but no panes, give each agent its own tab.
- If it has no tabs, use its closest separate container (a window or a workspace), so that your own view stays whole.
- If it cannot open a tab or cut a pane from its CLI or API, ask the person to open the agents' tab and give you its handles, or use fewer agents through your host's subagents. Never split your own tab as a fallback.
- Tell the person which mapping you used, with the orchestrator's version.

## Check before launching

1. Measure every pane, with its tab shown.
2. Inside each row, every pane must have the same columns, give or take one for the divider.
3. Every row must have the same rows, give or take one.
4. If a check fails, even the row out where the orchestrator can size panes; otherwise close the panes you created in that tab and rebuild with the cut order above.
5. Your own tab still holds one pane: yours.
