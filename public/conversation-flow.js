// Conversation modes and one-step, idempotent final feedback.
const suppressedConversationReviews=new Set(),automaticReviewAttempts=new Set();
let reviewNavigation=0,reviewPollTimer=null;
school.conversationMode='tutor';
function chosenConversationMode(){return voice.session?.mode||(current()==='entrevista'?school.interview.mode:school.conversationMode)||'tutor'}
const sessionOptionsBeforeModes=schoolSessionOptions;
schoolSessionOptions=function(){return {...sessionOptionsBeforeModes(),mode:chosenConversationMode(),purpose:chosenConversationMode()==='interview'?'interview':'practice'}};
const roomBeforeModes=voiceRoom;
voiceRoom=function(){const mode=chosenConversationMode(),locked=voice.busy||voice.session?.status==='active';const selector=`<section class="conversation-mode-picker" aria-label="Modo de conversación"><button type="button" data-conversation-mode="tutor" class="card conversation-mode ${mode==='tutor'?'selected':''}" aria-pressed="${mode==='tutor'}" ${locked?'disabled':''}><strong>Practicar con tutor</strong><span>Recibe una corrección breve cuando la necesites y sigue hablando.</span></button><button type="button" data-conversation-mode="interview" class="card conversation-mode ${mode==='interview'?'selected':''}" aria-pressed="${mode==='interview'}" ${locked?'disabled':''}><strong>Simular entrevista</strong><span>Conversa con un reclutador. Recibe toda la retroalimentación al terminar.</span></button></section>`;return roomBeforeModes().replace('<div class="voice-layout">',selector+'<div class="voice-layout">')};
views.aula=voiceRoom;views.entrevista=voiceRoom;
const paintBeforePracticeGoal=paintVoice;
paintVoice=function(){
 paintBeforePracticeGoal();const goal=voice.session?.practiceGoal;if(!goal)return;
 const context=document.querySelector('.voice-context');
 if(context){const title=context.querySelector('h2');if(title)title.textContent=goal.title;const objective=context.querySelector('#voice-learning-objective');if(objective){objective.hidden=false;objective.textContent='Objetivo: '+goal.objective}const note=context.querySelector('.mini-info');if(note)note.textContent=`${goal.targetAnswers} respuestas · hasta ${Math.ceil(goal.maxSeconds/60)} minutos, según tu plan. Después, despedida y evaluación. Aprobar requiere 7,5/10; no necesitas aprobar para terminar.`}
 const count=document.querySelector('#voice-count');if(count)count.textContent=`${voice.index} / ${goal.targetAnswers} respuestas`;
};
document.addEventListener('click',event=>{const button=event.target.closest('[data-conversation-mode]');if(!button||voice.busy||voice.session?.status==='active')return;if(voice.session){stopVoiceSession();voice.session=null;voice.transcript=[];voice.index=0;voice.currentPrompt='';voice.run++}school.conversationMode=button.dataset.conversationMode;school.interview.mode=button.dataset.conversationMode;render()});
const syncBeforeReview=syncSession;
syncSession=function(session){
 const completed=voice.session?.id===session.id&&voice.session?.status==='active'&&session.status==='completed';
 syncBeforeReview(session);
 if(completed&&!suppressedConversationReviews.has(session.id)&&(session.purpose==='diagnostic'||session.messages.some(m=>m.role==='user'))){
  const owner=window.FluentSession?.user?.uid;
  queueMicrotask(()=>{if(owner===window.FluentSession?.user?.uid&&voice.session?.id===session.id&&['aula','entrevista','diagnostico'].includes(current()))openReview('session',session.id,{automatic:true})});
 }
};
function reviewIsCurrent(token,owner){return token===reviewNavigation&&owner===window.FluentSession?.user?.uid}
function pollReview(token,owner,until=Date.now()+150000){
 clearTimeout(reviewPollTimer);
 if(!reviewIsCurrent(token,owner)||current()!=='resultado'||Date.now()>=until)return;
 reviewPollTimer=setTimeout(async()=>{
  if(!reviewIsCurrent(token,owner)||current()!=='resultado')return;
  const {kind,id}=school.reviewTarget;
  try{const data=await apiCall(`/api/feedback/${kind}/${id}`,undefined,'GET');if(!reviewIsCurrent(token,owner))return;school.review=data.review;if(data.review?.status!=='pending'){school.error='';schoolRender();return}schoolRender()}catch{/* Recovery reads never resubmit a paid evaluation. */}
  pollReview(token,owner,until);
 },1500);
}
openReview=async function(kind,id,{automatic=kind==='session'}={}){
 const token=++reviewNavigation,owner=window.FluentSession?.user?.uid;clearTimeout(reviewPollTimer);
 school.reviewTarget={kind,id};school.review=null;school.reviewSession=null;school.error='';school.notice='';school.busy=true;go('resultado');
 try{
  if(kind==='session'){const data=await apiCall(`/api/sessions/${id}`,undefined,'GET');if(!reviewIsCurrent(token,owner))return;school.reviewSession=data.session;}
  if(school.reviewSession?.purpose==='diagnostic'&&typeof prepareOralResult==='function'){await prepareOralResult(id,token,owner);if(!reviewIsCurrent(token,owner))return;}
  const data=await apiCall(`/api/feedback/${kind}/${id}`,undefined,'GET');if(!reviewIsCurrent(token,owner))return;school.review=data.review;
 }catch(error){if(reviewIsCurrent(token,owner))school.error=error.message;}
 finally{if(reviewIsCurrent(token,owner)){school.busy=false;schoolRender()}}
 if(!reviewIsCurrent(token,owner)||school.error)return;
 const key=owner+':'+kind+':'+id;
 if(!school.review&&automatic&&!automaticReviewAttempts.has(key)){automaticReviewAttempts.add(key);await requestReview()}
 else if(school.review?.status==='pending')pollReview(token,owner);
};
requestReview=async function({retry=false}={}){
 if(school.busy||!school.reviewTarget)return;
 const token=reviewNavigation,owner=window.FluentSession?.user?.uid,{kind,id}=school.reviewTarget;
 school.busy=true;school.error='';schoolRender();
 try{const data=await apiCall(`/api/feedback/${kind}/${id}`,retry?{retryAttempt:school.review?.attempt||1}:{});if(!reviewIsCurrent(token,owner))return;school.review=data.review;if(data.review?.status==='pending')pollReview(token,owner)}
 catch(error){if(reviewIsCurrent(token,owner)){school.error=error.message;pollReview(token,owner)}}
 finally{if(reviewIsCurrent(token,owner)){school.busy=false;schoolRender()}}
};
const legacyReviewView=reviewView;
function evaluationLoading(title='Estamos preparando tu evaluación.',detail='Revisamos tus respuestas para mostrarte fortalezas, mejoras y el siguiente paso.'){
 return `<section class="card evaluation-loading" role="status" aria-live="polite" aria-busy="true"><div class="evaluation-loading-heading"><span class="evaluation-spinner" aria-hidden="true"></span><div><h2>${escapeHTML(title)}</h2><p>${escapeHTML(detail)}</p></div></div><div class="evaluation-skeleton" aria-hidden="true"><div class="evaluation-placeholder wide"></div><div class="evaluation-placeholder"></div><div class="evaluation-placeholder short"></div><div class="evaluation-placeholder-panel"></div></div><p class="mini-info">Tu conversación está guardada. El resultado aparecerá aquí automáticamente.</p></section>`;
}
reviewView=function(){
 const r=school.review,result=r?.result,s=school.reviewSession;
 if(school.busy&&!result)return `${heading('TU RETROALIMENTACIÓN','Estamos revisando tu conversación.','')}${schoolAlert()}${evaluationLoading()}`;
 if(r?.status==='failed')return `${heading('TU RETROALIMENTACIÓN','Tu conversación está guardada.','Podemos volver a evaluarla sin que repitas tus respuestas.')}${schoolAlert()}<section class="card"><p>${escapeHTML(r.error||'No se pudo completar la evaluación.')}</p>${button('review-retry','Evaluar mis respuestas guardadas','btn','',school.busy?'disabled':'')}<p role="status">${school.busy?'La IA está preparando tu evaluación…':'Se usará tu conversación original.'}</p><details><summary>Detalles para soporte</summary><p>Código: ${escapeHTML(r.code||'legacy_unknown')} · Referencia: ${escapeHTML(r.id||school.reviewTarget?.id||'')}</p></details></section>`;
 if(r?.status==='pending')return `${heading('TU RETROALIMENTACIÓN','Estamos revisando tu conversación.','Tu resultado aparecerá aquí automáticamente.')}${schoolAlert()}${evaluationLoading()}`;
 if(!result)return legacyReviewView();
 const strengths=result.strengths?.length?result.strengths:result.observations.filter(o=>o.finding==='demonstrated').map(o=>({comment:o.comment,quote:o.quote}));
 const scoring=result.scoring,corrections=result.corrections||[],outcome=result.practiceOutcome,passed=scoring?.passed&&(outcome?.achieved??true);
 const number=n=>Number(n).toLocaleString('es-EC',{minimumFractionDigits:1,maximumFractionDigits:2});
 return `${heading('TU RETROALIMENTACIÓN','Una práctica más. Un siguiente paso claro.','Evaluación de esta práctica, basada en las respuestas guardadas.',link('progreso','Ver mi progreso','btn secondary'))}${schoolAlert()}
 <div class="stack"><section class="card review-strengths"><span class="tag">${r.source==='mock'?'EJEMPLO · SIN CALIFICACIÓN':'LO QUE YA HICISTE BIEN'}</span><h2>Tus fortalezas</h2>${strengths.length?strengths.map(x=>`<div class="study-observation"><p><strong>${escapeHTML(x.comment)}</strong></p><blockquote lang="en">${escapeHTML(x.quote)}</blockquote></div>`).join(''):'<p>Necesitamos más evidencia para destacar una fortaleza concreta. Una respuesta más desarrollada nos ayudará.</p>'}<p>${escapeHTML(result.summary)}</p></section>
 ${outcome?`<section class="card practice-outcome"><span class="eyebrow">EL OBJETIVO DE ESTA PRÁCTICA</span><h2>${outcome.achieved?'✓ Objetivo alcanzado':'Objetivo pendiente'}</h2><p>${escapeHTML(outcome.objective)}</p><p>${escapeHTML(outcome.reason)}</p><p class="mini-info">${outcome.answerCount} de ${outcome.targetAnswers} respuestas · mínimo 7,5/10</p></section>`:''}
 ${result.assessmentTarget&&!outcome?`<section class="card"><span class="eyebrow">EL OBJETIVO EVALUADO</span><h2>${escapeHTML(result.assessmentTarget.title)}</h2><p>${escapeHTML(result.assessmentTarget.objective)}</p><p><strong>Para completar este paso:</strong> ${escapeHTML(result.assessmentTarget.criterion)}</p></section>`:''}
 ${scoring?`<section class="card"><div class="row between wrap"><div><span class="eyebrow">TU CALIFICACIÓN</span><h2 class="review-score">${number(scoring.score)} <small>/ 10</small></h2></div><span class="tag">${passed?'Objetivo alcanzado':'Todavía en práctica'}</span></div><p>${passed?'Alcanzaste la nota mínima de 7,5. Practica ahora en una situación nueva.':'Se aprueba con 7,5/10. Revisa qué falta reforzar en los criterios de abajo.'}</p><div class="grid cols-2">${scoring.criteria.map(c=>`<div class="feedback note"><strong>${escapeHTML(c.label)} · ${number(c.points)}/10</strong><p>${escapeHTML(c.reason)}</p></div>`).join('')}</div><details><summary>Cómo se calcula</summary><p>Los cuatro criterios pesan lo mismo. El servidor calcula el promedio y aprueba desde 7,5, sin redondear hacia arriba para aprobar. La nota describe esta práctica; no predice una contratación.</p></details></section>`:'<section class="card"><p>Esta revisión no incluye una nota. Las conversaciones nuevas con IA reciben una calificación al terminar.</p></section>'}
 ${corrections.length?`<section class="card"><h2>Así puedes mejorarlo</h2>${corrections.map(c=>`<div class="study-observation"><span class="tag">${c.kind==='error'?'Corrección':c.kind==='uncertain_transcription'?'Posible confusión al transcribir':'Una alternativa más clara'}</span><p lang="en">${c.kind==='error'?`<del>${escapeHTML(c.original)}</del>`:escapeHTML(c.original)}</p><p class="feedback note" lang="en"><strong>${escapeHTML(c.replacement)}</strong></p><p>${escapeHTML(c.reason)}</p></div>`).join('')}</section>`:''}
 <section class="card"><h2>Para tu siguiente conversación</h2>${result.observations.filter(o=>o.finding!=='demonstrated').map(o=>`<div class="study-observation"><p>${escapeHTML(o.comment)}</p><p>${escapeHTML(o.suggestion)}</p></div>`).join('')}<p><strong>${escapeHTML(result.nextStep)}</strong></p><div class="row wrap">${link('aula','Volver a conversar','btn','mic')}${link('ejercicios','Ejercicios de apoyo','btn secondary')}</div>${result.sampled?'<p class="mini-info">Se revisaron seis respuestas distribuidas entre el inicio y el final de la conversación.</p>':''}</section>
 ${s?`<details class="card"><summary>Tu conversación guardada</summary>${s.messages.map(m=>`<p><strong>${m.role==='user'?'Tú':s.mode==='interview'?'Entrevistador':'Tutor'}:</strong> ${escapeHTML(m.content)}</p>`).join('')}</details>`:''}</div>`;
};
views.resultado=reviewView;
document.addEventListener('click',event=>{if(event.target.closest('[data-action="review-retry"]')&&school.review?.status==='failed')requestReview({retry:true})});
window.addEventListener('hashchange',()=>{if(current()!=='resultado')clearTimeout(reviewPollTimer)});
window.addEventListener('fluent-auth-cleared',()=>{reviewNavigation++;clearTimeout(reviewPollTimer);automaticReviewAttempts.clear();suppressedConversationReviews.clear();school.conversationMode='tutor'});
