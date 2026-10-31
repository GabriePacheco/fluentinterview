# Día 6 — Verificación y entrega del piloto

Actualización del 25 de octubre de 2026. Implementación y verificación automatizada completadas; versión publicada para pruebas. la aceptación física de voz y la apertura comercial siguen pendientes.

## Cambios de esta entrega

- Mensajes en español ante pérdida de conexión, tiempo de espera y sesión vencida. Las solicitudes no se reenvían automáticamente; la pantalla conserva la respuesta para recuperarla o copiarla.
- La conversación diferencia errores de acceso, cuota y presupuesto de una respuesta todavía recuperable.
- Pantalla de estado actualizada con acceso al recorrido, disponibilidad de IA, presupuesto global, cuotas y soporte.
- Instrucciones de revisión más precisas para describir únicamente evidencia textual. El rechazo de términos sobre habilidades no medidas cubre también resumen y siguiente paso, además de observaciones. Las citas originales del alumno se conservan sin modificarlas.
- Dependencia de desarrollo `undici` fijada a 7.30.1; `npm audit` sin vulnerabilidades reportadas. Se comprobó de nuevo el Worker bajo Miniflare después del cambio. [Aviso oficial de seguridad](https://github.com/nodejs/undici/security/advisories/GHSA-xjj6-f33q-929c).
- Guía de uso, soporte, coordinación de evaluadores, publicación, apagado y límites en `GUIA_DEL_PILOTO.md`.

El modelo sigue fijado en `gpt-4.1-mini-2025-04-14`. El ajuste utiliza instrucciones explícitas y ejemplos de redacción observables; mantiene esquema, claves, cuota y presupuesto. Se consultó la [guía oficial de instrucciones de GPT-4.1](https://developers.openai.com/cookbook/examples/gpt4-1_prompting_guide). Un caso aprobado no garantiza que todas las respuestas futuras superen la validación.

## Evidencia automatizada

| Área | Verificación |
|---|---|
| Servidor | 36 pruebas iniciales aprobadas; 17 pruebas pertinentes tras el ajuste final, incluida una nueva de revisión segura |
| Reglas Firestore | Propiedad, esquema, escritura de privilegios y acceso anónimo comprobados en emulador |
| Regresión de navegador | 48 comprobaciones: cuentas 8, voz 8, diagnóstico 13, escuela 10, comercio 9 |
| Casos adicionales del día 6 | 6 comprobaciones: micrófono denegado, conexión perdida, sesión vencida, presupuesto agotado, estado y pantallas |
| Pantallas | 11 rutas en anchos de 360, 390, 768 y 1440 píxeles; encabezado principal y ausencia de desbordamiento horizontal |
| Navegadores instalados | 8 comprobaciones adicionales de voz en Chrome y 8 en Edge, con audio simulado y perfiles aislados |
| Publicación web | 11 archivos iguales a los locales; secretos privados ausentes; API rechaza acceso anónimo y webhook sin firma |

Las pruebas de navegador no capturan audio físico. La revisión de encabezados y tamaños no constituye una auditoría completa de accesibilidad. No se hicieron pruebas de carga a escala.

Informes: `qa/day6-browser.json`, `qa/day6-chrome-voice.json`, `qa/day6-edge-voice.json`, `qa/day6-audit.json`, `qa/day5-published.json` y regresiones `qa/day*-browser.json`.

## Comprobación con OpenAI real

El primer recorrido creó una cuenta sintética, guardó su perfil, completó un diagnóstico real y generó una ruta y semana. El tutor recibió el objetivo de la ruta; una actividad obtuvo revisión real vinculada a la respuesta guardada. La revisión final de entrevista fue rechazada por el filtro de habilidades no medidas. Se conservaron el error y la evidencia de la prueba en `qa/day6-cloud.json`; no se convirtió ese fallo en un éxito ni se reinició su consumo.

El filtro detectó un término no permitido en texto generado. La respuesta descartada no se conserva: no se puede reconstruir su formulación exacta ni asegurar si era una afirmación o una mención negativa. Se hicieron explícitas las restricciones del vocabulario generado y se reforzó la verificación de todos sus campos. El mensaje de error ahora habla de evaluación y no confunde una revisión de entrevista con un diagnóstico.

La comprobación posterior se limita a una actividad gratuita, entrevista real, revisión final, persistencia tras recarga, tamaño móvil y aislamiento entre cuentas; no repite el diagnóstico ni la revisión de actividad ya comprobados. El tramo pasó con tres llamadas nuevas: revisión final real, progreso persistente, móvil y aislamiento confirmados. Evidencia en `qa/day6-cloud-recheck.json`. La limpieza tuvo un fallo transitorio de conexión; se completó por separado sin repetir ninguna llamada de IA. Las dos cuentas sintéticas quedaron eliminadas y se retiró el archivo temporal de credenciales.

Lemon Squeezy sigue en TEST. La compra, webhook, activación y cancelación con el proveedor fueron verificados en el día 5; no se repitió una compra durante esta entrega. La suite local volvió a comprobar estados de renovación, fallo, recuperación y cancelación.

## Publicación y continuidad

- [Inicio](https://fuentinterview--day1-0vs64ic5.web.app/#/inicio).
- [Aula](https://fuentinterview--day1-0vs64ic5.web.app/#/aula).
- [Estado del piloto](https://fuentinterview--day1-0vs64ic5.web.app/#/pruebas).
- [Administración](https://fuentinterview--day1-0vs64ic5.web.app/#/administracion), cuenta verificada `gabioh2012@gmail.com`.

Firebase `fuentinterview`, canal `day1`, Worker `fluent-interview-api` y Durable Object `global-v1` se mantienen. Worker final: `16370daf-df11-45f7-b443-b068a8de73e2`. El canal web vence el 31 de octubre de 2026 a las 19:03, hora de Ecuador, salvo nueva publicación. El sitio live anterior permanece intacto.

El límite global autorizado sigue en US$6 y el cupo de administrador en 120 solicitudes reales mensuales. Las cuentas normales conservan 10. No se reinician reservas, intentos ni consumo al publicar. Las reservas son preventivas; el consumo estimado es distinto de una factura. Las pruebas locales son gratuitas y las llamadas externas se registran por separado.

## Aceptación pendiente y alcance

El propietario había confirmado conversación y pausa en el día 2. Se solicitó una nueva prueba física del recorrido actual, identificando navegador y dispositivo; todavía no se ha recibido esa confirmación en esta entrega. La prueba de móvil es de interfaz, no de micrófono físico.

La guía permite coordinar hasta cinco evaluadores; no se enviaron invitaciones ni se crearon cuentas para personas reales. El registro es público y no hay una lista de invitados impuesta en servidor. Compartir el enlace de manera limitada no equivale a restringirlo técnicamente.

Antes de vender faltan revisión docente, oferta y condiciones comerciales, habilitación y verificación de cobros live, presupuesto operativo y respaldo/restauración de datos. La escuela es un piloto con banco inicial de actividades y evaluación experimental; no un currículo completo validado ni una certificación. La voz sigue siendo automática por turnos, sin interrupciones simultáneas naturales.

## Resultado económico y cierre

Las dos verificaciones del día 6 usaron 7 + 3 = 10 llamadas reales y US$0,50 de reservas preventivas. La diferencia de consumo estimado durante esas ejecuciones fue US$0,0051908, aproximadamente medio centavo. Esto no es una factura. Hubo actividad adicional entre ejecuciones; no se atribuye ese consumo a las pruebas.

Última lectura: límite US$6; reservas US$3,70; consumo estimado acumulado US$0,0452388; 74 intentos y 46 disponibles. Son valores de la comprobación, no un saldo fijo: cambian al usar la app. No se aumentó el límite ni se reinició el registro.

La aceptación técnica automática se cierra con los resultados de ambas fases, conservando el primer fallo en su informe. No se presenta el primer recorrido como una ejecución íntegra aprobada. Siguen pendientes la confirmación física del propietario y los requisitos comerciales descritos arriba.

Copia local del código de entrega: `.local/releases/day6-source-2026-10-25.zip`, acompañada de manifiesto SHA-256. Incluye código, configuración pública y guías; excluye credenciales, datos educativos, registros y dependencias instaladas. Es una copia de código, no un respaldo de los datos en Cloudflare/Firebase.
