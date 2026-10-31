# Suscripciones — Ecuador y Lemon Squeezy

El propietario eligió Lemon Squeezy. El 24 de octubre de 2026 se verificó la tienda existente en TEST y el recorrido compra → webhook del proveedor → activación en la app → cancelación → borrado de cuenta sintética. Sin cargos reales. Evidencia y operación: DIA_5_ESTADO.md.

Tienda 503999, producto 1468780 y variante mensual 2290584; precio de prueba creado por el propietario: US$24/mes. El servidor verifica firmas, consulta suscripciones y vincula checkout a UID autenticado; la página de éxito no concede Pro. El plan TEST amplía solo las solicitudes simuladas, sin ampliar presupuesto real.

## Antes de vender

1. Completar la habilitación comercial del negocio y desembolsos con el proveedor. Ecuador figura entre los países admitidos; eso no garantiza aprobación individual. [Países admitidos](https://docs.lemonsqueezy.com/help/getting-started/supported-countries).
2. Definir una oferta sostenible con costes reales. El catálogo original promete 150 minutos, pronunciación y entrevistas ilimitadas; el piloto no ofrece esas prestaciones. Solo se ajustó la descripción del checkout TEST, sin alterar catálogo ni precio del propietario.
3. Acordar precio, impuestos, condiciones, cancelación, reembolsos y tratamiento de datos. No se aceptaron contratos ni se tramitó habilitación comercial en nombre del propietario.
4. Implementar y verificar modo live separado. El código actual exige TEST; cambiar una clave no habilita cobros reales.
5. Contar con presupuesto operativo: los US$2 autorizados son pruebas acotadas, no financiación comercial.

Los datos de tarjeta se introducen en el checkout alojado del proveedor, no se almacenan en la app. Borrar una cuenta educativa no elimina registros de pedidos conservados por Lemon Squeezy.

[Modo de prueba](https://docs.lemonsqueezy.com/help/getting-started/test-mode) · [Paso a producción](https://docs.lemonsqueezy.com/guides/developer-guide/testing-going-live) · [Firmas de webhooks](https://docs.lemonsqueezy.com/help/webhooks/signing-requests).
