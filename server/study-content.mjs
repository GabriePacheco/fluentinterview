import {LEARNING_FOCUS} from './diagnostic-model.mjs';
export const STUDY_REVISION='2026-10-22-v1';
const row=(question,options,correct,explanation)=>({question,options,correct,explanation});
const bank={
 grammar:{explanation:'Elige el tiempo según el momento: pasado terminado (I solved), experiencia hasta ahora (I have worked) o situación hipotética (I would). Comprueba sujeto y verbo.',items:[
 row('Last month, our team ___ a new guide.',['created','creates','creating'],0,'Last month indica pasado terminado: created.'),
 row('I ___ here since 2023 and I still work here.',['worked','have worked','am work'],1,'Since conecta el comienzo con el presente: have worked.'),
 row('If I had more information, I ___ a clearer recommendation.',['will made','would make','made'],1,'La situación hipotética usa would + verbo base.'),
 row('She ___ the issue yesterday.',['has fix','fix','fixed'],2,'Yesterday requiere pasado: fixed.')
 ]},
 vocabulary:{explanation:'Usa verbos concretos para describir tu contribución: checked, compared, resolved. Un resultado explica qué cambió. No añadas cifras que no puedas respaldar.',items:[
 row('Which phrase describes checking that information is correct?',['validate the data','schedule a meeting','hire a colleague'],0,'Validate the data significa comprobar los datos.'),
 row('Which sentence states a result?',['I like my team.','We reduced the number of errors.','I started in June.'],1,'Reducir errores describe un cambio observable.'),
 row('A deadline is…',['the date by which work must be finished','a job title','a customer complaint'],0,'Deadline es la fecha límite de una tarea.'),
 row('Which verb best describes finding the cause of a problem?',['attend','decorate','investigate'],2,'Investigate describe examinar causas y evidencia.')
 ]},
 cohesion:{explanation:'Ordena una experiencia: contexto → acción propia → resultado. Usa because para explicar una razón, however para un contraste y therefore para una consecuencia.',items:[
 row('Which order makes a project story easier to follow?',['Result → unrelated opinion → action','Situation → action → result','Action → unrelated detail → question'],1,'El contexto permite entender tu acción y su resultado.'),
 row('The data was incomplete. ___, we requested another file.',['However','For example','Therefore'],2,'Therefore introduce una consecuencia: faltaban datos, por eso pedimos otro archivo.'),
 row('The approach was fast. ___, it missed important details.',['However','Because','Therefore'],0,'However introduce un contraste con la ventaja anterior.'),
 row('Which sentence explains a reason?',['First, I checked the report.','I checked the report because two totals differed.','Finally, I sent the report.'],1,'Because conecta la acción con su motivo.')
 ]},
 evidence:{explanation:'Apoya una habilidad con una experiencia real. Distingue lo que hizo el equipo de tu propia acción. Un resultado puede ser cualitativo; nunca inventes cifras.',items:[
 row('Which answer supports “I solve problems” with evidence?',['I am always perfect.','I solve all problems.','I compared the records, found the missing date and corrected the report.'],2,'La respuesta describe una acción concreta y lo que cambió.'),
 row('You do not know the exact percentage saved. What should you say?',['Invent a realistic percentage.','Describe the improvement you actually observed.','Claim the company doubled its profit.'],1,'Un resultado observado sin porcentaje es mejor evidencia que una cifra inventada.'),
 row('Which sentence distinguishes your contribution?',['We did many things.','I tested the revised guide while my colleague collected comments.','Everyone helped.'],1,'Identifica tu acción y la diferencia de la de tu colega.'),
 row('Which detail helps a recruiter understand a claim?',['A specific example of what you did','An unrelated hobby','A larger invented number'],0,'Un ejemplo pertinente permite comprender y preguntar por tu contribución.')
 ]},
 concision:{explanation:'Resume conservando acción y resultado. Quita repeticiones, no hechos esenciales. Prepara una versión de dos frases y otra con más contexto.',items:[
 row('Choose the shortest version that keeps both facts: “I reviewed the file and I found an error in the file.”',['I found an error while reviewing the file.','The file existed.','I reviewed something.'],0,'Conserva la revisión y el hallazgo sin repetir file.'),
 row('What should remain in a short project answer?',['Every meeting date','The relevant action and result','Only adjectives about yourself'],1,'La acción y el resultado son el centro de una respuesta breve.'),
 row('“The guide was useful. The guide was useful for new staff.” Choose the accurate summary.',['Everyone mastered all tasks.','The guide replaced training.','The guide helped new staff.'],2,'Mantiene el beneficio sin añadir logros no mencionados.'),
 row('When shortening an answer, what should you avoid?',['Removing a repeated phrase','Keeping the main action','Changing the facts to sound impressive'],2,'Resumir no autoriza a cambiar hechos.')
 ]},
 reasoning:{explanation:'Explica tu decisión, una razón y una alternativa. Un trade-off es un beneficio que exige aceptar un coste. Evita presentar una opción como perfecta para todos los casos.',items:[
 row('Which sentence explains a trade-off?',['The solution was perfect in every way.','Automation saved time but required maintenance.','We discussed automation.'],1,'Presenta un beneficio y su coste.'),
 row('Which answer compares alternatives?',['I prefer option A.','Option A exists.','A is faster; B costs less, so the choice depends on our deadline.'],2,'Compara dos criterios y explica cuándo importa cada uno.'),
 row('What makes a recommendation easier to assess?',['A reason and a relevant example','Repeating the recommendation','Saying everyone agrees'],0,'La razón y el ejemplo permiten examinar la propuesta.'),
 row('Which phrase acknowledges a limitation?',['There are no possible risks.','This may work better for small teams.','This is always the best choice.'],1,'Limita el alcance en lugar de afirmar que sirve siempre.')
 ]},
 technical_clarity:{explanation:'Empieza por el problema que resuelve la idea. Define los términos necesarios con palabras habituales y añade un ejemplo. Adapta el detalle a quien te escucha.',items:[
 row('Explain “backup” to a non-technical colleague.',['An auxiliary redundant state mechanism','A copy we can restore if the original is lost','A faster internet connection'],1,'Explica su función con lenguaje habitual.'),
 row('What should you do when using an unfamiliar technical term?',['Repeat it louder','Assume everyone understands','Define it and give a relevant example'],2,'Definición y ejemplo ayudan a conectar el término con su uso.'),
 row('Explain “cache” simply.',['A place to keep frequently used information for faster access','A security guarantee','A list of employee names'],0,'Describe su función sin prometer seguridad ni cambiar el concepto.'),
 row('Which question checks whether your explanation helped?',['You understood everything, right?','Which part would you like me to illustrate with an example?','Why do you not know this?'],1,'Invita a pedir una aclaración concreta.')
 ]},
 reading_details:{explanation:'Busca en el texto la frase que respalda tu respuesta. Distingue lo que el texto dice de lo que parece posible.',passages:[
 'Rosa tested a new support guide with two colleagues. They understood the first section, but asked for an example in the last section. Rosa added the example before sharing the guide with the team.',
 'Leo compared two delivery options. The express option was faster but more expensive. Because the customer did not need the package until next week, Leo recommended the standard service.'
 ],items:[
 row('What change did Rosa make?',['She removed the first section.','She added an example.','She hired two colleagues.'],1,'El texto dice que añadió el ejemplo solicitado.'),
 row('When did Rosa make the change?',['Before sharing the guide with the team','After sending it to every customer','Before testing it'],0,'Probó, añadió el ejemplo y después compartió la guía.'),
 row('Why did Leo recommend standard delivery?',['It was faster.','The package was already late.','The customer did not need the faster option.'],2,'La fecha requerida permitía elegir el servicio estándar.'),
 row('What was the disadvantage of express delivery?',['It cost more.','It arrived next month.','It required a new package.'],0,'El texto indica que express era más caro.')
 ]},
 listening_details:{explanation:'Escucha un mensaje breve y busca fechas, cambios y acciones solicitadas. Si lees la transcripción, la tarea cuenta como lectura asistida, no como evidencia de escucha.',passages:[
 'Hi, this is Nora. Our project meeting is now on Thursday at ten in the morning. Please send your questions on Wednesday. You do not need to prepare slides.',
 'Hello, this is Luis from the hiring team. Your interview will last twenty minutes. Please have one example of teamwork ready. We will send the video link tomorrow.'
 ],items:[
 row('When is the meeting now?',['Wednesday at ten','Thursday at ten','Thursday at two'],1,'El mensaje indica jueves a las diez.'),
 row('What should you send before the meeting?',['Your slides','Your résumé','Your questions'],2,'Pide enviar preguntas el miércoles, no diapositivas.'),
 row('What should the candidate prepare?',['An example of teamwork','A list of customers','A slide presentation'],0,'El mensaje solicita un ejemplo de trabajo en equipo.'),
 row('When will the link be sent?',['Today','Tomorrow','Next month'],1,'El enlace se enviará mañana.')
 ]}
};
export function moduleFocus(module,index=0){return Object.keys(bank).includes(module.focus)?module.focus:Object.keys(LEARNING_FOCUS).find(k=>LEARNING_FOCUS[k].title===module.title)||['grammar','vocabulary','cohesion','evidence'][index%4]}
export function foundationModules(){return ['grammar','vocabulary','cohesion','evidence'].map(focus=>({focus,...LEARNING_FOCUS[focus],conversation:'Describe a real task you completed. What did you do and what changed?'}))}
export function buildActivity(module,level,round=0){
 const focus=moduleFocus(module),content=bank[focus],variant=round%2,items=content.items.slice(variant*2,variant*2+2).map((item,i)=>({id:`q${i+1}`,...item}));
 return {revision:STUDY_REVISION,focus,title:module.title,objective:module.objective,explanation:content.explanation,
  scaffold:['A1','A2',null].includes(level)?'Empieza con frases breves: I worked on… / I checked… / The result was…':'Explica el contexto, tu decisión y su resultado. Añade una alternativa o un límite cuando sea pertinente.',
  passage:content.passages?.[variant]||'',audio:focus==='listening_details',items,
  question:module.conversation,exercise:module.exercise,criterion:module.masteryCheck};
}
export function publicActivity(record){const {items,...rest}=record.content;return {...record,content:{...rest,items:items.map(({correct,explanation,...item})=>item)}}}
export function scoreActivity(record){
 const eligible=!record.content.audio||record.audio.played&&!record.audio.revealed;
 const details=record.content.items.map(item=>({id:item.id,question:item.question,answer:record.answers[item.id],expected:item.correct,correct:record.answers[item.id]===item.correct,explanation:item.explanation}));
 return {correct:details.filter(x=>x.correct).length,total:details.length,details,listeningEvaluated:record.content.audio&&eligible,needsReview:details.some(x=>!x.correct)||!eligible,
  basis:record.content.audio&&!eligible?'Lectura asistida: comprensión auditiva pendiente.':'Corrección de dos tareas concretas; no equivale a dominar la habilidad.',openAnswerEvaluated:false};
}
