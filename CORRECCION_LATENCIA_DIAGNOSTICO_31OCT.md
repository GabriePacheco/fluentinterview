# Espera entre preguntas del diagnóstico — 31/10/2026

El usuario reportó lentitud después del ajuste de integridad del 29/10. Ese ajuste
introdujo una dependencia innecesaria: esperar a que acabara la transcripción antes
de solicitar una decisión de Realtime sobre audio que ya estaba confirmado.

Se elimina esa espera tanto antes como después de autorizar cada respuesta. El análisis
privado consume las referencias de los audios confirmados mientras el transcriptor
trabaja en paralelo. La siguiente pregunta tampoco depende de recibir ese texto. El
análisis sigue separado de la salida de voz y conserva las decisiones adaptativas del
servidor. Su instrucción se reduce a la tarea de clasificación, con una razón breve,
en lugar de repetir todo el prompt del entrevistador. No se cambian modelo, VAD,
contexto, margen de salida ni reservas.

La espera por transcripciones sigue siendo obligatoria AL FINALIZAR para conservar la
evidencia. Los textos tardíos siguen guardándose; los errores tardíos no generan preguntas
extra. Si una transcripción falla durante el análisis se pide aclarar sin bajar de nivel.
Si falla después y no se ha aclarado, no se publica un nivel con evidencia incompleta.

Verificación local: pruebas de voz, diagnóstico e integridad (21 casos distintos),
incluyendo generación anterior a la transcripción, conservación del texto tardío,
interrupción y acuse de reproducción. Sin inferencias pagadas y sin cambios de interfaz.
No se ha medido aún la reducción de segundos con el micrófono físico del usuario.

Worker publicado: `64265524-fdec-46aa-8f06-855f0b9efccf`.

Este cambio reemplaza la regla de esperar transcripciones durante cada turno descrita
en CORRECCION_DIAGNOSTICO_VOZ_29OCT.md; el resto de las protecciones permanece.

Referencia consultada: https://developers.openai.com/api/reference/resources/realtime/server-events
