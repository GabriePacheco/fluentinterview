// Competencies drive the route. Language exercises support a professional task.
export const MIN_ROUTE_STAGES=7;
export const INTERVIEW_COMPETENCIES={
 professional_intro:{rank:0,supportFocus:'concision',title:'Presenta tu perfil profesional',objective:'Presentar tu experiencia y conectar tu aportación con el puesto objetivo.',exercise:'Escribe una presentación breve con tu función, una aportación propia y su relación con el puesto.',masteryCheck:'Presentar tu perfil de forma pertinente y respaldar tu aportación con un detalle propio.'},
 role_fit:{rank:1,supportFocus:'evidence',title:'Conecta tu experiencia con el puesto',objective:'Explicar por qué tu experiencia y motivación responden a una necesidad del puesto.',exercise:'Elige una necesidad del puesto y relaciona una experiencia real con ella.',masteryCheck:'Justificar tu interés y tu aportación al puesto con evidencia de tu experiencia.'},
 experience_story:{rank:2,supportFocus:'cohesion',title:'Describe experiencias y resultados',objective:'Contar una experiencia laboral con contexto, una acción propia y su resultado.',exercise:'Ordena una experiencia real y distingue qué hiciste tú y qué ocurrió después.',masteryCheck:'Describir una experiencia pertinente y distinguir tu contribución y su resultado sin inventar hechos.'},
 explain_concepts:{rank:3,supportFocus:'technical_clarity',title:'Explica tu trabajo con claridad',objective:'Explicar un concepto o proceso de tu trabajo a un reclutador que no lo conoce.',exercise:'Explica un concepto de tu puesto mediante un ejemplo y elimina términos que no hayas aclarado.',masteryCheck:'Explicar para qué sirve un concepto profesional y mostrar su uso con un ejemplo comprensible.'},
 justify_decisions:{rank:4,supportFocus:'reasoning',title:'Justifica tus decisiones',objective:'Explicar una decisión profesional con razones, restricciones y un resultado o efecto esperado.',exercise:'Describe una decisión propia, por qué la tomaste y qué restricción consideraste.',masteryCheck:'Conectar una decisión con una razón pertinente y explicar sus consecuencias.'},
 handle_followups:{rank:5,supportFocus:'concision',title:'Responde repreguntas',objective:'Responder preguntas de seguimiento sin perder el sentido ni contradecir tu experiencia.',exercise:'Escribe una repregunta sobre tu ejemplo y respóndela usando un detalle que todavía no hayas explicado.',masteryCheck:'Aclarar un detalle o una objeción nueva con una respuesta directa y coherente con lo dicho.'},
 compare_options:{rank:6,supportFocus:'reasoning',title:'Compara alternativas',objective:'Comparar opciones de trabajo con un criterio y explicar cuándo elegirías cada una.',exercise:'Compara dos opciones de una situación del puesto e indica un beneficio y un límite de cada una.',masteryCheck:'Comparar alternativas con el mismo criterio y justificar una elección en ese contexto.'},
 defend_position:{rank:7,supportFocus:'reasoning',title:'Defiende una postura profesional',objective:'Sostener una recomendación ante una objeción y reconocer cuándo conviene revisarla.',exercise:'Formula una recomendación, añade una razón y responde a una objeción razonable.',masteryCheck:'Defender una postura con evidencia, reconocer un límite y explicar qué dato cambiaría tu decisión.'}
};
// Six incremental tasks per competency; lower levels receive more scaffolding.
const STEPS={
 professional_intro:[['Tu función','Describe your current work or studies.'],['Tu aportación','Explain one useful thing you do for others.'],['Un ejemplo de tu perfil','Give one example that demonstrates that contribution.'],['Elige lo relevante','Connect that example to one need of the target role.'],['Tu presentación breve','Introduce yourself to a recruiter using the relevant facts only.'],['Adapta tu presentación','Adapt your introduction to a different priority in the same role.']],
 role_fit:[['Qué necesita el puesto','Describe one responsibility of the target role.'],['Por qué te interesa','Explain what interests you about that responsibility.'],['Tu experiencia relacionada','Describe a real task that prepared you for it.'],['Demuestra tu aportación','Use a concrete example to show how you would contribute.'],['Reconoce un reto','Explain one gap and a practical way you would address it.'],['Conecta tu motivación','Answer why this role fits you, linking motivation and evidence.']],
 experience_story:[['Sitúa la experiencia','Describe the setting and task in a real experience.'],['Explica el problema','Explain what needed to change and who was affected.'],['Distingue tu acción','Describe what you personally did, separate from the team.'],['Muestra el resultado','Explain what changed because of your action, without invented metrics.'],['Extrae un aprendizaje','Explain what that experience taught you and why.'],['Cuenta una experiencia completa','Tell a new relevant example with context, your action and the result.']],
 explain_concepts:[['Para qué sirve','Name one concept or process in your role and explain its purpose.'],['Un ejemplo sencillo','Show where someone would use it in a familiar situation.'],['Cómo funciona','Explain its main steps in a useful order.'],['Ajusta el lenguaje','Explain it to a recruiter without unexplained jargon.'],['Aclara una confusión','Clarify a realistic misunderstanding about that concept.'],['Adapta a otra persona','Explain another concept to a stakeholder with a different need.']],
 justify_decisions:[['Identifica la decisión','Describe a decision you made in work or studies.'],['Tu razón principal','Explain one reason for that choice.'],['Considera una restricción','Explain how a real limitation influenced the decision.'],['Relaciona decisión y efecto','Explain what happened or was expected because of that choice.'],['Comprueba tu criterio','Explain how you judged whether the decision worked.'],['Decide en un contexto nuevo','Justify a choice in a new role-specific scenario with reasons and constraints.']],
 handle_followups:[['Da una respuesta base','Give a short account of a task so the interviewer can follow up.'],['Aclara un detalle','Answer a follow-up asking who, what or when about that account.'],['Explica lo que faltaba','Answer a why or how follow-up using a new relevant detail.'],['Mantén la coherencia','Clarify an apparent inconsistency without changing your facts.'],['Responde a una duda','Respond to a recruiter questioning one claim in your example.'],['Maneja una repregunta nueva','Answer an unexpected follow-up directly, acknowledge unknowns and stay relevant.']],
 compare_options:[['Nombra dos opciones','Describe two possible approaches to a familiar work task.'],['Un criterio común','Choose one criterion that matters for comparing them.'],['Beneficio de cada opción','Explain a benefit of each option using that criterion.'],['Reconoce los límites','Explain a limitation or cost of each option.'],['Elige para este caso','Recommend an option for this role-specific situation and justify it.'],['Cambia una condición','Explain whether your recommendation changes when a constraint changes.']],
 defend_position:[['Formula tu postura','State a recommendation about a situation in the target role.'],['Apoya tu recomendación','Give a concrete reason or real example supporting it.'],['Reconoce otra perspectiva','Explain a reasonable concern from another stakeholder.'],['Responde a la objeción','Answer that concern without dismissing it or inventing evidence.'],['Reconoce un límite','Explain what your recommendation does not solve.'],['Decide cuándo reconsiderar','Defend your recommendation and identify evidence that would change your mind.']]
};
const LEGACY={grammar:['experience_story','professional_intro'],vocabulary:['explain_concepts','role_fit'],cohesion:['experience_story','professional_intro'],evidence:['role_fit','experience_story'],concision:['professional_intro','handle_followups'],reasoning:['justify_decisions','compare_options','defend_position'],technical_clarity:['explain_concepts','handle_followups'],listening_details:['handle_followups'],reading_details:['role_fit','compare_options']};
const CRITERIA={
 professional_intro:['Explicar qué haces actualmente en tu trabajo o estudios.','Describir cómo tu trabajo ayuda a otra persona.','Respaldar tu aportación con un ejemplo propio.','Relacionar tu ejemplo con una necesidad del puesto.','Presentar tu perfil usando solo los datos relevantes para el reclutador.','Adaptar tu presentación a otra prioridad del mismo puesto.'],
 role_fit:['Identificar una responsabilidad concreta del puesto.','Explicar por qué te interesa esa responsabilidad.','Relacionar una tarea que hiciste con esa responsabilidad.','Demostrar con un ejemplo cómo puedes aportar al puesto.','Reconocer un reto del puesto y proponer cómo prepararte.','Justificar tu interés en el puesto con motivación y evidencia.'],
 experience_story:['Situar una experiencia real y explicar cuál era tu tarea.','Explicar el problema y a quién afectaba.','Distinguir tu acción de las acciones del equipo.','Explicar qué cambió después de tu acción sin inventar resultados.','Extraer un aprendizaje concreto de la experiencia.','Contar una experiencia nueva con contexto, acción propia y resultado.'],
 explain_concepts:['Explicar para qué sirve un concepto o proceso de tu trabajo.','Mostrar su utilidad con un ejemplo comprensible.','Describir sus pasos principales en un orden útil.','Explicarlo a un reclutador sin términos que no hayas aclarado.','Aclarar una confusión concreta sobre el concepto.','Adaptar la explicación de otro concepto a las necesidades de otra persona.'],
 justify_decisions:['Identificar una decisión propia y su contexto.','Explicar una razón pertinente para esa decisión.','Relacionar una restricción real con la elección.','Explicar una consecuencia observada o esperada de la decisión.','Indicar cómo comprobaste si la decisión funcionó.','Justificar una decisión nueva con razones y restricciones del caso.'],
 handle_followups:['Dar una respuesta base con hechos que permitan una repregunta.','Responder una repregunta aclarando un dato concreto.','Explicar cómo o por qué ocurrió algo con un detalle nuevo.','Aclarar una aparente contradicción sin cambiar los hechos.','Responder a una duda sobre tu ejemplo con evidencia pertinente.','Responder una repregunta inesperada y reconocer lo que no sabes.'],
 compare_options:['Describir dos opciones para una tarea de trabajo.','Elegir un criterio relevante para comparar ambas opciones.','Explicar una ventaja de cada opción usando ese criterio.','Reconocer un coste o límite de cada opción.','Recomendar una opción y justificarla para el caso.','Revisar tu recomendación cuando cambia una condición.'],
 defend_position:['Formular una recomendación pertinente al puesto.','Respaldarla con una razón o un ejemplo real.','Reconocer una preocupación razonable de otra persona.','Responder a esa objeción sin descartarla ni inventar evidencia.','Explicar un límite de tu recomendación.','Defender tu postura e identificar qué evidencia te haría cambiarla.']
};
export function professionalModules(modules){
 const used=new Set();
 return modules.map((m,moduleIndex)=>{
  const candidates=INTERVIEW_COMPETENCIES[m.focus]?[m.focus]:LEGACY[m.focus]||['professional_intro','experience_story','justify_decisions','handle_followups'];
  const focus=[...candidates,...Object.keys(INTERVIEW_COMPETENCIES)].find(k=>!used.has(k));if(!focus)throw Error('Too many interview competencies');used.add(focus);
  const c=INTERVIEW_COMPETENCIES[focus];
  return {...m,...c,focus,moduleIndex,adaptedFrom:m.focus!==focus?m.focus||'legacy':null};
 }).sort((a,b)=>a.rank-b.rank);
}
export function competencySteps(focus,count){
 const tasks=STEPS[focus];
 // Preserve the final transfer task at every level, with a different capability at each step.
 const indices=count===6?[0,1,2,3,4,5]:count===5?[0,1,2,3,5]:count===4?[0,2,3,5]:count===3?[2,3,5]:[3,5];
 return indices.map(i=>({title:tasks[i][0],task:tasks[i][1],criterion:CRITERIA[focus][i]}));
}

