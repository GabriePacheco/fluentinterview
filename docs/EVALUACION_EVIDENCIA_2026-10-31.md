# Evaluación con objetivo explícito y transcripción incierta — 31/10/2026

## Problemas reportados

La nota mostrada (7 + 6 + 5 + 6) / 4 = 6 es aritméticamente correcta. Las capturas no justifican una nueva nota: faltan las preguntas completas y el objetivo del paso. Sí muestran una corrección que presenta la expansión de I've como un cambio de tiempo verbal y posibles sustituciones de reconocimiento (apps/ads, climbing/planning). El comentario de pertinencia tampoco explica la deducción.

## Cambios

- La evaluación recibe título, nivel, objetivo y criterio como campos separados. El texto resumido de contexto tenía un límite de 600 caracteres que podía cortar el criterio. El objetivo evaluado aparece en el resultado de los pasos de ruta.
- Las respuestas/preguntas recortadas conservan una marca explícita. El prompt prohíbe atribuir al usuario una omisión causada por ese recorte. Se mantienen los límites de muestra y tamaño; no se aumenta la cantidad de llamadas.
- Rúbrica versión 4: las razones inferiores a 9 deben concretar una exigencia incumplida con evidencia. No se exige impacto cuantificado cuando el paso pide únicamente rol y función.
- Nueva categoría `uncertain_transcription`: la IA puede distinguir una sustitución dudosa de un error confirmado. Se muestra «Posible confusión al transcribir», sin tachado; las instrucciones excluyen estas dudas de las deducciones en todos los criterios. La clasificación sigue dependiendo del modelo, no es una validación acústica.
- Filtro determinista para cambios equivalentes de contracciones, puntuación y artículos no verificados ante nombres con mayúscula. Suprimir una falsa corrección no inventa una nota nueva. Se preserva el texto original.
- No se cambió el cierre, el modelo de voz, el umbral 9/10 ni ninguna calificación histórica.

## Validación

11 pruebas locales de revisión/objetivos y una prueba de navegador con WebSocket simulado: objetivo completo aunque supere el resumen, banderas de recorte, filtro de contracción, preservación de errores reales, categoría incierta sin tachado y cierre existente. Captura de feedback revisada visualmente. Cero llamadas pagadas. No se afirma que el modelo real ya esté calibrado: debe observarse en evaluaciones nuevas.
