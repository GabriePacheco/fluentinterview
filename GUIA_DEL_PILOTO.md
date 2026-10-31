# Guía del piloto de Fluent Interview

Versión del 25 de octubre de 2026. Esta guía corresponde a la app de pruebas, con diagnóstico experimental y suscripciones Lemon Squeezy TEST.

## Acceso y primer recorrido

Abrir [Fluent Interview](https://fuentinterview--day1-0vs64ic5.web.app/#/inicio). Crear una cuenta propia y confirmar el correo. No compartir contraseñas. El proyecto existente es `fuentinterview`; la publicación usa el canal `day1` y no reemplaza el sitio principal.

1. En **Mi objetivo profesional**, guardar cargo, experiencia, vacante y tiempo diario.
2. En **Mi diagnóstico**, responder las tres muestras y las tareas. Si se revela el texto del audio, la comprensión auditiva queda pendiente. Guardar el avance permite continuar después.
3. Pulsar **Evaluar y crear mi ruta** una sola vez. La IA propone objetivos basados en las respuestas y una primera semana. El nivel es orientativo, no una certificación.
4. Abrir un objetivo de **Mi ruta** y practicar con el tutor. **Iniciar con voz** pide permiso al micrófono una vez; después alterna escucha y respuesta. **Pausar** detiene ambas. Se puede continuar por escrito.
5. Completar una actividad, revisar las correcciones y solicitar, si hace falta, la revisión de la respuesta abierta con IA. Los ejercicios objetivos no consumen llamadas.
6. En **Entrevistas**, indicar el cargo y la vacante, practicar y finalizar. La revisión de la entrevista usa las respuestas guardadas; no predice una contratación.
7. Consultar **Mi progreso** para retomar actividades y conversaciones. Cerrar sesión en equipos compartidos.

La conversación actual termina tras seis respuestas del estudiante; se puede iniciar otra práctica. Es voz automática por turnos. Para detener al tutor mientras habla hay que pulsar Pausar; todavía no admite interrupciones naturales simultáneas.

## Cuotas y costes

El límite global autorizado es US$6 acumulados. Cada intento real reserva US$0,05 de forma preventiva, incluso si falla. La reserva no equivale al cargo de OpenAI. El consumo estimado se muestra separado y no reemplaza la factura del proveedor. No se reinicia el registro al publicar, cambiar de mes o pasar de etapa.

Las cuentas normales tienen 10 solicitudes reales por mes calendario UTC y dependen también del saldo global. La cuenta administrativa tiene un cupo de prueba de 120, igualmente sujeto al límite global. Una solicitud es una respuesta del tutor, un diagnóstico o una revisión, no una sesión completa. Consultar resultados guardados no vuelve a llamar al modelo.

Los ejemplos tienen un cupo separado: 10 gratuitos o 200 con Pro TEST. Una suscripción TEST no amplía el presupuesto real. El checkout actual muestra el precio de prueba de US$24/mes; no usar una tarjeta real ni presentarlo a clientes como una oferta comercial habilitada.

Consultar [estado del piloto](https://fuentinterview--day1-0vs64ic5.web.app/#/pruebas) y [cuotas personales](https://fuentinterview--day1-0vs64ic5.web.app/#/planes).

## Si algo falla

| Situación | Acción |
|---|---|
| Micrófono bloqueado o no compatible | Revisar el permiso del sitio; continuar por texto. Chrome y Edge de escritorio son los navegadores objetivo. |
| Se perdió la conexión durante una respuesta | Conservar la pantalla y pulsar Recuperar respuesta. Se consulta/reutiliza la misma solicitud; no se envía automáticamente otra llamada. |
| Sesión de acceso no válida | Copiar cualquier respuesta sin guardar y volver a iniciar sesión. Los datos ya guardados permanecen. |
| Diagnóstico interrumpido | Abrir el resultado, revisar el código para soporte y recuperar las respuestas. Una nueva evaluación exige una acción explícita y consume otra solicitud. |
| Cuota o presupuesto agotados | Continuar con ejercicios objetivos e historial. Consultar cupos antes de solicitar otra evaluación. |
| Pago TEST completado sin cambio de plan | Actualizar Mi suscripción y consultar el estado. No repetir la compra ni confiar únicamente en la página de éxito. |
| Error al eliminar cuenta | La app informa si faltó completar perfil/acceso. Reautenticarse y repetir el borrado para terminar; no crear una nueva cuenta para ocultar el fallo. |

Soporte: `gabioh2012@gmail.com`. Enviar pantalla, hora, navegador, acción y referencia del diagnóstico si existe. No enviar contraseñas, claves API ni datos de tarjeta.

## Coordinación de hasta cinco evaluadores

El propietario debe escoger a los evaluadores y compartirles el enlace y estas instrucciones. No se enviaron invitaciones automáticas ni se crearon cuentas en su nombre. La URL y el registro son públicos; el piloto por invitación es una coordinación del propietario, no una lista de acceso impuesta por el servidor.

Antes de invitar, revisar el saldo compartido y asignar un recorrido pequeño: diagnóstico, una conversación breve y una revisión. No prometer una sesión ilimitada ni que todos los evaluadores podrán agotar su cupo si el saldo global es menor.

Registrar por persona: navegador/dispositivo, permiso de micrófono, cinco turnos sin pulsar de nuevo, pausa/salida, claridad de la ruta, recuperación tras recarga y problemas encontrados. No recopilar contraseñas. Las pruebas automatizadas de voz y tamaño móvil no sustituyen esta prueba física.

## Administración y apagado

Entrar a [Administración](https://fuentinterview--day1-0vs64ic5.web.app/#/administracion) con la cuenta verificada del propietario. **Pausar IA** bloquea futuras llamadas reales; no interrumpe una petición ya enviada. Los ejercicios e historial siguen disponibles. Suspender práctica de una cuenta no cancela su suscripción y mantiene accesible la gestión de pagos.

Si no se puede acceder al panel, cambiar `AI_MODE` a `mock` y `AI_BUDGET_USD` a `0` en `wrangler.jsonc` y ejecutar `npm run deploy:api`. Esto no borra reservas ni datos. Para reanudar, restaurar únicamente la configuración autorizada; no eliminar ni renombrar `global-v1`.

## Publicación y recuperación técnica

Desde `E:\Gabriel\INTERVIEW\fluent-interview-app`, con Node 24 y TLS del sistema:

```powershell
$env:NODE_USE_SYSTEM_CA='1'
npm run build
npm test
npm run deploy:preview
```

Publicar el Worker con `npm run deploy:api` solo cuando cambie el servidor/configuración. Publicar reglas con `npm run deploy:rules` solo después de probar modificaciones de reglas. El canal `day1` se renueva por siete días: si caduca, volver a publicar ese canal. No sustituirlo por el sitio live sin una decisión expresa del propietario.

Ante una regresión, pausar IA y volver a desplegar una copia conocida del código y configuración, manteniendo las mismas vinculaciones de almacenamiento. Reinstalar dependencias con `npm ci` y reconstruir la interfaz si fuera necesario. Nunca publicar `.env`, `.local`, registros CLI o credenciales. La clave Firebase del navegador identifica el proyecto; las claves privadas de OpenAI y Lemon Squeezy permanecen en servidor.

No se ha implantado una copia automática restaurable del contenido educativo. Volver a desplegar código conserva datos existentes, pero no recupera datos eliminados. Antes de una operación comercial se necesita definir y verificar respaldo/retención, supervisión y recuperación ante incidentes.

## Antes de vender

Faltan validación docente, condiciones comerciales y de privacidad revisadas, oferta acorde con las funciones reales, presupuesto operativo y habilitación/verificación del modo live de Lemon Squeezy. El catálogo original promete minutos, pronunciación y entrevistas ilimitadas que este piloto no ofrece. No activar ese catálogo para cobros reales con esas promesas.

El piloto no incluye certificación, garantía de contratación, pronunciación acústica, portal de reclutadores ni un currículo completo validado de todos los niveles. Las pruebas de integración verifican funcionamiento; no prueban eficacia pedagógica ni capacidad a escala.
