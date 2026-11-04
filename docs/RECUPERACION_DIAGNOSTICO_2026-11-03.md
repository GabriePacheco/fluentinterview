# Recuperación de diagnóstico · 3 de noviembre de 2026

El validador de diagnóstico se actualizó para exigir siete etapas, pero su mensaje nuevo no se añadió al clasificador de fallos. Una ruta incompleta quedaba registrada como `internal_error` y no entraba en la reparación limitada ya existente.

Se reconoce el mensaje como `incomplete_route`, conservando compatibilidad con el anterior. La IA puede realizar el único intento de reparación previsto, usando las respuestas originales. Si sigue fallando, se conservan las muestras y un motivo específico; abrir el resultado no vuelve a evaluar. No se reducen requisitos de evidencia, no se inventan etapas ni calificaciones y los fallos ambiguos de red siguen sin repetirse automáticamente.

La consulta del incidente confirmó respuestas guardadas y un payload válido. El servidor anterior no conserva el resultado bruto rechazado ni la excepción interna, por lo que la causa exacta de aquel resultado no puede probarse retrospectivamente. El fallo de clasificación sí se reprodujo localmente antes de corregirlo.

Verificación: nueve pruebas de evaluaciones y siete de recuperación correctas, con proveedor simulado, incluida una entrevista básica sin sección avanzada. Se corrigió una referencia fija obsoleta en una prueba para usar el siguiente paso real de la ruta. Sin llamadas pagadas. La reevaluación real se inicia con «Evaluar mi diagnóstico guardado».

Publicado únicamente el servidor: Cloudflare Worker `5695ea0d-d97a-42c9-9720-80188fbec331`. La web existente ya permite recuperar las respuestas. Cambios sin commit, conservando la referencia aprobada `release-2026-11-02-1`.
