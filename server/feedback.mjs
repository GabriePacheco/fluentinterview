import {fail} from './http.mjs';
import {assessmentFailure} from './assessment-errors.mjs';
import {EVALUATION_PENDING_MS,retryEvaluation} from './evaluation-policy.mjs';
import {practiceOutcome} from './practice-goals.mjs';
const UUID=/^[a-f0-9-]{36}$/i;
export class FeedbackService{
 constructor(storage,{evidence,run,budget,source='mock'}){this.storage=storage;this.evidence=evidence;this.run=run;this.budget=budget;this.source=source;this.inflight=new Map()}
 key(uid,kind,id){if(!['activity','session'].includes(kind)||!UUID.test(id||''))throw fail('Revisión no válida.');return `feedback:${encodeURIComponent(uid)}:${kind}:${id}`}
 async get(uid,kind,id){await this.evidence(uid,kind,id);const key=this.key(uid,kind,id);return this.storage.transaction(async tx=>{const record=await tx.get(key)||null;if(record?.status==='pending'&&Date.now()-record.startedAt>EVALUATION_PENDING_MS){record.status='failed';record.error='No se pudo confirmar la revisión. No se repetirá la llamada automáticamente.';record.code='interrupted';await tx.put(key,record)}return record})}
 async evaluate(uid,kind,id,verified,options={}){const key=this.key(uid,kind,id);if(this.inflight.has(key))return this.inflight.get(key);const task=this.perform(uid,kind,id,verified,options);this.inflight.set(key,task);try{return await task}finally{this.inflight.delete(key)}}
 async perform(uid,kind,id,verified,options={}){
  const evidence=await this.evidence(uid,kind,id),key=this.key(uid,kind,id),source=evidence.source||this.source;
  if(source==='openai'&&!verified)throw fail('Confirma tu correo antes de pedir una revisión con IA.',403);
  const previous=await this.get(uid,kind,id);if(previous&&!retryEvaluation(previous,options))return {review:previous,budget:await this.budget(),replayed:true};
  const record={kind,id,source,status:'pending',startedAt:Date.now(),attempt:previous?(previous.attempt||1)+1:1};
  const cached=await this.storage.transaction(async tx=>{const old=await tx.get(key);if(old&&!retryEvaluation(old,options))return old;await tx.put(key,record);return null});if(cached)return {review:cached,budget:await this.budget(),replayed:true};
  try{
   const enough=evidence.answers.reduce((count,a)=>count+a.text.split(/\s+/).filter(Boolean).length,0)>=10;
   if(!enough){record.status='insufficient';record.error='Añade respuestas más desarrolladas en una nueva práctica; no hay evidencia suficiente para esta revisión.'}
   else{const {result}=await this.run(source,{...evidence,kind},{uid});record.result=result;if(source!=='mock'&&evidence.practiceGoal)record.result.practiceOutcome=practiceOutcome(evidence.practiceGoal,result,evidence.answerCount);record.status=source==='mock'?'mock':'completed'}
  }catch(error){const failure=assessmentFailure(error);record.status='failed';record.code=failure.code;record.error=failure.message}
  record.finishedAt=Date.now();
  await this.storage.transaction(async tx=>{const current=await tx.get(key);if(current?.status==='pending')await tx.put(key,record)});
  return {review:await this.get(uid,kind,id),budget:await this.budget(),replayed:false};
 }
}
