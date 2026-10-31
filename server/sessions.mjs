import {fail} from './http.mjs';
import {validatePayload} from './ai.mjs';
import {newOralDiagnostic} from './oral-diagnostic.mjs';
import {farewellText,isTerminalFarewell} from './conversation-ending.mjs';
import {buildPracticeGoal,countPracticeAnswers} from './practice-goals.mjs';
const UUID=/^[a-f0-9-]{36}$/i;
export const MAX_TURNS=6;
export function sessionSummary(s){
 const answers=s.messages.filter(m=>m.role==='user');
 return {label:s.source==='mock'?'Práctica simulada':'Práctica con IA',learnerTurns:answers.length,
  focus:[...new Set(s.feedback.map(x=>x.focus))].slice(-4),quotes:answers.slice(-2).map(x=>x.content.slice(0,400)),
  suggestion:s.feedback.at(-1)?.feedback||'Añade una experiencia concreta y explica el resultado.',
  level:null,pronunciationEvaluated:false};
}
function publicSession(s){const {requests,pending,blocked,...safe}=s;const hidden=s.mode==='interview'&&s.status!=='completed';return {...safe,feedback:hidden?[]:s.feedback,turnCount:s.feedback.length,pending:!!pending,blocked:!!blocked,summary:hidden?{label:'Entrevista en curso',learnerTurns:s.messages.filter(m=>m.role==='user').length,focus:[],quotes:[],suggestion:'Revisarás las observaciones al terminar.',level:null,pronunciationEvaluated:false}:sessionSummary(s),maxTurns:s.practiceGoal?.targetAnswers||MAX_TURNS}}
export class SessionService{
 constructor(storage,{run,source='mock',budget,learning}){this.storage=storage;this.run=run;this.source=source;this.budget=budget;this.learning=learning;this.inflight=new Map()}
 prefix(uid){return `sessions:${encodeURIComponent(uid)}:`}
 async evidence(uid,id){
  const s=await this.get(uid,id);if(s.status!=='completed')throw fail('Finaliza la conversación antes de solicitar su revisión.',409);
  const all=[];let question='';for(const m of s.messages){if(m.role==='assistant')question=m.interrupted?'[Pregunta interrumpida; evalúa solo la respuesta disponible.]':m.content;else if(m.content.trim())all.push({question:question.slice(0,250),text:m.content.slice(0,800)})}
  // A representative bounded sample includes the beginning and the final answer,
  // instead of silently ignoring everything beyond the sixth turn.
  const chosen=all.length<=6?all:Array.from({length:6},(_,i)=>all[Math.round(i*(all.length-1)/5)]);
  const context=s.practiceGoal?`Objetivo: ${s.practiceGoal.objective} Criterio: ${s.practiceGoal.criterion} Evalúa este objetivo con evidencia propia; repetir al tutor no demuestra dominio.`:s.learning?.routeStep?`Paso de entrevista, expresión orientativa ${s.learning.level}. Objetivo: ${s.learning.objective} Criterio: ${s.learning.criterion}. Evalúa lo que la persona explicó por sí misma; copiar una corrección del tutor no demuestra transferencia.`:s.purpose==='interview'||s.mode==='interview'?'Entrevista profesional · '+(s.interviewType||'screening'):s.learning?.objective||'Práctica de entrevista profesional';
  return {source:s.source,profile:s.profile,context,practiceGoal:s.practiceGoal||null,answerCount:countPracticeAnswers(s.messages),answers:chosen.map((a,i)=>({...a,id:'answer'+(i+1)})),transcribed:s.transport==='realtime',sampled:all.length>6};
 }

