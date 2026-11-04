import {fail} from './http.mjs';import {validatePayload} from './ai.mjs';
import {REVISION,PROMPTS,ITEMS,catalog,scoreTasks} from './diagnostic-content.mjs';
import {insufficientResult,validateDiagnosis} from './diagnostic-model.mjs';
import {assessmentFailure} from './assessment-errors.mjs';
import {oralSamples} from './oral-diagnostic.mjs';
import {routeAttemptKey} from './conversation-route.mjs';
import {EVALUATION_PENDING_MS,retryEvaluation} from './evaluation-policy.mjs';
import {initialRouteKey} from './diagnostic-access.mjs';
const UUID=/^[a-f0-9-]{36}$/i;
function cleanDraft(input){
 if(input.catalogRevision!==REVISION)throw fail('El diagnóstico cambió. Recarga la página antes de continuar.',409);
 const profile=validatePayload('conversation',{profile:input.profile,messages:[]}).profile;
 if(!Array.isArray(input.samples)||input.samples.length!==3)throw fail('Incluye las tres secciones de expresión.');
 const samples=PROMPTS.map(p=>{const s=input.samples.find(x=>x?.id===p.id);if(!s||typeof s.text!=='string'||s.text.length>1200||!['text','dictated'].includes(s.mode))throw fail('Respuesta de expresión no válida.');return {id:p.id,text:s.text.trim(),mode:s.mode}});
 if(!input.answers||typeof input.answers!=='object'||Array.isArray(input.answers)||Object.keys(input.answers).some(k=>!ITEMS.some(i=>i.id===k)))throw fail('Respuestas de ejercicios no válidas.');
 const answers={};for(const item of ITEMS){const value=input.answers[item.id];if(value!==undefined&&value!==null){if(!Number.isInteger(value)||value<0||value>=item.options.length)throw fail('Opción no válida.');answers[item.id]=value}}
 const audio={played:input.audio?.played===true,revealed:input.audio?.revealed===true};return {profile,samples,answers,audio,catalogRevision:REVISION};
}
export function weeklyPlan(result,profile){
 if(!result.modules.length)return [];
 const minutes=[10,20,30].includes(parseInt(profile.minutes))?parseInt(profile.minutes):20;
 return Array.from({length:7},(_,i)=>{const moduleIndex=i%result.modules.length,m=result.modules[moduleIndex];return {day:i+1,minutes,moduleIndex,title:m.title,activities:[{minutes:Math.floor(minutes*.6),task:m.conversation},{minutes:minutes-Math.floor(minutes*.6),task:m.exercise}]}});
}
export class AssessmentService{
 constructor(storage,{source='mock',run,budget}){this.storage=storage;this.source=source;this.run=run;this.budget=budget;this.inflight=new Map()}
 key(uid,id){if(!UUID.test(id||''))throw fail('Diagnóstico no válido.');return `assessment:${encodeURIComponent(uid)}:${id}`}
 index(uid){return `assessment-index:${encodeURIComponent(uid)}`}
 async context(uid,input={}){const index=await this.storage.get(this.index(uid));const id=input.assessmentId||index?.current;if(!id)return null;const s=await this.get(uid,id);if(s.status!=='completed')return null;const i=Number.isInteger(input.moduleIndex)&&input.moduleIndex>=0&&input.moduleIndex<s.result.modules.length?input.moduleIndex:0;const m=s.result.modules[i];return {assessmentId:id,moduleIndex:i,level:s.result.level,title:m.title,objective:m.objective,conversation:m.conversation}}
 async get(uid,id){const key=this.key(uid,id);return this.storage.transaction(async tx=>{const s=await tx.get(key);if(!s)throw fail('Diagnóstico no encontrado.',404);if(s.status==='pending'&&Date.now()-s.startedAt>EVALUATION_PENDING_MS){s.status='failed';s.failure={code:'interrupted',at:Date.now()};s.error='La evaluación se interrumpió antes de confirmar un resultado.';await tx.put(key,s);const index=await tx.get(this.index(uid));if(index?.pending===id){index.pending=null;await tx.put(this.index(uid),index)}}return s})}
 async state(uid){let index=await this.storage.get(this.index(uid))||{ids:[],current:null,pending:null};if(index.pending)await this.get(uid,index.pending);index=await this.storage.get(this.index(uid))||index;const history=[];for(const id of index.ids){const s=await this.storage.get(this.key(uid,id));if(s)history.push({id,status:s.status,source:s.source,version:s.version,createdAt:s.createdAt,level:s.result?.level||null})}return {catalog:catalog(),history,current:index.current?await this.get(uid,index.current):null,pending:index.pending}}
 async save(uid,input){
 const data=cleanDraft(input),key=this.key(uid,input.id);if(!Number.isInteger(input.expectedRevision)||input.expectedRevision<0)throw fail('Versión de borrador no válida.');
 return this.storage.transaction(async tx=>{const index=await tx.get(this.index(uid))||{ids:[],current:null,pending:null,sequence:0};const old=await tx.get(key);
  if(old&&(old.status!=='draft'||old.revision!==input.expectedRevision))throw fail('El diagnóstico cambió en otra pantalla. Recupéralo antes de editar.',409);
  if(!old&&input.expectedRevision!==0)throw fail('No existe ese borrador.',409);
  const s={...data,id:input.id,source:old?.source||(input.source==='mock'?'mock':this.source),status:'draft',revision:(old?.revision||0)+1,createdAt:old?.createdAt||Date.now(),updatedAt:Date.now()};
  await tx.put(key,s);if(!old){index.ids.unshift(s.id);await tx.put(this.index(uid),index)}return s;
 })}
 async fromSession(uid,id,verified,options={}){
  const session=await this.sessionFor(uid,id);
  if(session.purpose!=='diagnostic'||session.transport!=='realtime'||session.status!=='completed')throw fail('Termina el diagnóstico oral antes de ver el resultado.',409);
  if(session.diagnostic?.transcriptionIncomplete)throw fail('Falta una parte de tus respuestas. No podemos asignar un nivel con esa transcripción incompleta.',409);
  if(session.source==='openai'&&!verified)throw fail('Confirma tu correo antes de evaluar con IA.',403);
  const key=this.key(uid,id);
  await this.storage.transaction(async tx=>{
   const old=await tx.get(key);if(old){if(old.sessionId!==id)throw fail('Este identificador ya pertenece a otro diagnóstico.',409);return}
   const index=await tx.get(this.index(uid))||{ids:[],current:null,pending:null,sequence:0};
   const s={id,sessionId:id,format:'oral-v1',source:session.source,status:'draft',revision:1,createdAt:Date.now(),updatedAt:Date.now(),profile:session.profile,samples:oralSamples(session),answers:{},audio:{played:false,revealed:false},catalogRevision:REVISION,diagnostic:session.diagnostic};
   await tx.put(key,s);index.ids.unshift(id);await tx.put(this.index(uid),index);
  });
  return this.evaluate(uid,id,verified,options);
 }
 async evaluate(uid,id,verified,options={}){const key=this.key(uid,id);if(this.inflight.has(key))return this.inflight.get(key);const task=this.perform(uid,id,verified,options);this.inflight.set(key,task);try{return await task}finally{this.inflight.delete(key)}}
 async perform(uid,id,verified,options={}){
 const key=this.key(uid,id);await this.get(uid,id);
 const prepared=await this.storage.transaction(async tx=>{const s=await tx.get(key),index=await tx.get(this.index(uid));
  if(s.source==='openai'&&!verified)throw fail('Confirma tu correo antes de evaluar con IA.',403);
  if(s.status!=='draft'&&!retryEvaluation(s,options))return {cached:s};
  if(index.pending)throw fail('Hay otro diagnóstico en evaluación. Recupera su resultado antes de continuar.',409);
  s.attempt=(s.attempt||(s.status==='failed'?1:0))+1;delete s.error;delete s.failure;
  s.status='pending';s.startedAt=Date.now();s.scores=scoreTasks(s);s.previousId=index.current;index.pending=id;await tx.put(key,s);await tx.put(this.index(uid),index);
  const previous=index.current?await tx.get(this.key(uid,index.current)):null;return {s,previous:previous?{level:previous.result.level,priorities:previous.result.priorities.map(p=>p.slice(0,150)).slice(0,4),modules:previous.result.modules.map(m=>m.title.slice(0,100))}:null};
 });
 if(prepared.cached)return {assessment:prepared.cached,budget:await this.budget(),replayed:true};
 const {s,previous}=prepared;const words=s.samples.map(x=>x.text.split(/\s+/).filter(Boolean).length);const enough=s.format==='oral-v1'?(s.diagnostic?.steps.filter(x=>x.stage>0&&x.outcome!=='unclear').length>=3&&words.reduce((a,b)=>a+b,0)>=20):words.filter(n=>n>=10).length>=2&&words.reduce((a,b)=>a+b,0)>=40;
 try{
  if(s.format==='oral-v1')s.scores={skills:{},details:[],audioBasis:'Conversación adaptativa. No se aplicaron ejercicios escritos ni una prueba auditiva independiente.'};
  const oral=s.format==='oral-v1'?{steps:s.diagnostic.steps.map(x=>({stage:x.stage,outcome:x.outcome,reason:x.reason})),endReason:s.diagnostic.endReason}:undefined;
  const result=enough?(await this.run(s.source,{profile:s.profile,samples:s.samples,scores:{skills:s.scores.skills,audioBasis:s.scores.audioBasis},previous,oral},{uid,sessionId:s.sessionId||id})).result:insufficientResult();
  if(!enough&&s.format==='oral-v1')result.summary='Aún necesitamos más respuestas para estimar tu punto de partida. En otra conversación te pediremos describir tu trabajo y una experiencia sencilla. Tu ruta anterior se conserva.';
  if(s.source==='openai')validateDiagnosis(result,s.samples);
  const assessment=await this.storage.transaction(async tx=>{const current=await tx.get(key),index=await tx.get(this.index(uid));if(current?.status!=='pending'||index.pending!==id)throw fail('La evaluación ya no está activa.',409);
   current.result=result;current.status=!enough||result.level==='insufficient_evidence'&&s.source==='openai'?'insufficient':s.source==='mock'?'mock':'completed';current.week=weeklyPlan(result,s.profile);current.updatedAt=Date.now();current.experimental=true;current.pronunciationEvaluated=false;current.expressionBasis='Texto o transcripción revisada, no fluidez oral';index.pending=null;
   if(current.status==='completed'){index.sequence++;current.version=index.sequence;index.current=id;if(!await tx.get(initialRouteKey(uid)))await tx.put(initialRouteKey(uid),{assessmentId:id,completedAt:current.updatedAt})}else current.version=null;
   if(s.format==='oral-v1'){current.scores=s.scores;current.expressionBasis='Contenido de la conversación transcrita; nivel orientativo, sin medir pronunciación.'}
   await tx.put(key,current);await tx.put(this.index(uid),index);return current;
  });return {assessment,budget:await this.budget(),replayed:false};
 }catch(error){
  const failure=assessmentFailure(error);
  const assessment=await this.storage.transaction(async tx=>{const current=await tx.get(key),index=await tx.get(this.index(uid));if(current?.status==='pending'){current.status='failed';current.error=failure.message;current.failure={code:failure.code,at:Date.now()};current.updatedAt=Date.now();await tx.put(key,current)}if(index.pending===id){index.pending=null;await tx.put(this.index(uid),index)}return current});return {assessment,budget:await this.budget(),replayed:false};
 }
 }
 async remove(uid,id){const key=this.key(uid,id);await this.get(uid,id);return this.storage.transaction(async tx=>{const s=await tx.get(key),index=await tx.get(this.index(uid));if(s.status==='pending')throw fail('Espera a que termine la evaluación.',409);for(const stage of s.conversationRoute?.stages||[])for(const step of stage.steps)for(const a of step.attempts)await tx.delete(routeAttemptKey(uid,typeof a==='string'?a:a.id));await tx.delete(key);index.ids=index.ids.filter(x=>x!==id);if(index.current===id){index.current=null;for(const other of index.ids){if((await tx.get(this.key(uid,other)))?.status==='completed'){index.current=other;break}}}await tx.put(this.index(uid),index);return {deleted:true}})}
}
