# Control de versiones local

Repositorio: `E:/Gabriel/INTERVIEW/fluent-interview-app`. Rama principal: `main`.
Inicio del historial: 31 de octubre de 2026. No se puede reconstruir con Git el historial anterior a este punto.
El propietario autorizó GitHub el 3 de noviembre de 2026. Remoto: `https://github.com/GabriePacheco/fluentInterview.git`. El hook `pre-push` permite exclusivamente ese destino; la revisión de credenciales antes de cada commit sigue activa. La versión de código `04290b0` se sube mediante la rama `version-2026-11-04`, conservando el historial independiente de `main` remoto. El nombre de la rama usa la fecha UTC; la autorización ocurrió el 3 de noviembre en Ecuador.

## Qué se conserva

Código, pruebas, configuración pública, documentación y `package-lock.json`. También `public/account.bundle.js`: es el archivo efectivamente desplegado y permite comparar o recuperar el frontend exacto sin depender de recompilarlo. Su fuente está en `src/account.js`.

Las claves, sesiones, bases locales, dependencias instaladas, capturas y temporales quedan fuera. La configuración pública de Firebase no es una credencial privada. El hook inspecciona el contenido preparado para commit y algunas credenciales comunes; no es un detector infalible y no sustituye revisar el diff.

## Trabajo habitual

1. `git status --short`: revisar los cambios existentes.
2. Para un trabajo de varios cambios, `git switch -c fix/nombre-del-cambio` o `feat/nombre` desde un estado limpio.
3. Editar y ejecutar solo las pruebas pertinentes. Ningún hook llama a OpenAI ni ejecuta despliegues.
4. `git diff --check` y `git diff`: revisar los cambios. No mostrar diffs de secretos en mensajes.
5. `git add ruta/al/archivo`: preparar únicamente los archivos de ese trabajo.
6. `git diff --cached --stat` y `git diff --cached`: revisar lo preparado.
7. `git commit -m "fix: descripción concreta"`. Usar `feat:`, `docs:`, `test:` o `chore:` según corresponda.
8. Al finalizar la rama: `git switch main` y `git merge --ff-only nombre-de-rama`. Si no permite avance directo, revisar la divergencia; no forzar.

Cambios pequeños pueden registrarse directamente en `main`. No es necesario crear una rama por un ajuste de documentación.

## Publicaciones

Crear el commit del código antes de desplegar. Registrar hash, Worker version ID, canal de Firebase, verificaciones y limitaciones. Tras verificar una publicación, crear una etiqueta anotada sobre el commit de código correspondiente: `git tag -a release-AAAA-MM-DD-N -m "Descripción y referencias de despliegue" HASH`.

La etiqueta inicial `baseline-2026-10-31` identifica el código existente al habilitar Git. Corresponde al Worker `a091dc32-b567-4de1-8538-a182210c6906` y al canal Firebase `day1`, verificados en el trabajo anterior. Los archivos de configuración de Git se añadieron después de ese despliegue. No es una declaración de versión final ni de validación física completa.

## Recuperar sin perder trabajo

- Historial: `git log --oneline --decorate -15`.
- Ver un archivo anterior: `git show ETIQUETA:ruta/al/archivo`.
- Comparar: `git diff ETIQUETA -- ruta/al/archivo`.
- Para deshacer un commit ya consolidado, preferir `git revert HASH`: crea un nuevo commit conservando el historial. Revisar primero que el árbol esté limpio.
- No usar `git reset --hard` ni `git clean` para resolver problemas rutinarios. La configuración privada y los datos excluidos no se restauran desde Git.

## Copias locales

La copia inicial del historial se guarda como bundle en `E:/Gabriel/INTERVIEW/git-backups/`. Un bundle contiene objetos y referencias de Git, no claves ni datos ignorados. No copia cambios sin commit.

Crear una copia con un nombre nuevo: `git bundle create E:/Gabriel/INTERVIEW/git-backups/fluent-interview-AAAA-MM-DD-N.bundle --all`.
Verificarla: `git bundle verify RUTA.bundle`.
Para recuperar: `git clone RUTA.bundle NUEVA_CARPETA`. Un clon desde bundle añade un remoto local `origin`; quitarlo con `git remote remove origin` y volver a configurar los hooks.

La copia está en el mismo disco E:, por lo que protege frente a pérdidas de la carpeta del proyecto, pero no frente a una avería de ese disco. Para ese riesgo, copiar periódicamente el bundle a una unidad externa. Git no reemplaza el respaldo privado de `.env` ni de los datos de la aplicación.

## Hooks al restaurar en otro equipo

Configurar `git config core.hooksPath .githooks`. Si `node` no está en PATH: `git config fluent.nodePath RUTA_ABSOLUTA_A_NODE`. Los ajustes son locales al repositorio; no cambian la configuración global de Git. Usar la identidad propia ya configurada en Git.
