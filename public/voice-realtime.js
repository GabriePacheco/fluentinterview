// Bridge the existing room/history to the audio-to-audio transport.
let realtimeVoice=null;
const legacyStartVoice=startVoice,legacyPauseVoice=pauseVoice,legacyResumeVoice=resumeVoice,legacyFinishVoice=finishVoice,legacyStopVoiceIO=stopVoiceIO,legacyPaintVoice=paintVoice;
stopVoiceIO=function(){const live=realtimeVoice;realtimeVoice=null;live?.dispose();legacyStopVoiceIO()};
paintVoice=function(){legacyPaintVoice();if(!voice.session||voice.session?.transport==='realtime'||realtimeVoice){if($('#voice-count'))$('#voice-count').textContent=`${voice.index} respuestas`;const note=document.querySelector('.voice-context .mini-info');if(note)note.textContent='Conversación continua. Puedes terminar cuando quieras; tu historial queda guardado.'}if(realtimeVoice&&!realtimeVoice.closed&&$('#voice-mic-state'))$('#voice-mic-state').innerHTML=icon('mic')+(realtimeVoice.paused?'Micrófono en pausa':'Micrófono activo · puedes interrumpir');};
startVoice=async function(mode='voice',source){
 if(mode!=='voice'||(source||runtime.config?.mode)!=='openai')return legacyStartVoice(mode,source);
 if(voice.busy)return;stopVoiceSession();voice.session=null;voice.pending=null;voice.draft='';voice.error='';voice.transcript=[];voice.index=0;voice.currentPrompt='';voice.mode='voice';voice.active=true;voice.owner=window.FluentSession.user?.uid;
 const owner=voice.owner,run=++voice.run;voice.busy=true;voice.status='requesting';paintVoice();
 const valid=()=>run===voice.run&&window.FluentSession.user?.uid===owner;
 const live=new FluentRealtime(event=>{
  if(!valid()||realtimeVoice!==live)return;
  if(event.type==='transcript'){
   voice.transcript=event.items;voice.index=event.items.filter(x=>x.role==='user'&&x.final).length;voice.currentPrompt=[...event.items].reverse().find(x=>x.role==='assistant')?.text||'';
   voice.partial=event.items.at(-1)?.role==='user'&&!event.items.at(-1)?.final?event.items.at(-1).text:'';
  }else if(['listening','speaking','thinking','paused'].includes(event.type)){voice.status=event.type;voice.paused=event.type==='paused';voice.active=!voice.paused;voice.busy=false}
  else if(event.type==='error')voice.error=event.message;
  else if(event.type==='notice')voice.error=event.message;
  else if(event.type==='closed'){
   if(voice.session&&!event.completed)suppressedConversationReviews.add(voice.session.id);
   voice.busy=false;voice.active=false;voice.status=voice.session?'complete':'error';if(event.message)voice.error=event.message;
   if(voice.session){const id=voice.session.id;apiCall(`/api/sessions/${id}`,undefined,'GET').then(data=>{if(valid()&&voice.session?.id===id){syncSession(data.session);voice.status=data.session.status==='completed'?'complete':'error';paintVoice()}}).catch(()=>{if(valid()){voice.error='Revisa el historial para confirmar el guardado.';paintVoice()}})}
  }
  paintVoice();
 });
 realtimeVoice=live;
 try{
  await live.prepare();if(!valid()||live.closed)return;
  const result=await createVoiceSession({id:crypto.randomUUID(),source:'openai',mode:isInterviewVoice()?'interview':'tutor',profile:profileForAI(),...(typeof learning!=='undefined'?learning.selection||{}:{}),...(typeof schoolSessionOptions==='function'?schoolSessionOptions():{})});
  if(!valid()||live.closed)return;syncSession(result.session);
  const ticket=await apiCall('/api/realtime/ticket',{id:result.session.id});if(!valid()||live.closed)return;
  await live.connect(window.FLUENT_CONFIG.apiBase,ticket);
 }catch(error){if(valid()){voice.error=error.name==='NotAllowedError'?'Permite el micrófono para conversar. También puedes practicar por escrito.':error.message;live.finish();voice.status='error';voice.paused=true;voice.active=false;voice.busy=false;paintVoice()}}
};
pauseVoice=function(){if(realtimeVoice&&!realtimeVoice.closed){realtimeVoice.pause();return}legacyPauseVoice()};
resumeVoice=async function(){if(realtimeVoice&&!realtimeVoice.closed){try{await realtimeVoice.resume()}catch{voice.error='No se pudo reactivar el micrófono.';paintVoice()}return}if(voice.session?.transport==='realtime'){toast('Esta conexión terminó. Inicia una nueva conversación.');return}return legacyResumeVoice()};
finishVoice=async function(){if(realtimeVoice&&!realtimeVoice.closed){voice.status='thinking';paintVoice();await realtimeVoice.end();return}return legacyFinishVoice()};
// Never fall back silently to browser STT/TTS for real AI sessions.
const legacyListening=startListening,legacySayPrompt=sayPrompt;
startListening=function(...args){if(voice.session?.source==='openai'){toast('Inicia una nueva conversación para activar la voz en tiempo real.');return}return legacyListening(...args)};
sayPrompt=function(...args){if(voice.session?.source==='openai'){voice.mode='text';voice.status='text';paintVoice();return}return legacySayPrompt(...args)};
document.addEventListener('click',async event=>{
 const action=event.target.closest('[data-action]')?.dataset.action;
 if(action==='voice-text'&&voice.session?.source==='openai'&&realtimeVoice){
  if(typeof suppressedConversationReviews!=='undefined')suppressedConversationReviews.add(voice.session.id);
  event.preventDefault();event.stopImmediatePropagation();await realtimeVoice.end();await startVoice('text');
 }
 if(action==='voice-enable'&&voice.session?.source==='openai'){
  event.preventDefault();event.stopImmediatePropagation();toast('La voz comienza en una conversación nueva. Termina esta práctica y pulsa «Iniciar con voz».');
 }
},true);
