# Día 2 — conversación como centro de la aplicación

Implementado y publicado el 20 de octubre de 2026. Verificación con OpenAI real aprobada. El propietario confirmó que la conversación y la pausa funcionan en su prueba con micrófono. No indicó el navegador; la comprobación específica en Chrome, Edge y un móvil sigue pendiente.

Web: https://fuentinterview--day1-0vs64ic5.web.app/#/aula

API: https://fluent-interview-api.fluent-interview-local.workers.dev

El canal web conserva el nombre `day1` para mantener la URL y caduca el 27 de octubre de 2026 a las 22:56 (Ecuador). El sitio principal anterior no fue reemplazado.

## Funcionalidades implementadas

- Una pulsación inicial permite abrir el micrófono y comenzar. Después se alternan automáticamente escucha, respuesta del modelo y voz del navegador.
- Prácticas de hasta seis respuestas del estudiante. Preguntas breves contextualizadas con el perfil, experiencia y vacante; tutor y entrevistador usan instrucciones diferentes.
- Pausa, finalización, tiempo entre frases configurable, subtítulos y alternativa por escrito. El micrófono se detiene al cambiar de pantalla, ocultar la pestaña o cerrar sesión.
- Permisos denegados, voz no disponible, silencio, interrupciones y fallos de conexión muestran una salida recuperable. El texto parcial se conserva para revisión.
- Cada turno, observaciones y resumen se guardan en el servidor. Historial privado con reapertura por escrito y eliminación de conversaciones.
- Resumen descriptivo con citas del estudiante y sugerencias. No inventa un nivel CEFR ni evalúa pronunciación a partir del texto.
- Verificación de correo antes de usar IA real; botón para actualizar la confirmación y renovación del token si sus atributos quedaron desactualizados.
- Ejemplos gratuitos identificados claramente, disponibles con «Probar sin gastar».

## Presupuesto y almacenamiento

La clave está instalada como secreto de Cloudflare, fuera del navegador. Modelo `gpt-4.1-mini-2025-04-14`, máximo 300 tokens de salida, contexto acotado y límite de 16 KB para la solicitud completa. No hay reintentos automáticos al proveedor.

El mismo Durable Object `global-v1` del día 1 conserva el presupuesto: límite total US$1,50; reserva permanente de US$0,05 por intento, incluso ante fallos. Una práctica completa requiere como máximo seis llamadas. El último aporte se guarda sin generar otra pregunta. La reserva es un tope conservador, diferente del consumo estimado del proveedor. No reiniciar este registro para recuperar saldo. El control no cubre otros usos de la misma clave fuera de esta aplicación.

Firebase `fuentinterview` conserva las cuentas y perfiles. Las conversaciones se guardan por usuario en el Durable Object existente de Cloudflare, con escritura exclusiva del servidor; no se introdujeron credenciales administrativas de Firebase en el Worker. Máximo 20 conversaciones por cuenta en este piloto; el estudiante puede eliminar las anteriores. No se guardan grabaciones. La interfaz explica que el servicio de voz del navegador puede procesar audio y que OpenAI recibe transcripciones y contexto profesional.

## Verificaciones

- Diez pruebas de servidor: autenticación, aislamiento, presupuesto, concurrencia, persistencia, repetición de solicitudes y fallos inciertos. Aprobadas.
- Reglas Firestore: acceso entre usuarios y cambios de privilegios rechazados. Aprobadas.
- Ocho comprobaciones de cuentas en navegador. Aprobadas.
- Ocho comprobaciones de conversación en navegador: cinco intercambios automáticos, pausa, texto, historial tras recarga, voz incompatible, respuesta HTTP perdida sin duplicación, ancho móvil y cierre de sesión. Aprobadas.
- Los servicios de audio de estas pruebas son simulados. Las capturas a 390 px comprueban disposición visual, no compatibilidad de un teléfono físico.
- Prueba publicada con Firebase y OpenAI reales: aprobada. Seis respuestas del modelo, cinco intercambios automáticos, sexto aporte guardado, recuperación del historial y rechazo de acceso de otro usuario. Repetir una solicitud no agregó otra llamada. Sin errores JavaScript. Cuentas, perfiles y conversación sintéticos eliminados.
- Consumo estimado por tokens: **US$0,0014924**; reserva acumulada: **US$0,30**; límite: **US$1,50**; quedan **24 intentos** bajo ese control conservador. Valores al cerrar la prueba, antes de las prácticas del propietario.
- Latencia de los turnos del servidor: 0,706–1,669 segundos, media 1,189 segundos en esta muestra de seis llamadas. No incluye reconocimiento ni reproducción de audio físicos.
- Evidencia en `qa/day2-cloud.json`. La búsqueda de la clave privada en los ocho archivos públicos no encontró coincidencias.

## Validación con el propietario

El 20 de octubre de 2026, al responder a la solicitud de probar cinco intercambios y la pausa con micrófono, el propietario confirmó: «La conversación y la pausa funcionan». Queda registrada la comprobación manual de estas funciones en su entorno. No se confirmó el navegador utilizado ni se informaron por separado resultados sobre eco, reanudación, salida de pantalla o teléfono.

Para completar la cobertura de compatibilidad:

En Chrome y Edge de escritorio: entrar, confirmar el correo, abrir «Conversar con IA», pulsar «Iniciar con voz» y permitir el micrófono. Responder cinco veces sin volver a pulsar botones; comprobar que el tutor no se transcribe a sí mismo. Probar pausa, reanudación y salida de la pantalla. Repetir en un teléfono disponible, usando texto si el servicio de voz no funciona.

La conversación es automática por turnos. Para interrumpir mientras habla el tutor se usa «Pausar»; hablar simultáneamente con interrupciones naturales no forma parte de esta implementación. El diagnóstico y la ruta personalizada corresponden al día 3, y los pagos siguen pendientes del día 5.
