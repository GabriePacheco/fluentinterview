# Acceso y primer registro · 3 de noviembre de 2026

Base aprobada: `11d1f91` / `release-2026-11-02-1`. Esta entrega permanece sin commit, conforme a la instrucción de no crear otro sin solicitud del propietario.

## Comportamiento

- Firebase Auth conserva la sesión en almacenamiento local del navegador, hasta cerrar sesión o borrar los datos del sitio. Se mantiene por navegador y origen; el modo privado puede eliminarla al cerrar.
- Google aparece primero en acceso y registro. Usa el proveedor ya habilitado del proyecto existente `fuentinterview`. No solicita un segundo correo de verificación. El servidor reconoce el proveedor únicamente desde el JWT validado de Firebase.
- El registro con contraseña envía confirmación de correo y muestra una pantalla de espera con reenvío y comprobación. Al volver a la pestaña se vuelve a consultar la verificación.
- Tras Google o confirmación de correo, un formulario único pide nivel percibido, profesión y de uno a cinco puestos. El primer puesto es el objetivo principal. Al guardar abre el diagnóstico inicial; el usuario inicia el micrófono.
- `selfReportedLevel` se conserva como dato del perfil. No entra en el estado de nivel, el perfil enviado a IA ni el payload aceptado para evaluación. La ruta sigue usando el diagnóstico calculado.
- Las cuentas anteriores con puesto ya definido conservan su acceso y progreso. Las cuentas nuevas o incompletas reciben el formulario. Un registro completado que aún no tenga diagnóstico vuelve a esa pantalla al entrar.
- Eliminación de cuenta: Google confirma identidad mediante su ventana; las cuentas con contraseña conservan la confirmación habitual.

## Verificación focalizada

- Tres pruebas de validación, separación del nivel declarado y proveedor en JWT firmado: correctas.
- Reglas Firestore en emulador: correcto; límites, aislamiento entre usuarios, bloqueo de campos de privilegios/nivel calculado y compatibilidad de perfiles anteriores.
- Navegador con emuladores Auth/Firestore: registro, confirmación, Google, formulario, cambio entre cuentas, salida, redirección y persistencia después de cerrar y abrir el navegador: correcto.
- Capturas de escritorio y móvil revisadas en `qa/`; sin desbordamiento horizontal. Compilación del bundle y revisión de espacios del diff correctas.
- Sin correos reales enviados ni llamadas pagadas a OpenAI durante las pruebas.
- El recorrido local de Google utiliza el emulador. La autenticación final con una cuenta personal en dispositivos físicos queda para la prueba del propietario.

## Publicación

- Firestore: reglas compiladas y publicadas en `fuentinterview`.
- Cloudflare Worker: `92fae55a-8b41-4857-94a9-6c3a68f9136e`.
- Hosting: canal existente `day1`, https://fuentinterview--day1-0vs64ic5.web.app , vigente hasta el 10 de noviembre de 2026. Se verificaron hashes publicados de los cinco archivos cambiados: bundle, CSS, app, runtime y commerce.
- Navegador contra la web publicada: el botón Google abre `accounts.google.com` sin errores JavaScript. Se cerró antes de autenticarse; no se utilizó una cuenta personal para esta comprobación. CSP publicado permite cargar el SDK de Google.

No se creó otro proyecto Firebase ni se cambiaron modelos, prompts o condiciones de consumo de IA.

## Ajuste de acceso solicitado después

Iconos en nombre, correo y contraseña. Botón accesible para mostrar u ocultar la contraseña en acceso y registro, sin perder el valor ni enviar el formulario. Comprobados clic, teclado y diseño de escritorio/móvil en navegador; recuperación conserva solo el campo de correo. Bundle recompilado; sin llamadas pagadas ni cuentas reales utilizadas.

Ajuste publicado en el mismo canal `day1`; hashes remotos de `account.bundle.js`, `account.css` y `app.js` coinciden con los archivos comprobados.
