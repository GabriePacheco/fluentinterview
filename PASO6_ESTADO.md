# Paso 6: presentación y lenguaje de producto

27 de octubre de 2026.

El propietario aprobó la maqueta y después retiró expresamente el personaje. La implementación conserva la bienvenida con fondo abstracto violeta, conversación principal, acceso separado a Tutor/Entrevista, fortalezas y nota de la última conversación, y un recorrido visual con checks y posición actual. No incluye ilustraciones de personas ni nuevos archivos de imagen. La ilustración generada antes del cambio de opinión no se publica.

## Datos y comportamiento

- `public/dashboard.js` y `dashboard.css` presentan los datos existentes. No cambian el motor de voz, los criterios de evaluación ni las reglas de aprobación.
- La portada consulta sesiones y evaluación mediante GET. Abrirla nunca solicita una evaluación pagada. Abrir el resultado desde la tarjeta también evita generar automáticamente una evaluación faltante.
- La ruta usa nivel, puesto, pasos y aprobados del diagnóstico actual. No toma una ruta histórica por la ruta activa ni muestra el ejemplo fijo de 18 pasos de la maqueta.
- Fortalezas, notas y próximo paso provienen de la revisión guardada. No se inventan resultados si falta revisión. Para indicar “Paso aprobado” se consulta el intento aprobado de la ruta; una nota alta por sí sola no sustituye la evidencia requerida.
- Estados propios para carga, error, diagnóstico ausente, conversación sin resultado y ruta terminada. Datos de la portada asociados a la identidad; resultados tardíos de otra cuenta se descartan.
- Se sustituyeron rótulos de aprendizaje/aula por preparación/conversación en navegación activa. La pantalla de estado ya no utiliza el presupuesto de desarrollo para determinar el acceso del usuario ni muestra reservas o solicitudes.
- La cancelación de suscripción usa lenguaje de usuario. Se conserva la transparencia sobre proveedores en privacidad y los controles operativos en administración.
- Suscripciones siguen en TEST. No se inventan métodos de pago: se indica que los disponibles se muestran en el formulario de pago. No se habilitan cobros comerciales.

## Comprobación acotada

- `tests/conversation-route-browser.mjs`: flujo con servicios locales y voz/IA simuladas; fallo, reintento, aprobación con 9, conservación al recargar, portada con fortalezas y nota, próximo paso, modo entrevista, diagnóstico ausente y diseño a 390/768/1536 px. Sin llamadas al proveedor. El fixture de autenticación instala las vistas como lo hace la sesión real.
- Comprobación de la pantalla de estado: propietario con presupuesto de desarrollo agotado conserva acceso; plan agotado y pausa administrativa se distinguen; sin reservas ni solicitudes visibles.
- Compilación de cuenta y comprobación sintáctica de archivos modificados.
- Capturas revisadas: `qa/step6-home-desktop.png`, `qa/step6-home-mobile.png`. Contienen datos de prueba, no resultados del propietario.
- Se corrigió durante la prueba el estado sin diagnóstico que podía intentar leer una ruta nula. El recorrido final pasa.
- No se repitieron las suites históricas ni se hicieron llamadas pagadas de desarrollo a OpenAI.

## Entrega y pendientes

Publicado en el canal existente [day1](https://fuentinterview--day1-0vs64ic5.web.app/#/inicio), sin desplegar cambios de Worker, crear proyectos, modificar cuentas ni reiniciar consumo. Verificación de archivos publicados mediante `.local/verify-step6-release.mjs`.

La presentación no valida la calidad de respuestas de OpenAI. Siguen pendientes la conversación real de diagnóstico/ruta, el micrófono físico móvil y medir el objetivo de interrupción menor de 300 ms. La apertura de pagos reales continúa pendiente; esta entrega sigue siendo un piloto.
