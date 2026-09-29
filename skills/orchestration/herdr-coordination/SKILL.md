---
name: herdr-coordination
description: "Coordina agentes de código en paneles Herdr: delega tareas delimitadas, verifica modelo y esfuerzo efectivos, sigue estados y preguntas y recupera sesiones sin suplantar autorizaciones humanas. Úsala cuando la persona pida coordinar agentes mediante Herdr."
---

# Coordinación de agentes en Herdr

Esta guía funciona sola en un host con `herdr` disponible. No instala agentes, configura el host ni crea paneles por defecto. Si `herdr` falta o no hay acceso a una sesión autorizada, explica la precondición y detente: no atribuyas tareas iniciadas ni resultados a un panel que no pudiste observar.

## Alcance y fronteras

- Pide objetivo, repositorio/directorio de trabajo, límites de lectura y escritura, tipo de agente y efectos permitidos. Lee sólo lo necesario del panel y del checkout autorizado; no copies credenciales, transcripciones privadas ni archivos fuera del alcance a prompts o informes. Escribe sólo en destinos autorizados y deja claro qué agente hará cada cambio. No hagas commits, publicaciones ni cambios irreversibles por la persona.
- Consulta la ayuda instalada antes de actuar: `herdr agent --help`, `herdr pane --help`, `herdr tab --help` y `herdr <grupo> <subcomando> --help` para las operaciones elegidas. Las opciones, tipos de agente y gestos de modelo/esfuerzo varían entre hosts; la pantalla del agente confirma los valores efectivos, no el argumento de arranque ni una suposición sobre el perfil.
- Si varios agentes comparten archivos o un recurso con estado, acuerda propiedad y orden de escritura; serializa sólo el tramo que lo necesita mediante un mecanismo genérico apropiado al contexto. No inventes un candado global ni gestiones agentes de otras personas.
- Una solicitud de permiso, gasto de cuota/recursos, commit, publicación, cambio irreversible o acceso ampliado se devuelve **literalmente a la persona** con su contexto y todas las alternativas visibles. Espera una respuesta escrita explícita para **esa** solicitud; no elijas ni pulses por ella, no infieras autorización de instrucciones anteriores ni la delegues al agente bloqueado. Si la persona no responde, conserva el bloqueo. Sólo transmite la opción que haya autorizado y comprueba su recepción y el estado posterior. Las políticas de permisos del host siguen vigentes.

## Ciclo observable

1. **Ubicar.** Usa `herdr tab list`, `herdr pane list` y, si existe agente, `herdr agent list`/`herdr agent get <objetivo>` para localizar el tab/pane correcto. Usa `herdr tab get <id>` o `herdr pane get <id>` antes de actuar si hay ambigüedad. Crear tab (`herdr tab create`) o dividir pane (`herdr pane split`) sólo cuando se haya acordado el destino y la organización; no cierres ni reemplaces paneles ajenos. Conserva la relación tarea ↔ pane, no dependas únicamente de un nombre de agente.
2. **Arrancar.** En un pane autorizado con shell interactivo libre, consulta `herdr agent start --help` y el tipo (`--kind`) realmente disponible. Usa `herdr agent start <nombre> --kind <tipo> --pane <id>` con sólo opciones del agente confirmadas por su ayuda. El éxito indica detección y disposición interactiva en ese pane, no que la tarea haya empezado. Si el pane está ocupado o el tipo no está soportado, detente y replantea la selección; no fuerces el proceso.
3. **Verificar antes del encargo.** Lee `herdr pane read <id> --source visible` o `herdr agent read <objetivo> --source visible` y contrasta el banner/indicador del agente, modelo y esfuerzo efectivos, sesión y disposición con la tarea acordada. Si ajustas modelo o esfuerzo mediante la UI propia de ese agente, espera a que se actualice, vuelve a leer la pantalla y sólo entonces confirma. Si no se muestran o difieren, informa la incertidumbre y pregunta antes de usar una configuración distinta.
4. **Delegar.** Envía un encargo acotado con objetivo, ruta relativa/destino, límites de lectura/escritura, prueba esperada y condiciones de parada; `herdr agent prompt <objetivo> "<encargo>"` acepta el envío. `--wait` puede esperar un estado posterior, pero no identifica el turno: si el agente ya trabajaba, puede coincidir con el fin de otro encargo. Nunca tomes «prompt aceptado» como «leído», «ejecutado» o «terminado»; vuelve a leer el panel para comprobar que recibió **este** encargo. Si la recepción es incierta, inspecciona antes de reenviar, para evitar instrucciones duplicadas.
5. **Seguir.** `herdr agent wait <objetivo> --until working --until idle --until blocked --until done --timeout <ms>` espera estados observados; usa un timeout adecuado y lee después con `herdr agent read <objetivo> --source recent` o `herdr pane read <id> --source visible`. Un timeout, un estado desconocido o un panel que no cambia no demuestran fracaso ni éxito; registra lo observado y reevalúa. `herdr pane wait-output` sirve para una señal visible específica, no para acreditar toda la tarea.
6. **Cerrar el encargo, no el panel.** Para `done` o `idle`, lee igualmente la pantalla: puede contener una pregunta, un permiso o un error. Contrasta el entregable y la validación del encargo con la evidencia del checkout o la salida del agente. Informa lo completado, lo no verificado y lo pendiente; no atribuyas a la persona una aprobación que no escribió.

