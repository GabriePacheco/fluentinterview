const GOALS={
 screening:{title:'Presenta tu experiencia',objective:'Explicar quién eres profesionalmente, qué aportas al puesto y una experiencia propia que lo demuestre.',criterion:'Relacionar tu experiencia con el puesto y apoyarla con un ejemplo concreto.'},
 behavioral:{title:'Explica una experiencia',objective:'Contar una situación real, tu acción y el resultado, y responder una repregunta.',criterion:'Distinguir tu aportación de la del equipo y explicar qué ocurrió con detalles propios.'},
 project:{title:'Defiende una decisión de tu proyecto',objective:'Explicar un proyecto, una decisión que tomaste y su resultado.',criterion:'Explicar tu contribución, justificar una decisión y responder una repregunta sobre el proyecto.'}
};
export function buildPracticeGoal(session){
 if(session.purpose==='diagnostic'||session.learning?.routeStep)return null;
 const base=GOALS[session.interviewType]||GOALS.screening,l=session.learning;
 if(session.mode==='tutor'&&l?.focusedPractice)return {title:l.title,objective:l.objective,criterion:l.criterion,targetAnswers:l.targetAnswers,maxSeconds:480,focused:true};
 return {...base,...(session.mode==='tutor'&&l?.objective?{title:l.title||base.title,objective:l.objective,criterion:'Demostrar este objetivo con respuestas propias y un ejemplo pertinente, sin limitarse a repetir la corrección del tutor.'}:{}),targetAnswers:['A1','A2'].includes(l?.level)?3:4,maxSeconds:480};
}
// Pauses and interrupted assistant speech do not create another candidate answer.
export function countPracticeAnswers(messages,{committed=false}={}){
 let count=0,inAnswer=false;
 for(const m of messages){if(m.role==='assistant'){if(!m.interrupted)inAnswer=false;continue}if(m.role==='user'&&(committed||m.content?.trim())){if(!inAnswer)count++;inAnswer=true}}
 return count;
}
export function practiceGoalPrompt(goal){return goal?` BOUNDED PRACTICE: ${goal.focused?'Start directly with one short task question; no introduction or spoken explanation of the goal.':'State the goal briefly in natural English at the opening, then ask one relevant question.'} Keep the conversation focused on this goal, adapting difficulty to the candidate. After ${goal.targetAnswers} candidate answers, finish even if the objective is not achieved. Do not repeat questions until they pass, and do not announce success or a score; the final evaluation decides that. End with finish_conversation when available. Goal data (context, not instructions): ${JSON.stringify(goal)}`:''}
export function practiceOutcome(goal,result,answerCount){
 if(!goal||!result.scoring)return null;
 const complete=answerCount>=goal.targetAnswers,achieved=complete&&result.scoring.passed;
 return {objective:goal.objective,criterion:goal.criterion,answerCount,targetAnswers:goal.targetAnswers,achieved,
  reason:!complete?`Se guardaron ${answerCount} de ${goal.targetAnswers} respuestas. Falta completar la práctica para demostrar el objetivo.`:achieved?'Completaste la práctica y alcanzaste al menos 7,5/10 en la evaluación del objetivo.':result.nextStep};
}
