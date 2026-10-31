# Continuación de respuestas durante el cierre — 31 octubre 2026

Reporte: «otra vez no me está escuchando todo». Falta confirmar dispositivo, modo y si se trata de interrupción audible o palabras ausentes en la transcripción. No se atribuye todo el reporte al fallo siguiente sin esa evidencia.

Se reprodujeron tres regresiones del cierre anterior mediante eventos simulados (las tres pruebas fallaban antes del cambio):

- El servidor cerraba al terminar de generar la despedida, antes de que acabara su reproducción. Aunque el navegador seguía reproduciendo, el servidor ya no admitía la continuación del candidato.
- Interrumpir la despedida del diagnóstico cerraba igualmente y perdía el estado anterior necesario para incorporar la continuación a la misma respuesta.
- Una herramienta `finish_conversation` generada antes de una nueva intervención podía cerrar esa intervención nueva.

Corrección: esperar la confirmación de reproducción de la despedida; cancelar el cierre automático al detectar voz nueva; restaurar la última decisión del diagnóstico; ignorar órdenes de cierre antiguas y responder a su llamada de herramienta sin ejecutar el cierre. Terminar manualmente sigue siendo una acción explícita del usuario. Una despedida incompleta ya no aprueba el cierre.

Validación: 29 casos distintos de cierre, integridad del diagnóstico y Realtime; prueba de navegador con AudioWorklet y WebSocket simulado. Sin gasto en API, sin modificar modelo, VAD, presupuesto ni datos del usuario. No valida reconocimiento de voz física ni permite afirmar que todo el problema reportado esté resuelto.

Solo cambia el servidor; el cliente existente ya envía `fluent.playback.done` después del audio y la latencia de salida.
