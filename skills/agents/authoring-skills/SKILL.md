---
name: authoring-skills
description: "Use when authoring or editing an agent SKILL.md — its description/frontmatter or its instruction body — even when the user only says 'write a skill', 'this skill isn't triggering', or 'improve this skill'. Enforces the description-as-trigger discipline (third person, what + 'Use when…' + the literal keywords users type + a negative-scope seam against sibling skills, front-loaded), lean progressive-disclosure bodies (≤~500 lines, references ≤1 hop with load conditions), imperative one-idea-per-line steps, affirmative action wording (reserve 'never' for true invariants and pair it with the motivation), and validating triggers on the weakest target model. For prose style, the `technical-writing` skill helps if available; for tool scaffolding, the `creating-tools` skill helps if available."
---

# Authoring skills

A skill loads in two stages: its **description** decides whether it fires; its **body** runs once it does. Write for both — and for the weakest model you will ship to (a strong model masks weak triggers and under-specified steps).

## The description is a trigger, not documentation

Only `name` + `description` (~100 tokens) is preloaded to route among many skills.

- **Third person, imperative** — "Extracts…", "Enforces…". Never first/second person ("I can help…", "You can use…"); inconsistent point-of-view hurts discovery.
- **What + when** — state the capability, then a **"Use when…"** clause naming the contexts and the **literal keywords the user types** (verbs, file extensions, product terms), not generic paraphrases. Activation behaves closer to keyword-match than semantics: a term absent from the description tends not to fire.
- **Front-load** the primary use case in the first sentence — listings truncate the tail under budget pressure.
- **Concrete, not vague** — never "helps with X" / "handles Y"; name the artifact and the action.
- **Draw the seam** — add a negative-scope clause against adjacent skills ("…not for Vue" / "for the core rules, see the `coding-standards` skill if available"). This is the main lever against over-triggering and collisions. Negative scope belongs *here*, in the description — the opposite of the affirmative rule for action steps below.
- **One job** — statable in ~10 words. If the description needs several "or" clauses to cover its cases, split the skill.

## Keep the body lean (progressive disclosure)

- Three levels: metadata (always loaded) → SKILL.md body (loaded on trigger; keep ≤~500 lines) → bundled files/scripts (read or executed only when needed). In a session the body stays for the whole conversation — every line is a recurring token cost.
- **Add only what the model does not already know** — project conventions, edge cases, specific tools. Challenge each line: "would the agent get this wrong without it?" Cut what fails.
- **References ≤1 hop** from SKILL.md, each with a **load condition** ("Read api-errors.md if the API returns non-200"). Never chain SKILL → a → b.

## Write instructions the weakest model can follow

- **Imperative commands, never inferences.** Brief the model like a brilliant but context-free new hire: define terms, give ranges/defaults, state constraints it would otherwise guess.
- **One idea per line** — numbered/bulleted atomic steps when order or completeness matters; explicit branches ("If X do this; otherwise skip to step 5"). Never bury several requirements in one paragraph.
- **One term per concept** — always "API endpoint", never URL/route/path interchangeably. Drop near-synonym conditions ("if missing" beside "if incomplete").
- **Affirmative action steps** — name the desired behavior ("Respond in prose") over prohibitions ("Do not use markdown"); models handle negation unreliably. Reserve **"never"** for genuine invariants and pair each with its motivation ("read aloud by TTS, so never use ellipses").
- **Match freedom to fragility** — heuristics + why for open tasks (code review); exact, ordered, "do not modify" steps for fragile ones (DB migrations). Strong imperatives only for real invariants.
- **Pin the output** — exact format + at least one worked example in that format; three concrete examples beat twenty rules.
- Put the task and load-bearing constraints at the **start**; in long bodies **repeat** the critical invariants near the **end** — attention sags in the middle.

## Validate triggering before shipping

- Build ~18–20 labeled queries dominated by **near-miss negatives** (they share keywords but need a different skill); run each a few times for a trigger rate.
- **Tune on the weakest model you will serve.**
- Diagnose by direction: should-fire misses → description too narrow (broaden); should-not-fire hits → too broad (add specificity + negative scope, or gate to manual invocation).
- Gate irreversible/side-effecting skills (deploy, send) to explicit invocation — never rely on auto-trigger for what you can't undo.

## Gotchas

- **Dial back shouty caps** — "CRITICAL: You MUST ALWAYS…" makes current models over-trigger; prefer "Use when…". Emphasis is not clarity.
- **Multi-host caveat** — this guidance is measured mostly on Claude. On other hosts (Codex, Gemini, OpenCode, Crush) the keyword-matching, truncation points and caps-sensitivity may differ; when a host matters, verify triggering there rather than assuming it transfers.

For prose style, the `technical-writing` skill helps if available; for scaffolding a developer tool (not a skill), the `creating-tools` skill helps if available.
