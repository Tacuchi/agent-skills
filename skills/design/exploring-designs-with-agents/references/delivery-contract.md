# Delivery contract

Share this contract with every agent in a round so all outputs drop straight into the local comparator without manual reformatting.

## Directory boundaries

- Each agent writes **only** inside its assigned folder:
  - Round 1: `<work-dir>/<agent>/`
  - Round N (`N >= 2`): `<work-dir>/round-<N>/<agent>/`
- Scratch files (intermediate PNG renders, audit scripts, contact sheets) go inside `<agent>/work/`.
- Hard limits for every participating agent:
  - No git commands.
  - No edits outside the assigned agent folder.
  - No spawning other agents.

## Required files per agent

### 1. `manifest.json`

```json
{
  "agent": "<agent-name>",
  "model": "<exact model id>",
  "variants": [
    {
      "id": "<kebab-case-id>",
      "idea": "<mark type · short concept label>",
      "name": "<Short Variant Title>",
      "concept": "<2–3 sentences in English explaining what is shown and why it fits the brief.>",
      "recommended": true
    }
  ]
}
```

- Deliver the agreed number of variants (typically 3–6).
- Every `id` is unique `kebab-case` and matches the SVG filenames below.
- Mark **exactly one** variant with `"recommended": true` (omit or set `false` on the rest).

### 2. Per-variant SVGs

| File | Required | Canvas and rules |
|---|---|---|
| `<id>-iso.svg` | Yes | Symbol / adaptive foreground. `viewBox="0 0 108 108"`, transparent background, core shape inside `21..87`. |
| `<id>-logo.svg` | Yes (logo rounds) | Horizontal lockup (symbol + wordmark). Tight `viewBox`, legible on both dark and light backgrounds. |
| `<id>-mono.svg` | Optional (recommended for app icons) | Single-ink version on the same canvas as `<id>-iso.svg`, colored exclusively with `currentColor`. |
| `<id>-bg.svg` | Optional | Full-bleed background layer (`viewBox="0 0 108 108"`) composited behind `<id>-iso.svg` by the comparator. |

### 3. `notes.md` (optional, recommended)

Keep it brief: word map, cliches ruled out, raw 1-line concept list, why the delivered variants were chosen, audit findings, and any assumptions made.

## Color variables and SVG ID rules

### Themeable rounds (CSS variables)

When the comparator re-themes variants across dark, light, and single-ink modes, avoid hardcoded hex colors inside the SVG; use CSS variables with fallbacks:

| Token | Purpose | Fallback example |
|---|---|---|
| `currentColor` | Primary ink | `#e6e6e2` |
| `var(--accent, #22c55e)` | Accent color | `#22c55e` |
| `var(--bg, #111111)` | Surface color when masking or cutting | `#111111` |
| `var(--ink-inverse, #111111)` | Accent or cutout resting on a filled plate so it stays visible in single-ink mode | `#111111` |

When a round explicitly allows free gradients, glows, or custom palettes, `<id>-iso.svg` and `<id>-bg.svg` may use literal colors and gradients, while `<id>-mono.svg` must still use only `currentColor` and `<id>-logo.svg` must read cleanly on both dark and light themes.

### Prefixed internal IDs

Prefix every internal SVG `id` (`linearGradient`, `radialGradient`, `clipPath`, `mask`, `filter`) with `<variant-id>-` (for example, `id="horizon-pulse-grad"`). The comparator inlines every variant into one DOM document; unprefixed IDs such as `id="g1"` collide across variants and break rendering.

### Fonts and outlines

- Use open/licensed fonts only (such as SIL OFL) or hand-crafted geometric paths. Never use proprietary system fonts.
- Convert wordmark text to SVG paths so `<id>-logo.svg` renders identically without installed fonts.
- If Python `fontTools` is unavailable, outline glyphs using `fontkit` in a temporary folder outside the project repository.

## Self-verification before delivering

1. Serve `<work-dir>` locally on loopback (`python3 -m http.server <port> --bind 127.0.0.1 --directory <work-dir>`).
2. Capture screenshots of `http://127.0.0.1:<port>/comparator.html?round=<n>` using **headless Chrome**.
   - Never use computer-use or desktop automation.
   - Never rely on `qlmanage -t` (it composites on white and crops wide SVGs).
3. Inspect every variant at 16, 32, 48, and 128 px, in dark, light, and single-ink themes, in the browser-tab preview, under circle and squircle masks, and in the themed monochrome preview.
4. If inspecting CSS animations, do not rely on `--virtual-time-budget` (headless Chrome does not advance CSS keyframes with it); freeze target frames with `animation-play-state: paused` and a negative `animation-delay`.

## Production kit checklist (winning agent only)

Run this phase only after the person confirms the final winning variant:

- **Master SVGs with literal colors:** resolve every `var(...)` and `currentColor` into concrete hex colors for standalone distribution (favicons and standalone SVG viewers do not inherit page CSS variables).
- **Platform icon set:** adaptive icon foreground and background layers at required densities (for example, Android `mdpi` through `xxxhdpi`), monochrome themed icon, and splash screen asset.
- **Store graphics (if shipping an app):** e.g. 512×512 store icon and 1024×500 feature graphic.
- **Web favicons:** `favicon.svg` (literal colors), `favicon.ico`, and touch icons (`180×180`, `192×192`, `512×512`).
- **Font license:** include the open font license file (for example, `OFL.txt`) alongside the kit whenever a typeface was used.
- **Contact sheet:** one summary image showing every exported deliverable at actual proportions for final sign-off.
