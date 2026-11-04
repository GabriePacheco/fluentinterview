// Only known application messages become user-visible explanations. Never persist
// arbitrary exception messages, provider response bodies, tokens, or stack traces.
const causes=new Map([
 ['Fortaleza sin evidencia.',['invalid_quote','La IA no vinculó una fortaleza con tus respuestas.']],
 ['La corrección no corresponde a tus palabras.',['invalid_correction','La IA propuso una corrección que no coincide con tus palabras.']],
 ['Calificación no válida.',['invalid_rating','La IA devolvió una calificación fuera del formato permitido.']],
 ['La evaluación afirma una habilidad que no se ha medido.',['unmeasured_skill','La IA incluyó una afirmación sobre una habilidad que esta evaluación no puede medir.']],
 ['Objetivo no admitido.',['unsupported_goal','La IA propuso un objetivo que no admite esta evaluación.']],
 ['La prioridad de comprensión no está respaldada por las tareas.',['unsupported_priority','La IA propuso una prioridad de comprensión que no coincide con los resultados de tus tareas.']],
 ['Nivel de diagnóstico no válido.',['invalid_level','La IA devolvió un nivel que no admite esta evaluación.']],
 ['La evaluación contiene una cita que no está en tus respuestas.',['invalid_quote','La IA incluyó una cita que no coincide con tus respuestas originales.']],
 ['Un módulo no está respaldado por tus respuestas.',['invalid_quote','La IA incluyó una cita que no coincide con tus respuestas originales.']],
 ['Una evidencia insuficiente no debe crear una ruta.',['inconsistent_result','La IA indicó que faltaba evidencia, pero también propuso una ruta. No guardamos ese resultado contradictorio.']],
 ['El diagnóstico no incluye evidencia y módulos suficientes.',['incomplete_route','La IA no incluyó todos los elementos necesarios para justificar tu ruta.']],
 ['El diagnóstico no incluye evidencia y al menos 7 etapas.',['incomplete_route','La IA debe incluir evidencia suficiente y al menos 7 etapas para justificar tu ruta.']],
 ['Los objetivos exceden la longitud admitida.',['oversized_result','La IA devolvió objetivos demasiado extensos para esta evaluación.']],
 ['La ruta contiene módulos repetidos.',['duplicate_modules','La IA repitió objetivos en la ruta.']],
 ['La IA no devolvió un resultado completo. No se reintentó automáticamente.',['incomplete_response','La IA no devolvió una evaluación completa.']],
 ['Respuesta de IA no válida. No se reintentó automáticamente.',['invalid_response','No se pudo interpretar la respuesta de la IA.']],
 ['La respuesta no cumple el formato de aprendizaje.',['invalid_format','La respuesta de la IA no cumple el formato necesario para generar tu ruta.']],
 ['No se pudo completar la llamada a IA. Se conserva la reserva de presupuesto por precaución.',['provider_connection','No se pudo confirmar una respuesta de la IA dentro del tiempo de espera.']],
 ['La sesión es demasiado extensa para esta prueba.',['input_too_large','Tus respuestas y contexto exceden el tamaño admitido para esta prueba. Puedes revisarlos y acortarlos.']],
 ['Falta OPENAI_API_KEY en el servidor. No se realizó ninguna llamada.',['provider_configuration','La conexión de la aplicación con la IA necesita revisión. No se realizó la llamada.']]
]);
export function assessmentFailure(error){
 const known=causes.get(error?.message);
 if(known)return {code:known[0],message:known[1]};
 if(error?.status===429)return {code:'quota_limit',message:'Alcanzaste tu cupo mensual de práctica. Tus respuestas siguen guardadas.'};
 if(error?.status===403)return {code:'access_restricted',message:'Tu cuenta no tiene acceso a esta práctica. Consulta tu suscripción o contacta con soporte.'};
 if(error?.status===402)return {code:'budget_limit',message:'Se alcanzó el límite compartido de pruebas. No se realizó otra llamada a la IA.'};
 if(/^La API rechazó la solicitud \(\d{3}\)\./.test(error?.message||''))return {code:'provider_rejected',message:'El proveedor de IA rechazó la solicitud. La conexión o disponibilidad del servicio necesita revisión.'};
 if(error?.status===503)return {code:'service_unavailable',message:'El servicio de evaluación no está disponible en este momento.'};
 return {code:'internal_error',message:'No se pudo completar la evaluación por un error interno de la aplicación.'};
}
