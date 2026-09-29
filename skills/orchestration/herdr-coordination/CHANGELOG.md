# Historial de herdr-coordination

## [1.1.0] — 2026-09-29

- Reparto parejo de un tab entre N agentes (`--ratio` en 1/N, `pane layout`, `pane resize`) y lectura del banner con el reparto corregido o con zoom.
- Los diálogos de varias pestañas se leen enteros sin elegir, releyendo tras cada tecla, y se envían sólo con la revisión completa.
- Una autorización general previa no responde a una solicitud concreta; si el host bloquea el envío al diálogo de otro agente, la persona contesta en su panel.

## [1.0.1] — 2026-09-29

- Entrecomilla la `description` del frontmatter: el `: ` sin comillas era YAML inválido y los instaladores estrictos (`skills` CLI) omitían la skill.

## [1.0.0] — 2026-09-29

- Primera guía autónoma de coordinación de agentes Herdr: panel como fuente de verdad, delegación verificable, recuperación y autorizaciones humanas explícitas.