| Señal observada | Siguiente acción antes de informar |
|---|---|
| `working` | Esperar o leer progreso; no interrumpir ni enviar una segunda instrucción incierta. |
| `blocked` | Leer el panel, llevar la pregunta y sus opciones a la persona y esperar autorización específica; confirmar recepción tras transmitirla. |
| `idle` | Leer el panel: puede estar esperando una pregunta o el siguiente encargo; comprobar el resultado previo antes de concluir. |
| `done` | Leer el panel y verificar entregable/pruebas del encargo concreto antes de declarar conclusión. |
| `unknown` | Leer pane, revisar detección (`herdr agent explain`) y conservar estado incierto; no repetir ni declarar éxito. |

## Preguntas, reinicios y recuperación

- Ante un bloqueo, lee el texto íntegro de la solicitud y presenta a la persona sus alternativas con el efecto de cada una. No ejecutes `herdr agent send-keys`, `herdr pane send-keys` ni `herdr agent prompt` para responder hasta recibir la elección explícita. `herdr agent prompt` rechaza envíos a un agente ya bloqueado: después de la elección escrita, usa las teclas necesarias de `herdr agent send-keys <objetivo> <tecla>` o `herdr pane send-keys <id> <tecla>` según el diálogo visible, sin seleccionar otra alternativa. Relee la pantalla y, si no se confirma recepción, conserva la pregunta pendiente sin asumir que la respuesta llegó. Una respuesta enviada justo antes de una desconexión también queda incierta.
- Tras un reinicio o cambio de sesión, los nombres de agente pueden perderse. Relocaliza con `herdr tab list`/`herdr pane list` y el identificador de pane conservado; usa `herdr pane get <id>` y `herdr pane read <id> --source visible` para comprobar que es la sesión y tarea esperadas. `herdr agent get <id>` o `herdr agent explain <id>` aclaran detección. No envíes «continúa» ni repitas el encargo hasta comprobar qué recibió y qué ejecutó la instancia; si no se puede demostrar, consulta a la persona cómo recuperar.
- Si el panel cambia, no refleja el modelo/esfuerzo después de la pausa, aparece otra instancia o la evidencia contradice el estado, detente, inspecciona y comunica la incertidumbre. Una autorización para una pregunta no se traslada a otra, aunque parezca igual.

## Ejemplos sintéticos

- **Bloqueado:** un agente pide «¿publicar ahora? Sí / No». Lleva ambas opciones a la persona. Con respuesta escrita «No», transmite «No», relee la pantalla para comprobar recepción y conserva el resultado sin afirmar publicación.
- **Envío incierto:** `prompt` acepta «revisar módulo», pero la pantalla sigue mostrando la tarea anterior. Lee el pane y espera señal de recepción; no reenvíes a ciegas ni declares la revisión terminada.
- **Reinicio:** `agent get <nombre>` ya no resuelve. Busca el pane asociado y lee su pantalla; sólo después de identificar la instancia y el último encargo retoma el seguimiento.
- **Modelo:** después de seleccionar otra variante/esfuerzo el banner aún muestra el anterior. Espera y relee; hasta que refleje el cambio, no reportes el nuevo valor como efectivo.
- **Terminado:** `done` aparece y la pantalla informa una ruta de salida y pruebas superadas. Comprueba esa ruta y la salida de las pruebas en el checkout autorizado; sólo entonces informa que ese encargo está completo.
