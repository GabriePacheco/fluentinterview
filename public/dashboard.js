// Presentation only: read saved results; never request an AI evaluation on the home screen.
const dashboard={owner:null,epoch:0,loading:false,loaded:false,error:'',session:null,review:null};
async function loadDashboard(force=false){
 const owner=window.FluentSession?.user?.uid;if(!owner)return;
 if(dashboard.owner!==owner){dashboard.epoch++;Object.assign(dashboard,{owner,loading:false,loaded:false,error:'',session:null,review:null})}
 if(dashboard.loading||dashboard.loaded&&!force)return;
 const epoch=++dashboard.epoch;Object.assign(dashboard,{owner,loading:true,error:''});
 try{
  const data=await apiCall('/api/sessions',undefined,'GET');
  if(epoch!==dashboard.epoch||owner!==window.FluentSession?.user?.uid)return;
  const session=(data.sessions||[]).filter(s=>s.status==='completed'&&s.source==='openai'&&s.summary?.learnerTurns>0).sort((a,b)=>b.updatedAt-a.updatedAt)[0]||null;
  const result=session?await apiCall('/api/feedback/session/'+session.id,undefined,'GET'):{};
  if(epoch!==dashboard.epoch||owner!==window.FluentSession?.user?.uid)return;
  Object.assign(dashboard,{session,review:result.review||null,loaded:true});
 }catch(error){if(epoch===dashboard.epoch)dashboard.error=error.message}
 finally{if(epoch===dashboard.epoch){dashboard.loading=false;if(current()==='inicio')render()}}
}
function dashboardRoute(){return learning.current&&pathState.data?.assessmentId===learning.current.id&&pathState.data.current?pathState.data:null}
function routeRibbon(route){
 if(!route)return '';
 const steps=route.stages.flatMap(stage=>stage.steps),index=steps.findIndex(step=>step.id===route.nextStepId);
 const start=Math.max(0,Math.min((index<0?steps.length-1:index)-2,steps.length-6)),visible=steps.slice(start,start+6);
 const gap='<li class="ribbon-gap" aria-label="Más pasos en tu ruta">···</li>';
 const node=step=>`<li class="ribbon-step ${step.status}" ${step.status==='current'?'aria-current="step"':''}><span class="ribbon-pin">${step.status==='passed'?icon('check'):step.order+1}</span><span class="ribbon-title">${escapeHTML(step.title)}</span>${step.status==='current'?'<span class="ribbon-caption">Estás aquí</span>':''}<span class="sr-only">Paso ${step.order+1}: ${step.status==='passed'?'Aprobado':step.status==='current'?'Paso actual':'Por completar'}</span></li>`;
 return `<section class="card journey-card" aria-label="Resumen de tu ruta"><div class="row between wrap"><div><h2>Tu ruta, a tu medida</h2><p>Nivel ${escapeHTML(route.level)} · ${escapeHTML(route.profile.role||'Tu objetivo profesional')}</p></div><strong>${route.completed} de ${route.total} pasos aprobados</strong></div><ol class="journey-ribbon" aria-label="Pasos de tu recorrido">${start>0?node(steps[0])+(start>1?gap:''):''}${visible.map(node).join('')}${start+6<steps.length?(start+6<steps.length-1?gap:'')+node(steps.at(-1)):''}</ol><div class="row between wrap journey-footer"><span>${route.finished?'✓ Llegaste a la meta de esta ruta.':'Cada paso es una conversación. Apruebas desde 9/10.'}</span>${link('ruta','Ver mi ruta completa','text-btn','arrow')}</div></section>`;
}
function dashboardReview(){
 if(dashboard.owner!==window.FluentSession?.user?.uid)return '<aside class="card last-conversation"><h2>Tu última conversación</h2><p role="status">Recuperando tu práctica…</p></aside>';
 const {session,review,error,loading,loaded}=dashboard;
 if(error)return `<aside class="card last-conversation"><h2>Tu última conversación</h2><p>No pudimos recuperar el resultado. Tus conversaciones guardadas se conservan.</p>${button('dashboard-refresh','Volver a cargar','btn secondary')}</aside>`;
 if(!loaded||loading)return '<aside class="card last-conversation"><h2>Tu última conversación</h2><p role="status">Recuperando tu práctica…</p></aside>';
 if(!session)return `<aside class="card last-conversation"><span class="dashboard-empty-icon">${icon('chat')}</span><h2>Tu progreso empieza al conversar</h2><p>Aquí verás las fortalezas y la nota de tu última conversación con IA.</p><p class="mini-info">Recibirás tu retroalimentación al terminar.</p></aside>`;
 const result=review?.status==='completed'&&review.source==='openai'?review.result:null;
 if(!result)return `<aside class="card last-conversation"><h2>Tu última conversación</h2><p>${review?.status==='pending'?'Tu evaluación se está preparando.':review?.status==='failed'?'Tu conversación se guardó, pero la evaluación no pudo completarse.':'Tu conversación está guardada; todavía no tiene una evaluación.'}</p>${button('dashboard-review','Abrir resultado','btn secondary')}</aside>`;
 const strengths=result.strengths?.length?result.strengths:result.observations?.filter(o=>o.finding==='demonstrated')||[],score=result.scoring?.score;
 const route=dashboardRoute(),step=route?.stages.flatMap(s=>s.steps).find(s=>s.id===session.learning?.stepId),attempt=step?.attempts.find(a=>a.id===session.id);
 const label=session.learning?.routeStep?(attempt?.passed?'Paso aprobado':'Revisa el objetivo del paso'):result.scoring?.passed?'Objetivo alcanzado':'Sigue practicando';
 return `<aside class="card last-conversation"><h2>Tu última conversación</h2><h3>Tus fortalezas</h3><ul class="dashboard-strengths">${strengths.slice(0,2).map(s=>`<li>${icon('check')}<span>${escapeHTML(s.comment)}</span></li>`).join('')||'<li>Necesitamos más respuestas para destacar una fortaleza concreta.</li>'}</ul>${Number.isFinite(score)?`<div class="dashboard-grade"><div class="grade-ring ${score>=9?'achieved':''}" style="--grade:${Math.max(0,Math.min(100,score*10))}%" role="img" aria-label="Nota ${pathScore(score)}"><span><b>${Number(score).toLocaleString('es-EC',{maximumFractionDigits:2})}</b><small>/ 10</small></span></div><div><h3>${label}</h3><p>${escapeHTML(result.nextStep||'Revisa tus respuestas y prepara tu siguiente conversación.')}</p></div></div>`:'<p>Esta conversación todavía no tiene una nota sobre 10.</p>'}${button('dashboard-review','Ver retroalimentación','text-btn','arrow')}</aside>`;
}
studyHome=function(){
 if(dashboard.owner!==window.FluentSession?.user?.uid||!dashboard.loaded&&!dashboard.loading&&!dashboard.error)queueMicrotask(()=>loadDashboard());
 const key=learning.current?.id||'current';if(learning.loaded&&pathState.key!==key&&!pathState.loadingKey&&!pathState.error)queueMicrotask(()=>loadPath(learning.current?.id));
 const route=dashboardRoute(),next=route?.stages.flatMap(s=>s.steps).find(s=>s.id===route.nextStepId),loading=!learning.loaded||learning.current&&!route&&!pathState.error;
 return `<section class="welcome-banner"><span class="eyebrow">TU PRÓXIMO CAPÍTULO</span><h1>Tu próxima oportunidad empieza aquí</h1><p>Practica entrevistas en inglés, a tu ritmo.</p><div class="welcome-lines" aria-hidden="true"></div></section><div class="dashboard-conversations"><section class="conversation-launch"><div class="launch-copy"><span class="tag">${next?'Tutor · Paso '+(next.order+1)+' de '+route.total:route?.finished?'TU RUTA COMPLETADA':'CONVERSA CON IA'}</span><h2>Tu siguiente conversación</h2><h3>${escapeHTML(next?.title|| (route?.finished?'Un nuevo reto para tu experiencia':'Tu experiencia merece ser escuchada'))}</h3><p>${escapeHTML(next?.objective||(route?.finished?'Has aprobado todos los pasos. Puedes simular una entrevista o revisar tu siguiente etapa.':'Practica por voz: inicia una vez, habla y recibe ayuda del tutor.'))}</p></div><div class="launch-orb" aria-hidden="true"><span>${icon('mic')}</span><i></i><i></i><i></i></div><div class="launch-actions">${next?button('path-start','Continuar con el tutor','btn','mic',`data-step="${next.id}"`):button('dashboard-tutor','Conversar con el tutor','btn','mic')}${button('dashboard-interview','Simular entrevista','btn secondary','brief')}<small>En entrevista, recibes los comentarios al terminar.</small></div></section>${dashboardReview()}</div>${pathState.error||learning.error?`<section class="card"><h2>Tu ruta guardada está a salvo</h2><p>No pudimos recuperar el diagnóstico o el avance.</p>${button('dashboard-refresh','Volver a cargar','btn secondary')}</section>`:loading?'<section class="card"><p role="status">Recuperando tu ruta personal…</p></section>':route?routeRibbon(route):`<section class="card journey-empty"><div><h2>Una ruta que empieza contigo</h2><p>Conversa para conocer tu punto de partida. Tu nivel, tus respuestas y el puesto que buscas guiarán cada paso.</p></div>${link('diagnostico','Crear mi ruta conversando','btn','mic')}</section>`}${route?.finished?`<div class="dashboard-support">${button('learn-new','Revisar mi siguiente etapa','btn secondary','spark')}</div>`:''}<div class="dashboard-support">${link('ejercicios','Ejercicios escritos de apoyo (opcional)','text-btn','book')}${link('perfil','Mi objetivo profesional','text-btn','brief')}</div>`;
};views.inicio=studyHome;
document.addEventListener('click',event=>{
 const action=event.target.closest('[data-action]')?.dataset.action;
 if(action==='dashboard-tutor'||action==='dashboard-interview'){
  pathState.selection=null;pathState.requestId=null;school.voiceActivity=null;learning.selection=null;
  if(action==='dashboard-tutor'){school.conversationMode='tutor';go('aula')}
  else{school.interview.mode='interview';go('entrevistas')}
 }
 if(action==='dashboard-review'&&dashboard.session)openReview('session',dashboard.session.id,{automatic:false});
 if(action==='dashboard-refresh'){loadDashboard(true);loadLearning();loadPath(learning.current?.id,true)}
});
window.addEventListener('hashchange',()=>{if(current()==='inicio')loadDashboard(true)});
window.addEventListener('fluent-auth-ready',()=>{views.inicio=studyHome;if(current()==='inicio')loadDashboard(true)});
window.addEventListener('fluent-auth-cleared',()=>{dashboard.epoch++;Object.assign(dashboard,{owner:null,loading:false,loaded:false,error:'',session:null,review:null})});
