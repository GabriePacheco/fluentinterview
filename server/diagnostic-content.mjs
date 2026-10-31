// Original pilot activities, versioned for reproducible scoring. Answers stay on the server.
export const REVISION='2026-10-21-v1';
export const PROMPTS=[
 {id:'introduction',title:'Tu presentación',prompt:'Tell me about yourself. What do you do, or what would you like to do?'},
 {id:'challenge',title:'Una experiencia',prompt:'Describe a challenge at work, in your studies or in daily life. What did you do, and what happened?'},
 {id:'opinion',title:'Tu punto de vista',prompt:'Is it better to work alone or with a team? Explain your opinion, give an example and mention a possible disadvantage.'}
];
export const READING='Maya works in customer support. Her team used to answer the same questions many times. She created a short guide and asked two colleagues to test it. After a month, new employees needed less help, but some customers still found the guide confusing. Maya decided to collect their comments before updating it.';
export const AUDIO='Hello, this is Daniel from the recruitment team. Your interview has moved from Tuesday morning to Wednesday at three in the afternoon. Please join the video call ten minutes early. You do not need to prepare a presentation, but please bring one example of a problem you solved with a team.';
export const ITEMS=[
 {id:'r1',skill:'reading',question:'Why did Maya create the guide?',options:['To answer repeated questions more efficiently','To replace her colleagues','To prepare for an interview'],correct:0,explanation:'El equipo respondía las mismas preguntas muchas veces.'},
 {id:'r2',skill:'reading',question:'What will Maya do before changing the guide?',options:['Hire more employees','Ask customers for comments','Stop using the guide'],correct:1,explanation:'Decidió recoger comentarios antes de actualizarlo.'},
 {id:'g1',skill:'grammar',question:'Yesterday, I ___ a problem with my team.',options:['solve','have solve','solved'],correct:2,explanation:'Yesterday sitúa la acción en el pasado: solved.'},
 {id:'g2',skill:'grammar',question:'If we had checked the data earlier, we ___ the mistake.',options:['would have noticed','will notice','notice'],correct:0,explanation:'La condición pasada hipotética se combina con would have + participio.'},
 {id:'v1',skill:'vocabulary',question:'Which phrase describes a result of your work?',options:['I joined on Monday','We reduced waiting time by 20%','I enjoy working here'],correct:1,explanation:'Reduced waiting time by 20% expresa un resultado medible.'},
 {id:'v2',skill:'vocabulary',question:'In a project, a “trade-off” is…',options:['an employment contract','a list of daily tasks','a balance where gaining one benefit involves giving up another'],correct:2,explanation:'Trade-off expresa una decisión entre beneficios y costes.'},
 {id:'l1',skill:'listening',question:'When is the interview now?',options:['Tuesday morning','Wednesday at 3 p.m.','Wednesday at 10 a.m.'],correct:1,explanation:'El mensaje cambia la entrevista al miércoles a las tres de la tarde.'},
 {id:'l2',skill:'listening',question:'What should the candidate prepare?',options:['A presentation','A list of customers','An example of solving a problem with a team'],correct:2,explanation:'Se pide un ejemplo de resolución de un problema en equipo.'}
];
export function catalog(){return {revision:REVISION,prompts:PROMPTS,reading:READING,audio:AUDIO,items:ITEMS.map(({correct,explanation,...item})=>item)}}
export function scoreTasks(input){
 const audioEligible=input.audio.played===true&&input.audio.revealed!==true;
 const details=ITEMS.map(item=>({id:item.id,skill:item.skill,answer:input.answers[item.id]??null,correct:input.answers[item.id]===item.correct,expected:item.correct,explanation:item.explanation,eligible:item.skill!=='listening'||audioEligible}));
 const skills=Object.fromEntries(['reading','grammar','vocabulary','listening'].map(skill=>{const rows=details.filter(x=>x.skill===skill&&x.eligible);return [skill,{correct:rows.filter(x=>x.correct).length,answered:rows.filter(x=>x.answer!==null).length,total:rows.length,status:rows.length?'task_sample':'not_evaluated'}]}));
 return {skills,details,audioBasis:audioEligible?'Reproducción declarada por el navegador; muestra de dos preguntas, no nivel de comprensión global.':'Audio no completado o texto revelado: comprensión auditiva pendiente.'};
}
