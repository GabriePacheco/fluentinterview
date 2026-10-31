import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {RealtimeRelay,RealtimeService,realtimeConfig} from '../server/realtime.mjs';
import '../public/realtime-core.js';
const {Playback,Transcript,pcmBase64}=globalThis.FluentRealtimeCore;
class Socket extends EventTarget{readyState=1;sent=[];send(s){this.sent.push(JSON.parse(s))}close(){this.readyState=3}}
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
test('Incomplete generation stays connected; speech fragments count as one answer',async()=>{
 const upstream=new Socket(),downstream=new Socket();let closed=0,authorized=0;
 const relay=new RealtimeRelay({upstream,downstream,session:{mode:'tutor',profile:{}},save:async()=>{},authorize:async()=>authorized++,usage:async()=>{},onClose:async()=>closed++});
 const config=realtimeConfig({mode:'tutor',profile:{}}).session;
 assert.equal(config.max_output_tokens,1536);assert.equal(config.audio.input.transcription.language,'en');assert.equal(config.audio.input.turn_detection.silence_duration_ms,1600);assert.equal(config.audio.input.turn_detection.interrupt_response,true);
 relay.ready=true;relay.event({type:'response.created',response:{id:'r'}});
 relay.event({type:'response.done',response:{id:'r',status:'incomplete',status_details:{reason:'max_output_tokens'}}});await tick();
 assert.equal(closed,0);assert.equal(authorized,0,'No paid automatic retry');assert.equal(relay.active,null);assert.equal(relay.wantResponse,false);
 for(const [item_id,transcript] of [['one','I was creating software'],['two','to simulate job interviews.']])relay.event({type:'conversation.item.input_audio_transcription.completed',item_id,transcript});
 assert.equal(relay.snapshot().length,1);assert.equal(relay.snapshot()[0].content,'I was creating software to simulate job interviews.');
 const log=new Transcript();for(const [item_id,transcript] of [['one','I was creating software'],['two','to simulate job interviews.']])log.event({type:'conversation.item.input_audio_transcription.completed',item_id,transcript});
 assert.equal(log.values().length,1);assert.equal(log.values()[0].text,relay.snapshot()[0].content);assert.equal(log.items.get('one').text,'I was creating software');
 relay.event({type:'response.output_audio_transcript.done',item_id:'question',transcript:'What did you build?'});relay.event({type:'input_audio_buffer.committed',item_id:'three'});relay.event({type:'conversation.item.input_audio_transcription.completed',item_id:'three',transcript:'I built a demo.'});await tick();
 assert.equal(authorized,1);assert.equal(relay.snapshot().filter(x=>x.role==='user').length,2);await relay.close();
});
test('A route transcript never cancels the final response; completion is explicit',async()=>{
 const upstream=new Socket(),downstream=new Socket();let closed=0;
 const relay=new RealtimeRelay({upstream,downstream,session:{mode:'tutor',learning:{routeStep:true,targetAnswers:1}},save:async()=>{},authorize:async()=>{},usage:async()=>{},onClose:async()=>closed++});
 relay.event({type:'response.output_item.added',response_id:'r',item:{id:'a',role:'assistant'}});
 relay.input({type:'conversation.item.truncate',item_id:'a',content_index:0,audio_end_ms:0}); // output item may precede conversation.item.added
 relay.event({type:'response.output_audio_transcript.done',item_id:'q',transcript:'What do you do?'});
 relay.event({type:'response.created',response:{id:'r'}});
 relay.event({type:'conversation.item.input_audio_transcription.completed',item_id:'u',transcript:'I sell food.'});
 assert.equal(closed,0);assert.equal(upstream.sent.filter(e=>e.type==='response.cancel').length,0);
 relay.event({type:'response.done',response:{id:'r',status:'completed'}});await relay.closeTask;
 assert.equal(closed,1);assert.equal(downstream.sent.find(e=>e.type==='fluent.closed').completed,true);
 const tutor=realtimeConfig({mode:'tutor',learning:{level:'C1'},profile:{role:'Engineer'}}).session;
 assert.match(tutor.instructions,/latest independent answers override/);assert.match(tutor.instructions,/Only the brief correction/);assert.match(tutor.instructions,/Never translate/);
 assert.equal(tutor.audio.input.transcription.language,'en');
});
test('Playback truncates at device playhead, stops scheduled sources and rejects stale chunks',()=>{
 const sources=[];const context={currentTime:10,outputLatency:.1,createBuffer:()=>({copyToChannel(){}}),createBufferSource:()=>{const s={connect(){},disconnect(){},start(){},stop(){this.stopped=true}};sources.push(s);return s}};
 const playback=new Playback(context),delta=pcmBase64(new Int16Array(24000).buffer);
 playback.append({item_id:'a',response_id:'r',delta});playback.append({item_id:'a',response_id:'r',delta});
 context.currentTime=10.615;const cuts=playback.interrupt('r');
 assert.equal(cuts.length,1);assert.ok(Math.abs(cuts[0].audio_end_ms-500)<=1);assert.equal(cuts[0].item_id,'a');assert.ok(sources.every(s=>s.stopped));assert.equal(playback.sources.size,0);
 playback.append({item_id:'a',response_id:'r',delta});assert.equal(sources.length,2);
 playback.append({item_id:'b',response_id:'new',delta});assert.equal(sources.length,3);
});
test('Transcripts replace final text, ignore late deltas and keep interruption markers',()=>{
 const log=new Transcript();log.event({type:'input_audio_buffer.committed',item_id:'u'});
 for(const transcript of ['I work here.','I work here.'])log.event({type:'conversation.item.input_audio_transcription.completed',item_id:'u',transcript});
 log.event({type:'conversation.item.input_audio_transcription.delta',item_id:'u',delta:'repetition'});
 assert.equal(log.values().length,1);assert.equal(log.values()[0].text,'I work here.');
 log.event({type:'response.output_audio_transcript.done',item_id:'a',transcript:'Never heard in full'});log.truncate('a');log.event({type:'response.output_audio_transcript.done',item_id:'a',transcript:'late'});
 assert.equal(log.values()[1].text,'[Respuesta interrumpida]');
});
test('Capture resamples 44.1/48 kHz without drift and pause discards buffered audio',()=>{
 for(const sampleRate of [44100,48000]){
  let Processor;const buffers=[];const context={sampleRate,AudioWorkletProcessor:class{port={postMessage:b=>buffers.push(b)}},registerProcessor:(name,p)=>Processor=p};
  vm.runInNewContext(fs.readFileSync('public/pcm-capture.js','utf8'),context);const p=new Processor();
  for(let i=0;i<sampleRate;i+=128)p.process([[new Float32Array(Math.min(128,sampleRate-i)).fill(.5)]]);
  assert.equal(buffers.reduce((n,b)=>n+b.byteLength/2,0),24000);assert.equal(new Int16Array(buffers[0])[0],16384);
  p.port.onmessage({data:{enabled:false}});p.process([[new Float32Array(48000).fill(1)]]);assert.equal(buffers.length,25);
 }
});
test('Relay enforces configuration, response cap, scoped cancellation and transcript persistence',async()=>{
 const upstream=new Socket(),downstream=new Socket();let saved,closed=0;
 const relay=new RealtimeRelay({upstream,downstream,session:{mode:'interview',profile:{}},save:async m=>saved=m,authorize:async()=>{},usage:async()=>{},onClose:async()=>closed++});
 relay.start();const config=upstream.sent[0].session;
 assert.equal(config.audio.input.turn_detection.silence_duration_ms,1600);assert.equal(config.audio.output.voice,'alloy');assert.equal(config.audio.input.turn_detection.create_response,false);
 assert.throws(()=>relay.input({type:'session.update',session:{max_output_tokens:999999}}));
 relay.event({type:'session.updated',session:config});await tick();assert.equal(upstream.sent.filter(e=>e.type==='response.create').length,1);
 relay.event({type:'response.created',response:{id:'r'}});relay.event({type:'conversation.item.added',item:{id:'a',role:'assistant'}});
 relay.input({type:'response.cancel',response_id:'wrong'});assert.equal(upstream.sent.filter(e=>e.type==='response.cancel').length,0);
 relay.input({type:'response.cancel',response_id:'r'});assert.equal(upstream.sent.at(-1).response_id,'r');
 relay.input({type:'conversation.item.truncate',item_id:'a',content_index:0,audio_end_ms:2300});
 relay.event({type:'response.output_audio_transcript.done',item_id:'a',transcript:'not heard'});
 relay.event({type:'response.done',response:{id:'r'}});
 relay.event({type:'input_audio_buffer.committed',item_id:'u',previous_item_id:'a'});
 relay.responses=6;await tick();
 relay.event({type:'conversation.item.input_audio_transcription.completed',item_id:'u',transcript:'My name is Alex.'});await relay.close();
 assert.equal(closed,1);assert.equal(saved.filter(x=>x.role==='user').length,1);assert.ok(saved[0].interrupted);assert.ok(!saved.some(x=>x.content==='not heard'));assert.equal(upstream.readyState,3);
});
test('Single-use ticket, budget preservation and provider failure never retry or refund',async()=>{
 let values=new Map([['ledger',{reserved:3700000,attempts:74,usageEstimate:.045}]]),queue=Promise.resolve();
 const storage={get:async key=>structuredClone(values.get(key)),put:async(k,v)=>values.set(k,structuredClone(v)),delete:async k=>values.delete(k),transaction(fn){const task=queue.then(async()=>{const next=structuredClone(values),result=await fn({get:async k=>structuredClone(next.get(k)),put:async(k,v)=>next.set(k,structuredClone(v)),delete:async k=>next.delete(k)});values=next;return result});queue=task.catch(()=>{});return task}};
 const id=crypto.randomUUID(),session={id,source:'openai',status:'active',messages:[]};await storage.put('s:alice:'+id,session);
 const owner={storage,env:{AI_MODE:'openai',OPENAI_API_KEY:'test',AI_BUDGET_USD:'6'},commerce:{guard:async()=>{},reserve:async()=>({key:'quota:alice',value:{real:1}})},sessions:{key:(u,id)=>'s:'+u+':'+id,get:async(u,id)=>{const s=await storage.get('s:'+u+':'+id);if(!s)throw Object.assign(Error('missing'),{status:404});return s},end:async()=>{}}};
 let calls=0;const service=new RealtimeService(owner,{fetchImpl:async()=>{calls++;throw Error('offline')}});
 await assert.rejects(()=>service.ticket('alice',id,false),{status:403});await assert.rejects(()=>service.ticket('bob',id,true),{status:404});
 const ticket=await service.ticket('alice',id,true),request=new Request('https://budget/realtime/connect?uid=alice&ticket='+ticket.ticket,{headers:{Upgrade:'websocket'}});
 await assert.rejects(()=>service.connect(request),/offline/);await assert.rejects(()=>service.connect(request),{status:401});
 const ledger=await storage.get('ledger');assert.equal(calls,1);assert.equal(ledger.reserved,3730000);assert.equal(ledger.attempts,75);assert.equal(ledger.usageEstimate,.045);
 const id2=crypto.randomUUID();await storage.put('s:alice:'+id2,{...session,id:id2});await storage.put('ledger',{...ledger,reserved:5990000});
 const ticket2=await service.ticket('alice',id2,true);await assert.rejects(()=>service.connect(new Request('https://budget/realtime/connect?uid=alice&ticket='+ticket2.ticket,{headers:{Upgrade:'websocket'}})),{status:402});assert.equal(calls,1);
 owner.commerce.key=uid=>'account:'+uid;await storage.put('ledger',{...ledger,reserved:5800000});
 const reservations=await Promise.allSettled(Array.from({length:4},()=>service.reserveResponse('alice')));assert.equal(reservations.filter(x=>x.status==='fulfilled').length,2);assert.equal((await storage.get('ledger')).reserved,6000000);
});