// Extend saved four-stage plans without a paid re-evaluation or invented weaknesses.
// Original module indexes stay stable for exercises, attempts and session references.
export function extendRouteModules(assessment){
 const original=assessment.result.modules;
 if(original.length>=MIN_ROUTE_STAGES)return original;
 if(original.length<4)throw Error('La ruta necesita al menos 7 etapas y un diagnóstico completo.');
 const modules=professionalModules(original).sort((a,b)=>a.moduleIndex-b.moduleIndex);
 if(!modules.length)return original;
 const used=new Set(modules.map(m=>m.focus));
 for(const [focus,competency] of Object.entries(INTERVIEW_COMPETENCIES)){
  if(modules.length>=MIN_ROUTE_STAGES)break;if(used.has(focus))continue;
  if(focus==='professional_intro'&&['B2','C1'].includes(assessment.result.level))continue;
  const anchor=modules.find(m=>m.supportFocus===competency.supportFocus)||modules[0];
  modules.push({...competency,focus,moduleIndex:modules.length,orientation:'transfer',
   reason:`Amplía el ejemplo de tu diagnóstico para practicar: ${competency.objective}`,
   evidenceQuote:anchor.evidenceQuote,
   conversation:`${STEPS[focus][0][1]} Use the candidate's own experience and target role: ${String(assessment.profile?.role||'their target role').slice(0,120)}.`,
   extendedFromSavedEvidence:true});used.add(focus);
 }
 return modules;
}
