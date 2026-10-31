import {fail} from './http.mjs';
import {scoreReview} from './review-model.mjs';
const UUID=/^[a-f0-9-]{36}$/i;
const LEVELS={A1:{count:6,answers:3,language:'Use short, concrete questions and simple everyday English; ask for one fact at a time.'},A2:{count:5,answers:3,language:'Use simple linked sentences; ask about a familiar task, an action and a result.'},B1:{count:4,answers:4,language:'Ask for a connected account with reasons and a concrete example.'},B2:{count:3,answers:4,language:'Ask for a developed professional explanation, alternatives and follow-up clarification.'},C1:{count:3,answers:5,language:'Ask for precise, nuanced explanations and defensible trade-offs suited to the target role.'}};
const TASKS=[
 {title:'Una idea clara',task:'Describe one relevant fact about your own work or studies.',criterion:'Responder con una idea propia, pertinente y comprensible.'},
 {title:'Añade un detalle',task:'Explain a familiar task using one specific detail from your experience.',criterion:'Explicar una tarea propia con un detalle concreto.'},
 {title:'Cuenta tu acción',task:'Describe what you personally did in one real situation and what happened.',criterion:'Distinguir la acción propia y explicar qué ocurrió.'},
 {title:'Explica tus razones',task:'Explain a decision and why it made sense in that situation.',criterion:'Conectar una decisión con una razón y un ejemplo pertinente.'},
 {title:'Responde una repregunta',task:'Answer a new follow-up that asks you to clarify or adapt the example.',criterion:'Responder la repregunta sin perder claridad ni contradecir el ejemplo.'},
 {title:'Llévalo a otra situación',task:'Apply the objective to a different interview situation; compare an alternative when appropriate to your level.',criterion:'Usar lo practicado en un ejemplo nuevo, con razones adecuadas a la pregunta.'}
];
const FOCUS={grammar:'Habla de tu experiencia con claridad',vocabulary:'Elige palabras precisas para tu puesto',cohesion:'Ordena tus respuestas',evidence:'Demuestra tu aportación',concision:'Da respuestas concretas',reasoning:'Explica tus decisiones',technical_clarity:'Explica tu trabajo a un reclutador',listening_details:'Aclara lo que te pregunta el reclutador',reading_details:'Conversa sobre una situación de trabajo'};
export function buildConversationRoute(assessment){
 const level=LEVELS[assessment.result.level];if(!level)throw fail('Necesitas un diagnóstico con evidencia suficiente para crear tu ruta.',409);
 let order=0;
 const stages=assessment.result.modules.map((m,index)=>{
  const count=Math.max(2,level.count-(m.orientation==='transfer'?1:0));
  const tasks=assessment.result.level==='A1'?TASKS.slice(0,count):assessment.result.level==='A2'?TASKS.slice(1,1+count):TASKS.slice(6-count);
  return {id:'stage'+index,moduleIndex:index,title:FOCUS[m.focus]||m.title,reason:m.reason,evidence:m.evidenceQuote,focus:m.focus||'evidence',steps:tasks.map((task,i)=>({id:`m${index}s${i}`,order:order++,title:task.title,objective:`${m.objective.slice(0,230)} ${task.criterion}`,criterion:task.criterion,task:task.task,question:m.conversation.slice(0,500),evidence:m.evidenceQuote.slice(0,300),targetAnswers:level.answers,attempts:[],passedAt:null}))};
 });
 return {revision:1,assessmentId:assessment.id,level:assessment.result.level,profile:assessment.profile,createdAt:Date.now(),stages};
}
const allSteps=route=>route.stages.flatMap(stage=>stage.steps);
export const routeAttemptKey=(uid,id)=>`route-attempt:${encodeURIComponent(uid)}:${id}`;
const scoreReasons=scoring=>scoring.criteria.filter(c=>c.points<9).sort((a,b)=>a.points-b.points).slice(0,2).map(c=>`${c.label}: ${c.reason}`).join(' ');
export class ConversationRouteService{
 constructor(storage,{assessments,sessions}){Object.assign(this,{storage,assessments,sessions})}
 async ensure(uid,id){
  const assessment=id?await this.assessments.get(uid,id):(await this.assessments.state(uid)).current;
  if(!assessment)return null;if(assessment.status!=='completed'||assessment.source!=='openai')throw fail('Completa un diagnóstico con IA para crear tu ruta.',409);
  const key=this.assessments.key(uid,assessment.id);
  return this.storage.transaction(async tx=>{const saved=await tx.get(key);if(!saved)throw fail('Diagnóstico no encontrado.',404);let changed=false;if(!saved.conversationRoute){saved.conversationRoute=buildConversationRoute(saved);changed=true}
   for(const step of allSteps(saved.conversationRoute)){const ids=[];for(const a of step.attempts){if(typeof a==='string')ids.push(a);else{await tx.put(routeAttemptKey(uid,a.id),a);ids.push(a.id);changed=true}}step.attempts=ids}
   if(changed)await tx.put(key,saved);return saved.conversationRoute});
 }
 async reconcile(uid,id){
  const key=this.assessments.key(uid,id);
  return this.storage.transaction(async tx=>{
   const assessment=await tx.get(key);if(!assessment?.conversationRoute)throw fail('Ruta no encontrada.',404);const route=assessment.conversationRoute;let changed=false;
   for(const step of allSteps(route))for(const attemptId of step.attempts){
    const attempt=await tx.get(routeAttemptKey(uid,attemptId));if(!attempt)continue;
    const s=await tx.get(this.sessions.key(uid,attempt.id)),review=await tx.get(`feedback:${encodeURIComponent(uid)}:session:${attempt.id}`);
    if(!s||!review||review.status==='pending')continue;
    if(attempt.reviewedAt&&(attempt.reviewAttempt||1)===(review.attempt||1))continue;
    if(s.learning?.routeId!==id||s.learning?.stepId!==step.id||s.status!=='completed')continue;
    const count=s.messages.filter(m=>m.role==='user'&&m.content.trim().split(/\s+/).length>=2).length;
    const enough=s.transport==='realtime'&&count>=step.targetAnswers;
    let scoring=null;if(review.status==='completed'&&review.source==='openai'&&s.source==='openai'&&review.result?.ratings)scoring=scoreReview(review.result.ratings);
    attempt.score=scoring?.score??null;attempt.passed=!!scoring?.passed&&enough;
    attempt.reason=!enough?`Necesitamos ${step.targetAnswers} respuestas en esta conversación. Se guardaron ${count}; completa una nueva práctica para demostrar este objetivo.`:scoring?attempt.passed?'Objetivo alcanzado con al menos 9/10.':scoreReasons(scoring)||review.result.nextStep:review.error||'No hay una evaluación válida para aprobar este paso.';
    attempt.reviewedAt=Date.now();attempt.reviewAttempt=review.attempt||1;attempt.nextStep=review.result?.nextStep||'';
    if(attempt.passed&&!step.passedAt){step.passedAt=attempt.reviewedAt;step.passedSessionId=attempt.id;step.passedScore=attempt.score}
    await tx.put(routeAttemptKey(uid,attempt.id),attempt);changed=true;
   }
   if(changed)await tx.put(key,assessment);return route;
  });
 }
 async state(uid,id){
  const initial=await this.ensure(uid,id);if(!initial)return {route:null};const route=await this.reconcile(uid,initial.assessmentId),steps=allSteps(route),next=steps.find(s=>!s.passedAt),completed=steps.filter(s=>s.passedAt).length;
  const current=(await this.storage.get(this.assessments.index(uid)))?.current;
  const stages=[];
  for(const stage of route.stages){const visible=[];for(const s of stage.steps){const attempts=[];for(const id of s.attempts){const stored=await this.storage.get(routeAttemptKey(uid,id));if(!stored)continue;const {context,...a}=stored,record=await this.storage.get(this.sessions.key(uid,a.id));attempts.push({...a,sessionExists:!!record,sessionStatus:record?.status||null})}visible.push({...s,attempts,status:s.passedAt?'passed':s.id===next?.id?'current':'locked',latest:attempts.at(-1)||null})}stages.push({...stage,steps:visible,completed:visible.filter(s=>s.passedAt).length})}
  return {route:{...route,stages,current:current===route.assessmentId,total:steps.length,completed,percent:Math.floor(completed/steps.length*100),nextStepId:next?.id||null,finished:!next}};
 }
 async context(uid,input){
  if(!input.routeId||!input.stepId)throw fail('Paso no válido.');
  const assessment=await this.assessments.get(uid,input.routeId),step=assessment.conversationRoute&&allSteps(assessment.conversationRoute).find(s=>s.id===input.stepId),attempt=step?.attempts.includes(input.id)?await this.storage.get(routeAttemptKey(uid,input.id)):null;
  if(!attempt)throw fail('Abre la conversación desde tu ruta.',409);return attempt.context;
 }
 async captureReview(uid,id){
  const s=await this.storage.get(this.sessions.key(uid,id));if(!s?.learning?.routeStep)return;
  const a=await this.storage.get(this.assessments.key(uid,s.learning.routeId));if(a?.conversationRoute){await this.ensure(uid,a.id);await this.reconcile(uid,a.id)}
 }
 async start(uid,input,verified){
  if(!verified)throw fail('Confirma tu correo para practicar con IA.',403);if(!UUID.test(input.id||'')||!UUID.test(input.routeId||''))throw fail('Conversación no válida.');
  const {route}=await this.state(uid,input.routeId);if(!route?.current)throw fail('Esta es una ruta histórica. Continúa desde tu ruta actual.',409);
  const step=allSteps(route).find(s=>s.id===input.stepId);if(!step||step.status==='locked')throw fail('Aprueba el paso actual con 9/10 antes de avanzar.',409);
  // Existing request IDs reopen the same session. They never allocate another attempt.
  const existing=await this.storage.get(this.sessions.key(uid,input.id));if(existing){if(existing.learning?.routeId!==route.assessmentId||existing.learning?.stepId!==step.id)throw fail('Ese identificador pertenece a otra conversación.',409);return {session:await this.sessions.get(uid,input.id)}}
  for(const a of step.attempts){if(a.id===input.id)continue;const s=await this.storage.get(this.sessions.key(uid,a.id));if(s?.status==='active'&&s.transport==='realtime')throw fail('Termina la conversación abierta antes de iniciar otro intento.',409)}
  const key=this.assessments.key(uid,route.assessmentId);
  await this.storage.transaction(async tx=>{
   const a=await tx.get(key);if(!a)throw fail('Ruta no encontrada.',404);const stored=allSteps(a.conversationRoute).find(s=>s.id===step.id);
   if(stored.attempts.includes(input.id))return;
   const round=stored.attempts.length+1,last=stored.attempts.length?await tx.get(routeAttemptKey(uid,stored.attempts.at(-1))):null;
   const variations=['una experiencia propia distinta','una situación con otra persona del equipo','una explicación para un reclutador que desconoce tu trabajo','una situación con una restricción o necesidad diferente'];
   const previous=last?await tx.get(this.sessions.key(uid,last.id)):null;
   const context={routeStep:true,routeId:route.assessmentId,stepId:step.id,assessmentId:route.assessmentId,moduleIndex:route.stages.find(s=>s.steps.some(x=>x.id===step.id)).moduleIndex,level:route.level,title:step.title,objective:step.objective,criterion:step.criterion,conversation:step.question,task:step.task,evidence:step.evidence,targetAnswers:step.targetAnswers,language:LEVELS[route.level].language,attempt:round,scenario:variations[(round-1)%variations.length],retryFocus:last?.reason?.slice(0,300)||'',avoidQuestions:previous?.messages.filter(m=>m.role==='assistant').slice(-2).map(m=>m.content.slice(0,120))||[]};
   await tx.put(routeAttemptKey(uid,input.id),{id:input.id,number:round,startedAt:Date.now(),score:null,passed:false,context});stored.attempts.push(input.id);await tx.put(key,a);
  });
  return {session:await this.sessions.create(uid,{id:input.id,source:'openai',mode:'tutor',purpose:'practice',profile:route.profile,routeId:route.assessmentId,stepId:step.id},verified)};
 }
}
