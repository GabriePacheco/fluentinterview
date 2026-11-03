# Prompts y monitor de consumo — 1 de noviembre de 2026

Base aprobada: `release-2026-10-31-5` (código `551b66f`); HEAD local `86406dc` incorpora documentación. Cambios de esta entrega sin commit por instrucción del propietario.

## Optimización

Se condensaron las instrucciones de voz, correcciones, conversación escrita, revisión final y diagnóstico/ruta. Las instrucciones estables preceden al contexto personal en Realtime. No se cambiaron modelos, VAD, audio, truncación de contexto, límites de salida, cierre, esquemas de resultados, validadores ni cálculo de aprobado (9/10 sin redondeo).

Medición local de instrucciones estáticas con perfil vacío, sin objetivo libre ni datos de ruta añadidos. Son **caracteres, no tokens facturados ni porcentaje de ahorro de una conversación**:

| Instrucciones | Antes | Ahora | Reducción |
|---|---:|---:|---:|
| Tutor de voz | 3860 | 2195 | 43% |
| Entrevista simulada | 1449 | 1074 | 26% |
| Diagnóstico oral | 1910 | 995 | 48% |
| Revisión final | 6526 | 3398 | 48% |
| Evaluación y ruta | 6435 | 3229 | 50% |

Se conservaron instrucciones explícitas para correcciones mínimas, español solo en explicaciones del tutor cuando corresponda, evidencia incierta sin penalización, calibración de criterios por nivel/objetivo, fortalezas primero en el resultado y progresión profesional personalizada. El esquema y el contexto dinámico siguen consumiendo tokens. El audio y el historial también se facturan; caché es automática y no se garantiza.

## Modelos y decisión

Precios estándar consultados el 1/11/2026, por millón de tokens salvo indicación:

| Uso actual | Modelo | Entrada / caché / salida |
|---|---|---|
| Conversación y decisiones orales | gpt-realtime-2.1-mini | Texto: US$0,60 / 0,06 / 2,40; audio: US$10 / 0,30 / 20 |
| Evaluación y conversación escrita | gpt-4.1-mini-2025-04-14 | US$0,40 / 0,10 / 1,60 |
| Transcripción del diagnóstico | gpt-4o-transcribe | US$2,50 entrada / US$10 salida |
| Transcripción de práctica | whisper-1 | US$0,006/min |

Realtime Mini es la alternativa de menor precio de la familia Realtime actual consultada. **No todos los componentes son los más baratos disponibles**: GPT-4o Mini cuesta US$0,15/0,075/0,60 para texto y mini-transcribe tiene estimación de US$0,003/min. Su equivalencia en las notas y en el reconocimiento de esta app no se ha probado. Se preservaron los modelos que el usuario acaba de aprobar; no cambiar transcripción/calificación por precio sin una comparación controlada. GPT-Live cobra US$0,05/min más uso de backend/herramientas, por lo que no es automáticamente más económico.

Las fichas actuales marcan GPT-4.1 Mini, GPT-4o Transcribe y Whisper como deprecated. Esta entrega no migra esos modelos: debe prepararse una comparación de sustitución antes de su retirada, verificando fecha y acceso de la cuenta. No se hicieron llamadas pagadas ni se modificó el presupuesto de desarrollo.

Fuentes oficiales:
- [Realtime Mini](https://developers.openai.com/api/docs/models/gpt-realtime-2.1-mini)
- [Costes y campos de uso de Realtime](https://developers.openai.com/api/docs/guides/voice-latency-cost)
- [GPT-4.1 Mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini)
- [Transcripción](https://developers.openai.com/api/docs/models/gpt-4o-transcribe)
- [Whisper](https://developers.openai.com/api/docs/models/whisper-1)
- [GPT-4o Mini](https://developers.openai.com/api/docs/models/gpt-4o-mini)
- [Tarifas](https://developers.openai.com/api/docs/pricing)

## Monitor del propietario

En el perfil, debajo del formulario: **Consumo de OpenAI**. Endpoint `GET /api/admin/openai-usage`, protegido mediante UID administrativo y correo verificado desde identidad validada por servidor. Ningún rol enviado por cliente concede acceso. No se incorpora a las respuestas normales de facturación.

Registra eventos de uso recibidos del proveedor: respuestas Realtime (incluidas canceladas y decisiones internas), transcripciones y evaluaciones de texto (incluidos intentos con salida inválida). Agrupa conversación y evaluación por identificador de sesión. Separa propietario, otros usuarios y desarrollo, texto/audio/transcripción, caché, modelo y día UTC. No guarda respuestas, nombres ni audio en este registro.

La tarifa de caché sustituye a la normal para esos tokens, no se suma dos veces. Se corrigió el cálculo anterior que aplicaba tarifas de audio a todos los tokens Realtime. Los importes históricos ya guardados permanecen intactos; el nuevo monitor empieza con los eventos posteriores al despliegue. Las reservas de desarrollo no son gasto real ni se reinician.

Los eventos con desglose insuficiente se marcan como parciales, no como gratuitos. No representa factura, crédito disponible, actividad anterior, otras aplicaciones ni consumo de solicitudes cuyo uso no se recibió. Para reconciliar con facturación haría falta otra integración con credencial administrativa; no se requiere esa credencial para este monitor.

Conservación acotada: agregados acumulados y por modelo/ámbito; últimos 31 días con datos; 30 sesiones recientes (10 visibles); 300 IDs recientes para deduplicación persistente. Realtime además deduplica durante toda la conexión. Al eliminar conversaciones no se elimina su consumo ya facturado. Refrescar el monitor actualiza solo su contenedor y conserva el formulario sin guardar.

## Validación

Sin llamadas pagadas. Pruebas locales de precios y caché, eventos parciales/cancelados/duplicados, permisos del propietario, persistencia Worker y presupuesto, correcciones con evidencia, progresión, metas, voz y cierre. Vista de perfil comprobada a 1440 y 390 px con datos simulados; actualización conserva ediciones sin guardar y borrar autenticación limpia el monitor.

Estas pruebas verifican contratos y flujos; no demuestran equivalencia lingüística de los prompts reducidos. La siguiente conversación normal del propietario permitirá revisar comportamiento y empezar a medir gasto real reportado por el proveedor.

Publicación: Worker `2743cdc8-1289-405f-97af-fa087a91184e`; mismo proyecto Firebase `fuentinterview`, canal `day1`, [perfil publicado](https://fuentinterview--day1-0vs64ic5.web.app/#/perfil), con vencimiento del canal 8/11/2026. Endpoint de consumo sin autenticación devuelve 401. Archivos públicos `commerce.js` y `account.bundle.js` comprobados contra sus hashes locales. HEAD permanece `86406dc`, sin commits nuevos ni archivos preparados en el índice. El despliegue contiene los cambios locales de esta entrega, no un nuevo commit.
