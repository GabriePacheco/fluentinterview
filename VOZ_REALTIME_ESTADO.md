# Conversación Realtime — 25 de octubre de 2026
> Actualización de acceso: las reservas y límites breves descritos abajo ahora corresponden solo a pruebas del agente. El acceso del propietario y de usuarios se rige por `ACCESO_POR_PLAN.md`.

Implementado el primer bloque del plan. Se conserva Firebase `fuentinterview`, el Worker existente y el registro acumulado `global-v1`. No se modificó el sitio principal: se publica en el canal `day1`.

## Qué cambia

- Voz real mediante WebSocket: navegador → Worker → OpenAI, con PCM16 mono de 24 kHz. La clave permanente permanece en el servidor.
- Modelo `gpt-realtime-2.1-mini`, disponible en esta cuenta; voz `alloy`.
- Server VAD: umbral 0,5; prefijo 300 ms; silencio 800 ms; interrupción habilitada. El servidor inicia cada respuesta tras reservar su presupuesto (`create_response: false`); el audio no pasa por un modelo de texto intermedio.
- AudioWorklet adapta micrófonos de 44,1/48 kHz. El micrófono continúa activo mientras habla la IA. Pausar silencia la captura; terminar/salir libera los dispositivos.
- Al comenzar a hablar: se detienen las fuentes de audio, se vacía la cola, se cancela la respuesta por identificador y se trunca cada item según su posición de reproducción. Se descartan fragmentos atrasados.
- La posición usa el reloj de salida de Web Audio; si el navegador no lo ofrece, se aproxima con su latencia declarada. No equivale a una medición acústica.
- Subtítulos consolidados por item, con reemplazo del texto final. Las respuestas interrumpidas se identifican; no se guarda como escuchado el texto completo que el usuario cortó.
- Se conserva práctica por escrito. Cambiar de voz a texto cierra y guarda la sesión de voz y abre una práctica escrita nueva. Activar voz desde una sesión escrita requiere una conversación nueva.
- Tutor e entrevista usan instrucciones distintas: el tutor puede corregir brevemente; el entrevistador no corrige durante la simulación. El rediseño de sus entradas pertenece al bloque 2.

## Control del piloto

Una conexión simultánea; hasta 120 segundos y seis respuestas generadas. Ticket de 30 segundos, de un solo uso, asociado al usuario verificado y una sesión nueva. El cliente no puede modificar la configuración ni iniciar respuestas cobrables.

Reserva inicial permanente: US$0,03 para transcripción de entrada. Antes de cada respuesta: US$0,10 adicionales, atómicamente, dentro del tope acumulado US$6. No se reinician ni devuelven las reservas anteriores. La reserva no es una factura de OpenAI.

Límites adicionales: audio de entrada máximo de 120 segundos, control de velocidad de subida, veinte segmentos, instrucciones de hasta 2048 bytes, contexto posterior a instrucciones de 2048 tokens y salida máxima de 512 tokens. La reserva por respuesta deja margen sobre 8192 tokens de entrada a US$10/millón y 512 de salida a US$20/millón (US$0,09216). Se comprueba la confirmación de configuración antes de generar. Las tarifas y la disponibilidad deben revisarse antes de abrir el producto comercialmente.

La transcripción auxiliar (`whisper-1`) proporciona el historial; no se usa para decidir qué responde el modelo. Su consumo está cubierto por la reserva inicial, pero no aparece en el contador de uso estimado de generaciones. Ese contador no sustituye la factura del proveedor.

## Evidencia

- Cinco pruebas específicas: reproducción/truncado; transcripciones; remuestreo; límites y coordinación del relay; ticket y reservas concurrentes.
- Cinco pruebas existentes de sesiones y una de persistencia/concurrencia del Worker: aprobadas.
- Una comprobación de navegador con AudioWorklet real y WebSocket simulado: inicio, captura, interrupción, ausencia de duplicados, pausa/reanudación, descarte de eventos durante pausa y liberación del micrófono. No acredita reconocimiento ni latencia física.
- Prueba publicada real: OpenAI devolvió 57 600 bytes de PCM, confirmó `conversation.item.truncated` y la conversación terminó guardada. Se corrigió previamente una invocación de `fetch` con contexto incorrecto en Cloudflare. Se conservó la reserva del intento fallido.
- Registro después de verificar: US$4,51 reservados de US$6; estimación acumulada de generaciones US$0,0542072. La cuenta sintética se eliminó. Informe: `qa/realtime-cloud.json` (ignorado por el repositorio).
- No se realizaron todavía pruebas físicas de micrófono en computador y móvil, ni se acreditó el objetivo acústico menor de 300 ms. La prueba publicada verificó salida/cancelación/truncado, no una conversación oral completa.

## Prueba física pendiente

Abrir https://fuentinterview--day1-0vs64ic5.web.app/#/aula y actualizar la página. Iniciar con voz, permitir el micrófono y responder sin pulsar botones. Interrumpir al asistente hablando; hacer una pausa breve pensando; pausar/reanudar y terminar. Repetir en el teléfono. Registrar navegador/dispositivo, eco, cortes de palabras, duplicaciones y tiempo de interrupción. Usar auriculares si hay eco.

Quedan para los siguientes bloques: evaluación automática al terminar, nota mínima 9/10, diagnóstico oral adaptativo, ruta de microconversaciones con avance visible y limpieza de lenguaje comercial. No se presentan como realizados por este cambio de voz.

Referencias: [Realtime y VAD](https://developers.openai.com/api/docs/guides/realtime-vad), [eventos y truncado](https://developers.openai.com/api/docs/guides/realtime-conversations), [modelo](https://developers.openai.com/api/docs/models/gpt-realtime-2.1-mini), [tarifas](https://developers.openai.com/api/docs/pricing).
