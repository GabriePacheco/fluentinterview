// Reuse the tested voice room and saved feedback, with an oral diagnostic entry.
const oralDiagnostic={active:false,result:null,error:'',timer:null,attempts:new Set()};
const writtenDiagnostic=newDiagnostic,writtenDiagnosticView=diagnosticView;
newDiagnostic=function(source){
 if(source==='mock')return writtenDiagnostic(source);
 stopDiagnosticAudio();stopVoiceSession();voice.session=null;voice.run++;voice.busy=false;voice.transcript=[];voice.index=0;voice.currentPrompt='';voice.error='';
 learning.draft=null;learning.dirty=false;learning.selection=null;school.voiceActivity=null;oralDiagnostic.active=true;go('diagnostico');
};
const optionsBeforeDiagnostic=schoolSessionOptions;
schoolSessionOptions=function(){return current()==='diagnostico'&&oralDiagnostic.active?{purpose:'diagnostic',mode:'interview',profile:profileForAI()}:optionsBeforeDiagnostic()};
diagnosticView=function(){
 if(learning.draft)return writtenDiagnosticView().replace(/<button\b[^>]*data-action="learn-dictate"[^>]*>[\s\S]*?<\/button>/g,'').replace('Responde en inglés con tus propias palabras. Puedes hablar, revisar la transcripción o escribir. No guardamos grabaciones; el servicio de voz del navegador puede procesar audio.','Responde por escrito en inglés con tus propias palabras. Para conversar con voz, vuelve al diagnóstico oral.');
 if(oralDiagnostic.active){
  const room=roomBeforeModes(); // Same voice controls, without the practice mode selector.
  return `${heading('TU PUNTO DE PARTIDA','Una entrevista laboral que se adapta a ti.','Un primer encuentro con un reclutador: tu presentación, el puesto que buscas y tus experiencias. Las preguntas se adaptan a tus respuestas.')}${room.slice(room.indexOf('<div class="voice-layout">'))}`;
 }
 return `${heading('TU PUNTO DE PARTIDA','Tu ruta empieza con una entrevista.','Prepara entrevistas en inglés desde lo que ya sabes.')}<div class="grid dashboard-grid"><section class="card"><span class="tag">ENTREVISTA INICIAL</span><h2>De una presentación a tu experiencia profesional.</h2><p>La IA hará de reclutador y te preguntará por tu experiencia y el puesto que buscas. Una pregunta cada vez, empezando con inglés sencillo y profundizando según tus respuestas.</p><p>Al terminar verás tus fortalezas, sugerencias y una ruta creada para ti, sin pedir la evaluación por separado.</p>${button('learn-new','Empezar mi diagnóstico oral','btn','mic',!runtime.config?'disabled':'')}<p class="mini-info">Puedes terminar antes. Si falta evidencia, conservaremos tu ruta anterior.</p></section><aside class="card"><h2>Habla a tu ritmo</h2><p>No necesitas pulsar un botón en cada respuesta. Puedes interrumpir o hacer una pausa.</p><p>El nivel estimado orienta la práctica; no es una certificación. La evaluación usa el contenido transcrito.</p>${button('oral-written','Prefiero responder por escrito','btn secondary')}</aside></div>${learningError()}${diagnosticHistory()}`;
};
views.diagnostico=diagnosticView;
const paintBeforeDiagnostic=paintVoice;
paintVoice=function(){paintBeforeDiagnostic();if(current()!=='diagnostico'||!oralDiagnostic.active||!$('#voice-scene'))return;
 for(const action of ['voice-start-text','voice-demo','voice-text','voice-enable'])document.querySelector(`[data-action="${action}"]`)?.remove();
 if(!voice.currentPrompt&&$('#voice-caption'))$('#voice-caption').textContent='Empezaremos con una pregunta sencilla.';
 const context=document.querySelector('.voice-context');if(context)context.innerHTML='<span class="eyebrow">TU DIAGNÓSTICO</span><h2>Paso a paso, según tus respuestas.</h2><p>Presentación → motivación → experiencias → situaciones del puesto.</p><p>No todos necesitan llegar a la última etapa. Puedes pedir una pregunta más sencilla.</p><p class="mini-info">Como en una entrevista laboral, las correcciones llegan al final, junto con tu ruta de práctica.</p>';
 document.querySelector('[data-action="school-exercises"]')?.closest('section')?.remove();
};
const startBeforeDiagnostic=startVoice;
startVoice=function(mode='voice',source){if(current()==='diagnostico'&&oralDiagnostic.active&&(mode!=='voice'||source==='mock')){toast('Usa la voz aquí o vuelve al diagnóstico escrito.');return}return startBeforeDiagnostic(mode,source)};
async function prepareOralResult(id,token,owner,{retry=false}={}){
 oralDiagnostic.result=null;oralDiagnostic.error='';clearTimeout(oralDiagnostic.timer);schoolRender();
 const key=owner+':'+id;
 try{
  let assessment;
  try{assessment=(await apiCall(`/api/assessments/${id}`,undefined,'GET')).assessment}catch(error){if(error.status!==404)throw error}
  if(!reviewIsCurrent(token,owner))return;
  if(assessment?.status==='draft'||(retry&&assessment?.status==='failed')||(!assessment&&!oralDiagnostic.attempts.has(key))){
   const input=retry&&assessment?.status==='failed'?{retryAttempt:assessment.attempt||1}:{};
   oralDiagnostic.attempts.add(key);assessment=(await apiCall(`/api/assessments/${id}/from-session`,input)).assessment;
  }
  if(!reviewIsCurrent(token,owner))return;
  oralDiagnostic.result=assessment||null;
  if(assessment?.status==='completed'){learning.selected=assessment;await loadLearning()}
  if(assessment?.status==='pending')pollOralResult(id,token,owner);
 }catch(error){if(reviewIsCurrent(token,owner)){oralDiagnostic.error='Tu conversación está guardada. No pudimos confirmar la ruta: '+error.message;pollOralResult(id,token,owner)}}
}
function pollOralResult(id,token,owner,until=Date.now()+150000){
 clearTimeout(oralDiagnostic.timer);if(!reviewIsCurrent(token,owner)||current()!=='resultado'||Date.now()>=until)return;
 oralDiagnostic.timer=setTimeout(async()=>{
  try{const {assessment}=await apiCall(`/api/assessments/${id}`,undefined,'GET');if(!reviewIsCurrent(token,owner))return;oralDiagnostic.result=assessment;if(assessment.status!=='pending'){oralDiagnostic.error='';if(assessment.status==='completed'){learning.selected=assessment;await loadLearning()}schoolRender();return}}
  catch{/* Read-only recovery. Never repeat an uncertain evaluation. */}
  if(reviewIsCurrent(token,owner)){schoolRender();pollOralResult(id,token,owner,until)}
 },2000);
}
function oralResultCard(){
 const a=oralDiagnostic.result;if(!a)return `<section class="card"><h2>Tu ruta personalizada</h2><p role="status">${escapeHTML(oralDiagnostic.error||'Preparando tu punto de partida…')}</p>${button('oral-recover','Recuperar resultado guardado','btn secondary')}</section>`;
 if(a.status==='pending')return evaluationLoading('Estamos preparando tu ruta.','Adaptamos los siguientes pasos a la evidencia de tu entrevista.');
 if(a.status!=='completed')return `<section class="card"><h2>${a.status==='insufficient'?'Necesitamos un poco más de conversación':'Tu diagnóstico puede recuperarse'}</h2><p>${escapeHTML(a.result?.summary||a.error||'Tus respuestas están guardadas.')}</p><p>Tu ruta anterior se conserva.</p>${a.status==='failed'?button('oral-retry','Evaluar mi diagnóstico guardado','btn')+`<details><summary>Detalles para soporte</summary><p>Código: ${escapeHTML(a.failure?.code||'legacy_unknown')} · Referencia: ${escapeHTML(a.id)}</p></details>`:button('learn-new','Hacer otro diagnóstico oral','btn secondary')}</section>`;
 return `<section class="card"><span class="tag">RUTA PERSONALIZADA LISTA</span><h2>Tu punto de partida: ${escapeHTML(a.result.level)}</h2><p>${escapeHTML(a.result.summary)}</p><p>${escapeHTML(a.result.changeReason)}</p><ol>${a.result.modules.map(m=>`<li><strong>${escapeHTML(m.title)}</strong> — ${escapeHTML(m.reason)}</li>`).join('')}</ol>${button('oral-route','Ver mi ruta','btn','route')}<p class="mini-info">Estimación orientativa de la expresión observada. La nota de la conversación describe esta práctica; el diagnóstico no se aprueba ni se reprueba.</p></section>`;
}
const reviewBeforeDiagnostic=reviewView;
reviewView=function(){if(school.reviewSession?.purpose!=='diagnostic')return reviewBeforeDiagnostic();if(school.busy&&!school.review)return `${heading('TU DIAGNÓSTICO','Tu conversación ya está guardada.','Estamos preparando tus fortalezas, evaluación y ruta.')}${evaluationLoading()}`;return reviewBeforeDiagnostic().replace('Se aprueba con 9/10. Revisa qué falta reforzar en los criterios de abajo.','Esta nota describe tus respuestas de hoy. Tu ruta se adapta a las dificultades observadas.').replace('Todavía en práctica','Punto de partida')+oralResultCard()};
views.resultado=reviewView;
const openBeforeOralDiagnostic=openDiagnostic;
openDiagnostic=async function(id){try{const {assessment}=await apiCall(`/api/assessments/${id}`,undefined,'GET');if(assessment.format==='oral-v1')return openReview('session',assessment.sessionId)}catch(error){toast(error.message);return}return openBeforeOralDiagnostic(id)};
document.addEventListener('click',event=>{const action=event.target.closest('[data-action]')?.dataset.action;
 if(action==='oral-written'){oralDiagnostic.active=false;writtenDiagnostic()}
 if(action==='oral-route'&&oralDiagnostic.result?.status==='completed'){learning.routePreview=oralDiagnostic.result;go('ruta')}
 if(action==='oral-recover'&&school.reviewSession?.purpose==='diagnostic')prepareOralResult(school.reviewSession.id,reviewNavigation,window.FluentSession?.user?.uid).then(()=>schoolRender());
 if(action==='oral-retry'&&oralDiagnostic.result?.status==='failed')prepareOralResult(school.reviewSession.id,reviewNavigation,window.FluentSession?.user?.uid,{retry:true}).then(()=>schoolRender());
});
window.addEventListener('hashchange',()=>{if(current()!=='resultado')clearTimeout(oralDiagnostic.timer);if(current()!=='diagnostico')oralDiagnostic.active=false});
window.addEventListener('fluent-auth-cleared',()=>{clearTimeout(oralDiagnostic.timer);oralDiagnostic.attempts.clear();Object.assign(oralDiagnostic,{active:false,result:null,error:''})});
