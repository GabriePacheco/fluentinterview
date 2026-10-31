import test from 'node:test';import assert from 'node:assert/strict';
import {RealtimeRelay} from '../server/realtime.mjs';import {farewellText,isTerminalFarewell} from '../server/conversation-ending.mjs';
import {newOralDiagnostic} from '../server/oral-diagnostic.mjs';
class Socket{readyState=1;sent=[];send(text){this.sent.push(JSON.parse(text))}close(){this.readyState=3}}
const tick=()=>new Promise(r=>setTimeout(r,0));
function setup(session={mode:'interview'}){const upstream=new Socket(),downstream=new Socket();let closed=0;const relay=new RealtimeRelay({upstream,downstream,session,save:async()=>{},authorize:async()=>{},usage:async()=>{},onClose:async()=>closed++});relay.ready=true;return {relay,upstream,downstream,closed:()=>closed}}
function farewell(relay,session,id='bye'){relay.event({type:'response.created',response:{id}});relay.event({type:'response.output_item.added',response_id:id,item:{id:'a-'+id,role:'assistant'}});relay.event({type:'response.output_audio_transcript.done',response_id:id,item_id:'a-'+id,transcript:farewellText(session)});relay.event({type:'response.done',response:{id,status:'completed'}})}
test('An interviewer farewell closes once after generation without cancelling its audio',async()=>{
 const f=setup();farewell(f.relay,{mode:'interview'});await f.relay.closeTask;assert.equal(f.closed(),1);assert.equal(f.downstream.sent.find(e=>e.type==='fluent.closed').completed,true);assert.equal(f.upstream.sent.filter(e=>e.type==='response.cancel').length,0);assert.equal(f.upstream.sent.filter(e=>e.type==='response.create').length,0);
 assert.equal(isTerminalFarewell('You could say "Goodbye."'),false);assert.equal(isTerminalFarewell('Thank you. What did you do next?'),false);
});
test('Completing a tutor step generates a farewell before closing',async()=>{
 const session={mode:'tutor',learning:{routeStep:true,targetAnswers:1}},f=setup(session);
 f.relay.event({type:'response.output_audio_transcript.done',item_id:'q',transcript:'What did you do?'});f.relay.event({type:'conversation.item.input_audio_transcription.completed',item_id:'u',transcript:'I helped the customer.'});await tick();
 assert.equal(f.closed(),0);assert.equal(f.upstream.sent.filter(e=>e.type==='response.create').length,1);assert.match(f.upstream.sent.at(-1).response.instructions,/See you next time/);
 farewell(f.relay,session);await f.relay.closeTask;assert.equal(f.closed(),1);assert.ok(f.relay.snapshot().at(-1).content.includes('See you next time'));
});
test('Finish tool without a spoken farewell requests one and cannot create another question',async()=>{
 const f=setup();f.relay.event({type:'response.created',response:{id:'tool'}});f.relay.event({type:'response.done',response:{id:'tool',status:'completed',output:[{type:'function_call',name:'finish_conversation',call_id:'finish',arguments:'{}'}]}});await tick();assert.equal(f.closed(),0);assert.match(f.upstream.sent.at(-1).response.instructions,/Say ONLY/);assert.deepEqual(f.upstream.sent.at(-1).response.tools,[]);
 farewell(f.relay,{mode:'interview'});await f.relay.closeTask;assert.equal(f.closed(),1);
});
test('Manual finish while paused resumes only for the farewell; leaving the room makes no paid farewell',async()=>{
 const f=setup({mode:'tutor'});f.relay.paused=true;f.relay.input({type:'fluent.end'});f.relay.input({type:'fluent.end'});await tick();assert.equal(f.upstream.sent.filter(e=>e.type==='response.create').length,1);farewell(f.relay,{mode:'tutor'});await f.relay.closeTask;
 const abandoned=setup();abandoned.relay.input({type:'fluent.abort'});await abandoned.relay.closeTask;assert.equal(abandoned.upstream.sent.filter(e=>e.type==='response.create').length,0);assert.equal(abandoned.downstream.sent.find(e=>e.type==='fluent.closed').completed,false);
});

test('Automatic farewell keeps listening until playback ends; a continuation cancels the close',async()=>{
 const f=setup();f.relay.beginFarewell();await tick();
 f.relay.event({type:'response.created',response:{id:'bye'}});
 f.relay.event({type:'response.output_audio.delta',response_id:'bye',item_id:'bye-audio',delta:'AA=='});
 f.relay.event({type:'response.done',response:{id:'bye',status:'completed'}});await tick();
 assert.equal(f.closed(),0,'Generated audio is not yet heard');
 f.relay.event({type:'input_audio_buffer.speech_started'});
 f.relay.input({type:'fluent.playback.done',response_id:'bye'});await tick();assert.equal(f.closed(),0);
 f.relay.event({type:'input_audio_buffer.speech_stopped'});f.relay.event({type:'input_audio_buffer.committed',item_id:'continued'});
 f.relay.event({type:'conversation.item.input_audio_transcription.completed',item_id:'continued',transcript:'And the final result was a faster application.'});await tick();
 assert.equal(f.relay.ending,null);assert.equal(f.upstream.sent.filter(e=>e.type==='response.create').length,2);assert.match(f.relay.snapshot().at(-1).content,/final result/);await f.relay.close();
});

test('Interrupting a diagnostic farewell restores the last decision so the full answer is assessed',async()=>{
 const session={purpose:'diagnostic',mode:'interview',diagnostic:newOralDiagnostic()},f=setup(session);
 f.relay.decisionRollback={state:structuredClone(session.diagnostic),responseId:null};session.diagnostic.finished=true;
 f.relay.beginFarewell();await tick();f.relay.event({type:'response.created',response:{id:'bye'}});
 f.relay.event({type:'input_audio_buffer.speech_started'});f.relay.event({type:'response.done',response:{id:'bye',status:'cancelled'}});await tick();
 assert.equal(f.closed(),0);assert.equal(session.diagnostic.finished,false);assert.equal(f.relay.ending,null);await f.relay.close();
});

test('Late finish tool cannot end a newer candidate answer',async()=>{
 const f=setup();f.relay.event({type:'response.created',response:{id:'old'}});f.relay.event({type:'input_audio_buffer.speech_started'});
 f.relay.event({type:'response.done',response:{id:'old',status:'completed',output:[{type:'function_call',name:'finish_conversation',call_id:'old-finish',arguments:'{}'}]}});await tick();
 assert.equal(f.relay.ending,undefined);assert.equal(f.closed(),0);assert.match(f.upstream.sent.at(-1).item.output,/candidate_continued_speaking/);await f.relay.close();
});

test('An uninterrupted farewell closes only on its own playback acknowledgement',async()=>{
 const f=setup();f.relay.beginFarewell();await tick();f.relay.event({type:'response.created',response:{id:'bye'}});f.relay.event({type:'response.output_audio.delta',response_id:'bye',item_id:'bye-audio',delta:'AA=='});f.relay.event({type:'response.done',response:{id:'bye',status:'completed'}});await tick();assert.equal(f.closed(),0);
 f.relay.input({type:'fluent.playback.done',response_id:'old'});await tick();assert.equal(f.closed(),0);f.relay.input({type:'fluent.playback.done',response_id:'bye'});await f.relay.closeTask;assert.equal(f.closed(),1);assert.equal(f.downstream.sent.at(-1).completed,true);
});
