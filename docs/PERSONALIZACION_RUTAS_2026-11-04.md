# Construcción de rutas personalizadas

Se conserva la propuesta del diagnóstico: orden de módulos, títulos, objetivos y criterios. El catálogo de competencias sigue como soporte y compatibilidad para datos antiguos; ya no impone un orden fijo ni reemplaza los campos personalizados de módulos nuevos.

El esquema solicita por módulo entre dos y seis pasos con título en español y tarea concreta en inglés, y dos ejemplos ilustrativos en español. Los pasos y el escenario del módulo llegan al contexto real del tutor. Los ejemplos son preparación visual: no entran en la evidencia del alumno ni en las instrucciones de voz, y se excluyen del contexto enviado al modelo de conversación escrita.

Se envían los puestos de interés adicionales guardados en onboarding, con validación de hasta cinco entradas. El nivel declarado sigue excluido; se usa el nivel calculado del diagnóstico.

Las rutas persistidas conservan sus IDs, intentos y aprobados. No se regeneran ni gastan llamadas al abrirlas. La generación completa nueva requiere un diagnóstico nuevo. La ampliación por reglas de rutas cortas sigue siendo un mecanismo de compatibilidad, no una evaluación nueva de IA.

La salida máxima del diagnóstico pasa de 3.600 a 6.000 tokens para alojar pasos y ejemplos sin truncarlos. Es un límite de generación, no un consumo fijo; no aumenta la salida de cada respuesta Realtime.

Verificación: 30 pruebas focalizadas correctas, incluyendo conservación de orden, escenarios, pasos, ejemplos y contexto del tutor para dos profesiones del mismo nivel con salidas de modelo controladas. Verifica la construcción, no certifica la calidad de generación real. Sin llamadas pagadas a OpenAI. Bundle recompilado.

Publicación: Worker `59164ad3-e473-425b-993c-57c3e488e1cd`; Hosting canal `day1`, con hashes comprobados de runtime, bundle, ejemplos y ruta. El experimento Gemini aún no se ha iniciado.
