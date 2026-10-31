# Ruta conversacional personalizada — 26 de octubre de 2026

Bloque 5 implementado. Las prioridades, razones, evidencia y preguntas base proceden del diagnóstico individual generado por IA. La aplicación las divide en pasos graduados según nivel y orientación de cada prioridad (refuerzo o transferencia de una fortaleza). No se hace una llamada adicional solo para construir la vista de la ruta.

Publicado en el mismo canal `day1`: https://fuentinterview--day1-0vs64ic5.web.app/#/ruta. Worker versión `d519dd40-2fbe-4981-920f-f7f895ecce5e`. Se comprobó por hash que los cinco archivos web de esta entrega coinciden con sus versiones publicadas. No se cambió de proyecto ni se publicó el sitio principal.

## Personalización y recorrido

- A1 recibe más apoyos y pasos simples; A2 añade detalles y experiencias; B1 organiza razones y ejemplos; B2/C1 practican repreguntas, decisiones y transferencia con mayor exigencia. Una fortaleza requiere menos pasos que una dificultad por reforzar.
- El recorrido tiene entre 8 y 24 pasos, distribuidos en las prioridades individuales del diagnóstico. El número exacto depende de nivel y orientación. Dos personas del mismo nivel pueden tener diferentes prioridades, tareas base, evidencia y contexto profesional; no se asigna un curso fijo únicamente por la etiqueta CEFR.
- Los patrones de subdivisión son reglas de producto, no una generación independiente de cada título por IA. El tutor genera las preguntas concretas a partir del objetivo, evidencia, puesto, nivel, tarea y escenario. No se promete que cada pregunta vaya a ser única sin validación real.
- Cada conversación pide 3–5 respuestas propias, según nivel. Tutor corrige brevemente y solicita una respuesta nueva para aplicar la corrección. Cierra automáticamente después de suficientes preguntas y respuestas transcritas; también permite terminar antes.
- Si el intento no aprueba, se muestra la nota y los criterios que faltaron. El siguiente intento lleva otro escenario, las dificultades de la evaluación previa y las últimas preguntas que debe evitar.

## Avance confiable

El servidor recalcula la media con las cuatro notas de la rúbrica guardada. Aprobación desde 9 sin redondear hacia arriba; 8,9975 sigue sin aprobar. Solo revisiones reales de conversaciones de voz de ese paso y con la evidencia mínima permiten avanzar. Ni completar ejercicios escritos, ni una demostración, ni una nota enviada por el navegador desbloquean pasos.

Una evaluación de 9 o más en una conversación terminada antes de reunir las respuestas necesarias conserva su nota, pero no aprueba el paso. La pantalla explica esta distinción. Un aprobado previo no se pierde por un intento posterior menor. El avance se guarda antes de devolver la evaluación al cliente y al recuperar resultados pendientes.

La ruta se guarda en el diagnóstico de cada cuenta; sus intentos tienen registros separados para no acumular todo el contexto en un único documento. Recargar, reabrir una evaluación o desplegar cambios no reinicia el avance. Borrar una conversación no borra un aprobado ya registrado. Borrar el diagnóstico o la cuenta elimina también su ruta y los registros de intentos. Una reevaluación crea otra versión: las anteriores quedan como historial, sin atribuir aprobados que no fueron evaluados con estos criterios.

## Interfaz y verificación

Resumen de pasos aprobados y porcentaje, ubicación actual, mapa de etapas, checks, pendientes, calificaciones, historial de intentos y acción siguiente. Escritos opcionales y secundarios. La página inicial y el progreso muestran el mismo avance conversacional.

Pruebas locales enfocadas: variación por nivel/evidencia, 9 exacto, rechazo de saltos y accesos de otra cuenta, duplicados, aprobación persistente, intentos cortos/mock/texto, nuevas versiones y cierre del tutor. Prueba de navegador con micrófono sintético y voz simulada: fallo → intento distinto → 9 → siguiente paso → recarga, vista escritorio/móvil sin desbordamiento. También se comprobó que diagnóstico oral y conversación libre siguen funcionando en el flujo simulado.

Cero llamadas pagadas de desarrollo. Pendiente validar con conversación real la calidad de las preguntas, el seguimiento de las instrucciones y el cierre automático. La comprobación del diseño móvil no sustituye una prueba física de voz en teléfono.
