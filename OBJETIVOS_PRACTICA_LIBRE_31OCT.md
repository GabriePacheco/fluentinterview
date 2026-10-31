# Tutor y práctica libre con objetivo — 31 octubre 2026

- Corregida la instrucción contradictoria: el tutor conversa normalmente y corrige errores cuando hace falta. Fortalezas primero corresponde a la evaluación final. El bloque de claridad inspirado en ASD-STE100 se limita a correcciones.
- Las sesiones nuevas de práctica libre reciben un objetivo y criterio guardados por servidor. Tutor usa el objetivo de aprendizaje disponible; sin él se elige una meta de presentación, experiencia o proyecto según el tipo de entrevista. En simulación se mantiene el papel de reclutador sin correcciones durante la conversación.
- 3 respuestas para A1/A2 conocidos; 4 en los demás casos. Máximo de 8 minutos o el límite menor del plan. El cierre no exige aprobar ni prolonga las preguntas hasta acertar. La ruta y el diagnóstico conservan sus reglas propias.
- El servidor cierra tras la última respuesta: espera su transcripción, solicita despedida y espera su reproducción. Las pausas de una misma respuesta no cuentan como respuestas nuevas.
- La revisión recibe el objetivo y criterio. El resultado del objetivo se guarda con la revisión: práctica completa y nota mínima 9/10. Terminar antes conserva la nota disponible, pero deja el objetivo pendiente. Un resultado de ejemplo no certifica aprobación.
- Objetivo y cantidad de respuestas visibles durante la práctica; fortalezas antes del resultado del objetivo en la revisión. Prompts legibles actualizados en `docs/PROMPTS_ACTUALES_31OCT2026.md`.

Validación: 22 pruebas distintas entre objetivos, sesiones, cierre y evaluación; prueba de navegador con AudioWorklet y API simulada. Capturas de computador y móvil revisadas. Sin llamadas de pago a OpenAI ni cambios de micrófono, VAD o modelos. Falta observación de una conversación física con el nuevo objetivo.

Worker publicado: `a091dc32-b567-4de1-8538-a182210c6906`.

Durante publicación, Wrangler informó C: sin espacio; el despliegue del Worker terminó correctamente. Los temporales de Firebase se dirigen a `.local/deploy-temp` en E: sin borrar archivos del usuario.

Firebase informó que completó la publicación de `day1`, aunque terminó con código 1 y avisos de credenciales/error inesperado. Se verificó por HTTP que `conversation-flow.js` publicado coincide por SHA256 con el archivo local. No se repitió el despliegue ni se pidió reautenticación para un cambio ya publicado.
