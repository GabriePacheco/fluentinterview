// Automatic alternating speech. Audio is handled by browser services, never recorded here.
const voice={status:'idle',mode:'voice',route:'',session:null,transcript:[],index:0,currentPrompt:'',active:false,paused:false,generation:0,recognition:null,utterance:null,timers:new Set(),silenceTimer:null,finalText:'',partial:'',draft:'',error:'',notice:'',waitMs:2500,subtitles:true,pending:null,busy:false,owner:null,run:0,emptyEnds:0};
const sessionHistory={items:[],loaded:false,busy:false,error:''};
function isInterviewVoice(){return current()==='entrevista'||voice.session?.purpose==='interview'||voice.session?.mode==='interview'}
function isSimulationMode(){return (typeof chosenConversationMode==='function'?chosenConversationMode():voice.session?.mode||'tutor')==='interview'}
function voiceName(){return isSimulationMode()?'Alex':'Emma'}
function voiceLater(fn,ms){const token=voice.generation;const id=setTimeout(()=>{voice.timers.delete(id);if(token===voice.generation)fn()},ms);voice.timers.add(id);return id}
function stopRecognition(){const rec=voice.recognition;voice.recognition=null;if(rec){rec.onstart=rec.onresult=rec.onerror=rec.onend=rec.onspeechstart=null;try{rec.abort()}catch{}}}
function stopVoiceIO(){voice.generation++;for(const timer of voice.timers)clearTimeout(timer);voice.timers.clear();voice.silenceTimer=null;stopRecognition();if(voice.utterance){voice.utterance.onend=voice.utterance.onerror=null;voice.utterance=null}window.speechSynthesis?.cancel()}
function stopVoiceSession(status='idle'){stopVoiceIO();voice.active=false;voice.paused=false;voice.status=status;voice.finalText='';voice.partial=''}
function statusLabel(){return ({idle:'Cuando quieras, empezamos.',requesting:'Conectando tu micrófono…',speaking:`${voiceName()} está hablando`,listening:'Te escucho. Tómate tu tiempo.',thinking:'Preparando tu siguiente pregunta…',paused:'Conversación en pausa',text:'Escribe tu respuesta en inglés.',complete:'Una conversación más. Un paso adelante.',error:'Tu conversación sigue guardada.'})[voice.status]||''}
function sessionModeLabel(){return voice.session?.source==='openai'?'CONVERSACIÓN CON IA':voice.session?'PRÁCTICA SIMULADA · SIN COSTE':typeof runtime!=='undefined'&&runtime.config?.mode==='openai'?'IA DISPONIBLE':'PRÁCTICA SIMULADA'}
function voiceRoom(){return `${heading(isSimulationMode()?'SIMULACIÓN DE ENTREVISTA':'TU ESPACIO PARA HABLAR',`Hola, ${escapeHTML(state.name)}. Hablemos.`,isSimulationMode()?'Practica como si tuvieras al reclutador delante. Revisa las observaciones al terminar.':'Inicia una vez. Después, escucha y responde a tu ritmo.',link('progreso','Mis conversaciones','btn secondary','chat'))}
 <div class="voice-layout"><section class="voice-main" aria-label="Sala de conversación"><div class="voice-room-top"><span class="voice-person">${icon('spark')} ${voiceName()} <span>· ${isSimulationMode()?'Entrevistador':'Tu tutora'}</span></span><span id="voice-source" class="voice-demo-badge">${sessionModeLabel()}</span></div>
 <div class="voice-scene" id="voice-scene" data-state="idle"><div class="voice-orbit"><span></span><span></span><div class="orb" aria-hidden="true"></div></div><div class="voice-state" id="voice-state" role="status" aria-live="polite"></div><h2 id="voice-caption"></h2><p class="voice-subtitle" id="voice-subtitle"></p>${wave()}</div><div id="voice-error" class="voice-error" role="status" hidden></div><div id="voice-notice" class="feedback note" role="status" aria-live="polite" hidden></div><div class="voice-controls" id="voice-controls"></div>
 <form id="voice-text-form" class="voice-text-form" hidden><label for="voice-text">Tu respuesta en inglés</label><textarea id="voice-text" rows="3" maxlength="1800" placeholder="I work as…"></textarea><button class="btn white" type="submit">Enviar respuesta ${icon('arrow')}</button></form>
 <div class="voice-room-bottom"><span id="voice-mic-state">${icon('mic')} Micrófono apagado</span>${button('voice-subtitles','Subtítulos activados','voice-small-control')}</div></section>
 <aside class="voice-aside"><section class="card voice-context"><div class="eyebrow">TU PRÓXIMO PASO</div><h2>${escapeHTML(voice.session?.profile.role||(isInterviewVoice()?state.interviewRole:state.role)||'Cuenta tu experiencia.')}</h2><p>${escapeHTML(state.goal)}</p><div class="row wrap"><span class="tag">${isSimulationMode()?'Modo entrevista':'Práctica guiada'}</span><span id="voice-level" class="tag">${voice.session?.learning?.level?`Expresión ${escapeHTML(voice.session.learning.level)} · orientativa`:'Nivel todavía sin evaluar'}</span></div><p id="voice-learning-objective" hidden></p><p class="mini-info">Practica a tu ritmo. Puedes terminar cuando quieras. El historial se guarda en tu cuenta.</p></section><section class="card voice-notebook"><div class="section-title"><h2>Tu conversación</h2><span class="voice-count" id="voice-count"></span></div><div id="voice-transcript" class="voice-transcript"></div></section><section id="voice-summary" class="card" hidden></section></aside></div>
 <div class="voice-footnotes"><p><b>Conversación continua:</b> al iniciar con voz autorizas el envío de tu audio y contexto profesional a OpenAI. Escucha y responde sin pulsar botones: puedes interrumpir cuando necesites. Usa «Pausar» para descansar.</p><details><summary>Privacidad y voz</summary><p>La conversación de voz con IA procesa audio directamente en OpenAI. Guardamos el texto recibido en tu historial; no almacenamos grabaciones en Fluent Interview. Puedes eliminar las conversaciones desde tu cuenta. Los subtítulos pueden contener errores y una respuesta interrumpida se identifica como tal.</p><p>La duración de cada sesión depende de tu plan; te avisamos antes de terminar. Puedes usar Chrome, Edge o Safari actualizado. Usa auriculares si escuchas eco; también puedes practicar por escrito.</p></details></div>`}
