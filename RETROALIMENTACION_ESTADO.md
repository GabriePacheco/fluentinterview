# Modos y evaluación automática — 26 de octubre de 2026

Implementados los bloques 2 y 3 del plan de mejora.

- Dos opciones visibles en la sala: Practicar con tutor y Simular entrevista. La elección se envía al servidor y se mantiene fija durante la sesión. Tutor puede corregir; Entrevista reserva las observaciones para el final.
- Terminar una conversación con respuestas abre su evaluación automáticamente. Se muestra la preparación mientras llega el resultado. Si ya existe una revisión, se recupera: no se vuelve a cobrar ni recalcular al abrirla.
- Las revisiones pendientes se consultan automáticamente mediante GET; nunca se repite un POST pagado de forma automática ante una respuesta incierta. Los errores conservan el historial.
- Fortalezas primero, calificación después, correcciones y siguiente conversación al final. Un error validado puede aparecer tachado; una alternativa de estilo aparece como sugerencia sin tachar una frase correcta.
- Rúbrica de cuatro criterios con igual peso: pertinencia, claridad/estructura, detalles adecuados a la pregunta e inglés comprensible. La IA propone los valores y razones; el servidor calcula el promedio. Aprueba desde 9/10 sin redondear al alza. La nota describe esta práctica, no nivel general ni probabilidad de contratación.
- Las citas de corrección deben existir literalmente en la respuesta correspondiente. Se rechazan referencias inventadas y afirmaciones de habilidades no medidas. El modelo recibe la indicación de no penalizar errores dudosos de transcripción.
- Las conversaciones largas se revisan con una muestra de seis respuestas distribuida desde el principio al final, en lugar de ignorar todo lo posterior a la sexta respuesta. Se informa cuando se usa esta muestra y se conserva la conversación completa para consulta. Las respuestas enviadas al evaluador tienen una longitud acotada.
- Se mantienen revisiones históricas: no se inventa una nota para las que no la tenían. Los ejemplos simulados tampoco reciben una nota ficticia.
- Se eliminó el requisito visible de revisión docente. La evaluación es autónoma con IA.

## Validación

Doce pruebas existentes de sesiones y revisiones aprobadas. Cuatro pruebas nuevas comprueban umbral exacto (incluido 8,9975, que no aprueba), citas, esquema numérico y muestra de una conversación larga. La comprobación de navegador verifica selección de modo, cierre de voz hacia resultados, liberación de micrófono, tachado y recuperación sin una segunda generación.

Se intentó preparar una única revisión real con una cuenta sintética de desarrollo. El registro estaba en US$6 reservados, por lo que la comprobación se detuvo antes de llamar a OpenAI. No hubo llamadas pagadas y se eliminó la cuenta temporal. El formato nuevo aún no tiene validación real de proveedor. Informe local: `qa/review-v2-cloud.json`. Las reservas de desarrollo no bloquean las cuentas de usuario.

La nueva revisión usa el mismo modelo de texto fijado, `gpt-4.1-mini-2025-04-14`, con salida estructurada y un máximo de 1800 tokens de respuesta. Esquema contrastado con la [documentación oficial](https://developers.openai.com/api/docs/guides/structured-outputs). La conversación de audio y su VAD no se modificaron.

Pendiente del plan: diagnóstico oral progresivo y ruta dividida en microconversaciones, con aprobados, notas y avance gráfico. Mostrar una nota en este bloque todavía no modifica automáticamente el avance de esa nueva ruta.
