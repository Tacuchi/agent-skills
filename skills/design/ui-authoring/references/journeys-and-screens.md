# Journeys and screens

Use this guide when you need concrete decisions about an interface; match the level of detail to the question. A drawing does not replace behavior described in text. The [fictional appointment journey](../assets/example-journey.md) shows a minimal version.

## From goal to journey

1. Name the person, their goal, the entry point and the observable result. Clarify device, permissions and known constraints; leave as a question whatever only the business can decide.
2. Draw the journey as nodes (screen or step) and edges (action + condition). Include success, voluntary exit, abandonment, error and recovery; for each branch, say who triggers it.
3. For each edge, describe which data goes in and out, what changes and where the person ends up. A list of screens without connections does not explain the journey.

Fictional example: "Search" → on submitting a valid date → "Results"; no slots → empty state with a "Change date" option; network failure → error with "Retry" without losing the date. Do not assume that booking an appointment is possible if the need only asks to look it up.

## Card for each screen

| Question | What to record |
|---|---|
| Purpose | Task and point in the journey; how the screen is entered and left. |
| Structure | Header, regions, main content, primary and secondary actions; reading order and visual hierarchy. |
| Data and rules | Fields, origin and freshness of data, validations, permissions and messages; minimize sensitive data. |
| States | Initial, loading, empty, success, error, no permission and retry where they apply; content and available action in each one. |
| Interaction | Actions, confirmations, navigation, reversibility and where focus goes after each transition. |
| Adaptation | Devices, widths, long content, language and enlarged text that affect the structure. |
| Failures | Validation, network, expiry or denied access; what is kept, how it is reported and how it is recovered. |

State the hierarchy with observable decisions: which action stands out, which information is read first and what stays subordinate. Do not rely only on color or position to convey state; use text and structure. Use existing components or tokens only if they are available in the authorized sources; otherwise describe the visual intent without inventing a library.

## Verifiable states and accessibility

- For each transition, record "previous state → event/condition → next state → visible and announced response". Tell loading from empty and from error; avoid active controls that trigger duplicate operations.
- Explain keyboard order, the accessible name of controls, labels and their associated errors, focus after navigation or error, announcement of results without unexpected movement, and an alternative to gesture-only input. Define how contrast and enlarged text will be reviewed; do not claim conformance without tests.
- Test edge inputs: no data, invalid data, late response, expired session, insufficient permissions, interruption and return. Say whether what was entered is kept or discarded.
- Separate confirmed claims, hypotheses and open questions. A screenshot can help review the visuals, but it does not prove interaction, accessibility or error behavior.

## Reviewing the specification

Walk with the person through one success path and one failure path end to end. For each screen check purpose, action, next state and feedback; for each state check its exit or recovery. Check hierarchy, privacy, keyboard, focus, accessible names and adaptation against known needs. If a functional decision is missing, ask the concrete question and do not fill it with a visual detail.
