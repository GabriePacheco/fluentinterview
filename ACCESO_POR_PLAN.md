# Acceso de usuarios y pruebas de desarrollo

Decisión del propietario: los US$6 autorizados son para pruebas efectuadas por el agente durante el desarrollo. Ese registro no debe impedir la práctica de usuarios ni mostrarse en su interfaz.

La configuración publicada activa `USER_BILLING_ENABLED=true`:

- Propietario (`ADMIN_UID` existente): sin cupo mensual de IA, sesiones de voz de hasta 30 minutos y sin el corte de seis respuestas. No necesita contratar su propia suscripción.
- Gratuito: conserva el cupo mensual interno existente; sesiones de voz de hasta 10 minutos.
- Pro vigente: el cupo ampliado existente también permite IA real, además de ejemplos. Sesiones de voz de hasta 20 minutos. El vencimiento devuelve el acceso al plan gratuito.
- Los pagos siguen en TEST. Este cambio no activa cobros reales ni establece un precio comercial.
- Cada cuenta puede tener una conversación de voz activa; una cuenta ya no bloquea a todas las demás.
- Un minuto antes del cierre por duración aparece un aviso. El motivo de finalización queda guardado en la sesión. Es posible iniciar otra sesión al finalizar.

El ledger histórico `ledger` en `global-v1` permanece intacto. Incluye las reservas anteriores a esta separación, que mezclaban pruebas y uso del propietario; no se ha reclasificado ni reiniciado sin evidencia. A partir del cambio solo registra pruebas de desarrollo. Los usuarios tienen registros independientes `usage-ledger:<uid>`, sin reservas preventivas que bloqueen su acceso.

Las identidades sintéticas del agente usan correo `@example.invalid`. La clasificación se obtiene de la identidad Firebase verificada por el servidor; no se admite un selector de presupuesto desde el cliente. Estas pruebas conservan el tope acumulado US$6, reservas y sesiones breves. El agente no debe usar cuentas normales para saltarse ese tope. Las pruebas locales conservan su presupuesto de desarrollo.

Se retiró la reserva de la cabecera y de Mi suscripción. Los importes de desarrollo quedan únicamente en administración. Usar la app sigue produciendo cargos reales en la cuenta OpenAI del propietario; eliminar el bloqueo de reservas no vuelve gratuito ese consumo.

Validación sin consumo de OpenAI: política de propietario/plan, Pro vigente/vencido, controles administrativos, conversación que supera seis respuestas, separación de ledger con presupuesto de desarrollo agotado en el Worker real de pruebas, persistencia, y comprobación de la interfaz y voz con proveedor simulado.

Esta decisión reemplaza las restricciones de acceso de usuario descritas en `VOZ_REALTIME_ESTADO.md` y en los informes históricos del piloto. Los parámetros de audio, Server VAD y la lógica de interrupción no cambian.
