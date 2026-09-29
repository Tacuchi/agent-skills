---
name: technical-writing
description: "Use whenever you write technical prose of any kind — commit messages, PR descriptions, docs, READMEs, notes, decision records, release notes — even short ones, and even when the user does not ask for good writing. Enforces short sentences (~15 words), lists over prose, one idea per line, what + why on a single line, no jargon, no filler, an audience-driven lexicon (plain functional terms for operators and management, technical terms for developers), and decision records as ADR/DEC. For the commit shape, the `git-conventions` skill helps if available; for the diff discipline, the `reviewing-code` skill if available."
---

# technical-writing — Clear technical writing

## Purpose

Style and format rules for **all technical prose**: commit messages, PR descriptions, documentation, notes, decision records, release notes. Short sentences, lists over prose.

This skill covers **how the text is written**. The commit's shape (one line, what-not-how, propose-first) belongs to the `git-conventions` skill, and diff discipline (atomic, one concern) to the `reviewing-code` skill, when they are available.

## Knowledge

### The 6 rules

1. **Short sentences**: ~15 words max. Past 20, split in two.
2. **Lists over prose**: 3+ parallel ideas go in bullets. Prose only to narrate.
3. **One idea per line**: if a bullet uses "and" or ";" to sneak in a second idea, split it.
4. **"What + why" on one line**: format `<what>: <short why>`. No separate paragraph for the why.
5. **No jargon or odd abbreviations**: common words. Technical terms (MCP, C4) OK; invented abbreviations (e.g. "TLDR of the CTX") no.
6. **No filler**: delete `"it is important to note that…"`, `"it is worth highlighting…"`, `"as mentioned…"`, `"in conclusion…"`. The idea goes first.

### Words to avoid / prefer

| Avoid | Prefer |
|---|---|
| "it is important to note that" / "it is worth highlighting" | (delete, start with the idea) |
| "in other words" / "furthermore" | (delete) / "also" |
| "we proceed to" / "carry out" | direct verb / "do" |
| "implement the functionality of X" | "implement X" |
| "perform the validation of" | "validate" |
| "for the purposes of" / "within the framework of" | "for" / "in" |
| "notwithstanding" / "previously mentioned" | "but" / "earlier" |
| "TLDR", "FYI", "WIP" | write the full word |

### Audience lexicon

In functional or management prose, prefer the plain functional term. Technical terms only in technical context (code, troubleshooting, engineering comments).

| In functional prose use | Instead of |
|---|---|
| put live / make available | deploy / deployment |
| combine the changes | merge |
| service / web address the system calls | endpoint |
| proposed change | PR / pull request |
| automated build and release steps | pipeline |
| undo the change / go back to the previous version | rollback (technical OK) |
| data sent / data received | payload |

Quick decision rule: read by an operator or management? → functional term. Read by a developer in a diff or a log? → technical term allowed.

### Before / after example

Before:

```
It is important to note that each call implies a round-trip to the MCP server in addition to the consumption of tokens corresponding to the response JSON.
```

After (−50%):

```
Each MCP call costs a round-trip and the tokens of the JSON.
```

Functional prose with technical terms, before:

```
After the merge to staging the pipeline runs and the deploy of the endpoint is ready.
```

After (functional lexicon):

```
Once the changes are combined into the staging version, the automated release steps run and the service is ready to put live.
```

### Decision records (ADR / DEC)

Only the **non-obvious** gets recorded. Trivial decisions are not written.

Short format, 3-6 lines:

```md
## DEC-007: Validate permissions only in the frontend
**Decision**: role validation lives only in the FE.
**Why**: the backend does not need the logic; it avoids duplicating the rule.
```

- `ADR-NNN` for architecture decisions, `DEC-NNN` for implementation decisions.
- Correlative numbering; the title is the decision in one line.
- Body = `**Decision**:` + `**Why**:`. No "alternatives considered" unless it adds value.

Dense decision, before:

```
It was decided, after analyzing the alternatives, to implement role validation only in the frontend, given that the backend does not require the logic and it avoids duplicating the rule.
```

After: the DEC-007 block above.

### When long prose IS allowed

- Executive summaries where the decision needs 4-6 sentences to hold.
- The causal chain of an incident (a root cause may need a paragraph).
- UX tradeoffs that need explanation.

Even there: simple chained sentences, never long ones.

### Application by document type

- **commit messages**: one line, what changes (not how); no jargon, no filler. The exact shape and the propose-first policy belong to the `git-conventions` skill, if available.
- **PR descriptions**: brief summary + change bullets; no corporate filler.
- **decision records**: `ADR-NNN` / `DEC-NNN`, `**Decision**:` + `**Why**:`, 3-6 lines.
- **docs / manuals / reports**: operator/management audience; functional wording, bullets over prose, no filler.

### Note on where docs live

Artifact routing (which folder a document goes to, how it is named) is governed by the project's own conventions or tooling, **not this skill**. Here only the content's writing is defined, never its location. One detail that does matter while writing: parsers depend on **stable canonical headings** — the body can be freely simplified or translated, but never rename the headings or touch machine-read markers (such as HTML comment markers).

## Output

None of its own. The skill contributes rules; the `.md`, the commit or the message is written by whoever consumes it.
