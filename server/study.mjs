import {fail} from './http.mjs';
import {validatePayload} from './ai.mjs';
import {buildActivity,foundationModules,moduleFocus,publicActivity,scoreActivity} from './study-content.mjs';
const UUID=/^[a-f0-9-]{36}$/i;
export class StudyService{
 constructor(storage,{assessments,reviewFor}){this.storage=storage;this.assessments=assessments;this.reviewFor=reviewFor}
 key(uid,id){if(!UUID.test(id||''))throw fail('Actividad no válida.');return `study:${encodeURIComponent(uid)}:${id}`}
 index(uid){return `study-index:${encodeURIComponent(uid)}`}
 async course(uid,id){
  const assessment=id&&id!=='foundation'?await this.assessments.get(uid,id):id==='foundation'?null:(await this.assessments.state(uid)).current;
  if(assessment&&assessment.status!=='completed')throw fail('Esta ruta todavía no tiene una evaluación válida.',409);
  return assessment?{id:assessment.id,version:assessment.version,level:assessment.result.level,profile:assessment.profile,modules:assessment.result.modules.map((m,i)=>({...m,focus:moduleFocus(m,i)})),personalized:true}:{id:'foundation',version:null,level:null,profile:{},modules:foundationModules(),personalized:false};
 }
 async raw(uid,id){const record=await this.storage.get(this.key(uid,id));if(!record)throw fail('Actividad no encontrada.',404);return record}
 async context(uid,id){const s=await this.raw(uid,id);return {assessmentId:s.courseId==='foundation'?null:s.courseId,moduleIndex:s.moduleIndex,level:s.level,title:s.content.title,objective:s.content.objective,conversation:s.content.question}}
 async get(uid,id){return publicActivity(await this.raw(uid,id))}
 async records(uid){const ids=await this.storage.get(this.index(uid))||[];const rows=[];for(const id of ids){const s=await this.storage.get(this.key(uid,id));if(s)rows.push(s)}return rows}
 async state(uid){
  const course=await this.course(uid),records=await this.records(uid);
  const modules=[];
  for(const [i,module] of course.modules.entries()){
   const attempts=records.filter(x=>x.courseId===course.id&&x.moduleIndex===i),completed=attempts.filter(x=>x.status==='completed').sort((a,b)=>b.completedAt-a.completedAt),latest=completed[0],draft=attempts.find(x=>x.status==='draft');
   let review=null;for(const attempt of completed){const candidate=await this.reviewFor?.(uid,attempt.id);if(candidate?.status==='completed'&&candidate.source==='openai'){review=candidate;break}}
   const openPractice=review?.status==='completed'&&review.source==='openai'&&review.result.observations.some(o=>o.finding==='practice');
   modules.push({...module,index:i,completed:!!latest,attempts:completed.length,draftId:draft?.id||null,latestId:latest?.id||null,needsReview:!!latest&&(latest.result.needsReview||openPractice),openReviewed:review?.status==='completed'&&review.source==='openai'});
  }
  const next=modules.find(m=>m.needsReview)||modules.find(m=>!m.completed)||modules[0];
  const completed=records.filter(x=>x.courseId===course.id&&x.status==='completed').sort((a,b)=>b.completedAt-a.completedAt);
  return {course:{...course,modules},next:{index:next.index,title:next.title,draftId:next.draftId,reason:next.needsReview?'Tus últimas tareas o la revisión de tu respuesta indican que conviene reforzar este objetivo.':!next.completed?'Es el siguiente objetivo con actividades pendientes.':'Completaste las actividades de esta etapa. Practica otra situación para reunir evidencia nueva.'},
   completedModules:modules.filter(m=>m.completed).length,planRevision:completed.length,
   adaptations:completed.slice(0,10).map(x=>({at:x.completedAt,title:x.content.title,reason:x.result.needsReview?'Se recomienda repaso por errores o comprensión auditiva pendiente.':'Tareas terminadas: puedes continuar. Esto no acredita dominio ni cambia tu nivel.'})),
   history:records.map(({id,courseId,moduleIndex,status,createdAt,completedAt,content,result,round})=>({id,courseId,moduleIndex,status,createdAt,completedAt,title:content.title,score:result?`${result.correct}/${result.total}`:null,needsReview:result?.needsReview||false,round}))};
 }
 async create(uid,input){
  const key=this.key(uid,input.id),course=await this.course(uid,input.courseId);if(!course.personalized)course.profile=validatePayload('conversation',{profile:input.profile,messages:[]}).profile;
  if(!Number.isInteger(input.moduleIndex)||input.moduleIndex<0||input.moduleIndex>=course.modules.length)throw fail('Objetivo no válido.');
  return this.storage.transaction(async tx=>{
   const existing=await tx.get(key);if(existing){if(existing.courseId!==course.id||existing.moduleIndex!==input.moduleIndex)throw fail('El identificador corresponde a otra actividad.',409);return publicActivity(existing)}
   const ids=await tx.get(this.index(uid))||[];if(ids.length>=80)throw fail('Tienes 80 actividades guardadas. Elimina una antigua para continuar.',409);
   let round=0;for(const id of ids){const s=await tx.get(this.key(uid,id));if(s?.courseId===course.id&&s.moduleIndex===input.moduleIndex){if(s.status==='draft')return publicActivity(s);round++}}
   const record={id:input.id,courseId:course.id,moduleIndex:input.moduleIndex,round,profile:course.profile,level:course.level,personalized:course.personalized,content:buildActivity(course.modules[input.moduleIndex],course.level,round),answers:{},text:'',audio:{played:false,revealed:false},revision:0,status:'draft',createdAt:Date.now()};
   await tx.put(key,record);await tx.put(this.index(uid),[record.id,...ids]);return publicActivity(record);
  });
 }
 async save(uid,id,input){return this.storage.transaction(async tx=>{
  const key=this.key(uid,id),s=await tx.get(key);if(!s)throw fail('Actividad no encontrada.',404);
  if(s.status!=='draft'||input.expectedRevision!==s.revision)throw fail('La actividad cambió. Recupérala antes de editar.',409);
  if(typeof input.text!=='string'||input.text.length>1200)throw fail('Tu respuesta admite hasta 1200 caracteres.');
  if(!input.answers||typeof input.answers!=='object'||Array.isArray(input.answers)||Object.keys(input.answers).some(k=>!s.content.items.some(q=>q.id===k)))throw fail('Respuestas no válidas.');
  const answers={};for(const item of s.content.items){const value=input.answers[item.id];if(value!==undefined){if(!Number.isInteger(value)||value<0||value>=item.options.length)throw fail('Opción no válida.');answers[item.id]=value}}
  s.answers=answers;s.text=input.text.trim();s.audio={played:input.audio?.played===true,revealed:s.audio.revealed||input.audio?.revealed===true};s.revision++;s.updatedAt=Date.now();await tx.put(key,s);return publicActivity(s);
 })}
 async submit(uid,id){return this.storage.transaction(async tx=>{
  const key=this.key(uid,id),s=await tx.get(key);if(!s)throw fail('Actividad no encontrada.',404);if(s.status==='completed')return publicActivity(s);
  if(s.content.items.some(q=>s.answers[q.id]===undefined))throw fail('Responde las dos tareas antes de terminar.');
  if(s.text.split(/\s+/).filter(Boolean).length<10)throw fail('Añade una respuesta propia de al menos diez palabras para practicar el objetivo.');
  s.result=scoreActivity(s);s.status='completed';s.completedAt=Date.now();await tx.put(key,s);return publicActivity(s);
 })}
 async remove(uid,id){return this.storage.transaction(async tx=>{const key=this.key(uid,id);if(!await tx.get(key))throw fail('Actividad no encontrada.',404);const reviewKey=`feedback:${encodeURIComponent(uid)}:activity:${id}`,review=await tx.get(reviewKey);if(review?.status==='pending'&&Date.now()-review.startedAt<90000)throw fail('Espera a que termine la revisión antes de eliminar.',409);await tx.delete(key);await tx.delete(reviewKey);await tx.put(this.index(uid),(await tx.get(this.index(uid))||[]).filter(x=>x!==id));return {deleted:true}})}
 async evidence(uid,id){const s=await this.raw(uid,id);if(s.status!=='completed')throw fail('Termina la actividad antes de pedir una revisión.',409);return {source:null,profile:s.profile,context:s.content.objective,answers:[{id:'answer1',question:s.content.question.slice(0,350),text:s.text.slice(0,1000)}]}}
}
