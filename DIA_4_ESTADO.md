# Día 4 — Actividades, progreso y entrevistas

Estado al 22 de octubre de 2026: implementado y publicado. Recorrido local y comprobación publicada gratuita aprobados. Pendiente la verificación del nuevo esquema de revisión con OpenAI real porque el presupuesto preventivo ya estaba agotado.

## Recorrido implementado

- Inicio centrado en conversar, con una actividad recomendada y acceso al diagnóstico.
- Ruta personalizada → actividad del objetivo → conversación contextual → corrección → progreso → siguiente práctica.
- Cuatro objetivos de fundamentos para quien aún no tenga un diagnóstico válido. Se identifican como secuencia general, no como ruta personalizada por IA.
- Banco inicial propio de 36 preguntas objetivas para nueve focos: gramática, vocabulario, cohesión, evidencia, concisión, razonamiento, claridad técnica, lectura y escucha. Cada actividad combina dos tareas con una respuesta propia. Hay dos variantes por foco, reutilizadas en repasos posteriores; no es contenido ilimitado.
- Borradores persistentes, control de revisiones y conservación de cada intento. La corrección objetiva no llama a OpenAI. La transcripción revelada no cuenta como evidencia de escucha independiente.
- Revisión opcional con IA de respuestas abiertas: comentarios, alternativa de práctica, texto original adjuntado por el servidor y siguiente paso. No basta con completar las dos tareas para dar por evaluada la respuesta propia.
- Repaso priorizado por errores objetivos y observaciones de revisiones reales. Una actividad posterior sin revisión no borra una dificultad previamente observada por la IA. El nivel CEFR solo se reestima con otro diagnóstico.
- Entrevistas según cargo, vacante y tipo: primera conversación, experiencias o proyectos. Modo guiado con ayuda o simulación con observaciones al finalizar. Reutiliza la voz automática por turnos del día 2 y su alternativa por texto.
- Historial privado de actividades y conversaciones, progreso persistente y eliminación de actividades con su revisión asociada.

## Datos, presupuesto y operación

El proyecto Firebase sigue siendo `fuentinterview`. El Worker y el Durable Object `BudgetCoordinator`, instancia `global-v1`, son los existentes; no se reinició el consumo ni se creó otro proyecto.

Las claves `study:{uid}:{id}`, `study-index:{uid}` y `feedback:{uid}:{activity|session}:{id}` se guardan en el mismo almacenamiento privado de Cloudflare. Máximo 80 actividades por usuario. Las claves correctas se ocultan antes de entregar la actividad. El servidor calcula los resultados, comprueba propiedad y obtiene la evidencia guardada; el cliente no puede enviar calificaciones ni fabricar citas para el modelo.

Una revisión real exige correo confirmado y una acción explícita. Reserva US$0,05 del límite total de US$2, compartido con conversaciones y diagnósticos. La reserva es preventiva y no representa el coste facturado. La consulta o reapertura de una revisión ya guardada no vuelve a llamar al modelo. Los fallos conservan la evidencia y su reserva, sin reintento automático. Las revisiones de entrevistas de ejemplo siguen siendo simuladas, aunque el servidor tenga habilitada IA real.

El modelo permanece fijado en `gpt-4.1-mini-2025-04-14`. El nuevo esquema usa el mecanismo ya existente de [salidas estructuradas de OpenAI](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=chat). La revisión analiza fragmentos de hasta 1.000 caracteres por respuesta, máximo seis respuestas; el texto completo guardado puede ser mayor. No evalúa pronunciación, no concede nivel ni predice una contratación.

## Verificación local

- 28 pruebas de servidor aprobadas: autenticación, aislamiento, presupuesto, diagnóstico, conversación, actividades, revisiones, persistencia y concurrencia del Worker real bajo Miniflare.
- 10 comprobaciones del nuevo recorrido de navegador aprobadas, con modelo y audio simulados: guardado, repaso, revisión explícita, caché, conexión con tutor, entrevista, progreso, móvil y cierre de sesión.
- Regresión: 8 comprobaciones de cuentas, 8 de voz y 13 de diagnóstico aprobadas. La primera ejecución simultánea excedió el tiempo de carga de cuenta; las ejecuciones secuenciales pasaron sin cambiar el comportamiento de autenticación.
- Cero llamadas pagadas en estas pruebas locales. Capturas revisadas en `qa/day4-review.png` y `qa/day4-progress.png`; informes en `qa/day*-browser.json`.

## Límites del piloto

El banco y las revisiones siguen siendo experimentales, pendientes de revisión docente. Actividades terminadas no equivale a habilidades dominadas. La adaptación prioriza focos existentes y conserva evidencia; no inventa cursos completos ni certifica avances de nivel.

Las nuevas pruebas de voz usan simulación del navegador. La conversación física y pausa del día 2 fueron confirmadas por el propietario, pero queda pendiente una comprobación específica de la nueva experiencia en Chrome, Edge y teléfono. La interfaz conserva conversación automática por turnos, sin interrupción simultánea mientras habla el tutor.

El diagnóstico interrumpido reportado por el propietario pertenece al día 3. La recuperación de respuestas y los mensajes de fallo específicos se conservan; no se ha determinado retroactivamente la causa exacta de aquel fallo.

Los pagos, las cuotas comerciales y la administración pertenecen al día 5. Este bloque completa el recorrido educativo del piloto, no la preparación comercial íntegra.

## Publicación comprobada

- Web: https://fuentinterview--day1-0vs64ic5.web.app/#/ejercicios
- Entrevistas: https://fuentinterview--day1-0vs64ic5.web.app/#/entrevistas
- Worker: `d651b367-4eac-4685-b79d-9b2f1ee156be`.
- Canal `day1`: vence el 29 de octubre de 2026 a las 22:45:23, hora de Ecuador, salvo nueva publicación.
- Cuatro comprobaciones publicadas aprobadas: actividad gratuita y repaso, persistencia del progreso, aislamiento entre cuentas y entrevista de ejemplo con revisión final simulada. Las cuentas y datos sintéticos fueron eliminados.
- Los diez archivos públicos coinciden byte por byte con los locales; la API rechaza acceso anónimo con 401. Capturas publicadas revisadas visualmente.
- Presupuesto antes y después: 40 intentos, US$2 reservados, US$0,0287128 de consumo estimado registrado, cero llamadas disponibles. Cero nuevas llamadas reales durante el día 4. No se aumentó el límite, no se liberaron reservas ni se reinició el registro. El coste registrado es una estimación de uso, no una factura ni una conciliación de llamadas fallidas.
- `tests/day4-cloud.mjs` solicita una sola revisión real cuando hay margen; si el margen es cero omite esa parte y registra la limitación, manteniendo el resto de comprobaciones gratuitas. No confundir esta ejecución con una verificación real del nuevo feedback.

Informes: `qa/day4-cloud.json`, `qa/day4-deployment.json`, `qa/day4-browser.json`. El siguiente bloque es el día 5; la revisión docente, la prueba de feedback real y la cobertura física de navegadores siguen pendientes.
