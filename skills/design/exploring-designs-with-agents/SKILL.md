---
name: exploring-designs-with-agents
description: "Runs a visual design exploration (a logo, app icon, or app screens) with several agents in parallel across converging rounds: writes one shared brief with the person, enforces a manifest.json and CSS-variable SVG delivery contract, compares deliveries in a local HTML comparator on 127.0.0.1 where the person stars favorites, and hands the production kit to the winning agent. Use when asked to explore a logo, icon, visual mark, or app screen directions with multiple agents or design tools in parallel rounds. Not for specifying UI journeys and states before visual design (the `ui-authoring` skill covers that, if available), nor for general multi-agent task orchestration (the `master` and `coordinating-agents` skills cover launching and supervising agents, if available)."
---

# Exploring designs with agents

Run parallel visual explorations across converging rounds so the person compares concrete options side by side instead of iterating blind with one model.

## Scope and complements

- Agree on an exploration workspace directory before creating files (for example, `design-exploration/`).
- This skill works standalone. Optional complements, if installed:
  - The `master` skill or the `coordinating-agents` skill can launch and supervise the parallel agent panes.
  - A dedicated logo craft skill (such as `logo-design`, if installed) can guide each agent's concept-and-audit pass inside a round, stopping at the concept checkpoint before building the full production kit.
  - The `ui-authoring` skill can lock down journeys and states before an app screen exploration.
- Never require another skill; fall back cleanly when one is absent.

## Workflow

### 1. Draft one brief with the person first

1. Ask concise questions one at a time until the core constraints are clear: product purpose, audience, emotional tone, visual anchors, technical limits (minimum size, platform icon masks, single-ink viability, motion intent if animated), and cliches to avoid.
2. Read [references/brief-template.md](references/brief-template.md) before writing the Round 1 brief or a follow-up round brief.
3. Save the agreed brief to a single file inside the exploration workspace (for example, `<work-dir>/brief.md` for Round 1, `<work-dir>/round-<n>/brief.md` for later rounds).
4. Send the exact same brief file path to every agent in the round. Never paraphrase the brief differently per agent; differences should come from the models, not from prompt drift.

### 2. Enforce a shared delivery contract

1. Read [references/delivery-contract.md](references/delivery-contract.md) and include its contract (or save a copy as `<round-dir>/contract.md`) alongside the brief.
2. Assign each agent its own isolated subfolder (`<round-prefix><agent>/`) and forbid writes outside it, git operations, and spawning other agents.
3. Require every agent to deliver:
   - `<agent>/manifest.json` listing `agent`, `model`, and `variants` (`id`, `idea`, `name`, `concept`, and exactly one `"recommended": true`);
   - per-variant SVGs: `<id>-iso.svg` (symbol / adaptive foreground), `<id>-logo.svg` (horizontal lockup), and optionally `<id>-mono.svg` (single-ink `currentColor`) and `<id>-bg.svg` (full-bleed adaptive icon background).
4. Enforce SVG portability rules for themeable rounds:
   - Use CSS variables for colors (`currentColor`, `var(--accent, ...)`, `var(--bg, ...)`, and `var(--ink-inverse, ...)` for an accent or cutout resting on a filled plate) so the comparator can re-theme every variant cleanly.
   - Prefix every internal SVG `id` (gradients, masks, clip paths, filters) with `<variant-id>-` so inlining multiple SVGs on one HTML page never collides.
   - Use open/licensed fonts only (for example, SIL OFL) converted to paths or drawn geometry. Never allow proprietary system fonts in a wordmark.

### 3. Dispatch in parallel, time-box, and monitor by file

1. Launch all agents for the round in parallel with the same brief file and delivery contract.
2. Set a round time-box (for example, 10–15 minutes). Cancel any slow agent that stalls researching reference libraries without writing deliverables; proceed with the deliveries that landed.
3. Wait for completion by checking that `<round-prefix><agent>/manifest.json` exists and parses cleanly — never grep terminal scrollback for "done", because the prompt echo matches immediately.
4. Instruct each agent to verify its own renders with headless Chrome against the local comparator and explicitly forbid computer-use or desktop control.

### 4. Serve the local comparator and collect the person's picks

