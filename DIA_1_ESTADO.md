# Día 1 — entrega y verificación

Implementación inicial: 18 de octubre de 2026. Verificación final de Cloudflare: 20 de octubre de 2026 (Ecuador).

Este documento conserva la entrega histórica del día 1. La misma URL se actualizó con IA real y conversación en el día 2; consultar `DIA_2_ESTADO.md` para la configuración y consumo actuales. El canal se renovó hasta el 27 de octubre.

**Estado: base técnica del día 1 publicada y conectada. Web, Firebase y API Cloudflare verificados de extremo a extremo. La habilitación comercial de pagos sigue pendiente del propietario/proveedor.**

URL: https://fuentinterview--day1-0vs64ic5.web.app

API: https://fluent-interview-api.fluent-interview-local.workers.dev

El canal de pruebas caduca el 25 de octubre de 2026. Se puede renovar con el comando documentado en README. El sitio principal anterior no fue reemplazado.

| Entregable | Estado | Evidencia |
|---|---|---|
| Base de implementación única | Completo | `fluent-interview-app`, conservando el diseño aprobado. |
| Registro, acceso y cierre de sesión | Completo | Prueba de navegador con emuladores y dos cuentas temporales reales. |
| Recuperación de contraseña | Implementado y probado en emulador | Código de recuperación generado, sin enviar correos reales de prueba. |
| Verificación de correo | Implementado | Envío a petición del usuario; entrega de correo real no probada. |
| Perfil persistente | Completo | Guardado y recarga en la URL publicada. |
| Aislamiento de datos | Completo | Reglas desplegadas; lecturas cruzadas y anónimas rechazadas. |
| Plan y permisos protegidos | Completo para la base | El cliente no puede escribir atributos de administrador, presupuesto o suscripción. |
| Clave OpenAI solo en servidor | Completo | Sin clave en archivos públicos; modo simulado y presupuesto cero. |
| API con sesión validada | Completo localmente y en Cloudflare | Prueba con token Firebase real; rechazo de sesión ausente o inválida y de orígenes externos. |
| Presupuesto compartido | Implementado y probado localmente | Durable Object SQLite; 50 reservas concurrentes, 30 permitidas, 20 rechazadas, saldo conservado al reiniciar. |
| API publicada | Completo | Worker accesible por HTTPS y conectado desde la web Firebase; respuesta simulada con presupuesto cero. |
| Publicación web HTTPS | Completo | Canal Firebase day1 accesible y probado. |
| Preparación de pagos | Investigación completa; alta pendiente | Ecuador confirmado; comparación Payphone/Kushki y consulta preparada en `PAGOS_ECUADOR.md`. No se enviaron solicitudes. |

## Resultados de pruebas

- 6 pruebas automatizadas de seguridad, presupuesto y reglas: aprobadas.
- 8 comprobaciones de navegador en emuladores: aprobadas; sin errores JavaScript; sin desbordamiento horizontal móvil.
- Prueba real: dos registros, perfil persistente, aislamiento de usuarios, intento de asignarse Pro rechazado y validación de token real por el servidor local.
- Las dos cuentas temporales y sus documentos de Firebase fueron eliminados.
- `npm audit`: cero vulnerabilidades reportadas.
- Worker publicado y probado desde el navegador en la URL real de Firebase. La respuesta simulada tiene presupuesto cero e intentos pagados cero. Sin errores JavaScript.
- OpenAI: cero llamadas; sin consumo de API. Firebase comprobado sin facturación habilitada.

Los informes de navegador y nube están en `qa/`. Los controles sobre Firestore también se ejecutaron contra las reglas realmente desplegadas, además del emulador.

## Dependencia comercial pendiente

El propietario debe solicitar habilitación del proveedor de pagos elegido para evitar bloquear el día 5. La conexión de Cloudflare quedó resuelta y no requiere repetir la autorización.

La conversación real con IA y el diagnóstico pedagógico no se incluyen como completados en esta entrega: corresponden a los días 2 y 3.
