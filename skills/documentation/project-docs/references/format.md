# The published format

Read this before writing or reviewing any published file. It fixes what each piece holds and the exact shapes `check` reads.

## The three pieces

| Piece | Where it lives | Question it answers |
|---|---|---|
| `README.md` | Repository root | What is it, how do I install it and how do I use it? |
| `ARCHITECTURE.md` | Repository root | How is it built and which rules does it follow? |
| Decision records | `docs/decisions/` | Why was this decided? |

Rules for all three:

- **Language.** The language of the repository's README. Without a README, ask.
- **Defaults only.** State the default value, when it applies and how to change it.
- **Nothing measured.** A fact that is true of one machine at one moment never enters a published file. The table at the end converts each kind.
- **Unknown stays unknown.** Write "Not recorded yet" for a reason nobody stated.

## `README.md`

Start from [the README template](../assets/README.md.template). The order is fixed:

1. Title.
2. A one-line description in a block quote, under 120 characters.
3. One or two paragraphs: what it is and what sets it apart.
4. Table of contents, only when the README is longer than 100 lines.
5. Install: requirements, install, own setup steps, update, uninstall, platforms.
6. Usage: what the reader gets, the daily commands, and one paragraph with a link for each long topic.
7. How it works: one paragraph, the context diagram and the link to `ARCHITECTURE.md`.
8. Contributing. One line is enough.
9. License.

Rules:

- A long guide moves to `docs/<topic>.md`. The README keeps one paragraph and the link.
- Paths, ports and environment variables belong in `ARCHITECTURE.md`.
- When reordering an existing README, move its text; do not rewrite it. Afterwards, confirm that no original line was lost.
- `check` recognizes the section names in English and Spanish. Other names only produce a warning.

## `ARCHITECTURE.md`

Start from [the ARCHITECTURE template](../assets/ARCHITECTURE.md.template). Aim for 150 to 350 lines.

### Header

The first paragraph after the title is one line with the review date, the version and the pinned commit:

```
Reviewed on 2026-01-02 against version 1.4.0 (commit `abc1234`).
```

`check` reads that paragraph by shape, in any language: the first date written as `YYYY-MM-DD`, the first version number, and the first commit hash inside a code span. A project without versions leaves the version out.

The next paragraph states the scope: what the document covers, what it leaves out, and that every value is a default.

### Sections

Exactly seven numbered sections, in this order, then one section without a number for the evidence.

| Section | Holds |
|---|---|
| 1. Purpose and quality goals | A paragraph of purpose, a "What it is not" list, and a table of three to five goals, each with a scenario |
| 2. Context and scope | The context diagram, its interactive link, and a table of external interfaces: direction and when it happens |
| 3. Building blocks | The container diagram, its interactive link, a table of block, responsibility and code, and the "Rules that never break" list |
| 4. Runtime view | One or two numbered walkthroughs, step by step |
| 5. Deployment view | A table of what, default, when it applies and how to change it; requirements; optional deployments |
| 6. Cross-cutting concepts | Data and privacy in six questions; security; persistence |
| 7. Decisions | A table that links each record in `docs/decisions/`, and a "Not recorded yet" list |

Rules:

- The text does not link to the code. Evidence goes only in the appendix.
- A rule is written as a statement with no exception. If there is one, name it.
- A single-process command-line tool may settle sections 4 and 5 in a few lines.

### The six privacy questions

Section 6 always answers these, in a table:

1. What leaves the machine, and where does it go?
2. What never leaves it?
3. When does it happen?
4. Where is it stored, and for how long?
5. How can the person see exactly what was sent?
6. How is it turned off?

### Evidence appendix

The last section has no number. It opens with one sentence that names the pinned commit, then a table with one row per section:

```
| Section | Evidence |
|---|---|
| 3. Blocks | `src/cli.ts:102-126`, `src/service/server.ts:33-70` |
| 6. Privacy | `src/config.ts:7`. A search for external URLs in `src/` found none |
```

- A citation is a code span written as `path:line` or `path:start-end`. Line numbers refer to the pinned commit.
- Any other text in the cell is ignored by `check`, so a short note is allowed.
- Cite code or configuration only. A citation to `README.md`, `ARCHITECTURE.md` or anything under `docs/` is an error: those files change in the same commit that edits the document.
- Cite the smallest range that proves the claim. A range that covers a whole file goes stale at every edit.

## Decision records

- One file per decision: `docs/decisions/NNNN-title-with-dashes.md`. Four digits, lowercase, never reused.
- Start from [the decision template](../assets/decision.md.template): front matter with `status` and `date`, then context, considered options, outcome and consequences.
- Record only a reason found in the code, in a commit, or given by the person. When it comes from a comment, say so in the record.
- A decision with no known reason goes in the "Not recorded yet" list of section 7.
- An accepted record is never rewritten. A change of mind is a new record; the old one gets `status: superseded by NNNN`.

## From a measured fact to a publishable form

| Fact of one installation | Publishable form |
|---|---|
| Memory a process used | The behavior or the requirement: when it loads and whether it is released |
| How long it has been up | Who starts it and when it ends |
| An absolute path in a home folder | The path with `~` and the variable that changes it |
| An own domain | `example.com` |
| An own IP address | A reserved documentation range, such as `192.0.2.0/24` |
| Linked devices and their dates | The mechanism and its default deadlines |
| The installed version | The version the document was reviewed against |
| A token or a key | Nothing real; an obviously fake placeholder at most |
| A document or a folder outside the repository | The fact it states, with no path to it |

`check` catches home paths, common secret patterns and the terms of the private list. It cannot tell a measured number from a default: that judgment is yours.
