# Diagrams

Read this before creating or changing a diagram. Diagrams are drawn with Archify, a separate tool with its own guide: follow that guide for how a source is written. This file fixes only what the two diagrams hold, where their files go and how the image is exported.

## What is needed

- **Archify.** The preflight prints the path of its command file in `archify`. When it is `null`, tell the person that the diagrams need Archify (`tt-a1i/archify`) and ask whether to stop or to go on and leave the diagrams pending. `ARCHIFY_HOME` points the preflight at a folder it did not find.
- **Chrome.** The export uses the Chrome already installed. When `chrome` is `null`, the person can export by hand: open the page, choose Export, then "SVG · Auto", and save it next to the page.

## Two diagrams per repository

| Diagram | File name | Shows |
|---|---|---|
| Context | `context` | The system as one box in the middle; the people and the outside systems around it; one labeled arrow per interface |
| Containers | `containers` | What runs and what stores data inside the machine boundary; the security boundaries; the outside systems |

Rules for both:

- Every box cites the code that proves it exists, in its `sources`: `path`, `line` and `end_line`. Cite code or configuration, such as the manifest for the system itself; never the README or another document, which `check` reports as `diagram-self-citation`.
- `meta.repository` names the repository: `url`, `provider`, `link_mode` and the full commit hash in `revision`.
- Labels say what a thing is and when a connection happens. No measured figure, no own domain, no device name.
- The explanatory cards appear only on the page. The image carries the boxes, the arrows and the legend.
- Keep the labels short: the image is read at the width of a text column.
- Put connected boxes on the same row or the same column, so the arrows run straight.
- In the context diagram, make the central box large enough for every arrow to reach it without a bend.
- Name the central box after the repository. In a system of several repositories, each one does the same.

## Three files per diagram

All in `docs/architecture/`:

| File | What it is |
|---|---|
| `<name>.archify.json` | The source. Edit this one |
| `<name>.html` | The interactive page, generated |
| `<name>.svg` | The image the documents show, exported from the page |

## Generate the page

Run from the repository root, with `<archify>` being the path the preflight printed:

```sh
node <archify> finalize architecture docs/architecture/<name>.archify.json docs/architecture/<name>.html --repo-root . --quality showcase --json --out-dir <temporary folder outside the repository>
```

- Fix what it reports and run it again until it passes.
- It leaves a `<name>.delivery.json` receipt next to the page. Move it out of the repository: it holds local paths, and `check` reports it as `local-path`.

## Export the image

```sh
node <skill dir>/scripts/export-svg.mjs docs/architecture/<name>.html
```

- It writes `docs/architecture/<name>.svg`, with both themes inside one file.
- Exit code 1 means the page did not offer the image: read the message, it names what it looked for. Exit code 2 means Chrome or the file was not found.
- `external_requests` in its answer must be empty. If it is not, say so before going on.
- Look at the image in light and in dark before calling it done.

## Show it in the documents

In `ARCHITECTURE.md`, section 2 shows the context diagram and section 3 the container diagram. Each takes two lines, written out in [the ARCHITECTURE template](../assets/ARCHITECTURE.md.template):

1. An image whose target is `docs/architecture/<name>.svg` and whose text is "Context diagram of" or "Container diagram of" plus the project name.
2. A link named "Interactive version" whose target is `docs/architecture/<name>.html`, followed by "download the file and open it in a browser".

In the README, "How it works" shows the context image and links to `ARCHITECTURE.md`.

## Interactive pages on GitHub Pages

Inside a repository, a link to the page shows its source. GitHub Pages serves it as a page.

- Offer it only for a **public** repository: a Pages site is public even when the repository is private.
- Ask first, with a structured question. Turning it on publishes the whole `docs/` folder.
- With the person's yes: source branch `main`, folder `/docs`. The page is then at `https://<owner>.github.io/<repository>/architecture/<name>.html`; use that address in the "Interactive version" links and drop the download sentence.
- The site has no start page unless `docs/` has one. Say so.

## When a diagram changes

Regenerate a diagram when a box, an arrow or a label is wrong, or when `check` reports `diagram-source-stale`.

1. Edit the source and set `meta.repository.revision` to the current commit.
2. Generate the page and export the image again.
3. Run `check`.
