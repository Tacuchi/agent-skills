---
name: ui-authoring
description: Define recorridos, pantallas, estados, accesibilidad y fallos de una interfaz a partir de necesidades de usuario. Úsala cuando se pida diseñar o especificar el comportamiento visible de una UI, incluso sin código ni framework elegido.
---

# Autoría de interfaces

Convierte el objetivo de la persona en una especificación de interfaz que otro equipo pueda implementar y comprobar. No presupongas un sistema de diseño ni un framework.

## Alcance y destino

1. Pregunta por usuarios, objetivo, dispositivos y restricciones que no se deduzcan de las fuentes disponibles. Lee sólo las fuentes necesarias que la persona haya autorizado; no busques perfiles, credenciales ni datos de producción por defecto.
2. Acuerda la ruta de salida antes de crear o modificar archivos. Si no hay destino aprobado, presenta el borrador en la conversación. Mantén los cambios dentro de ese destino y no publiques ni copies datos personales, secretos o pantallas internas a servicios externos.
3. Cualquier despliegue, publicación o escritura irreversible requiere autorización separada. La skill sólo redacta artefactos; no instala herramientas ni modifica el entorno del host.

## Proceso

- Identifica la tarea principal, punto de entrada, salida exitosa y caminos de abandono o recuperación. Explicita decisiones abiertas en vez de inventar reglas de negocio.
- Enumera pantallas y transiciones: qué acción cambia qué estado, qué se muestra mientras espera, al quedar vacío, al fallar y al volver a intentar. Describe navegación por teclado, foco, etiquetas, mensajes comprensibles y contraste sin prometer conformidad que no se haya comprobado.
- Describe datos mostrados y recogidos, validación, permisos y privacidad; usa ejemplos ficticios en cualquier captura o maqueta. Si una decisión afecta al resultado funcional, indica su motivo y cómo se comprobará.
- Entrega en el destino aprobado un documento legible con objetivo, recorrido, pantallas, estados y casos de fallo; enlaza assets locales con rutas relativas. Usa el [ejemplo neutro](assets/ejemplo-recorrido.md) como punto de partida, no como plantilla obligatoria.
- Revisa cada ruta y cada estado con la persona: distingue decisiones confirmadas de hipótesis y deja preguntas concretas para las no resueltas.

## Resultado mínimo

Una tabla o lista de pantallas con acción, estado resultante y retroalimentación observable, más un recorrido principal y uno de error. Si no hay acceso a código, esa especificación sigue siendo útil sin dependencias adicionales.
