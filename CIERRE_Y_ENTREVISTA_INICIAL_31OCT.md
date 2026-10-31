# Cierre de conversación y entrevista inicial — 31 octubre 2026

## Comportamiento

- Realtime dispone de `finish_conversation` para finalizar entrevistas y prácticas. El servidor solicita una despedida breve y cierra tras generarla; el navegador espera a reproducir todo el audio antes de abrir la evaluación.
- Una despedida terminal reconocida del entrevistador también cierra la conversación, sin generar otra pregunta. Las citas de ejemplos no activan ese cierre.
- Terminar manualmente, completar un paso de la ruta y completar el diagnóstico solicitan despedida. Se prepara también antes del límite de duración. Salir de la pantalla aborta sin generar una despedida de pago.
- La espera de resultados presenta spinner y skeleton, en computador y móvil, con estado accesible y respeto a movimiento reducido.
- El diagnóstico conserva su adaptación progresiva y las reglas de evidencia. Sus preguntas se orientan a una primera entrevista laboral: presentación, motivación, experiencia, seguimiento y situación del puesto. No es un examen de vocabulario.

## Validación

- 27 pruebas existentes de Realtime, diagnóstico, sesiones e integridad de voz pasaron.
- 4 pruebas nuevas de cierre pasaron: despedida del entrevistador, paso del tutor, herramienta de finalización y terminar estando en pausa/salir sin generación.
- El caso de diagnóstico se actualizó para comprobar la despedida y el cierre automático real, sin forzarlo desde el test; sus 4 pruebas pasaron.
- `tests/realtime-browser.mjs` pasó con AudioWorklet real y servidor/IA simulados: la despedida termina de reproducirse antes de navegar; aparece la carga; evaluación automática; no desbordamiento móvil. Capturas revisadas: `qa/evaluation-loading-desktop.png` y `qa/evaluation-loading-mobile.png`.
- Sin llamadas de pago a OpenAI para estas pruebas. No se ha verificado con una conversación física ni medido latencia de red real.

## Publicación

- Cloudflare Worker: `65a1aad2-03c0-4611-a779-af52aa6e98b0`.
- Web publicada: https://fuentinterview--day1-0vs64ic5.web.app (canal `day1` del proyecto existente `fuentinterview`).
- No se modifican presupuesto, historial, cuentas ni claves.
