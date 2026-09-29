---
name: ui-authoring
description: Defines the journeys, screens, states, accessibility and failures of an interface from user needs. Use it when asked to design or specify the visible behavior of a UI, even with no code and no framework chosen.
---

# Authoring interfaces

Turn the person's goal into an interface specification that another team can implement and verify. Do not assume a design system or a framework.

## Scope and destination

1. Ask about users, goal, devices and constraints that cannot be inferred from the available sources. Read only the sources you need and the person has authorized; do not search for profiles, credentials or production data by default.
2. Agree on the output path before creating or changing files. With no approved destination, present the draft in the conversation. Keep changes inside that destination, and do not publish or copy personal data, secrets or internal screens to external services.
3. Any deployment, publication or irreversible write needs a separate authorization. The skill only drafts artifacts; it does not install tools or change the host environment.

## Process

- Identify the main task, the entry point, the successful exit and the paths of abandonment or recovery. State open decisions instead of inventing business rules.
- List screens and transitions: which action changes which state, and what is shown while waiting, when empty, on failure and on retry. Describe keyboard navigation, focus, labels, understandable messages and contrast, without promising conformance that has not been checked.
- Describe the data shown and collected, validation, permissions and privacy; use fictional examples in any screenshot or mockup. If a decision affects the functional result, give its reason and how it will be checked.
- To specify journeys, screens, visual hierarchy, adaptation, states and review criteria in enough detail, read the [journeys and screens guide](references/journeys-and-screens.md) as the requested interface needs.
- Deliver in the approved destination a readable document with goal, journey, screens, states and failure cases; link local assets with relative paths. Use the [neutral example](assets/example-journey.md) as a starting point, not as a mandatory template.
- Review each path and each state with the person: tell confirmed decisions from hypotheses, and leave concrete questions for the unresolved ones.

## Minimum result

A table or list of screens with action, resulting state and observable feedback, plus one main journey and one error journey. With no access to code, that specification is still useful with no extra dependencies.
