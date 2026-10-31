# Día 5 — Suscripciones y administración

> Actualización del 24 de octubre de 2026: el propietario autorizó US$4 adicionales para revisar la interacción con IA. El límite acumulado pasa de US$2 a US$6, conservando reservas, intentos y consumo. Con las 40 reservas existentes de US$0,05, quedan hasta 80 intentos adicionales compartidos. El cupo mensual real del UID administrativo es 120 para permitir estas pruebas, siempre sujeto al presupuesto global; las demás cuentas conservan 10. No se recargó saldo de OpenAI ni se activaron cobros de Lemon Squeezy.

Verificado el 24 de octubre de 2026. Implementado y publicado para el piloto, exclusivamente con pagos de prueba.

## Acceso y configuración

- [Mi suscripción](https://fuentinterview--day1-0vs64ic5.web.app/#/planes).
- [Administración](https://fuentinterview--day1-0vs64ic5.web.app/#/administracion): cuenta existente `gabioh2012@gmail.com`, con correo verificado. Soporte usa el mismo correo.
- [Privacidad, soporte y eliminación](https://fuentinterview--day1-0vs64ic5.web.app/#/privacidad), accesible también antes de registrarse.

Se mantiene Firebase `fuentinterview`, el canal `day1` y el Durable Object `global-v1`. No se creó otro proyecto Firebase ni se reemplazó el sitio principal. La última publicación renovó el canal hasta el 31 de octubre de 2026 a las 18:19, hora de Ecuador.

Tienda TEST `503999`, variante mensual `2290584`, producto `1468780`, webhook TEST `145857`. El precio creado por el propietario es US$24/mes en pruebas. API key y secreto de firma están en secretos de Cloudflare y en `.env.lemon.local`, excluido de publicación y control de versiones.

## Funcionalidad

Checkout alojado en Lemon Squeezy, estado confirmado en la app, enlace privado al portal y cancelación de renovación. El servidor verifica HMAC de las notificaciones y consulta la suscripción con el proveedor antes de conceder acceso. La URL de regreso no activa Pro. Se rechazan datos manipulados, suscripciones ajenas y retrocesos por eventos anteriores; repetir eventos no duplica beneficios.

Gratuito: 10 solicitudes reales y 10 simuladas por mes calendario UTC. Pro de prueba: 200 simuladas; no amplía la cuota real ni el presupuesto compartido. Una solicitud equivale a una respuesta del tutor, diagnóstico o revisión, no a una sesión ni a un minuto. Ejercicios objetivos e historial guardado no consumen solicitudes. Los intentos enviados cuentan aunque fallen.

Cancelación conserva acceso hasta el final confirmado del periodo. Pago fallido, pausa o vencimiento retiran el beneficio; recuperación lo restablece sin rellenar cuotas usadas. El aprendizaje se conserva.

Administración exige UID configurado y correo verificado: usuarios operativos, suscripciones, cuotas, presupuesto, eventos recientes, suspensión de práctica y pausa de futuras llamadas de IA. Suspender práctica no cancela facturación; sigue disponible la gestión de suscripción.

Borrado de cuenta: exige reautenticación reciente; cancela renovación, elimina contenido educativo y después perfil/acceso Firebase. Conserva identificador técnico de cuenta eliminada y asociación de suscripción para bloquear tokens antiguos y eventos tardíos, además del presupuesto agregado. El proveedor conserva sus registros de pedidos. La cuenta administrativa requiere transferir el rol antes de borrarse.

## Pruebas y límites de la evidencia

| Comprobación | Resultado |
|---|---|
| Servidor y Worker local | 36 pruebas aprobadas, incluidas 8 de comercio |
| Navegador de comercio local | 9 comprobaciones aprobadas |
| Regresiones de cuentas, voz, diagnóstico y escuela | 8 + 8 + 13 + 10 comprobaciones aprobadas |
| Checkout publicado con tarjeta oficial TEST | Compra completada sin cargo real |
| Webhook enviado por Lemon Squeezy | Activó Pro de prueba en la app publicada |
| Web publicada | Estado confirmado en escritorio y móvil; URL privada del portal obtenida |
| Cancelación en proveedor TEST | Renovación cancelada; acceso hasta el fin del periodo |
| Limpieza | Cuenta sintética y datos educativos eliminados |

Renovación, fallo, recuperación, vencimiento, repetición y desorden de eventos se probaron localmente con respuestas controladas de API y webhooks firmados. No se esperó un mes ni se provocó un impago en el proveedor. No se ejecutó un cambio de tarjeta desde el portal. Evidencia: `qa/day5-browser.json`, `qa/day5-cloud.json` y capturas `qa/day5-*.png`.

La compra utilizó únicamente tarjeta de prueba. Según Lemon Squeezy, los recibos TEST llegan al propietario de la tienda: [documentación oficial](https://docs.lemonsqueezy.com/help/getting-started/test-mode).

## Operación

Desde esta carpeta, con Node 24 y confianza TLS del sistema:

```powershell
node --use-system-ca scripts/connect-lemon.mjs inspect
node --use-system-ca scripts/connect-lemon.mjs configure
node --use-system-ca scripts/connect-lemon.mjs install
node --use-system-ca scripts/connect-lemon.mjs webhook
npm run deploy:api
npm run build
npm run deploy:preview
```

`configure` valida tienda/variante, resuelve `ADMIN_EMAIL` contra Firebase y configura el Worker; requiere sesión CLI vigente. `install` transmite secretos sin imprimirlos. `webhook` crea o actualiza solo el webhook TEST de esta app. Para cambiar contacto anterior al acceso, actualizar también `public/config.js`.

Prueba local: `npm run test:commerce`, con emuladores Auth y Firestore. La prueba externa explícita usa `tests/day5-cloud.mjs prepare`, `purchase`, `verify`, `cleanup`. Crea cuenta sintética y pedido TEST; no ejecutarla rutinariamente. Si falla tras enviar el pago, consultar su estado antes de repetir. `cleanup` elimina el archivo temporal privado.

El panel lista hasta 500 usuarios operativos recientes, 100 eventos de auditoría y se conservan 200 huellas recientes de notificaciones. No es un panel de todos los usuarios históricos Firebase ni contabilidad completa. La cuota mensual es independiente del periodo individual de cobro.

## Presupuesto y pendientes

Sin llamadas pagadas a OpenAI ni cobros reales en este bloque. Registro intacto: 40 intentos, US$2 reservados, US$0,0287128 de consumo estimado y cero llamadas disponibles. Las reservas preventivas no son dinero facturado. No se reinició consumo ni se liberaron reservas.

La integración exige TEST. Antes de vender faltan habilitación comercial del proveedor, oferta y condiciones finales, presupuesto operativo y adaptación/verificación explícita del modo live. El catálogo original anuncia 150 minutos, pronunciación y entrevistas ilimitadas; no son prestaciones implementadas en el piloto. El checkout TEST muestra los cupos actuales sin modificar catálogo ni precio del propietario. Hay que corregir y acordar la oferta antes de activarla.

El día 6 debe cerrar recorrido integral y operación del piloto. Siguen pendientes revisión educativa nueva con OpenAI real, revisión docente del diagnóstico experimental y cobertura física en navegadores/dispositivo previstos.
