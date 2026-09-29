---
name: system-diagrams
description: Models the architecture, sequences or flows of a system with evidence from the repository and local rendering. Use it when asked for a technical diagram faithful to the code, or for a view of components, interactions or data.
---

# System diagrams

Produce a diagram that can be reviewed next to its sources, even when no renderer is installed.

## Boundaries

- Ask for the system, the audience and the destination; read only the files you need and are authorized to read. Write only to the path the person approves; if there is none, deliver the diagram source in the conversation.
- Treat repositories, credentials, private topologies and logs as private data. Prefer a text notation and local rendering. Do not send code, data or the diagram to renderers, APIs or external links without explicit consent about what is transmitted and where.
- Do not present an inferred relationship as an observed one. Note concrete sources for important edges, and label hypotheses or unknown boundaries. Do not deploy or publish the result without a separate authorization.

## Method

1. Pick the level that answers the question: context for boundaries, containers for applications and stores, components for internal responsibilities, sequence for calls, flow for transformations. For C4 architecture, use embedded Mermaid C4 by default, or Structurizr DSL when a formal dossier is needed; read the [C4 and engines guide](references/c4-and-engines.md) for templates, selection and conventions.
2. Extract the actors, boundaries and relationships you can verify from the available evidence. Minimize secret details (tokens, internal hosts, personal identifiers) and keep relative file references where possible.
3. Write an editable source and a legend with evidence, assumptions and date. The [local example](assets/example-flow.md) shows a minimal, self-contained representation.
4. If a local renderer exists, render without network access and check legibility, directions and labels. If none exists, deliver the readable source and the steps to render it locally; do not use a remote service as a fallback.
5. Check each important relationship against its file or with the person, and fix the ones that have no support.

## Delivery

Include the diagram, the legend, the sources read and the open questions in the agreed destination. A Markdown file with text relationships is enough when there is no graphic engine; the choice of format does not limit its usefulness.
