---
name: coding-standards
description: "Use whenever you write, edit, review, or refactor ANY code in ANY stack — features, fixes, endpoints, components — even when the user does not say 'standards'. Enforces the stack-agnostic core: SOLID, fail-fast early returns, self-documenting names (comments say WHY), small single-responsibility methods, DRY (rule-of-three, check shared/ or common/ first), composition over inheritance, never silence errors, DTOs between layers, constructor injection, logging by severity, and the FE-BE contract (sparse DTO, PATCH for partial edit, send only changed fields, no hidden fallbacks). For UI/HTML/web, detect the installed framework and use minimal custom CSS. Optional complements, if available: the `java-spring-standards` skill, the `angular-standards` skill or the `sql-authoring` skill for stack-specific rules; the `security-practices` skill for secrets, SQL injection, auth, CORS, or PII; the `version-evolution` skill for selecting or migrating language, framework, toolchain or LTS versions; the `reviewing-code` skill for diff hygiene."
---

# coding-standards — Universal coding standards

## Purpose

The universal, **stack-agnostic** trunk of coding standards. It applies when implementing, reviewing or refactoring in any language. It contributes rules; the consumer writes the code.

Stack- or concern-specific rules can come from other skills when they are available (see "What is NOT here").

## Knowledge

### General principles

- **SOLID** — Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion.
- **Fail fast** — validate and return at the top of the method (early returns); avoid deep nesting.
- **Descriptive names** — code self-documents. Comments explain the **why**, never the **what**. A comment that repeats the code gets deleted. `TODO` for incomplete code.
- **The code file is not the home of design documentation** — architecture, rationale, usage guides and change narratives do not belong in a header block or a running commentary inside the source. Keep in the file only what a reader of that file needs to understand it; the rest belongs in the repository's own documentation. Where that documentation lives and how it is named is the repository's or the workflow harness' call, not this skill's.
- **Small methods** — one responsibility per function.
- **Composition over inheritance**.
- **Never silence errors** — an unhandled error propagates; never catch it to return a mock/empty value.

### Fit the repository you are changing

- **The impacted repository's pattern wins over your own preference.** Layering, folder layout, naming, error handling and test placement follow what that repository already does, even when a different style would be objectively defensible.
- **Read before diverging** — before introducing a different layer, a different location or a different style, read that repository's instruction file (`CLAUDE.md` / `AGENTS.md` / equivalent) and the code next to the file you are about to touch.
- **A deliberate divergence is proposed, not slipped in** — when the existing pattern is genuinely wrong for the change, say so and let the user decide; never leave the repository holding two conventions for the same concern.

### Reuse before duplicating (DRY)

- Before creating a component/function/class, check whether it exists: `shared/` (frontend) or `common/`/`util/` (backend).
- **Rule of three**: extract only when a pattern repeats 3+ times (a pattern in 2 places is observed; in 3, extracted).
- Extraction always as an isolated diff, separate from the feature.

### DTOs and injection (cross-stack)

- **DTOs between layers** — the API exposes DTOs, never persistence entities directly.
- **Constructor injection** — always by constructor, never field injection. How it materializes depends on the stack (if available, see the `java-spring-standards` and `angular-standards` skills).

### UI / HTML / web components (framework-first)

When touching UI or graphical components (especially HTML/web), the framework-agnostic rule:

1. **Detect the installed UI framework** before laying anything out — check `package.json`, global styles, imports and markup (Bootstrap, Angular Material, Tailwind, PrimeNG…). With more than one, or none evident, **ask the user** which one to use; never assume or mix frameworks.
2. **Minimal custom CSS** — leverage the installed framework's components, utilities, grid and tokens instead of writing your own CSS.
3. **Custom CSS only as the exception** — when the framework does not cover it, or the user asks for it (respect an existing design/identity). Default: zero custom CSS.

Per-stack detail (SCSS, Bootstrap partials, budgets, a shared components catalog) can come from the `angular-standards` skill, if it is available.

### FE-BE integration (when the change crosses frontend and backend)

Verb/DTO contract, generic (the concrete envelope shapes are organization-specific → see below):

- **R1 — Unified sparse DTO**: the same `<Feature>SaveRequest` DTO for create + edit, all fields nullable. `null` = "do not touch".
- **R2 — PATCH for edit**: partial `PATCH` in BE, `http.patch()` in FE. POST only for create. PUT only when a full replace is justified.
- **R3 — FE sends only changes**: the payload is the diff between the form value and the original entity.
- **R4 — No fallbacks that hide errors**: `catchError(() => of([]))` is forbidden in FE; a try/catch falling back to the legacy method is forbidden in BE during migrations. Gradual rollout with explicit feature flags. The rule covers **absent data too, not only thrown errors**: when a permission set, a catalog or a list comes back empty, render empty and say so — never widen access or substitute a default to make the screen look right.
- **R5 — BE validation with groups**: distinguish create-only rules vs edit when sharing a DTO (e.g. `OnCreate` validation groups).
- **R6 — DB stub-first**: new functions/SPs start returning a mock (`RETURN '[]'::jsonb`); the real implementation lands in a later phase.

### Logging by severity

Level semantics (cross-stack). The default stack and the message format (parametrized, context prefix, traceId/MDC) can come from the `java-spring-standards` skill, if it is available.

- `ERROR` — a failure needing immediate attention; log with the throwable.
- `WARN` — unexpected but handled situation.
- `INFO` — business events (process start/end).
- `DEBUG` — technical detail for diagnosis.
- Never log secrets or PII (if available, see the `security-practices` skill).

### Domain language

Use the repository's established domain language consistently across class/method/field/variable names, REST route segments, schema/table/column names, validation and user-facing messages, and comments; framework/library identifiers and language keywords keep their own language. Magic values and messages are centralized (a constants class / enums in BE, a constants file in FE), never inline.

## What is NOT here (other skills)

This skill is only the universal trunk. For adjacent concerns, load the matching skill if it is available — never duplicate its content:

- **the `java-spring-standards` skill** — MVC layers, `@RequiredArgsConstructor`, `@Transactional`, Bean Validation, `@ControllerAdvice`, Log4j2 + traceId, DTO style (e.g. `@Data public class OrderUpdateRequest`).
- **the `angular-standards` skill** — `@data`/`@presentation` architecture, a single HTTP wrapper service, reactive forms, centralized error handling, framework-first CSS.
- **the `sql-authoring` skill** — SQL script authoring (idempotency, header, categories, rollback).
- **the `security-practices` skill** — secrets out of code/logs, parametrized SQL, input sanitization, DB via READ-ONLY MCP, CORS, PII.
- **the `reviewing-code` skill** — atomic diffs (one concern per diff, split >5-file changes), propose-then-execute, the closing quality gate.
- **the `version-evolution` skill** — current versus target baselines, supported/LTS selection, compatibility matrices and incremental upgrades.
- **your organization's API envelope convention, if it has one** — the concrete request/response envelope shapes, status semantics and their FE mirror.

## Output

None of its own. The skill contributes rules; the consumer writes the code. When the change touches DB, modifications ship as versioned SQL scripts the user applies (if available, see the `sql-authoring` and `security-practices` skills).
