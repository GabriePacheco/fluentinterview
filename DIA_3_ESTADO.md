# Día 3 — diagnóstico y ruta personalizada

Implementación: 21–22 de octubre de 2026. Evaluación experimental aceptada por el propietario; no dispone todavía de docente para revisar la rúbrica.

## Recorrido implementado

1. Tres muestras de expresión: presentación, experiencia con una dificultad y opinión con razones. Se puede dictar, revisar la transcripción o escribir. Se guardan textos, no grabaciones.
2. Dos tareas de comprensión lectora, dos de gramática y dos de vocabulario, corregidas por el servidor con un banco de preguntas versionado.
3. Dos preguntas sobre un mensaje reproducido mediante voz del navegador. Si se revela el texto o no termina la reproducción, la comprensión auditiva queda pendiente. El resultado es una muestra de tareas, nunca un nivel global de escucha. La reproducción es información declarada por el cliente, no una prueba supervisada.
4. Revisión de respuestas y envío explícito a la IA. Los borradores se guardan al avanzar de paso o pulsar «Guardar avance» y se recuperan desde el historial.
5. Estimación orientativa de expresión en inglés, fortalezas, prioridades y citas exactas de las respuestas. Pronunciación, fluidez oral y nivel global no se deducen de una transcripción.
6. Cuatro módulos con objetivo, justificación, evidencia, conversación, ejercicio y criterio de dominio. La IA elige cuatro objetivos de un catálogo de nueve habilidades observables, decide su orden y redacta la justificación y la pregunta de conversación según el alumno. El servidor aporta ejercicios y criterios de dominio coherentes con cada objetivo. Primera semana de siete días con tiempos derivados de los 10, 20 o 30 minutos del perfil.
7. Versiones de ruta conservadas por cuenta. Una evaluación válida actualiza la ruta; un fallo o evidencia insuficiente conserva la anterior. Las demostraciones nunca sustituyen una ruta real.
8. «Practicar este objetivo» lleva al aula. El servidor agrega al tutor el módulo elegido y el nivel orientativo, recuperados de la evaluación del propio usuario.

## Rúbrica y límites

Se emplean anclajes breves de expresión A1–C1 como orientación experimental. No se distingue C2 con este diagnóstico corto. El sistema puede devolver evidencia insuficiente y nunca ofrece confianza alta. La corrección de ocho preguntas no se transforma en un nivel CEFR general.

