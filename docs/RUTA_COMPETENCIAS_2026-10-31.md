# Ruta de preparación para entrevistas

La selección nueva ofrece ocho competencias: presentación profesional, relación con el puesto, experiencias y resultados, explicación de conceptos, justificación de decisiones, repreguntas, comparación de alternativas y defensa de una postura. La IA elige cuatro con evidencia del candidato; el nivel orienta la dificultad, no fija una ruta idéntica para todos.

El prompt pide que cada módulo explique qué capacidad nueva añade y por qué sirve para el puesto. Aprovecha dificultades observadas y fortalezas para transferirlas a situaciones más exigentes. La selección se ordena desde capacidades de base hacia demandas más complejas. No es obligatorio incluir presentación en una ruta avanzada.

El servidor aporta pasos específicos para cada competencia, con criterios observables. La tarea inicial evalúa su capacidad concreta, no exige completar desde el principio toda la meta del módulo. Se conserva la longitud adaptada al nivel, el criterio de aprobación de 9/10 y los intentos independientes. El tutor recibe las capacidades anteriores para construir sobre ellas.

La gramática y el vocabulario quedan como correcciones o ejercicios de apoyo dentro del trabajo profesional. No aparecen como categorías elegibles para organizar módulos del diagnóstico nuevo. Los contenidos antiguos se conservan para leer actividades históricas.

## Rutas existentes

- Nuevos diagnósticos: selección de competencias por IA y preguntas personalizadas al puesto y evidencia.
- Rutas guardadas aún sin intentos ni aprobaciones: adaptación automática del recorrido usando el diagnóstico existente, sin llamada adicional a IA. La conversión de categorías antiguas es una regla del servidor, no una nueva evaluación.
- Rutas ya iniciadas: se mantienen objetivos, intentos, notas y aprobaciones. Un nuevo diagnóstico crea un plan nuevo sin borrar el histórico. No se atribuye una aprobación antigua a una competencia diferente.

## Verificación

20 pruebas distintas de modelo de diagnóstico, progresión, actividades y ruta. Comprueban enum profesional, citas conservadas, orden de capacidades, tareas distintas, nivel/puesto, soporte escrito, aprobación exacta y conservación de rutas iniciadas. Contrato de respuesta estructurada probado con proveedor simulado, sin reparación ni llamada real.

Prueba de navegador con API simulada: ruta, bloqueos, reintento, aprobado, historial y visualización en computador/móvil. Capturas revisadas en `qa/personal-route-desktop.png` y `qa/interview-route-mobile.png`. No se realizaron llamadas de pago ni se alteró el transporte de audio, VAD o modelos. La calidad de una selección generada en producción queda pendiente de observar en el siguiente diagnóstico real.

## Publicación verificada

- Commit del código: `cce7fc8`.
- Worker: `a0bbaf1e-6488-4cbd-a822-bbdc0ca45e07`.
- Firebase: canal `day1`, https://fuentinterview--day1-0vs64ic5.web.app/#/ruta.
- `public/conversation-route.js` servido por Firebase coincide por SHA256 con el archivo desplegado.
- Etiqueta del código publicado: `release-2026-10-31-1`. Git permanece local, sin remotos.
