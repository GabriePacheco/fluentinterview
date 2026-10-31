# Recuperación de evaluaciones — 29 de octubre de 2026

El usuario reporta fallos frecuentes al evaluar. No se ha obtenido aún el código
privado del último fallo de su cuenta; no se atribuye ese caso a una causa única.

Se corrigieron problemas reproducibles del código:

- Cualquier error de formato, cita o rúbrica rechazaba la evaluación sin reparación.
  Ahora se permite una sola regeneración desde la evidencia original cuando hay una
  respuesta definitivamente inválida. Se contabiliza cada llamada y se conserva la
  validación. No se repiten automáticamente conexiones inciertas, rechazos del proveedor
  ni negativas del modelo. No se fabrican notas ni citas.
- Las citas toleran únicamente espacios y comillas tipográficas; se muestran las palabras
  exactas del usuario. Las palabras distintas siguen siendo rechazadas.
- El esquema limita listas y referencias a las respuestas disponibles. El margen de
  salida es de 3600 tokens para diagnóstico y 2600 para práctica. La entrada de evaluación
  admite hasta 40000 bytes con sus límites de campos existentes.
- Los resultados fallidos pueden reevaluarse con `retryAttempt` desde la interfaz sin
  repetir la entrevista. El contador persistido evita que una petición duplicada o antigua
  produzca otra evaluación. Abrir el historial sigue siendo una lectura.
- El tiempo pendiente es de 150 segundos; las peticiones del navegador esperan 110 segundos
  y pueden recuperar el resultado mediante lectura. Cada llamada al proveedor tiene 45 segundos.
- Una revisión recuperada vuelve a conciliar el intento de ruta; se conserva el umbral 9/10.
- El diagnóstico oral y la nota de práctica mantienen recuperación independiente y detalles
  de soporte con código y referencia, sin exponer secretos ni respuestas del proveedor.

Verificación: 21 pruebas existentes de diagnóstico, revisión y ruta, cinco pruebas nuevas
de recuperación y un flujo de navegador con respuestas simuladas. Incluye recuperación
oral, idempotencia, aislamiento entre usuarios, avance posterior a una revisión fallida
y conservación del DOM cuando se llama render sin cambios. Cero llamadas de IA reales.
La cuenta fue recompilada; la publicación también incluye los cambios pendientes de carga
inicial que evitan reiniciar la animación de entrada en cada respuesta del servidor.

Worker publicado: `9df934c9-35ac-4305-a7d7-a55a83dd5e87`.
Hosting: canal existente `day1` del proyecto `fuentinterview`.
Falta verificar el resultado real de la cuenta del usuario. No se borraron sus conversaciones
ni evaluaciones: son la evidencia que ahora puede recuperar.

Referencia consultada: [Structured Outputs de OpenAI](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=chat).