1. Copy [assets/comparator.html](assets/comparator.html) into `<work-dir>/comparator.html`.
2. Write `<work-dir>/rounds.json` following [assets/rounds.example.json](assets/rounds.example.json), listing each round's `prefix` and participating `agents`.
3. Start a local loopback HTTP server **detached** so it stays alive after the tool call or session ends:

   ```sh
   nohup python3 -m http.server <port> --bind 127.0.0.1 --directory <work-dir> >/tmp/design-comparator.log 2>&1 &
   ```

4. Give the person the local URL `http://127.0.0.1:<port>/comparator.html?round=<n>`.
5. The comparator inlines every agent's SVGs across dark, light, single-ink black, and single-ink white themes, at 16, 32, 48, and 128 px, plus a browser-tab preview, circle and squircle adaptive masks, and a themed monochrome icon.
6. Ask the person to star (`★`) favorites and paste the generated selection line back into the conversation, along with brief feedback on what worked and what did not.

### 5. Run converging rounds

1. Start each new round from the person's starred picks (or from a clear visual direction shift if the previous round missed).
2. Change only **one or two axes** per converging round (for example: organic vs. geometric shapes, gradient language, removing notches, or upright vs. tilted lockup).
3. Document rejected directions in the new round's brief so agents do not repeat them.
4. Add the new round entry (`prefix` and `agents`) to `rounds.json` and review `?round=<n>`.

### 6. Produce the final kit with the winning agent

1. Stop concept rounds as soon as the person confirms a winning variant and any final micro-adjustments.
2. Assign **only the winning agent** to generate the production kit (see the checklist in [references/delivery-contract.md](references/delivery-contract.md)): master SVGs with literal colors (no CSS `var()`), platform icon layers across densities, monochrome icon, splash assets, store graphics (such as 512×512 icon and 1024×500 feature graphic), favicons, open font license file (such as OFL), and a contact sheet.

## App screen explorations with two design tools

When exploring UI screens rather than SVG marks:

1. Write one shared screen brief with the person first (product context, target journeys, key states, viewport, visual tone, fictional sample data).
2. Feed that identical brief to two design tools or agents in parallel (for example, two separate UI generators).
3. Save each tool's outputs side by side in separate subfolders, compare them against the brief's states and constraints, and have the person pick one direction before building code.

## Verified traps

- **Accent piece on a plate vanishes in single-ink mode:** collapsing `--accent` to `currentColor` makes an accent over a filled plate disappear. Give accents or cutouts on plates their own `--ink-inverse` variable.
- **Standalone files ignore CSS `var()`:** favicons, app icons, and standalone exported SVGs cannot resolve page CSS variables. Bake literal hex colors into every production-kit file.
- **Headless Chrome `--virtual-time-budget` does not advance CSS animations:** inspect animation frames by pausing the animation at target timestamps with negative `animation-delay` (for example, `animation-play-state: paused; animation-delay: -0.4s`).
- **Default animations miss intent:** ask the person what motion must express before generating animated variants.
- **`qlmanage -t` is not a valid SVG preview:** macOS QuickLook thumbnails composite onto opaque white and crop wide SVGs. Verify with headless Chrome over local HTTP instead.
- **Outlining text without `fontTools`:** when Python `fontTools` is unavailable, convert glyph outlines with `fontkit` in a temporary directory outside the project repository.
- **Browser verification triggers computer-use:** an agent told only to "verify in a browser" may attempt desktop control. Specify headless Chrome and explicitly forbid computer-use.
- **Foreground HTTP server dies:** an HTTP server tied to a shell turn exits when the turn or session ends. Always bind to `127.0.0.1` and detach with `nohup`.
- **Prompt echo fools completion monitors:** waiting for the word "done" in pane output matches the brief itself. Check for `<agent>/manifest.json` on disk.
- **Proprietary fonts and stalled agents:** reject proprietary system fonts immediately (require OFL or drawn paths), and cancel any agent that burns the time-box without delivering.

## Invariants

- Write the brief with the person first, and give the identical brief file to every agent in the round.
- Keep each agent inside its own subfolder with `manifest.json` and prefixed SVG `id`s.
- Change at most one or two axes per converging round; time-box rounds and cancel slow agents.
- Serve the comparator locally on `127.0.0.1` detached, with zero external network requests.
- Use open/licensed fonts only, and bake literal colors into all production-kit files.
