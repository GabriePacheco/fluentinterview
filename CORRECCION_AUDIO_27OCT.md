# Corrección de audio, cierre e idioma — 27/10/2026

## Corrección posterior tras pruebas físicas del propietario (vigente)

Worker publicado: `2722bc38-ad66-4441-957d-c565aa0a2d60`.

La primera corrección no resolvió la experiencia real. El propietario aportó capturas con el mensaje de cierre repetido, transcripción en español de habla inglesa y respuestas fragmentadas. Este apartado sustituye los puntos incompatibles de la primera entrega descrita abajo.

- Se retira la regla que cerraba la conexión por cualquier `response.status=incomplete`. Ahora deja el micrófono y la sesión disponibles, sin reevaluación, aprobación ni reintento pagado automático. Los fallos de conexión reales siguen diferenciados. La causa concreta de cada `incomplete` de las capturas no quedó registrada: el límite de salida era una causa posible, no un motivo demostrado de cada incidente.
- Margen máximo de salida de 512 a 1536 tokens, conservando instrucciones de respuestas breves. Esto permite terminar audio sin el límite demasiado estrecho anterior. No cambia el presupuesto acumulado de pruebas.
- Se restaura `transcription.language=en`. La conversación y las transcripciones se orientan al inglés. Se elimina el cambio anterior a detección automática de idioma.
- Solo la corrección/explicación del Tutor puede ir en español cuando el nivel mostrado es muy bajo o esa explicación resulta demasiado compleja. Preguntas, ejemplos, seguimiento y entrevista continúan en inglés. No traducir lo dicho por el candidato.
- Ante el reporte de tener que apresurarse, Server VAD conserva threshold 0.5, prefix 300 e interrupciones, pero la espera de silencio pasa de 800 a 1600 ms. Sustituye el ajuste inicial de 800 ms para dar margen a pausas al pensar.
- Fragmentos consecutivos de usuario sin intervención del asistente se agrupan en pantalla. En práctica/entrevista se agrupan también al guardar y contar evidencia de la ruta. El diagnóstico conserva sus identificadores originales para no romper las decisiones por pregunta.
- Pruebas enfocadas: 11 casos locales de voz/diagnóstico y navegador con WebSocket simulado; incompleto mantiene conexión y micrófono, sin evaluación; dos fragmentos cuentan como una respuesta, siguiente pregunta separa otra; configuración inglés/1536/1600; interrupción y reproducción final preservadas. Cero llamadas pagadas. La calidad acústica y lingüística en móvil real aún requiere confirmar con el usuario.

Referencias: [configuración de Realtime](https://developers.openai.com/api/reference/resources/realtime/client-events), [pausas de Server VAD](https://developers.openai.com/api/docs/guides/realtime-vad).

## Primera entrega (histórica; los puntos anteriores prevalecen)

Reporte: audio cortado antes de terminar, salida inesperada de entrevista y ayuda demasiado avanzada ante respuestas básicas.

## Cambios

- El servidor ya no cancela una respuesta en generación cuando llega la transcripción que completa los objetivos de un paso. Espera a que termine la respuesta; avisa del cierre y evita generar turnos adicionales.
- El navegador espera a que termine su cola de reproducción y la latencia de salida antes de liberar audio y abrir la evaluación. Cerrar el WebSocket no equivale a terminar de escuchar. Una interrupción o finalización manual sigue pudiendo detenerlo.
- Cierre confirmado y cierre por fallo son estados distintos. Desconexión, error o respuesta incompleta no abren automáticamente evaluación ni diagnóstico: la sala conserva el mensaje y permite revisar el historial.
- El relay registra también `response.output_item.added`: una interrupción rápida ya no depende de que haya llegado antes `conversation.item.added`.
- Tutor: nivel guardado como orientación inicial, prioridad a respuestas independientes actuales, simplificación inmediata ante dificultad. Explicaciones breves en español para nivel bajo, dificultad observada, explicación compleja o petición del usuario; ejemplos y preguntas de práctica en inglés. Sin correcciones durante la entrevista simulada.
- Transcripción sin idioma inglés forzado para permitir respuestas/peticiones bilingües. VAD, voz, modelo y límites de gasto permanecen iguales.
- Retroalimentación escrita: explicaciones en español y ejemplos en inglés ajustados a evidencia actual. Diagnóstico: un nivel anterior alto o puesto técnico no justifican un nivel actual alto.
- No se alteran resultados anteriores ni se recalifican en segundo plano. Abrir una nueva conversación aplica las nuevas instrucciones.

## Verificación y límites

11 comprobaciones locales de voz/ruta aprobadas, incluida la carrera entre transcripción final y audio en generación. Navegador con AudioWorklet y WebSocket simulado: reproduce audio pendiente antes del resultado, permanece en sala ante desconexión, conserva interrupción, pausa, deduplicación y evaluación idempotente. Sin llamadas pagadas de desarrollo a OpenAI. No valida acústica de micrófonos ni comportamiento lingüístico real del modelo.

Referencia revisada: [OpenAI Realtime, interrupciones y truncado](https://developers.openai.com/api/docs/guides/realtime-conversations#interruption-and-truncation). En WebSocket la aplicación controla reproducción y truncado.

Despliegue: mismo Worker, versión `1e1f464c-e983-483e-9fdc-bdb763e205fc`, y canal Firebase day1. Sin proyectos nuevos ni reinicio del consumo.
