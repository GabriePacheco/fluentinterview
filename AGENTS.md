# Fluent Interview: trabajo con Git local

- Este es el proyecto activo. El repositorio de `E:/Gabriel/desarrollos/fluentinterviewDO` es otro proyecto.
- Git es exclusivamente local. No agregar remotos, subir código ni publicar en GitHub sin una nueva instrucción del usuario.
- Antes de editar: revisar `git status --short` y el diff pertinente. Conservar cambios del usuario; no usar reset/clean ni sobrescribir trabajo ajeno.
- Al completar una corrección autorizada: ejecutar las comprobaciones pertinentes, revisar el diff, agregar archivos por nombre y crear un commit de alcance claro. No atribuir al agente cambios previos del usuario.
- No crear commits con claves, sesiones, datos de usuarios, registros o archivos temporales. No saltar el hook de revisión de credenciales para resolver un bloqueo; revisar el archivo señalado sin imprimir secretos.
- No ejecutar toda la batería ni llamar a APIs de pago como requisito de un commit. Las pruebas dependen del cambio y del presupuesto autorizado.
- Conservar `package-lock.json` y el bundle de cuentas que se publica. Si cambia `src/account.js`, recompilar y revisar también `public/account.bundle.js`.
- Registrar la relación entre commit y despliegue; no decir que un cambio local está publicado sin verificarlo. Etiquetas anotadas para hitos verificados, no para simular historial anterior.
- El estado inicial contiene trabajo anterior a Git. Su commit base no certifica que todas las funciones hayan pasado pruebas físicas.
- Procedimiento de trabajo y recuperación: `docs/CONTROL_DE_VERSIONES.md`.
