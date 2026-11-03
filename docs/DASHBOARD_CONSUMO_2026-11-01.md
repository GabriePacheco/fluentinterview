# Dashboard de consumo por conversación

Continuación de la optimización del 1/11. El propietario confirmó que prompts y despedida funcionan bien. Esta entrega no modifica instrucciones, modelos, tarifas, VAD ni lógica de cierre.

- Dashboard al principio de Administración y disponible también en el perfil del propietario.
- Tarjeta de última conversación: correo, tipo, fecha/hora, duración de voz, tokens de entrada/salida, caché, coste estimado y desglose texto/audio/transcripción.
- Resumen de consumo mensual UTC, acumulado y descuento por caché; historial de hasta 30 registros con búsqueda por correo, fecha, tipo o identificador y filtro por ámbito. Tabla en escritorio, tarjetas en móvil.
- Se conservan todos los importes previos. Un coste incompleto se identifica como subtotal conocido; no se presenta como precio completo o gratuito.
- Duración nueva: conexión de voz hasta cierre, incluyendo pausas y espera del cierre; excluye evaluación posterior. Se persiste separadamente de los eventos de consumo. Nunca se usa el límite permitido de voz ni el tiempo de evaluación para calcularla. Sesiones antiguas sin medición muestran «No registrada».
- Identidad nueva: UID proveniente del servidor; correo resuelto desde la cuenta guardada, sin copiar transcripciones o perfil al monitor. Los registros antiguos del propietario pueden recuperar su correo. Otras identidades antiguas no registradas quedan sin identificar. Borrar una cuenta desvincula su UID del historial de costes, conservando agregados.
- El endpoint mantiene restricción por UID administrativo y correo verificado. Los datos de conversación se consultan solo después de comprobar ese permiso. No hay acceso público a correos ni consumo individual.

Validación local sin llamadas pagadas: precios y agrupación, duración independiente de la evaluación, identidad y permisos, registros anteriores, separación de usuarios, pruebas existentes de voz y cuentas. Navegador a 1440 y 390 px: Administración, búsqueda, filtros, estado vacío, coste parcial y actualización sin perder ediciones del perfil. Capturas con datos ficticios en `qa/openai-dashboard-desktop.png` y `qa/openai-dashboard-mobile.png`.

Sin commits, conforme a la instrucción vigente del propietario. Conserva también los cambios sin commit de la entrega anterior.

Publicado: Worker `58fc9fda-98b9-4add-b83c-b8e3d00fba1d`; Firebase `fuentinterview`, canal `day1`, [Administración](https://fuentinterview--day1-0vs64ic5.web.app/#/administracion). Canal vigente hasta 8/11/2026. Endpoint sin autenticación devuelve 401; `commerce.js`, `account.css` y `app.js` publicados comparados por SHA-256 con los archivos locales. HEAD permanece `86406dc`; despliegue con cambios locales, sin commit nuevo.
