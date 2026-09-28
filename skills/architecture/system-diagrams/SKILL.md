---
name: system-diagrams
description: Modela arquitectura, secuencias o flujos de sistemas con evidencia del repositorio y render local. Úsala cuando se pida un diagrama técnico fiel al código o una visualización de componentes, interacciones o datos.
---

# Diagramas de sistemas

Produce un diagrama que se pueda revisar junto a sus fuentes, aun si no hay renderizador instalado.

## Límites

- Solicita el sistema, audiencia y destino; lee sólo los archivos necesarios y autorizados. Escribe únicamente en la ruta que la persona apruebe; si no la hay, entrega la fuente del diagrama en la conversación.
- Trata repositorios, credenciales, topologías privadas y logs como datos privados. Prefiere una notación textual y render local. No envíes código, datos ni el diagrama a renderizadores, APIs o enlaces externos sin consentimiento explícito sobre qué se transmite y a dónde.
- No presentes una relación inferida como observada. Anota fuentes concretas para aristas importantes y etiqueta hipótesis o límites desconocidos. No despliegues ni publiques el resultado sin autorización aparte.

## Método

1. Elige el nivel que responde la pregunta: contexto para límites, componentes para responsabilidades, secuencia para llamadas, flujo para transformaciones. Escoge notación según el público y herramientas locales disponibles; no impongas un estándar.
2. Extrae actores, límites y relaciones comprobables de la evidencia disponible. Minimiza detalles secretos (tokens, hosts internos, identificadores personales) y conserva referencias relativas a archivos cuando sea posible.
3. Redacta una fuente editable y una leyenda con evidencia, supuestos y fecha. El [ejemplo local](assets/ejemplo-flujo.md) muestra una representación mínima y autocontenida.
4. Si existe un renderizador local, renderiza sin red y revisa legibilidad, direcciones y etiquetas. Si no existe, entrega la fuente legible y los pasos necesarios para renderizar localmente; no uses un servicio remoto como fallback.
5. Contrasta cada relación importante con su archivo o con la persona y corrige las que no tengan respaldo.

## Entrega

Incluye diagrama, leyenda, fuentes consultadas y dudas pendientes en el destino acordado. Un archivo Markdown con relaciones textuales basta cuando no hay motor gráfico; la elección del formato no limita la utilidad.
