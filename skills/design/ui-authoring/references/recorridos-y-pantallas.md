# Recorridos y pantallas

Usa esta guía al necesitar decisiones concretas sobre una interfaz; adapta el nivel de detalle a la pregunta. Un dibujo no sustituye el comportamiento descrito en texto. El [recorrido ficticio de turnos](../assets/ejemplo-recorrido.md) muestra una versión mínima.

## Del objetivo al recorrido

1. Nombra a la persona, su meta, el punto de entrada y el resultado observable. Aclara dispositivo, permisos y restricciones conocidas; deja como pregunta lo que sólo el negocio puede decidir.
2. Dibuja el recorrido como nodos (pantalla o paso) y aristas (acción + condición). Incluye éxito, salida voluntaria, abandono, error y recuperación; si hay una bifurcación, indica quién la provoca.
3. Para cada arista, describe qué dato entra y sale, qué cambia y dónde queda la persona después. Una lista de pantallas sin conexiones no explica el recorrido.

Ejemplo ficticio: «Búsqueda» → al enviar fecha válida → «Resultados»; sin cupos → estado vacío con opción «Cambiar fecha»; fallo de red → error con «Reintentar» sin perder la fecha. No presupongas que reservar un turno es posible si la necesidad sólo pide consultarlo.

## Ficha de cada pantalla

| Pregunta | Qué registrar |
|---|---|
| Propósito | Tarea y punto del recorrido; entrada y salida de la pantalla. |
| Estructura | Encabezado, regiones, contenido principal, acciones primarias y secundarias; orden de lectura y jerarquía visual. |
| Datos y reglas | Campos, origen y vigencia de datos, validaciones, permisos y mensajes; minimizar datos sensibles. |
| Estados | Inicial, carga, vacío, éxito, error, sin permiso y reintento cuando correspondan; contenido y acción disponible en cada uno. |
| Interacción | Acciones, confirmaciones, navegación, reversibilidad y destino del foco tras cada transición. |
| Adaptación | Dispositivos, anchuras, contenido largo, idioma y texto ampliado que afecten la estructura. |
| Fallos | Validación, red, expiración o acceso denegado; qué se conserva, cómo se informa y cómo se recupera. |

Indica la jerarquía con decisiones observables: qué acción destaca, qué información se lee primero y qué queda subordinado. No confíes únicamente en color o posición para transmitir estado; usa texto y estructura. Usa componentes o tokens existentes sólo si están disponibles en las fuentes autorizadas; si no, describe intención visual sin inventar una biblioteca.

## Estados y accesibilidad verificables

- Para cada transición, registra «estado anterior → evento/condición → estado posterior → respuesta visible y anunciada». Distingue carga de vacío y error; evita controles activos que disparen operaciones duplicadas.
- Explica orden por teclado, nombre accesible de controles, etiquetas y errores asociados, foco tras navegación o error, anuncio de resultados sin movimientos inesperados y alternativa a gestos exclusivos. Define cómo se revisarán contraste y texto ampliado; no afirmes conformidad sin pruebas.
- Prueba entradas límite: sin datos, dato inválido, respuesta tardía, sesión caducada, permisos insuficientes, interrupción y retorno. Indica si se conserva o se descarta lo ingresado.
- Separa afirmaciones confirmadas, hipótesis y preguntas abiertas. Una captura puede ayudar a revisar lo visual, pero no demuestra interacción, accesibilidad ni comportamiento de error.

## Revisión de la especificación

Recorre con la persona una ruta de éxito y una de fallo de punta a punta. Por cada pantalla comprueba propósito, acción, estado siguiente y retroalimentación; por cada estado verifica salida o recuperación. Contrasta jerarquía, privacidad, teclado, foco, nombres accesibles y adaptación con necesidades conocidas. Si falta una decisión funcional, formula la pregunta concreta y no la suplas con un detalle visual.