 key(uid,id){if(!UUID.test(id||''))throw fail('Sesión no válida.');return this.prefix(uid)+id}
 async create(uid,input,canUseReal){
  const id=input.id;if(!UUID.test(id||''))throw fail('Identificador no válido.');
  const source=input.source==='mock'?'mock':this.source;
  if(source==='openai'&&!canUseReal)throw fail('Confirma tu correo y actualiza la sesión para usar la IA.',403);
  const {profile}=validatePayload('conversation',{profile:input.profile,messages:[]});
  const diagnostic=input.purpose==='diagnostic';
  if(diagnostic&&source!=='openai')throw fail('El diagnóstico conversacional requiere IA.',400);
  const learning=diagnostic?null:await this.learning?.(uid,input)||null;
  const key=this.key(uid,id),indexKey=`session-index:${encodeURIComponent(uid)}`;
  return this.storage.transaction(async tx=>{
   const existing=await tx.get(key);if(existing)return publicSession(existing);
   const ids=await tx.get(indexKey)||[];
   const s={id,source,profile,learning,mode:input.mode==='interview'?'interview':'tutor',purpose:input.purpose==='interview'?'interview':'practice',interviewType:['screening','behavioral','project'].includes(input.interviewType)?input.interviewType:'screening',status:'active',createdAt:Date.now(),updatedAt:Date.now(),messages:[],feedback:[],requests:{},pending:null,blocked:false};
   if(diagnostic){s.purpose='diagnostic';s.mode='interview';s.diagnostic=newOralDiagnostic()}
   s.practiceGoal=buildPracticeGoal(s);
   await tx.put(key,s);await tx.put(indexKey,[id,...ids]);return publicSession(s);
  });
 }
 async get(uid,id){const key=this.key(uid,id);let s=await this.storage.get(key);if(!s)throw fail('Sesión no encontrada.',404);if(s.pending&&Date.now()-s.pending.startedAt>40000){s=await this.storage.transaction(async tx=>{const current=await tx.get(key);if(current?.pending&&Date.now()-current.pending.startedAt>40000){const pending=current.pending;current.requests[pending.requestId]={...pending,error:'No se pudo confirmar la respuesta anterior. Para evitar un cobro duplicado, finaliza esta sesión e inicia otra.',status:409};if(pending.text)current.messages.push({role:'user',content:pending.text});current.pending=null;current.blocked=true;await tx.put(key,current)}return current})}return publicSession(s)}
 async list(uid){const ids=await this.storage.get(`session-index:${encodeURIComponent(uid)}`)||[];const sessions=[];for(const id of ids){const s=await this.storage.get(this.key(uid,id));if(s){const {messages,feedback,...item}=publicSession(s);sessions.push(item)}}return sessions}
 async remove(uid,id){const key=this.key(uid,id),indexKey=`session-index:${encodeURIComponent(uid)}`;return this.storage.transaction(async tx=>{const s=await tx.get(key);if(s?.pending&&Date.now()-s.pending.startedAt<40000)throw fail('Espera a que termine la respuesta antes de eliminar esta sesión.',409);const reviewKey='feedback:'+encodeURIComponent(uid)+':session:'+id,review=await tx.get(reviewKey);if(review?.status==='pending'&&Date.now()-review.startedAt<90000)throw fail('Espera a que termine la revisión antes de eliminar.',409);await tx.delete(reviewKey);await tx.delete(key);await tx.put(indexKey,(await tx.get(indexKey)||[]).filter(x=>x!==id));return {deleted:true}})}
 async end(uid,id){const key=this.key(uid,id);return this.storage.transaction(async tx=>{const s=await tx.get(key);if(!s)throw fail('Sesión no encontrada.',404);if(s.pending)throw fail('Espera a que termine el turno antes de finalizar.',409);if(s.status!=='completed'&&s.transport!=='realtime'&&!isTerminalFarewell(s.messages.at(-1)?.content))s.messages.push({role:'assistant',content:farewellText(s)});s.status='completed';s.updatedAt=Date.now();await tx.put(key,s);return publicSession(s)})}
 async turn(uid,id,input,canUseReal){
  const requestId=input.requestId;if(!UUID.test(requestId||''))throw fail('Identificador de turno no válido.');
  const text=typeof input.text==='string'?input.text.trim():'';
  if(text.length>1800)throw fail('Responde en menos de 1800 caracteres.');
  if(!Number.isInteger(input.expectedTurn)||input.expectedTurn<0||input.expectedTurn>MAX_TURNS)throw fail('Turno no válido.');
  const key=this.key(uid,id),operationKey=key+':'+requestId;
  const fingerprint=JSON.stringify({text,expectedTurn:input.expectedTurn});
  if(this.inflight.has(operationKey)){const active=this.inflight.get(operationKey);if(active.fingerprint!==fingerprint)throw fail('El identificador corresponde a otra respuesta.',409);return active.task}
  const task=this.perform(uid,key,{requestId,text,expectedTurn:input.expectedTurn},canUseReal);
  this.inflight.set(operationKey,{task,fingerprint});try{return await task}finally{this.inflight.delete(operationKey)}
 }
 async perform(uid,key,input,canUseReal){
  const cached=await this.storage.transaction(async tx=>{
   const s=await tx.get(key);if(!s)throw fail('Sesión no encontrada.',404);
   if(s.source==='openai'&&!canUseReal)throw fail('Confirma tu correo antes de continuar.',403);
   if(s.transport==='realtime')throw fail('Esta conversación usa voz en tiempo real. Finalízala antes de iniciar otra práctica por escrito.',409);
   if(s.purpose==='diagnostic')throw fail('Inicia este diagnóstico con voz o utiliza el diagnóstico escrito.',409);
   const prior=s.requests[input.requestId];
   if(prior){if(prior.text!==input.text||prior.expectedTurn!==input.expectedTurn)throw fail('Este identificador ya corresponde a otra respuesta.',409);return {cached:prior}}
   if(s.pending)throw fail('Hay una respuesta en proceso. Recupera la sesión antes de volver a enviar.',409);
   if(s.status!=='active'||s.blocked)throw fail('Esta sesión ya terminó. Inicia una nueva para seguir practicando.',409);
   if(input.expectedTurn!==s.feedback.length)throw fail('Tu sesión cambió. Recupera la conversación antes de enviar.',409);
   if((s.messages.length===0&&input.text)||(s.messages.length>0&&!input.text))throw fail('Falta una respuesta válida para este turno.');
   if(s.messages.filter(m=>m.role==='user').length>=MAX_TURNS)throw fail('La práctica alcanzó su límite de turnos.',409);
   s.pending={...input,startedAt:Date.now()};await tx.put(key,s);return {session:s};
  });
  if(cached.cached){if(cached.cached.error)throw fail(cached.cached.error,cached.cached.status);return {session:await this.get(uid,cached.cached.sessionId),budget:await this.budget(),replayed:true}}
  const s=cached.session,messages=[...s.messages];if(input.text)messages.push({role:'user',content:input.text});
  const startedAt=Date.now();
  try{
   // Save the final answer and farewell without buying another question.
   const result=messages.filter(m=>m.role==='user').length>=(s.practiceGoal?.targetAnswers||MAX_TURNS)?null:await this.run(s.source,{profile:s.profile,mode:s.mode,interviewType:s.interviewType,messages,learning:s.practiceGoal?{...s.learning,practiceGoal:s.practiceGoal}:s.learning},{uid});
   const final=await this.storage.transaction(async tx=>{
    const current=await tx.get(key);if(!current||current.pending?.requestId!==input.requestId)throw fail('No se pudo guardar el turno.',409);
    current.messages=messages;if(result){current.messages.push({role:'assistant',content:result.result.reply});current.feedback.push({focus:result.result.focus,feedback:result.result.feedback,latencyMs:Date.now()-startedAt})}
    else{current.messages.push({role:'assistant',content:farewellText(current)});current.status='completed'}
    if(result&&isTerminalFarewell(result.result.reply))current.status='completed';
    current.updatedAt=Date.now();current.pending=null;current.requests[input.requestId]={text:input.text,expectedTurn:input.expectedTurn,sessionId:current.id};await tx.put(key,current);return publicSession(current);
   });
   return {session:final,budget:await this.budget(),replayed:false};
  }catch(error){
   const status=error.status||502,message=error.status?error.message:'La IA no pudo completar este turno. Tu conversación sigue guardada; no se reintentará el cobro.';
   await this.storage.transaction(async tx=>{const current=await tx.get(key);if(current?.pending?.requestId===input.requestId){current.pending=null;current.blocked=true;current.messages=messages;current.requests[input.requestId]={text:input.text,expectedTurn:input.expectedTurn,error:message,status};current.updatedAt=Date.now();await tx.put(key,current)}});
   throw fail(message,status);
  }
 }
}
