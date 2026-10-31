import test from 'node:test';import assert from 'node:assert/strict';
import {RealtimeRelay,realtimeConfig} from '../server/realtime.mjs';
import {newOralDiagnostic,oralSamples} from '../server/oral-diagnostic.mjs';
import {validatePayload} from '../server/ai.mjs';
import '../public/realtime-core.js';
class Socket{readyState=1;sent=[];send(s){this.sent.push(JSON.parse(s))}close(){this.readyState=3}}
const tick=()=>new Promise(r=>setTimeout(r,0));
function fixture(){const upstream=new Socket(),downstream=new Socket(),session={purpose:'diagnostic',mode:'interview',profile:{name:'Gabriel'},diagnostic:newOralDiagnostic()};const relay=new RealtimeRelay({upstream,downstream,session,save:async()=>{},authorize:async()=>{},usage:async()=>{},onClose:async()=>{},policy:{seconds:120,maxResponses:null,maxSegments:30}});relay.ready=true;return {relay,upstream,downstream,session}}
const complete=(relay,id)=>relay.event({type:'response.done',response:{id,status:'completed',output:[{type:'function_call',name:'diagnostic_step',call_id:'call-'+id,arguments:JSON.stringify({outcome:'clear',reason:'Responde a la pregunta.'})}]}});
test('Diagnostic analyzes committed audio without waiting for ASR and never plays the internal decision',async()=>{
 const {relay,upstream,downstream,session}=fixture();
 relay.event({type:'input_audio_buffer.committed',item_id:'u1'});
 relay.event({type:'input_audio_buffer.committed',item_id:'u2',previous_item_id:'u1'});
 await tick();assert.equal(upstream.sent.length,1,'The audio decision starts while both transcripts are still pending');
 const request=upstream.sent.at(-1).response;assert.equal(request.conversation,'none');assert.deepEqual(request.output_modalities,['text']);assert.deepEqual(request.input.map(x=>x.id),['u1','u2']);
 relay.event({type:'response.created',response:{id:'private'}});
 relay.event({type:'response.output_audio.delta',response_id:'private',item_id:'hidden',delta:'AA=='});
 relay.event({type:'response.output_audio_transcript.done',response_id:'private',item_id:'hidden',transcript:'Internal assessment must not be spoken.'});
 complete(relay,'private');await tick();assert.equal(session.diagnostic.steps.length,1);assert.deepEqual(session.diagnostic.steps[0].itemIds,['u1','u2']);
 assert.equal(upstream.sent.at(-1).response.tool_choice,'none','The next spoken question also starts before ASR finishes');
 relay.event({type:'conversation.item.input_audio_transcription.completed',item_id:'u2',transcript:'and I help customers.'});
 relay.event({type:'conversation.item.input_audio_transcription.completed',item_id:'u1',transcript:'My name is Gabriel'});await tick();
 assert.deepEqual(relay.snapshot().filter(m=>m.role==='user').map(m=>m.content),['My name is Gabriel','and I help customers.']);
 assert.ok(!downstream.sent.some(e=>e.response_id==='private'||e.response?.id==='private'));assert.ok(!relay.snapshot().some(m=>m.id==='hidden'));
 complete(relay,'private');await tick();assert.equal(upstream.sent.filter(e=>e.type==='response.create').length,2,'Duplicate completion does not generate another question');
 await relay.close();
});
test('Continuing to speak invalidates the old decision and includes every segment in the replacement',async()=>{
 const {relay,upstream,session}=fixture();relay.event({type:'input_audio_buffer.committed',item_id:'u1'});relay.event({type:'conversation.item.input_audio_transcription.completed',item_id:'u1',transcript:'I work'});await tick();
 relay.event({type:'response.created',response:{id:'old'}});relay.event({type:'input_audio_buffer.speech_started'});relay.event({type:'input_audio_buffer.speech_stopped'});
 relay.event({type:'input_audio_buffer.committed',item_id:'u2',previous_item_id:'u1'});relay.event({type:'conversation.item.input_audio_transcription.completed',item_id:'u2',transcript:'at a shop and I help customers.'});complete(relay,'old');await tick();
 assert.equal(session.diagnostic.steps.length,0);assert.deepEqual(upstream.sent.at(-1).response.input.map(i=>i.id),['u1','u2']);await relay.close();
});
test('Question generation waits for audible playback, not just response.done',async()=>{
 const {relay,upstream}=fixture();relay.event({type:'response.created',response:{id:'question'}});relay.event({type:'response.output_audio.delta',response_id:'question',item_id:'q',delta:'AA=='});relay.event({type:'response.done',response:{id:'question',status:'completed'}});
 relay.event({type:'input_audio_buffer.committed',item_id:'u'});relay.event({type:'conversation.item.input_audio_transcription.completed',item_id:'u',transcript:'My name is Gabriel.'});await tick();assert.equal(upstream.sent.length,0);
 relay.input({type:'fluent.playback.done',response_id:'wrong'});await tick();assert.equal(upstream.sent.length,0);
 relay.input({type:'fluent.playback.done',response_id:'question'});await tick();assert.equal(upstream.sent.filter(e=>e.type==='response.create').length,1);await relay.close();
});
test('Late commit order retains final words and long grouped evidence reaches the evaluator intact',async()=>{
 const {relay}=fixture();const log=new FluentRealtimeCore.Transcript(),events=[{type:'conversation.item.input_audio_transcription.completed',item_id:'u2',transcript:'Second part.'},{type:'conversation.item.input_audio_transcription.completed',item_id:'u1',transcript:'First part.'},{type:'input_audio_buffer.committed',item_id:'u1',previous_item_id:null},{type:'input_audio_buffer.committed',item_id:'u2',previous_item_id:'u1'}];
 for(const e of events){relay.event(e);log.event(e)}assert.deepEqual(relay.snapshot().map(m=>m.content),['First part.','Second part.']);assert.equal(log.values()[0].text,'First part. Second part.');
 const long='I explained my work and its result. '.repeat(60)+'This final detail must remain.';
 const samples=oralSamples({messages:[{id:'a',role:'user',content:long},{id:'b',role:'user',content:'And the customer understood.'}],diagnostic:{steps:[{itemId:'b',itemIds:['a','b'],stage:2,outcome:'clear'}]}});
 assert.equal(samples.find(s=>s.id==='challenge').text,long+'\nAnd the customer understood.');assert.equal(samples[0].text,'');assert.equal(validatePayload('diagnosis',{samples,oral:{steps:[]}}).samples[1].text,samples[1].text);await relay.close();
});
test('Transcription failure asks for repetition without lowering the difficulty',async()=>{
 const {relay,upstream,session}=fixture();session.diagnostic.stage=2;
 relay.event({type:'input_audio_buffer.committed',item_id:'u'});relay.event({type:'conversation.item.input_audio_transcription.failed',item_id:'u'});await tick();
 assert.equal(session.diagnostic.stage,2);assert.equal(session.diagnostic.steps[0].outcome,'unclear');assert.equal(upstream.sent.at(-1).response.tool_choice,'none');assert.match(upstream.sent.at(-1).response.instructions,/repeat or clarify/);await relay.close();
});
test('Diagnostic name is context only; input stays English and internal context is retained longer',()=>{
 const {relay,session}=fixture();const s=realtimeConfig(session).session;assert.equal(s.audio.input.transcription.model,'gpt-4o-transcribe');assert.equal(s.audio.input.transcription.language,'en');assert.match(s.audio.input.transcription.prompt,/Gabriel/);assert.match(s.instructions,/Never guess or anglicize/);assert.equal(s.truncation.token_limits.post_instructions,8192);
});
test('Interrupting before hearing the next question restores the previous answer for continuation',async()=>{
 const {relay,upstream,session}=fixture();relay.event({type:'input_audio_buffer.committed',item_id:'u1'});relay.event({type:'conversation.item.input_audio_transcription.completed',item_id:'u1',transcript:'My name is Gabriel.'});await tick();relay.event({type:'response.created',response:{id:'decision'}});complete(relay,'decision');await tick();assert.equal(session.diagnostic.stage,1);
 relay.event({type:'response.created',response:{id:'question'}});relay.event({type:'response.output_item.added',response_id:'question',item:{id:'q',role:'assistant'}});relay.event({type:'response.output_audio.delta',response_id:'question',item_id:'q',delta:'AA=='});
 relay.event({type:'input_audio_buffer.speech_started'});relay.input({type:'conversation.item.truncate',item_id:'q',content_index:0,audio_end_ms:50});assert.equal(session.diagnostic.stage,0);assert.equal(session.diagnostic.steps.length,0);
 relay.event({type:'response.done',response:{id:'question',status:'cancelled'}});relay.event({type:'input_audio_buffer.speech_stopped'});relay.event({type:'input_audio_buffer.committed',item_id:'u2',previous_item_id:'u1'});relay.event({type:'conversation.item.input_audio_transcription.completed',item_id:'u2',transcript:'My surname is unusual, let me spell it.'});await tick();assert.deepEqual(upstream.sent.at(-1).response.input.map(x=>x.id),['u1','u2']);await relay.close();
});
test('Finalization waits for a late transcript instead of dropping the final answer',async()=>{
 const {relay}=fixture();relay.event({type:'input_audio_buffer.committed',item_id:'last'});const closing=relay.close('',true);await tick();assert.equal(relay.closed,false);
 relay.event({type:'conversation.item.input_audio_transcription.completed',item_id:'last',transcript:'The final result was that the customer could use the application.'});await closing;assert.match(relay.snapshot()[0].content,/final result/);assert.equal(relay.session.diagnostic.transcriptionIncomplete,undefined);
});
test('Late ASR failure does not generate an extra question or approve incomplete evidence',async()=>{
 const {relay,upstream}=fixture();relay.event({type:'input_audio_buffer.committed',item_id:'u'});await tick();relay.event({type:'response.created',response:{id:'decision'}});complete(relay,'decision');await tick();
 relay.event({type:'response.created',response:{id:'question'}});relay.event({type:'conversation.item.input_audio_transcription.failed',item_id:'u'});relay.event({type:'response.done',response:{id:'question',status:'completed'}});await tick();
 assert.equal(upstream.sent.filter(e=>e.type==='response.create').length,2);await relay.close('',true);assert.equal(relay.session.diagnostic.transcriptionIncomplete,true);
});
test('ASR failure received during the audio decision requests clarification without lowering difficulty',async()=>{
 const {relay,session,upstream}=fixture();session.diagnostic.stage=2;relay.event({type:'input_audio_buffer.committed',item_id:'u'});await tick();relay.event({type:'response.created',response:{id:'decision'}});relay.event({type:'conversation.item.input_audio_transcription.failed',item_id:'u'});complete(relay,'decision');await tick();
 assert.equal(session.diagnostic.stage,2);assert.equal(session.diagnostic.steps[0].outcome,'unclear');assert.match(upstream.sent.at(-1).response.instructions,/repeat or clarify/);await relay.close('',true);assert.equal(relay.session.diagnostic.transcriptionIncomplete,undefined);
});
