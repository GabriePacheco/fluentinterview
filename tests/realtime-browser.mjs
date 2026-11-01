import http from 'node:http';import fs from 'node:fs';import assert from 'node:assert/strict';
import {chromium,executablePath} from './browser-runtime.mjs';
import {buildConversationRoute} from '../server/conversation-route.mjs';
import {buildPracticeGoal,practiceOutcome} from '../server/practice-goals.mjs';
const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';if(!/^[\w.-]+$/.test(name)||!fs.existsSync('public/'+name)){res.writeHead(404);res.end();return}res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync('public/'+name))});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath,headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
let session,review=null,reviewCalls=0,assessment=null,diagnosisCalls=0,releaseReview;
const reviewText='I has five years of experience and I create weekly reports for customers.';
const reviewResult={summary:'Describes tu trabajo con un ejemplo concreto.',strengths:[{comment:'Explicas a quién ayudas.',quote:reviewText}],observations:[],corrections:[{kind:'error',original:'I has',replacement:'I have',reason:'Con I usamos have.'}],nextStep:'Cuenta otra tarea.',scoring:{score:8.5,passed:false,criteria:[{label:'Claridad',points:8.5,reason:'Puedes conectar mejor las ideas.'}]}};
await page.route('**/config.js',route=>route.fulfill({contentType:'text/javascript',body:'window.FLUENT_CONFIG={apiBase:location.origin};'}));
await page.route('**/account.bundle.js',route=>route.fulfill({contentType:'text/javascript',body:'window.FluentSession={user:{uid:"fixture"},token:async()=>"fixture"};document.body.classList.remove("booting");runtime.config={mode:"openai",budget:{reservedUsd:0}};render();'}));
await page.route('**/api/**',async route=>{
 const request=route.request(),url=new URL(request.url());let result={};
 if(url.pathname==='/api/sessions'&&request.method()==='POST'){const input=request.postDataJSON();review=null;session={...input,practiceGoal:buildPracticeGoal(input),status:'active',messages:[],feedback:[],summary:{learnerTurns:0,focus:[],quotes:[],label:'Práctica',suggestion:''},source:'openai'};result={session}}
 else if(url.pathname==='/api/realtime/ticket')result={uid:'fixture',ticket:'fixture',seconds:120};
 else if(url.pathname.startsWith('/api/sessions/'))result={session:{...session,transport:'realtime',status:'completed',messages:[{role:'assistant',content:'Tell me about your work.'},{role:'user',content:reviewText}],summary:{...session.summary,learnerTurns:1}}};
 else if(url.pathname.startsWith('/api/feedback/')){if(request.method()==='POST'){reviewCalls++;if(reviewCalls===1)await new Promise(resolve=>releaseReview=resolve);review={status:'completed',source:'openai',result:{...reviewResult,practiceOutcome:practiceOutcome(session.practiceGoal,reviewResult,1)}}}result={review}};
 if(url.pathname.startsWith('/api/assessments/')){
  if(request.method()==='POST'){diagnosisCalls++;assessment={id:session.id,sessionId:session.id,format:'oral-v1',status:'completed',source:'openai',profile:{role:'Data analyst'},version:1,week:[],result:{level:'B1',summary:'Explicas una experiencia concreta.',strengths:['Describes tu trabajo.'],priorities:['Añadir un resultado'],evidence:[],modules:Array.from({length:4},(_,i)=>({title:'Objetivo '+(i+1),reason:'Practicar una situación nueva.',objective:'Explicar una experiencia.',conversation:'Tell me about a project.',evidenceQuote:reviewText,exercise:'Ordena tu ejemplo.',masteryCheck:'Explicar una experiencia nueva.'})),changeReason:'La ruta parte de tus respuestas.'}}}
  if(!assessment){await route.fulfill({status:404,json:{error:'Diagnóstico no encontrado.'}});return}result={assessment};
 }
 if(url.pathname==='/api/learning')result={catalog:{},history:[],current:assessment,pending:null};
 if(url.pathname.startsWith('/api/route')){if(assessment){const route=buildConversationRoute(assessment);route.current=true;route.total=route.stages.flatMap(s=>s.steps).length;route.completed=0;route.percent=0;route.nextStepId=route.stages[0].steps[0].id;for(const stage of route.stages){stage.completed=0;for(const step of stage.steps)step.status=step.id===route.nextStepId?'current':'locked'}result={route}}else result={route:null}}
 await route.fulfill({json:result});
});
await page.addInitScript(()=>{
 window.__sent=[];window.__browserSTT=0;
 window.SpeechRecognition=class{constructor(){window.__browserSTT++}};
 window.WebSocket=class{
  readyState=0;bufferedAmount=0;
  constructor(){window.__socket=this;setTimeout(()=>{this.readyState=1;this.receive({type:'fluent.ready'})},20)}
  receive(e){this.onmessage?.({data:JSON.stringify(e)})}
  send(text){const e=JSON.parse(text);window.__sent.push(e);if(e.type==='fluent.end')setTimeout(()=>{this.receive({type:'response.created',response:{id:'farewell'}});this.receive({type:'response.output_audio_transcript.done',response_id:'farewell',item_id:'farewell-audio',transcript:'Thank you for your time. Goodbye.'});this.receive({type:'response.output_audio.delta',item_id:'farewell-audio',response_id:'farewell',delta:FluentRealtimeCore.pcmBase64(new Int16Array(24000).fill(900).buffer)});this.receive({type:'response.done',response:{id:'farewell',status:'completed'}});this.receive({type:'fluent.closed',completed:true,message:''})},10)}
  close(){this.readyState=3;this.onclose?.()}
 };
});
try{
 await page.goto(`http://127.0.0.1:${server.address().port}/#/aula`);
 assert.equal(await page.locator('[data-budget]').count(),0,'development reserve is absent from user header');
 const ownerPlan=await page.evaluate(()=>{commerce.data={plan:'owner',voice:{seconds:1800},limits:{real:{used:900,limit:null}},subscription:null};return billingView()});assert.ok(ownerPlan.includes('sin cupo mensual'));assert.ok(ownerPlan.includes('30 minutos'));assert.ok(!/Reserva|solicitudes|Lemon Squeezy/.test(ownerPlan));
 await page.locator('[data-conversation-mode=interview]').click();assert.equal(await page.evaluate(()=>schoolSessionOptions().mode),'interview');await page.screenshot({path:'qa/conversation-modes.png',fullPage:true,animations:'disabled'});
 await page.locator('[data-action=voice-start]').click();await page.waitForFunction(()=>realtimeVoice?.ready===true);
 assert.ok((await page.locator('#voice-learning-objective').textContent()).includes('Objetivo:'));assert.ok((await page.locator('.voice-context .mini-info').textContent()).includes('4 respuestas'));await page.screenshot({path:'qa/free-practice-goal-desktop.png',fullPage:true,animations:'disabled'});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'qa/free-practice-goal-mobile.png',fullPage:true,animations:'disabled'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.setViewportSize({width:1280,height:720});
 await page.waitForFunction(()=>window.__sent.some(e=>e.type==='input_audio_buffer.append'));
 assert.equal(await page.evaluate(()=>window.__browserSTT),0);
 await page.evaluate(()=>{
  const s=window.__socket;s.receive({type:'response.created',response:{id:'r1'}});s.receive({type:'response.output_item.added',response_id:'r1',item:{id:'a1',role:'assistant'}});
  s.receive({type:'conversation.item.added',item:{id:'a1',role:'assistant'}});s.receive({type:'response.output_audio_transcript.done',item_id:'a1',transcript:'Tell me about your experience.'});
  s.receive({type:'response.output_audio.delta',item_id:'a1',response_id:'r1',delta:FluentRealtimeCore.pcmBase64(new Int16Array(24000).fill(1000).buffer)});
 });
 await page.waitForFunction(()=>voice.status==='speaking');
 await page.evaluate(()=>window.__socket.receive({type:'input_audio_buffer.speech_started'}));
 const interrupt=await page.evaluate(()=>({cancel:window.__sent.find(e=>e.type==='response.cancel'),cut:window.__sent.find(e=>e.type==='conversation.item.truncate'),queued:realtimeVoice.playback.sources.size}));
 assert.equal(interrupt.cancel.response_id,'r1');assert.equal(interrupt.cut.item_id,'a1');assert.ok(interrupt.cut.audio_end_ms<1000);assert.equal(interrupt.queued,0);
 await page.evaluate(()=>{for(let i=0;i<3;i++)window.__socket.receive({type:'conversation.item.input_audio_transcription.completed',item_id:'u1',transcript:'I has five years of experience and I create weekly reports for customers.'})});
 assert.equal(await page.locator('.voice-line.user').count(),1);
 await page.locator('[data-action=voice-pause]').click();assert.equal(await page.evaluate(()=>realtimeVoice.stream.getAudioTracks()[0].enabled),false);
 await page.evaluate(()=>{window.__socket.receive({type:'input_audio_buffer.speech_started'});window.__socket.receive({type:'input_audio_buffer.speech_stopped'})});assert.equal(await page.evaluate(()=>voice.status),'paused');
 await page.locator('[data-action=voice-resume]').click();await page.waitForFunction(()=>voice.status==='listening');assert.equal(await page.evaluate(()=>realtimeVoice.stream.getAudioTracks()[0].enabled),true);
 await page.evaluate(()=>{const s=window.__socket;s.receive({type:'response.created',response:{id:'playback-ack'}});s.receive({type:'response.output_audio.delta',item_id:'ack-audio',response_id:'playback-ack',delta:FluentRealtimeCore.pcmBase64(new Int16Array(12000).fill(900).buffer)});s.receive({type:'response.done',response:{id:'playback-ack',status:'completed'}})});
 assert.equal(await page.evaluate(()=>window.__sent.some(e=>e.type==='fluent.playback.done'&&e.response_id==='playback-ack')),false,'Do not acknowledge generated but unplayed audio');
 await page.waitForFunction(()=>window.__sent.some(e=>e.type==='fluent.playback.done'&&e.response_id==='playback-ack'));
 await page.evaluate(()=>{window.__socket.receive({type:'response.created',response:{id:'limited'}});window.__socket.receive({type:'response.done',response:{id:'limited',status:'incomplete',status_details:{reason:'max_output_tokens'}}});window.__socket.receive({type:'fluent.notice',message:'Puedes seguir hablando.'})});
 assert.equal(await page.evaluate(()=>current()),'aula');assert.equal(await page.evaluate(()=>realtimeVoice.closed),false);assert.equal(await page.evaluate(()=>realtimeVoice.stream.getAudioTracks()[0].enabled),true);assert.equal(reviewCalls,0);
 await page.evaluate(()=>window.__finishedStream=realtimeVoice.stream);
 await page.locator('[data-action=voice-end]').click();await page.waitForFunction(()=>realtimeVoice?.playback.sources.size>0);
 assert.equal(await page.evaluate(()=>current()),'aula','The farewell must play before leaving the interview');assert.equal(reviewCalls,0);
 await page.locator('.evaluation-spinner').waitFor();assert.equal(await page.locator('.evaluation-loading[aria-busy=true]').count(),1);assert.ok(await page.locator('.evaluation-skeleton').isVisible());
 await page.screenshot({path:'qa/evaluation-loading-desktop.png',fullPage:true,animations:'disabled'});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'qa/evaluation-loading-mobile.png',fullPage:true,animations:'disabled'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.setViewportSize({width:1280,height:720});
 await page.waitForFunction(()=>school.busy);while(!releaseReview)await new Promise(r=>setTimeout(r,10));releaseReview();await page.waitForFunction(()=>current()==='resultado'&&school.review?.status==='completed');
 assert.equal(await page.evaluate(()=>window.__finishedStream.getAudioTracks()[0].readyState),'ended');
 assert.equal(reviewCalls,1);await page.getByRole('heading',{name:'Tus fortalezas',exact:true}).waitFor();assert.equal(await page.locator('del').textContent(),'I has');assert.ok((await page.locator('.review-score').textContent()).includes('8,5'));
 await page.getByRole('heading',{name:'Objetivo pendiente',exact:true}).waitFor();assert.equal(await page.evaluate(()=>!!(document.querySelector('.review-strengths').compareDocumentPosition(document.querySelector('.practice-outcome'))&Node.DOCUMENT_POSITION_FOLLOWING)),true);
 await page.evaluate(()=>{school.review.result.corrections.push({kind:'uncertain_transcription',original:'apps',replacement:'ads',reason:'Posible confusión al transcribir; no es un error confirmado.'});school.review.result.practiceOutcome=null;school.review.result.assessmentTarget={title:'Tu función',objective:'Explicar tu función principal.',criterion:'Identificar tu rol y una tarea propia.'};schoolRender()});
 await page.getByText('Posible confusión al transcribir',{exact:true}).waitFor();assert.equal(await page.locator('del').count(),1,'Only confirmed errors are crossed out');await page.getByRole('heading',{name:'Tu función',exact:true}).waitFor();
 await page.screenshot({path:'qa/conversation-feedback.png',fullPage:true,animations:'disabled'});
 await page.evaluate(id=>openReview('session',id),session.id);assert.equal(reviewCalls,1,'reopening a review must not regenerate it');
 await page.evaluate(()=>{learning.loaded=true;go('diagnostico')});await page.getByRole('button',{name:'Empezar mi diagnóstico oral'}).click();
 await page.getByRole('heading',{name:'Una entrevista laboral que se adapta a ti.'}).waitFor();assert.equal(await page.locator('[data-conversation-mode]').count(),0);assert.equal(await page.locator('[data-action=voice-start-text]').count(),0);
 await page.locator('[data-action=voice-start]').click();await page.waitForFunction(()=>realtimeVoice?.ready===true);assert.equal(session.purpose,'diagnostic');assert.equal(session.mode,'interview');
 await page.evaluate(()=>{window.__finishedStream=realtimeVoice.stream;window.__socket.receive({type:'response.output_audio.delta',item_id:'last-audio',response_id:'last-response',delta:FluentRealtimeCore.pcmBase64(new Int16Array(24000).fill(900).buffer)});window.__socket.receive({type:'fluent.closed',completed:true,message:'Diagnóstico finalizado.'});window.__socket.onclose?.()});
 assert.equal(await page.evaluate(()=>current()),'diagnostico','Do not navigate while final audio is queued');
 assert.ok(await page.evaluate(()=>realtimeVoice.playback.sources.size>0));assert.equal(reviewCalls,1);
 await page.waitForFunction(()=>current()==='resultado'&&school.review?.status==='completed'&&oralDiagnostic.result?.status==='completed');
 assert.equal(await page.evaluate(()=>window.__finishedStream.getAudioTracks()[0].readyState),'ended');assert.equal(diagnosisCalls,1);assert.equal(reviewCalls,2);
 await page.getByRole('heading',{name:'Tus fortalezas',exact:true}).waitFor();await page.getByRole('heading',{name:'Tu punto de partida: B1'}).waitFor();
 await page.screenshot({path:'qa/oral-diagnostic-feedback.png',fullPage:true,animations:'disabled'});
 await page.evaluate(id=>openReview('session',id),session.id);assert.equal(diagnosisCalls,1);assert.equal(reviewCalls,2);
 await page.locator('[data-action=oral-route]').click();await page.locator('.path-stage').first().waitFor();assert.equal(await page.locator('.path-stage').count(),4);
 await page.evaluate(()=>{learning.selection=null;school.voiceActivity=null;go('aula')});await page.locator('[data-action=voice-start]').click();await page.waitForFunction(()=>realtimeVoice?.ready);
 await page.evaluate(()=>window.__socket.receive({type:'fluent.closed',completed:false,message:'Se perdió la conexión.'}));await page.waitForFunction(()=>realtimeVoice?.closed&&!voice.active);
 assert.equal(await page.evaluate(()=>current()),'aula','Unexpected disconnect must stay in the room');assert.equal(reviewCalls,2);assert.equal(diagnosisCalls,1);
 assert.equal(await page.evaluate(()=>window.__browserSTT),0);
 assert.deepEqual(errors,[]);console.log('PASS: actual AudioWorklet capture + simulated WebSocket; start, audio, scoped interruption, transcript deduplication, pause/resume, finish and microphone release. Physical latency NOT measured.');
}finally{await browser.close();await new Promise(r=>server.close(r))}
