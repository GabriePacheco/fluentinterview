# Ejemplos de preparación en español

El propietario confirmó pregunta y respuesta en español. Se añaden dos pares ilustrativos por cada uno de los 48 objetivos del catálogo, en `public/practice-examples.js`. No son respuestas atribuidas al usuario ni preguntas garantizadas de la IA. Se indica que la conversación continúa en inglés y que debe usar su experiencia real.

La tarjeta «Tu objetivo» los muestra antes y durante el paso de ruta y durante la práctica libre con un objetivo reconocido. Cada paso de la ruta también permite desplegarlos. No se incluyen en el historial, las instrucciones de voz ni la evaluación; no generan llamadas a OpenAI.

Verificación local: cobertura de los 48 títulos, dos ejemplos por título, renderizado en ruta y tutor, ausencia de duplicados al repintar, móvil sin desbordamiento. Capturas revisadas: `qa/practice-examples-desktop.png` y `qa/practice-examples-mobile.png`. La primera captura móvil coincidió con la transición de ocultación del menú; se repitió esperando que terminara y quedó visible toda la tarjeta.

Cambio exclusivo del frontend. Sin cambios al motor de conversación ni commits.

Publicado en Firebase Hosting, proyecto existente `fuentinterview`, canal `day1`: https://fuentinterview--day1-0vs64ic5.web.app . Despliegue confirmado el 2 de noviembre de 2026; no se publicó en el canal principal.
