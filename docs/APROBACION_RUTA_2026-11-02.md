# Aprobación desde 7,5 y rutas de al menos 7 pasos

Cambio solicitado por el propietario: mínimo 7,5/10 para aprobar, sin redondeo ascendente. Se conserva la escala de evaluación: cambiar el umbral no infla las calificaciones.

- `PASS_SCORE` centraliza la decisión del servidor; UI, objetivo de práctica y prompt reflejan 7,5.
- Las revisiones anteriores con calificaciones válidas se actualizan al consultarlas, reutilizando sus cuatro notas. No se solicitan evaluaciones nuevas ni se modifican las notas originales.
- La reconciliación de ruta revisa los intentos bajo el umbral nuevo, preserva aprobados y sigue exigiendo evidencia de voz y respuestas suficientes.
- `MIN_ROUTE_STEPS=7` valida las rutas nuevas. Con los cuatro módulos requeridos, la estructura personalizada actual produce como mínimo 8 pasos (varía por nivel y orientación); no se recortan rutas largas ni se añaden repeticiones para rellenar.
- Diagnóstico, audio y ejemplos en español conservan su funcionamiento.

Validación: 19 pruebas de puntuación, ruta, objetivos y migración, más navegador con voz simulada, desbloqueo en 7,5 y revisión móvil. Sin llamadas pagadas.

Cloudflare publicado: `cdb79a25-e147-410d-be53-95fedbd8fa7b`. La web usa el proyecto existente `fuentinterview`, canal `day1`. Cambios sin commit por instrucción del propietario.
