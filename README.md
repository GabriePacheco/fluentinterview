# Fluent Interview — días 1 a 6

Control de versiones habilitado el 31 de octubre de 2026: Git local, sin remotos. Consulta [el flujo de trabajo, las copias y la recuperación](docs/CONTROL_DE_VERSIONES.md).

> Actualización del 24 de octubre de 2026: el propietario autorizó US$4 adicionales para revisar la interacción con IA. El límite acumulado pasa de US$2 a US$6, conservando reservas, intentos y consumo. Con las 40 reservas existentes de US$0,05, quedan hasta 80 intentos adicionales compartidos. El cupo mensual real del UID administrativo es 120 para permitir estas pruebas, siempre sujeto al presupuesto global; las demás cuentas conservan 10. No se recargó saldo de OpenAI ni se activaron cobros de Lemon Squeezy.

Aplicación activa: `fluent-interview-app`. El prototipo visual queda en la carpeta hermana como referencia. El repositorio React anterior no fue modificado.

## Abrir la versión publicada

[Abrir actividades](https://fuentinterview--day1-0vs64ic5.web.app/#/ejercicios) · [Preparar entrevista](https://fuentinterview--day1-0vs64ic5.web.app/#/entrevistas) · [Abrir el diagnóstico](https://fuentinterview--day1-0vs64ic5.web.app/#/diagnostico) · [Abrir la conversación](https://fuentinterview--day1-0vs64ic5.web.app/#/aula).

El canal de pruebas se renueva por siete días al publicar y conserva el nombre `day1` para mantener la URL. No reemplaza el sitio principal existente. Firebase Authentication y Firestore son los servicios reales del proyecto `fuentinterview`. La URL es accesible públicamente; perfiles, conversaciones y diagnósticos requieren autenticación y están aislados por usuario.

## Disponible

- Registro y acceso por correo/contraseña, cierre de sesión y recuperación de contraseña.
- Envío de verificación de correo a petición del usuario.
- Perfil profesional persistente y privado; sin métricas iniciales inventadas.
- Reglas desplegadas que rechazan lectura entre cuentas, cambios de privilegios y escritura de suscripciones desde el cliente.
- API local con verificación criptográfica de tokens Firebase, límites de tamaño y frecuencia, origen restringido y clave de OpenAI exclusivamente en servidor.
- Worker publicado en Cloudflare con un presupuesto compartido, reserva atómica antes de cada intento y almacenamiento persistente. Conexión desde la web publicada verificada el 20 de octubre de 2026.

El Worker está en modo IA real con límite compartido de US$6, ampliado el 24 de octubre sin reiniciar consumo. El aula permite conversación automática por turnos, pausa, texto, historial y resumen; también ofrece ejemplos sin consumir OpenAI. El diagnóstico incorpora expresión, lectura, gramática, vocabulario y una muestra auditiva. Genera una ruta experimental con evidencia, cuatro módulos y una semana de práctica, conserva versiones y conecta los objetivos con el tutor. El desarrollo local permanece en modo simulado con presupuesto cero. Lemon Squeezy está conectado exclusivamente en modo TEST. El día 4 añade actividades, correcciones gratuitas, repaso adaptado, progreso e entrevistas por cargo/vacante con revisión opcional. Detalles en `DIA_2_ESTADO.md`, `DIA_3_ESTADO.md`, `DIA_4_ESTADO.md` y `DIA_5_ESTADO.md`.

La IA selecciona y ordena objetivos de un catálogo de habilidades observables, justifica cada módulo con una cita del alumno y genera una pregunta contextual. Los ejercicios y criterios de dominio proceden del catálogo; la semana distribuye el tiempo del perfil. La verificación publicada del 22 de octubre pasó con tres muestras distintas y evidencia insuficiente, sin reemplazar rutas ante fallos. Al verificar el día 4: US$0,0287128 de consumo estimado registrado, US$2 reservados y cero llamadas restantes. El presupuesto ya estaba agotado antes de esta comprobación; no hubo nuevas llamadas reales. Las actividades y los ejemplos gratuitos siguen disponibles. Esa limitación histórica se resolvió en el día 6: las revisiones de actividad y entrevista fueron comprobadas con OpenAI real. El canal de pruebas se renueva por siete días en cada publicación.

## Suscripciones y administración

[Mi suscripción](https://fuentinterview--day1-0vs64ic5.web.app/#/planes) · [Administración](https://fuentinterview--day1-0vs64ic5.web.app/#/administracion) · [Privacidad y soporte](https://fuentinterview--day1-0vs64ic5.web.app/#/privacidad).

Lemon Squeezy TEST: compra publicada, webhook, activación y cancelación comprobados con tarjeta de prueba; cuenta sintética eliminada. Gratuito permite 10 solicitudes reales y 10 simuladas por mes UTC; Pro TEST amplía solo las simuladas a 200. La IA real también depende del presupuesto compartido, ampliado a US$6 el 24 de octubre. Administración y soporte usan la cuenta existente gabioh2012@gmail.com. Detalle, operación, evidencia y pendientes comerciales en `DIA_5_ESTADO.md` y `PAGOS_ECUADOR.md`.

## Entrega del piloto

La guía de uso, pruebas físicas, soporte, publicación y apagado está en `GUIA_DEL_PILOTO.md`. La evidencia final y sus límites se registran en `DIA_6_ESTADO.md`: 54 comprobaciones principales de navegador, voz automatizada adicional en Chrome/Edge, controles de servidor y pruebas reales de aprendizaje aprobadas en dos fases. El primer fallo y la corrección de la revisión se conservan en los informes. Sigue pendiente la confirmación física de voz; Lemon Squeezy continúa en TEST. La interfaz conserva la experiencia aprobada y añade mensajes claros de conexión/sesión, recuperación explícita y una pantalla de estado actualizada.

## Desarrollo local

Node 22 o superior, preferiblemente Node 24. Desde esta carpeta:

```powershell
npm ci
npm run build
npm start
```

Abrir `http://127.0.0.1:4173`. El archivo `.env` es privado y está excluido del control de versiones. Para reconstruirlo, copiar `.env.example` sin activar llamadas pagadas. En este equipo la confianza TLS se resolvió usando el almacén del sistema: `$env:NODE_USE_SYSTEM_CA='1'`. No desactivar la verificación TLS.

La configuración Firebase del navegador identifica el proyecto; no es una clave privada. El acceso real se controla con Firebase Auth y Firestore Rules. Nunca poner la clave OpenAI en `public/`, `VITE_*`, Git ni mensajes de chat.

## Pruebas

```powershell
npm test
npm run test:rules
npm run test:browser
npm run test:voice
npm run test:diagnostic
npm run test:school
npm run test:commerce
npm run test:pilot
```

`npm test` valida tokens, aislamiento HTTP, presupuesto local, sesiones, idempotencia y concurrencia/persistencia del Durable Object. No consume OpenAI. La prueba del Worker usa Miniflare con su motor real local y almacenamiento SQLite.

Las pruebas de reglas y navegador requieren Auth Emulator en `127.0.0.1:9099` y Firestore Emulator en `127.0.0.1:8080`, con proyecto `demo-fluentinterview`. Se pueden iniciar con Firebase CLI y un Java compatible:

```powershell
firebase emulators:start --only auth,firestore --project demo-fluentinterview
```

En este equipo se usó el emulador Firestore 1.19.8 ya instalado con Java 17 de Android Studio, más Auth Emulator de Firebase CLI. La CLI reciente puede exigir Java 21 para iniciar ambos automáticamente.

`tests/browser.mjs` usa Playwright y Chromium disponibles en este equipo. Las variables `PLAYWRIGHT_MODULE` y `CHROMIUM_PATH` permiten seleccionar instalaciones distintas. Cubre registro, persistencia, errores de acceso, cambio de usuario, móvil y recuperación de contraseña simulada.

`tests/cloud-smoke.mjs` conserva la prueba histórica del día 1: sus aserciones requieren un Worker en modo simulado con presupuesto cero. No ejecutarla contra el despliegue actual de IA real.

`tests/day2-browser.mjs` prueba la conversación en emuladores con servicios de voz simulados, incluyendo pérdida de una respuesta HTTP y recuperación sin duplicados. No consume OpenAI.

`tests/day3-browser.mjs` prueba el diagnóstico completo con un modelo de prueba local: borradores, resultados, ruta, semana, contexto del tutor, móvil y cierre de sesión. No consume OpenAI. `tests/browser-runtime.mjs` resuelve la instalación disponible de Playwright y admite `PLAYWRIGHT_MODULE` y `CHROMIUM_PATH`.

`tests/day2-cloud.mjs` es una prueba explícita del despliegue que **sí consume hasta seis llamadas** dentro del presupuesto global; no se ejecuta con `npm test`. Usa cuentas temporales, confirma únicamente la cuenta sintética mediante la sesión administrativa local de Firebase y elimina sus datos al terminar. No envía correos ni imprime credenciales. Los mensajes del modelo son reales y el audio es simulado. Ejecutar únicamente cuando una nueva modificación justifique ese gasto: `node --use-system-ca tests/day2-cloud.mjs`.

`tests/day3-cloud.mjs` comprueba tres muestras sintéticas de inglés con OpenAI real y una insuficiente sin llamada. Verifica versiones, prioridades diferentes, persistencia, aislamiento y repetición sin consumo adicional; elimina los datos temporales. Consume hasta tres llamadas en un recorrido correcto. Ejecutar solo cuando haga falta verificar un cambio: `node --use-system-ca tests/day3-cloud.mjs`. Las pruebas de modelo son una comprobación de integración, no una validación pedagógica poblacional.

`tests/day4-browser.mjs` comprueba diez pasos de actividades, revisión, repaso, tutor, entrevista y progreso con servicios simulados. `tests/day4-cloud.mjs` verifica actividades y entrevista de ejemplo publicadas; solo solicita una revisión real si queda margen en el límite compartido. Registra explícitamente la omisión si no queda margen. Elimina únicamente los datos y cuentas sintéticos que crea.

Informes de cada día en `qa/day*-browser.json` y `qa/day*-cloud.json`; capturas en `qa/`.

## Despliegue reproducible

```powershell
npm run build
npm run deploy:rules
npm run deploy:preview
```

Las reglas sustituyeron unas reglas de prueba caducadas que ya denegaban todo acceso desde octubre de 2025. La copia previa está en `.local/firestore-before.json`, fuera de los archivos públicos. Las colecciones antiguas siguen denegadas; solo `fi_users` y las lecturas privadas previstas tienen acceso autorizado.

## Cloudflare conectado

API: https://fluent-interview-api.fluent-interview-local.workers.dev

El Worker está publicado en la cuenta autorizada por el propietario. `public/config.js` ya apunta a esa URL y el origen del canal Firebase está permitido en `wrangler.jsonc`. El fallo HTTPS inicial ya no se reproduce. El 20 de octubre se comprobó la conexión completa desde el navegador: autenticación Firebase → Worker → respuesta simulada, sin errores JavaScript ni consumo de OpenAI.

Para futuros despliegues, ejecutar `npm run deploy:api`. `wrangler.jsonc` contiene `AI_MODE=openai` y `AI_BUDGET_USD=6`. Para detener llamadas pagadas, cambiar el modo a `mock`, el límite a `0` y volver a desplegar; las reservas existentes se conservan. Si caduca el acceso de Wrangler, ejecutar `npx wrangler login --scopes account:read user:read workers:write workers_scripts:write`. No es necesario conceder los demás permisos sugeridos por la advertencia genérica de Wrangler para esta integración.

Comprobar `/api/session`: sin token responde 401; con una cuenta real responde 200; un origen no autorizado responde 403. Si cambia la URL de la web, actualizar `ALLOWED_ORIGINS` y volver a desplegar. El servidor local adapta `apiBase` al mismo origen para que `npm start` siga usando la API local.

La clave de OpenAI ya está instalada como secreto de Cloudflare. Para sustituirla desde el archivo privado `.env`, ejecutar `node --use-system-ca scripts/install-openai-secret.mjs .env`. El script valida el acceso al modelo y envía la clave por entrada estándar; nunca la imprime ni la coloca en argumentos del proceso.

No eliminar ni renombrar el Durable Object `global-v1` para reiniciar el presupuesto. Las reservas se conservan incluso ante fallos. El límite aplica a esta aplicación, no a otros proyectos o usos de la cuenta OpenAI.

## Modelo de datos inicial

- `fi_users/{uid}`: nombre, cargo, objetivo, minutos diarios, experiencia, vacante, versión y fechas. El propietario puede leer/editar solo el esquema permitido.
- `fi_users/{uid}/assessments|routes|sessions|progress/{id}`: esquema reservado para funciones futuras; escritura denegada al cliente. Las conversaciones del día 2 se almacenan en Cloudflare, no en esta subcolección.
- Conversaciones: claves privadas por usuario dentro del Durable Object existente. El servidor guarda mensajes, observaciones, resumen y registro de solicitudes; el cliente no puede fabricar mensajes del tutor. Máximo 20 sesiones por usuario; lectura, reapertura y eliminación desde el historial.
- Diagnósticos y rutas: `assessment:{uid}:{id}` y `assessment-index:{uid}` en el mismo Durable Object. Borradores con control de revisión; evaluaciones inmutables; versiones sucesivas y puntero a la última ruta válida. Las muestras, respuestas, citas, módulos y semana se conservan por usuario, con máximo 20 diagnósticos. Un fallo o resultado insuficiente mantiene la ruta previa; un ejemplo gratuito nunca se convierte en ruta real.
- Actividades y revisiones: `study:{uid}:{id}`, `study-index:{uid}` y `feedback:{uid}:{activity|session}:{id}` en Cloudflare. Máximo 80 actividades por cuenta; borradores versionados, resultados calculados en servidor y revisiones guardadas sin repetición automática. Eliminar una actividad o sesión elimina su revisión asociada. Los ejemplos de feedback nunca cuentan como evidencia real.
- `fi_entitlements/{uid}`: colección reservada; no es la fuente del plan actual. Suscripciones y cuotas se verifican y almacenan en el servidor Cloudflare.
- Presupuesto: Durable Object de Cloudflare, fuera del alcance del cliente. En desarrollo local, `.local/budget.json` con bloqueo exclusivo de proceso.

No se guardan grabaciones. La sesión de acceso del navegador dura hasta cerrarlo; los datos del perfil permanecen en Firebase. El contenido educativo de ejemplo no se conserva como progreso real.

## Operación y límites actuales

- Firebase sin facturación habilitada, comprobado durante la implementación.
- IA real habilitada desde el día 2. El consumo de las verificaciones publicadas se registra en `qa/day2-cloud.json`, `qa/day3-cloud.json` y `qa/day4-cloud.json`; las reservas acumuladas se consultan con `/api/session` autenticado. Las pruebas locales siguen siendo gratuitas. La autorización acumulada de US$6 es compartida por conversaciones, evaluaciones y revisiones; no se reinició al pasar de día.
- Dependencias revisadas con `npm audit`: cero vulnerabilidades reportadas el 24 de octubre tras fijar undici 7.30.1, además de la corrección anterior de gRPC.
- No se ha activado App Check ni cobros reales. Las suscripciones TEST ya están verificadas; la apertura comercial requiere configuración y validación adicionales.
- Los tokens Firebase se validan por firma y vigencia. La revocación inmediata entre servicios requerirá el control adicional correspondiente; un token ya emitido puede conservar su vigencia hasta expirar.
- No publicar archivos `.env`, `.local`, registros CLI o credenciales. Un diagnóstico CLI de esta sesión mostró credenciales en su salida; revocar esa sesión CLI y volver a autenticarla es la medida recomendada antes de continuar con accesos administrativos.