Las preguntas y anclajes del piloto son originales, no un examen acreditado. La separación de habilidades y los niveles se contrastaron con la [escala global del Consejo de Europa](https://www.coe.int/en/web/common-european-framework-reference-languages/table-1-cefr-3.3-common-reference-levels-global-scale) y su [cuadrícula de autoevaluación](https://www.coe.int/en/web/common-european-framework-reference-languages/table-%202-cefr-3.3-common-reference-levels-self-assessment-grid). Se requiere revisión docente y más muestras antes de usar la estimación como criterio comercial de dominio.

Con menos de dos muestras de diez palabras y cuarenta palabras totales, el servidor devuelve evidencia insuficiente sin llamar al modelo. Superar ese mínimo solo permite solicitar la evaluación; no garantiza que la evidencia sea suficiente ni que esté en inglés.

## Persistencia, seguridad y gasto

- Mismo Firebase `fuentinterview` para identidad y perfil; mismo Durable Object `global-v1` para evidencia, versiones y presupuesto. No se creó otro proyecto.
- Identidad validada por token; las rutas y borradores solo se consultan con el usuario propietario. Correo verificado para evaluación real.
- Máximo 20 diagnósticos guardados por cuenta. Se pueden eliminar desde el historial. Eliminar la ruta actual recupera como actual la última versión válida restante.
- Un diagnóstico solo se evalúa una vez. Un reenvío devuelve su resultado almacenado; no repite el consumo. Un fallo incierto queda cerrado, y una nueva prueba requiere crear otro diagnóstico explícitamente.
- Validación estricta de formato y citas. Una cita inexistente, módulos duplicados o una respuesta incompleta no reemplazan la ruta actual. Las prioridades de lectura y escucha requieren errores o respuestas pendientes en tareas elegibles; se rechazan afirmaciones sobre habilidades orales no medidas en las fortalezas, observaciones y tareas generadas.
- Una llamada de texto por evaluación suficiente; ninguna llamada extra para la semana ni el resumen. `gpt-4.1-mini-2025-04-14`, máximo 2400 tokens de salida y solicitud completa limitada a 16 KB. Sin reintentos automáticos al proveedor.
- El propietario autorizó el 22 de octubre ampliar el límite global de US$1,50 a US$2. Se mantiene la reserva permanente US$0,05 por intento y todo el registro anterior. La cifra estimada del proveedor es distinta de esa reserva conservadora. Una prueba del Durable Object comprueba que ampliar el límite conserva intentos y reservas, y que las llamadas concurrentes no pueden superar el nuevo máximo.
- La salida usa el formato estructurado documentado por [OpenAI](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=chat). Que el formato sea válido no valida por sí solo la calidad pedagógica.

## Verificación

El 22 de octubre pasaron las 20 pruebas de servidor, incluidas cuentas, presupuesto, conversaciones, diagnóstico, truncamiento del proveedor, objetivos no respaldados y persistencia del Durable Object. Pasaron las 9 comprobaciones del diagnóstico en navegador con emuladores y sin llamadas pagadas: dictado con error, recuperación del borrador, evaluación, semana, persistencia, contexto del tutor, evidencia insuficiente, vista móvil y cierre de sesión. Informe: `qa/day3-browser.json`.

Las primeras pruebas reales detectaron prioridades sobre fluidez o confianza que las muestras no justificaban. Los informes se conservaron en `qa/day3-cloud-initial.json` y `qa/day3-cloud-prompt-review.json`. Un ajuste de instrucciones por sí solo no corrigió todos los casos; por ello se limitó la selección a objetivos observables y se incorporó validación en el servidor. No se consideran esos ensayos una validación pedagógica.

Publicación del 22 de octubre: Worker `8dfd054b-f7da-47d6-bdc5-4509db2d1d5b`; los nueve archivos públicos coinciden con la versión local y no se detectaron patrones de claves privadas. El canal de pruebas conserva la URL y vence el 29 de octubre de 2026 a las 08:39, hora de Ecuador.

Una comprobación previa se detuvo antes de llamar a OpenAI: el registro compartido tenía 28 intentos, US$1,40 reservados, US$0,018232 de consumo estimado y dos llamadas disponibles. El informe `qa/day3-cloud-preflight.json` registra esa interrupción y la eliminación de las cuentas temporales. El propietario autorizó ampliar el límite total a US$2 sin reiniciar el registro; la verificación final usa ese límite y comprueba la conservación del gasto anterior.

La verificación final publicada **pasó** (`qa/day3-cloud.json`, 22 de octubre). Las muestras sintéticas de principiante, intermedio y avanzado obtuvieron respectivamente A2, B2 y C1, con prioridades diferentes y citas de sus respuestas. Estas etiquetas son resultados del modelo en tres ejemplos, no una medida de precisión del diagnóstico. Se comprobó que una muestra insuficiente no consume llamadas ni sustituye la ruta, que repetir una evaluación no vuelve a cobrar, que otra cuenta no puede leerla y que la ruta permanece tras recargar. Las ocho comprobaciones publicadas pasaron; se eliminaron todas las cuentas y evidencias temporales. Las capturas finales de resultado y ruta se revisaron visualmente.

| Gasto al terminar | Valor |
|---|---:|
| Última prueba, tres llamadas | US$0,004678 estimados |
| Tres rondas de pruebas reales del día 3, nueve llamadas | US$0,0152232 estimados |
| Consumo estimado acumulado de la aplicación, incluidas otras sesiones | US$0,02291 |
| Reservas preventivas acumuladas, 31 intentos | US$1,55 |
| Límite total autorizado | US$2 |
| Llamadas restantes con reserva de US$0,05 | 9 |

El consumo estimado se calcula con los tokens informados por el proveedor; no sustituye la factura de OpenAI. Las reservas son un control preventivo distinto del consumo estimado y nunca se reiniciaron.

La validación del día 3 no certifica el funcionamiento del audio en todos los dispositivos. En el día 2 el propietario confirmó conversación y pausa con su micrófono, sin indicar navegador. Sigue pendiente la comprobación específica en Chrome, Edge y móvil, además de la revisión docente.

## Incidencia del diagnóstico del propietario y recuperación — 22 de octubre

El propietario comunicó una evaluación interrumpida, creada a las 09:07. La captura de consola solo muestra mensajes de una extensión de ajedrez y un `favicon.ico` ausente; no identifica la causa del diagnóstico. La versión anterior reemplazaba los errores de validación y otros errores internos por un mensaje genérico y no conservaba la causa. Por ello no se puede atribuir retrospectivamente este fallo a una validación concreta ni afirmar que su causa esté resuelta.

Se corrigieron el registro del fallo y la recuperación de respuestas:

- Los errores conocidos guardan una explicación y un código privado (cita inválida, prioridad no respaldada, respuesta incompleta, formato, conexión, presupuesto, etc.). Las excepciones desconocidas no guardan mensajes arbitrarios, trazas, claves ni respuestas brutas del proveedor.
- Las evaluaciones antiguas explican que la causa no está disponible. Una evaluación fallida ya no ofrece «Recuperar resultado», que solo devolvía el mismo fallo; ofrece «Revisar mis respuestas».
- Recuperar copia las respuestas y el contexto a un borrador nuevo. El original se conserva. Revisar, guardar y reabrir no llama a OpenAI; evaluar requiere pulsar explícitamente el botón correspondiente y sí utiliza el presupuesto.
- Si cambia el banco de tareas, se recuperan las muestras abiertas pero se deben volver a contestar las tareas y escuchar el audio.
- Pasaron 13 pruebas de servidor relacionadas y 13 comprobaciones de navegador, incluidas recuperación, persistencia, errores anteriores sin detalle, aislamiento y ausencia de reintentos. Se usó un proveedor simulado: **cero llamadas pagadas durante esta corrección**.

Worker de esta corrección: `5b54ff23-896e-4968-85b8-e07e22de0feb`. No se cambió el límite autorizado de US$2 ni se reinició el registro. La recuperación no repara retroactivamente el resultado fallido; permite conservar el trabajo del alumno y obtener información útil si una evaluación posterior falla.
