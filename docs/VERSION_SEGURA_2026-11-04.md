# Versión segura antes del experimento Gemini

El 4 de noviembre de 2026 el propietario confirmó que las rutas y el flujo mejoraron, y que probó el pago y una clase con el coach con resultado satisfactorio. Solicita conservar este estado como versión segura antes del experimento.

Referencia: etiqueta anotada `release-2026-11-04-segura`. Incluye la corrección de construcción de rutas documentada en `PERSONALIZACION_RUTAS_2026-11-04.md`. Validación automática focalizada: 30 pruebas correctas con proveedor simulado, sin llamadas pagadas. La validación física del pago y del coach corresponde al reporte del propietario; el proveedor continúa configurado en modo TEST.

Servidor publicado: Worker `59164ad3-e473-425b-993c-57c3e488e1cd`. Interfaz: canal Firebase Hosting `day1`, con hashes publicados comprobados. La etiqueta guarda código y configuración pública, no claves ni datos de usuarios. La limpieza posterior de cuentas de prueba no cambia este código.

El experimento se desarrolla en `experiment/gemini-live`, desde esta etiqueta. Crear la rama no cambia los proveedores ni despliega el experimento. Mantener las publicaciones actuales hasta decidir reemplazarlas explícitamente.

Para consultar la referencia: `git show release-2026-11-04-segura`. Para trabajar sobre una copia de esa versión sin descartar cambios: `git switch -c recuperacion/version-segura release-2026-11-04-segura`, con el árbol limpio.
