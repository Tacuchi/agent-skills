# Brief templates

Use these templates to keep every agent aligned on the same goals and constraints. Fill all `<placeholders>` with concrete decisions confirmed by the person before dispatching a round.

## Round 1 brief template (logo or icon)

```markdown
# Design brief · <product name>, round 1

Date: <YYYY-MM-DD>. Confirmed with the person.

## What the product is

- <1–2 sentences describing what the product does and who uses it.>
- <Moment of use: when and why the person opens it.>
- **Emotional tone (3–5 adjectives):** <e.g. warm, calm, modern, trustworthy, crisp>.

## Scope

- **Deliverables for this round:** concepts only — stop before building a full production kit.
- **Pieces per variant:**
  - Symbol / icon mark (works as <platform icon, e.g. Android adaptive foreground + monochrome icon, favicon>).
  - Horizontal lockup: symbol alongside the word "<wordmark>".
- **Variant count:** <e.g. 3–5> genuinely distinct concepts covering different mark types (abstract, letterform, pictorial, emblem) rather than minor tweaks of one idea.

## Visual direction

- **Color policy:** <fixed brand palette with hex values, or open palette with mood guidance>.
- **Starting ideas (optional inspiration, not mandatory):**
  - <idea 1>
  - <idea 2>
  - <idea 3>
- **Identity boundaries:** <what this mark must NOT resemble, such as an unrelated personal brand or competitor>.

## Technical constraints

- **Small-size legibility:** remains clear at 16 px; no hairlines or micro-details that blur away.
- **Icon safe zone (if adaptive icon):** `viewBox="0 0 108 108"`, core mark inside the central 66-unit circle (`21` to `87`) so circle, squircle, and rounded-square masks never clip it.
- **Single-ink viability:** works in solid black on light and solid white on dark without losing the core shape.
- **Typography:** open/licensed font (such as SIL OFL) converted to paths, or custom geometric paths. Never use proprietary system fonts.
- **Motion (only if requested):** <explicit description of what the animation must express; omit if static>.

## Cliches to avoid

- <list 4–8 overused category tropes to rule out from the start>

## Working rules

- Follow the delivery contract in `contract.md`.
- Do not ask blocking questions during the round; make reasonable decisions and record assumptions in `notes.md`.
- If a dedicated logo craft skill is installed, follow its concept and audit stages and stop at the concept checkpoint (do not generate the production kit yet).
```

## Converging round brief template (round N)

Change only **one or two axes** per round so feedback stays legible.

```markdown
# Design brief · <product name>, round <N>

## Feedback from round <N-1>

- **What worked (starred picks):**
  - `<agent>/<variant-id>`: <exact reason the person liked it>.
- **What did not work:**
  - <short summary of rejected directions and why they missed>.

## Axes to explore this round (pick 1–2)

1. **<Axis 1, e.g. shape language / silhouette>:** <specific change requested>.
2. **<Axis 2, e.g. color treatment or lockup proportion>:** <specific change requested>.

## What stays unchanged

- <carry-over constraints: safe zone, 16 px legibility, monochrome icon, OFL font or vector paths>.
- **Additional cliches to avoid:** all rejected paths from rounds 1..<N-1>.

## Variant mix

- Produce <e.g. 3> variants: <e.g. at least 1 refining the starred pick along the new axis, and up to 2 fresh interpretations>.
- Follow `contract.md` in this round's folder.
```

## App screen exploration brief additions

When comparing two design tools in parallel on app screens instead of SVG marks, include these sections in the shared brief:

- **Target screens (2–4 key views):** name each screen, its primary action, and the next transition.
- **Required states:** populated, empty, loading, and error/recovery state for each screen.
- **Platform and viewport:** mobile or desktop dimensions, light/dark mode expectation, and native conventions (such as edge-to-edge safe areas).
- **Sample content:** concrete fictional copy and realistic item lengths — never real personal data or placeholder lorem ipsum that hides layout bugs.
- **Comparison rubric:** list the 3–4 criteria the person will judge side by side (hierarchy, scannability, tone, implementation fit).
