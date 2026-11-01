# Cierre y evaluación por objetivo — 31 de octubre de 2026

## Cambios

- Tutor de ruta: decidir el final a partir de los turnos de audio recibidos, antes de solicitar otra respuesta. Esperar las transcripciones finales para despedirse y guardar la evidencia. Una transcripción tardía podía detectar el último turno cuando ya se generaba otra pregunta.
- Diagnóstico: una despedida espontánea dentro de una pregunta no cierra la sesión. El cierre por tiempo espera la respuesta pendiente dentro del límite de duración existente; se reserva un margen de 45 segundos. El cierre manual sigue siendo explícito.
- Rúbrica versión 3: 9 significa cumplir el objetivo del paso según su nivel, con evidencia propia suficiente; admite errores menores que no impidan comunicar. Una mejora opcional no equivale a reprobar. Las notas menores a 9 deben explicar una carencia material para ese objetivo. Se reconoce la aplicación independiente posterior a una corrección y se evita penalizar el mismo error sin efectos distintos demostrados.
- Se conservan cuatro criterios con pesos iguales y aprobación exacta desde 9/10. No se cambian las notas ni las aprobaciones históricas. No se atribuye a las pruebas locales una validación de calificaciones reales de la IA.

## Comprobación

Pruebas locales focalizadas: cierre y reproducción, transcripción tardía, diagnóstico, objetivos de práctica y cálculo/validación de evaluación. Sin llamadas de pago ni cambio de modelo, VAD o transporte. Nuevos casos: pregunta con despedida prematura, cierre programado con respuesta pendiente y última respuesta de ruta antes de que llegue su transcripción.

## Modelo y costes consultados

El código usa `gpt-realtime-2.1-mini`. Tarifa oficial de audio: US$10 de entrada y US$20 de salida por millón de tokens; entrada de audio en caché US$0,30. Texto, transcripción y evaluación son componentes adicionales.

GPT-Live 1 es una alternativa de integración distinta: US$0,05 por minuto de sesión, facturado por segundo, más modelo de backend y herramientas. No se ha migrado ni comprobado su habilitación en esta cuenta. No puede afirmarse que sea más barato para este producto sin comparar duración y consumo reales.

Fuentes consultadas: https://developers.openai.com/api/docs/pricing y https://developers.openai.com/api/docs/models/gpt-live-1

## Publicación verificada

Código `099bac9`, Worker `dc3d31df-8448-47b9-83a2-46ed1071c925`, publicado el 31/10/2026. Wrangler confirmó el despliegue y el endpoint de sesión responde 401 sin credenciales, como corresponde. No hubo cambios de frontend. La verificación no incluye una nueva conversación pagada.
