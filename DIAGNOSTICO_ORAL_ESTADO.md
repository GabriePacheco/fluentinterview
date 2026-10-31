# Diagnóstico conversacional — 26 de octubre de 2026

Bloque 4 del plan. Entrada principal por voz Realtime, con alternativa escrita secundaria. Conserva el transporte PCM16, voz alloy, VAD de 800 ms e interrupciones existentes.

Publicado en el canal Firebase `day1` existente: https://fuentinterview--day1-0vs64ic5.web.app. Worker versión `843d0d72-ad27-4c0e-9407-bdd36f49284c`. Se verificó que los cuatro archivos web modificados coinciden con sus copias publicadas. No se publicó el sitio principal ni se cambió de proyecto.

## Comportamiento

- Empieza preguntando el nombre. Después recorre descripción sencilla, experiencia propia, decisiones y situaciones profesionales/técnicas cuando las respuestas lo permiten.
- Realtime interpreta cada respuesta mediante `diagnostic_step`; el servidor valida y guarda la decisión, determina la siguiente dificultad y limita la exploración a doce intervenciones. No asigna un nivel por la etapa alcanzada.
- Las respuestas parciales hacen simplificar. Una dificultad persistente permite cerrar tras reunir al menos tres respuestas sustantivas; el recorrido avanzado reúne al menos cinco. Audio incierto pide repetir sin bajar dificultad. Tres aclaraciones consecutivas terminan conservando la evidencia disponible.
- Solo se procesan herramientas de respuestas completadas, una vez por intervención. Las canceladas o pertenecientes a una intervención anterior no alteran el diagnóstico.
- Cierre automático o manual → guardado → estimación/ruta y retroalimentación sin botones adicionales. Son dos evaluaciones independientes e idempotentes: diagnóstico y revisión de la conversación, ambas dentro del acceso del usuario. Los estados pendientes se consultan sin repetir llamadas inciertas.
- El servidor extrae las muestras del historial de la cuenta, excluye segmentos identificados como audio incierto y valida las citas. No recibe del navegador muestras inventadas ni notas para este flujo.
- Si solo hay nombre o poca evidencia, no asigna nivel ni sustituye la ruta anterior. Se necesitan tres respuestas sustantivas clasificadas y al menos veinte palabras como umbral mínimo para solicitar la estimación; la IA todavía puede declarar evidencia insuficiente.
- Fortalezas primero, nota de esta práctica, correcciones y ruta orientativa. La aprobación de pasos sigue siendo 9/10; un diagnóstico no se aprueba ni se reprueba.
- Historial existente preservado. También se retiró el antiguo bloqueo de veinte diagnósticos guardados.

## Verificación

Pruebas locales de progresión distinta según desempeño, aclaración sin penalización, duplicados/cancelación, cierre, citas, aislamiento por usuario, persistencia e idempotencia. Regresión focalizada de voz y diagnósticos existentes: 18 pruebas aprobadas. Navegador con micrófono sintético y WebSocket simulado: entrada oral, cierre automático, liberación del micrófono, resultado/ruta y reapertura sin nuevas evaluaciones aprobados. Sin llamadas pagadas a OpenAI.

La calidad de las decisiones del modelo y el esquema de herramientas todavía requieren validación con una conversación real del usuario. No se ha medido latencia física ni validado móvil en esta entrega. No usar una cuenta real para eludir el presupuesto de desarrollo agotado.

Referencia oficial consultada: [Realtime conversations — function calling](https://developers.openai.com/api/docs/guides/realtime-conversations). Se procesa `response.done` completado y se devuelve `function_call_output`, seguido de una nueva respuesta cuando procede.

El bloque 5 (ruta extensa con pequeños pasos conversacionales, checks y avance desde 9) sigue pendiente. El diagnóstico nuevo genera la ruta actual de cuatro objetivos; no convierte actividades antiguas en pasos aprobados.