function syncSession(session){voice.session=session;voice.transcript=session.messages.map(m=>({role:m.role,text:m.content}));voice.index=session.summary.learnerTurns;voice.currentPrompt=[...session.messages].reverse().find(m=>m.role==='assistant')?.content||'';sessionHistory.loaded=false}
function summaryHTML(summary){return `<h2>Lo que practicaste</h2><p>${summary.learnerTurns} respuestas · ${escapeHTML(summary.label)}</p><ul>${summary.focus.map(x=>`<li>${escapeHTML(x)}</li>`).join('')}</ul>${summary.quotes.map(x=>`<blockquote>${escapeHTML(x)}</blockquote>`).join('')}<p>${escapeHTML(summary.suggestion)}</p><p class="mini-info">Resumen descriptivo de esta sesión. No es una certificación ni una evaluación de pronunciación.</p>`}
function paintVoice(){
 if(!$('#voice-scene'))return;
 $('#voice-scene').dataset.state=voice.status;$('#voice-state').textContent=statusLabel();$('#voice-source').textContent=sessionModeLabel();
 $('#voice-caption').textContent=voice.subtitles?(voice.currentPrompt||'“Tell me about yourself.”'):'';
 $('#voice-subtitle').textContent=voice.partial||({idle:'Elige voz o texto para empezar.',listening:'Una pausa breve enviará tu respuesta.',speaking:'Puedes hablar e interrumpir cuando necesites.',paused:'Micrófono apagado. Continúa cuando estés listo.',thinking:'La respuesta se guardará aunque pauses la sesión.',complete:'Puedes volver a esta conversación desde tu historial.',text:'La misma conversación, a tu ritmo.'}[voice.status]||'');
 if($('#voice-level'))$('#voice-level').textContent=voice.session?.learning?.level?`Expresión ${voice.session.learning.level} · orientativa`:'Nivel todavía sin evaluar';const objective=$('#voice-learning-objective');if(objective){objective.hidden=!voice.session?.learning;objective.textContent=voice.session?.learning?'Objetivo: '+voice.session.learning.objective:''}
 $('#voice-count').textContent=`${voice.index} / 6 respuestas`;
 const log=$('#voice-transcript');log.innerHTML=voice.transcript.length?voice.transcript.map(t=>`<div class="voice-line ${t.role}"><span>${t.role==='user'?'Tú':voiceName()}</span><p>${escapeHTML(t.text)}</p></div>`).join(''):'<div class="voice-empty"><p>Aquí aparecerá tu conversación.</p></div>';log.scrollTop=log.scrollHeight;
 $('#voice-mic-state').innerHTML=icon('mic')+(voice.recognition&&voice.status==='listening'?'Micrófono activo':'Micrófono apagado');
 $('#voice-error').hidden=!voice.error;const planRequired=/plan activo|diagnóstico gratuito ya fue utilizado/i.test(voice.error);$('#voice-error').innerHTML=escapeHTML(voice.error)+(planRequired?' <a href="#/planes" class="voice-plan-link">Ver planes</a>':'');
 $('#voice-notice').hidden=!voice.notice;$('#voice-notice').textContent=voice.notice||'';
 const end=button('voice-end','Terminar y ver evaluación','voice-end','close'),text=button('voice-text','Continuar por escrito','voice-secondary');
 let controls='';
 if(!voice.session)controls=button('voice-start','Iniciar con voz','btn white','mic',voice.busy?'disabled':'')+button('voice-start-text','Iniciar por escrito','voice-secondary','',voice.busy?'disabled':'')+button('voice-demo','Probar sin gastar','voice-secondary','',voice.busy?'disabled':'');
 else if(voice.session.status==='completed'||voice.status==='complete')controls=button('voice-new','Nueva conversación','btn white','mic')+link('progreso','Ver historial','voice-secondary','chat');
 else if(voice.session.blocked)controls=end+button('voice-new','Empezar otra sesión','voice-secondary');
 else if(voice.paused||voice.status==='error')controls=button('voice-resume',voice.pending?'Recuperar respuesta':'Continuar','btn white','play')+text+end;
 else controls=button('voice-pause','Pausar','voice-secondary','pause')+(voice.mode==='voice'?text:button('voice-enable','Activar voz','voice-secondary','mic'))+end;
 $('#voice-controls').innerHTML=controls;
 const form=$('#voice-text-form');form.hidden=!(voice.session&&voice.mode==='text'&&voice.active&&!voice.busy&&!voice.session.blocked&&voice.session.status==='active');
 if(!form.hidden&&document.activeElement!==$('#voice-text'))$('#voice-text').value=voice.draft;
 const summary=$('#voice-summary');summary.hidden=voice.session?.status!=='completed';if(!summary.hidden)summary.innerHTML=summaryHTML(voice.session.summary);
 const subtitle=$('[data-action="voice-subtitles"]');subtitle.textContent=voice.subtitles?'Subtítulos activados':'Subtítulos desactivados';subtitle.setAttribute('aria-pressed',String(voice.subtitles));
}
function failVoice(message){voice.draft=voice.partial||voice.draft;stopVoiceIO();voice.active=false;voice.paused=true;voice.status='error';voice.error=message;paintVoice()}
async function createVoiceSession(input){return apiCall('/api/sessions',input)}
async function startVoice(mode='voice',source){
 if(!runtime.config&&!source){toast('Espera a que se conecte el servidor o elige «Probar sin gastar».');return}
 if(voice.busy)return;stopVoiceSession();voice.session=null;voice.pending=null;voice.draft='';voice.error='';voice.notice='';voice.transcript=[];voice.index=0;voice.currentPrompt='';voice.mode=mode;voice.active=true;voice.owner=window.FluentSession.user?.uid;const owner=voice.owner,run=++voice.run;voice.busy=true;voice.status='thinking';paintVoice();
 try{const result=await createVoiceSession({id:crypto.randomUUID(),source:source||runtime.config?.mode||'mock',mode:isInterviewVoice()?'interview':'tutor',profile:profileForAI(),...(typeof learning!=='undefined'?learning.selection||{}:{}),...(typeof schoolSessionOptions==='function'?schoolSessionOptions():{})});if(run!==voice.run||window.FluentSession.user?.uid!==owner)return;syncSession(result.session);voice.busy=false;if(mode==='voice')startListening(true);else await sendVoiceTurn('')}
 catch(error){if(run===voice.run)failVoice(error.message)}finally{if(run===voice.run){voice.busy=false;paintVoice()}}
}
async function sendVoiceTurn(text,retry=false){
 if(voice.busy||!voice.session)return;stopVoiceIO();voice.busy=true;voice.status='thinking';voice.error='';
 if(!retry)voice.pending={requestId:crypto.randomUUID(),text,expectedTurn:voice.session.turnCount??voice.session.feedback.length};
 const id=voice.session.id,owner=voice.owner,request=voice.pending;paintVoice();
 try{const data=await apiCall(`/api/sessions/${id}/turn`,request);if(voice.session?.id!==id||window.FluentSession.user?.uid!==owner)return;syncSession(data.session);voice.pending=null;voice.draft='';voice.partial='';voice.busy=false;
  if(data.session.status==='completed'){stopVoiceSession('complete');paintVoice();window.dispatchEvent(new Event('fluent-conversation-closed'));return}
  if(voice.active&&!voice.paused){if(voice.mode==='voice')sayPrompt();else{voice.status='text';paintVoice()}}else paintVoice();
 }catch(error){if(voice.session?.id===id&&window.FluentSession.user?.uid===owner)failVoice(error.message+([401,402,403,429].includes(error.status)?'':' Puedes consultar la respuesta con «Recuperar respuesta»; no se reintentará automáticamente.'))}
 finally{if(voice.session?.id===id){voice.busy=false;paintVoice()}}
}
function sayPrompt(){
 if(!voice.active||voice.paused)return;stopRecognition();
 if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){failVoice('La voz de salida no está disponible. Continúa por escrito.');return}
 voice.status='speaking';voice.partial='';paintVoice();const token=voice.generation,u=new SpeechSynthesisUtterance(voice.currentPrompt);voice.utterance=u;u.lang='en-US';u.rate=.9;
 const available=speechSynthesis.getVoices().find(v=>/^en[-_]/i.test(v.lang));if(available)u.voice=available;
 const timer=voiceLater(()=>failVoice('No se pudo reproducir la voz. La respuesta está guardada; puedes leerla y continuar por escrito.'),40000);
 u.onend=()=>{if(token!==voice.generation||!voice.active||voice.paused)return;clearTimeout(timer);voice.timers.delete(timer);voice.utterance=null;voiceLater(()=>startListening(),350)};
 u.onerror=()=>{if(token===voice.generation&&voice.active)failVoice('La voz se interrumpió. Puedes recuperar la conversación o seguir por escrito.')};
 try{speechSynthesis.speak(u)}catch{failVoice('No se pudo iniciar la voz. Continúa por escrito.')}
}
function startListening(permissionOnly=false){
 if(!voice.active||voice.paused||voice.mode!=='voice')return;
 const SpeechAPI=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SpeechAPI){failVoice('Este navegador no ofrece reconocimiento de voz. Puedes continuar por escrito con la misma conversación.');return}
 stopRecognition();voice.status='requesting';voice.finalText='';voice.partial='';paintVoice();const token=voice.generation,rec=new SpeechAPI();voice.recognition=rec;rec.lang='en-US';rec.continuous=true;rec.interimResults=true;
 const valid=()=>token===voice.generation&&voice.active&&!voice.paused&&voice.recognition===rec;
 let timeout=voiceLater(()=>failVoice(permissionOnly?'El permiso del micrófono sigue pendiente. Revisa el navegador o continúa por escrito.':'No hemos escuchado una respuesta. La sesión está en pausa para darte tiempo.'),permissionOnly?20000:30000);
 const renewTimeout=()=>{clearTimeout(timeout);voice.timers.delete(timeout);timeout=voiceLater(()=>failVoice('El reconocimiento dejó de recibir palabras. Conservamos tu texto; puedes revisarlo o continuar cuando estés listo.'),30000)};
 rec.onstart=()=>{if(!valid())return;if(permissionOnly){clearTimeout(timeout);voice.timers.delete(timeout);stopRecognition();sendVoiceTurn('');return}voice.status='listening';paintVoice()};
 rec.onspeechstart=()=>{if(!valid())return;renewTimeout();if(voice.silenceTimer){clearTimeout(voice.silenceTimer);voice.timers.delete(voice.silenceTimer)}};
 rec.onresult=event=>{
  if(!valid()||permissionOnly)return;renewTimeout();voice.emptyEnds=0;
  let final='',interim='';for(const r of Array.from(event.results)){if(r.isFinal)final+=r[0].transcript+' ';else interim+=r[0].transcript+' '}
  voice.finalText=final.trim();voice.partial=(final+interim).trim();voice.draft=voice.partial;paintVoice();
  if(voice.silenceTimer){clearTimeout(voice.silenceTimer);voice.timers.delete(voice.silenceTimer)}
  if(voice.finalText&&!interim.trim())voice.silenceTimer=voiceLater(()=>commitVoiceAnswer(voice.finalText),voice.waitMs);
 };
 rec.onerror=event=>{if(!valid()||event.error==='no-speech')return;const errors={'not-allowed':'No se autorizó el micrófono. Cambia el permiso del sitio o continúa por escrito.','service-not-allowed':'El servicio de voz no está disponible en este navegador. Continúa por escrito.','audio-capture':'No encontramos un micrófono. Conecta uno o continúa por escrito.','network':'El reconocimiento de voz perdió la conexión. Conservamos lo que alcanzó a transcribirse.'};failVoice(errors[event.error]||'El reconocimiento se interrumpió. Puedes continuar por escrito.')};
 rec.onend=()=>{if(!valid())return;voice.recognition=null;clearTimeout(timeout);voice.timers.delete(timeout);if(voice.silenceTimer){clearTimeout(voice.silenceTimer);voice.timers.delete(voice.silenceTimer)}
  if(permissionOnly){failVoice('No se pudo abrir el micrófono. Revisa el permiso o continúa por escrito.');return}
  if(voice.partial&&voice.partial!==voice.finalText){failVoice('El servicio terminó antes de confirmar todas las palabras. Puedes revisar y enviar el texto por escrito.');return}
  if(voice.finalText)voiceLater(()=>commitVoiceAnswer(voice.finalText),voice.waitMs);
  else if(++voice.emptyEnds<=2)voiceLater(()=>startListening(),600);else failVoice('No hemos recibido audio. Continúa cuando estés listo o usa el texto.');
 };
 try{rec.start()}catch{failVoice('No se pudo activar el micrófono. Continúa por escrito.')}
}
function commitVoiceAnswer(text){if(!voice.active||voice.paused||voice.busy||voice.status!=='listening'||!text.trim())return;if(text.length>1800){failVoice('Tu respuesta es muy larga. Acórtala en el cuadro de texto antes de enviarla.');return}sendVoiceTurn(text.trim())}
function pauseVoice(){if(!voice.session)return;voice.draft=voice.partial||voice.draft;stopVoiceIO();voice.active=false;voice.paused=true;voice.status='paused';paintVoice()}
async function resumeVoice(){
 if(!voice.session)return;voice.active=true;voice.paused=false;voice.error='';
 if(voice.busy){voice.status='thinking';paintVoice();return}
 if(voice.pending){await sendVoiceTurn(voice.pending.text,true);return}
 if(voice.session.pending){await recoverVoice(voice.session.id);return}
 if(voice.draft){voice.mode='text';voice.status='text';paintVoice();return}
 if(!voice.session.messages.length){if(voice.mode==='voice')startListening(true);else sendVoiceTurn('');return}
 if(voice.mode==='voice')sayPrompt();else{voice.status='text';paintVoice()}
}
async function finishVoice(){if(!voice.session)return;const id=voice.session.id;stopVoiceSession('paused');voice.error='';paintVoice();try{const data=await apiCall(`/api/sessions/${id}/end`,{});if(voice.session?.id===id){syncSession(data.session);voice.status='complete';paintVoice();window.dispatchEvent(new Event('fluent-conversation-closed'))}}catch(error){if(voice.session?.id===id)failVoice('No se pudo finalizar. Tus turnos anteriores están guardados. '+error.message)}}
async function recoverVoice(id){const owner=window.FluentSession.user?.uid;try{const data=await apiCall(`/api/sessions/${id}`,undefined,'GET');if(window.FluentSession.user?.uid!==owner)return;voice.owner=owner;voice.pending=null;syncSession(data.session);voice.mode='text';voice.active=data.session.status==='active'&&!data.session.pending&&!data.session.blocked;voice.paused=!voice.active;voice.status=data.session.status==='completed'?'complete':voice.active?'text':'paused';voice.error=data.session.pending?'La respuesta todavía se está procesando. Pulsa Continuar para recuperarla.':data.session.endReason||'';paintVoice()}catch(error){toast(error.message)}}
async function loadHistory(){if(sessionHistory.busy)return;sessionHistory.busy=true;const uid=window.FluentSession.user?.uid;try{const data=await apiCall('/api/sessions',undefined,'GET');if(window.FluentSession.user?.uid!==uid)return;sessionHistory.items=data.sessions;sessionHistory.loaded=true;sessionHistory.error=''}catch(error){sessionHistory.error=error.message}finally{sessionHistory.busy=false;if(current()==='progreso')render()}}
function historyView(){return `${heading('TUS CONVERSACIONES','Cada respuesta cuenta.','Revisa tu práctica y retoma una sesión por escrito.',button('voice-history-refresh','Actualizar','btn secondary'))}${sessionHistory.error?`<div class="feedback warm">${escapeHTML(sessionHistory.error)}</div>`:''}${!sessionHistory.items.length?'<section class="card"><h2>Todavía no hay conversaciones guardadas.</h2><p>Al empezar una práctica, aparecerá aquí.</p>'+link('aula','Conversar con IA','btn','mic')+'</section>':sessionHistory.items.map(s=>`<section class="card" style="margin-bottom:16px"><div class="row between wrap"><div><span class="tag">${s.source==='openai'?'IA real':'Simulación'}</span><h2>${escapeHTML(s.profile.role||'Práctica de entrevista')}</h2><p>${new Date(s.createdAt).toLocaleString('es-EC')} · ${s.summary.learnerTurns} respuestas · ${s.status==='completed'?'Finalizada':'En curso'}</p></div><div class="row wrap">${button('voice-open','Abrir conversación','btn secondary','',`data-id="${s.id}"`)}${button('voice-delete','Eliminar','text-btn','',`data-id="${s.id}"`)}</div></div></section>`).join('')}`}
icons.pause='M8 5v14M16 5v14';screens.find(s=>s[0]==='aula')[1]='Conversación con IA';screens.splice(5,0,['ejercicios','Ejercicios de apoyo','book']);views.ejercicios=lesson;views.aula=voiceRoom;views.entrevista=voiceRoom;
const originalShell=shell;shell=function(route){originalShell(route);const nav=$('#sidebar nav'),conversationLink=nav.querySelector('a[href="#/aula"]');conversationLink.innerHTML=icon('mic')+'Conversar con IA';nav.insertBefore(conversationLink,nav.querySelector('a[href="#/ruta"]'))};
const originalRender=render;render=function(){
 if(voice.route!==current()){stopVoiceSession();voice.run++;voice.session=null;voice.pending=null;voice.busy=false;voice.transcript=[];voice.error='';voice.draft='';voice.route=current()}
 originalRender();if($('#voice-scene'))paintVoice();
 if(current()==='progreso'&&window.FluentSession?.user&&!sessionHistory.loaded&&!sessionHistory.busy&&!sessionHistory.error)loadHistory();
};
document.addEventListener('click',async event=>{const el=event.target.closest('[data-action]'),action=el?.dataset.action;if(!action?.startsWith('voice-'))return;
 if(action==='voice-start')startVoice();if(action==='voice-start-text')startVoice('text');if(action==='voice-demo')startVoice('text','mock');
 if(action==='voice-pause')pauseVoice();if(action==='voice-resume')resumeVoice();if(action==='voice-end')finishVoice();
 if(action==='voice-new'){stopVoiceSession();voice.session=null;voice.run++;voice.pending=null;voice.busy=false;voice.transcript=[];voice.currentPrompt='';voice.draft='';voice.error='';voice.index=0;paintVoice()}
 if(action==='voice-text'){stopVoiceIO();voice.mode='text';voice.active=true;voice.paused=false;voice.error='';if(!voice.session.messages.length&&!voice.pending)sendVoiceTurn('');else if(voice.pending)resumeVoice();else{voice.status='text';paintVoice()}}
 if(action==='voice-enable'){voice.mode='voice';voice.active=true;voice.paused=false;voice.draft=$('#voice-text')?.value||voice.draft;if(voice.draft){failVoice('Envía primero el texto que tienes escrito; después podrás activar la voz.');return}if(voice.currentPrompt)sayPrompt();else startListening(true)}
 if(action==='voice-subtitles'){voice.subtitles=!voice.subtitles;paintVoice()}
 if(action==='voice-history-refresh')loadHistory();
 if(action==='voice-open'){go('aula');setTimeout(()=>recoverVoice(el.dataset.id),0)}
 if(action==='voice-delete'){try{await apiCall(`/api/sessions/${el.dataset.id}`,undefined,'DELETE');await loadHistory()}catch(error){toast(error.message)}}
});
document.addEventListener('submit',event=>{if(event.target.id!=='voice-text-form')return;event.preventDefault();const text=$('#voice-text').value.trim();voice.draft=text;if(text.length&&text.length<=1800)sendVoiceTurn(text)});
document.addEventListener('change',event=>{if(event.target.id==='voice-patience')voice.waitMs=Number(event.target.value)});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&voice.active)pauseVoice()});
window.addEventListener('pagehide',()=>stopVoiceSession());
window.addEventListener('fluent-auth-ready',()=>{views.progreso=historyView;if(current()==='progreso')render()});
window.addEventListener('fluent-auth-cleared',()=>{stopVoiceSession();voice.run++;voice.owner=null;voice.session=null;voice.pending=null;voice.busy=false;voice.transcript=[];sessionHistory.items=[];sessionHistory.loaded=false;sessionHistory.error=''});
// Account bootstrap performs the initial render.
