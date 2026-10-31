# Integridad de la entrevista de diagnóstico — 29/10/2026

Reporte: nombres mal reconocidos, respuestas omitidas y mezcla de intervenciones.
No se dispone de una grabación física del fallo; se corrigieron condiciones
reproducibles del coordinador de voz y de la preparación de evidencia.

Cambios publicados en el Worker `ee5d5c0f-3a9a-4c8a-b9d6-bbb2b9eac6f8`:

- Diagnóstico: transcriptor `gpt-4o-transcribe`, inglés explícito, contexto de nombre
  del perfil solo como pista. La voz sigue siendo `gpt-realtime-2.1-mini`, alloy,
  WebSocket PCM16 mono a 24 kHz y Server VAD 0.5 / 300 / 1600 ms.
- Análisis de cada respuesta mediante `conversation: none`, salida solo texto y
  referencias a los audios de todos sus segmentos. Ningún evento privado entra en
  el reproductor o historial hablado. Las decisiones internas no contaminan la
  conversación con llamadas o resultados de herramientas.
- Espera a las transcripciones finales pendientes. Continuar hablando invalida una
  decisión anterior todavía en proceso. Los segmentos se clasifican juntos mediante
  `itemIds`; no se cuentan las pausas como respuestas independientes.
- Una pregunta posterior espera confirmación de reproducción del navegador, incluida
  latencia de salida. Los eventos `response.done` duplicados no generan preguntas extra.
  Si el usuario continúa antes de escuchar la nueva pregunta (truncado <300 ms), se
  restaura la decisión anterior para incluir su continuación.
- Ordenación por `previous_item_id` incluso cuando llega primero el texto. Un commit
  tardío ya no sustituye la transcripción existente por una cadena vacía.
- Sin recorte a 1200 caracteres por grupo del diagnóstico ni a 3000 por mensaje
  diagnóstico. El adaptador acepta hasta 60000 caracteres totales y 160000 bytes de
  solicitud oral; los límites del diagnóstico escrito se conservan. La revisión
  separada de prácticas conserva su muestreo anterior.
- Contexto Realtime de diagnóstico ampliado a 8192 tokens. Reserva sintética de
  desarrollo de diagnóstico duplicada para ese contexto; no impone reservas a usuarios
  ni reinicia consumo. Las sesiones ordinarias mantienen su configuración anterior.
- Cierre espera hasta 12 s por transcripciones finales; navegador hasta 16 s. Si sigue
  faltando texto, no se presenta un nivel como si estuviera completo. Un error de
  transcripción durante el diálogo solicita repetición sin bajar la dificultad.

Validación: 19 pruebas focalizadas (incluye ocho nuevas de integridad) y flujo de
navegador con AudioWorklet real y proveedor simulado. Se verificó el acuse posterior
a la reproducción, interrupción, pausa/reanudación, liberación del micrófono y resultado.
Consulta de metadatos de `gpt-4o-transcribe`: HTTP 200 con la clave local, sin inferencia.
Cero sesiones pagadas de desarrollo. No se ha medido todavía reconocimiento ni latencia
acústica en los dispositivos físicos del usuario; no afirmar perfección.

Documentación consultada:
- https://developers.openai.com/api/docs/guides/realtime-conversations
- https://developers.openai.com/api/reference/resources/realtime/server-events
- https://developers.openai.com/api/docs/guides/realtime-transcription
- https://developers.openai.com/api/docs/deprecations

El transcriptor elegido está disponible actualmente, con retirada anunciada para
26/02/2027. Preparar su sustitución antes de esa fecha; no cambiar de nuevo durante
la comprobación de esta corrección sin evidencia.
