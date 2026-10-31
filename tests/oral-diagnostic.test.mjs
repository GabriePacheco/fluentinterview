import test from 'node:test';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {newOralDiagnostic,advanceDiagnostic,oralSamples} from '../server/oral-diagnostic.mjs';
import {RealtimeRelay,realtimeConfig} from '../server/realtime.mjs';
import {AssessmentService} from '../server/assessments.mjs';
import {SessionService} from '../server/sessions.mjs';
import {validResult,rawResult,draft} from './diagnostic-fixtures.mjs';
import {createAI} from '../server/ai.mjs';
const decision=outcome=>({outcome,reason:outcome==='clear'?'Responde a lo que se preguntó.':'Necesita una pregunta más sencilla.'});
const tick=()=>new Promise(r=>setTimeout(r,0));
function memory(){const values=new Map();let serial=Promise.resolve();const s={get:async k=>structuredClone(values.get(k)),put:async(k,v)=>values.set(k,structuredClone(v)),delete:async k=>values.delete(k),transaction(fn){const p=serial.then(()=>fn(s));serial=p.catch(()=>{});return p}};return s}
test('Adaptive paths diverge, unclear audio does not lower difficulty, names cannot establish level',()=>{
 let high=newOralDiagnostic(),low=newOralDiagnostic();
 for(let i=0;i<6;i++)high=advanceDiagnostic(high,'u'+i,decision('clear'));
 for(let i=0;i<4;i++)low=advanceDiagnostic(low,'u'+i,decision(i===0?'clear':'unable'));
 assert.deepEqual(high.steps.map(x=>x.stage),[0,1,2,3,4,4]);assert.equal(high.finished,true);
 assert.deepEqual(low.steps.map(x=>x.stage),[0,1,1,1]);assert.equal(low.endReason,'practice_boundary');
 let uncertain=advanceDiagnostic(newOralDiagnostic(),'a',decision('clear'));
 uncertain=advanceDiagnostic(uncertain,'b',decision('clear'));
 const before=uncertain.stage;uncertain=advanceDiagnostic(uncertain,'c',decision('unclear'));
 assert.equal(uncertain.stage,before);assert.equal(uncertain.struggles,0);
 assert.deepEqual(advanceDiagnostic(uncertain,'c',decision('unable')),uncertain);
 assert.equal(advanceDiagnostic(newOralDiagnostic(),'name',decision('clear')).finished,false);
 let bounded=newOralDiagnostic();for(let i=0;i<12;i++)bounded=advanceDiagnostic(bounded,'u'+i,decision(i%2?'partial':'clear'));assert.equal(bounded.finished,true);
});
class Socket extends EventTarget{readyState=1;sent=[];send(text){this.sent.push(JSON.parse(text))}close(){this.readyState=3}}
test('Relay requests one decision per answer, skips canceled calls, persists stages and closes automatically',async()=>{
 const upstream=new Socket(),downstream=new Socket(),session={purpose:'diagnostic',mode:'interview',profile:{role:'Data analyst'},diagnostic:newOralDiagnostic()};let saved,ended=0;
 const relay=new RealtimeRelay({upstream,downstream,session,save:async(messages,diagnostic)=>saved={messages,diagnostic},authorize:async()=>{},usage:async()=>{},onClose:async()=>ended++,policy:{seconds:120,maxResponses:null,maxSegments:30}});
 try{
 relay.start();const config=realtimeConfig(session).session;assert.equal(config.tools[0].name,'diagnostic_step');assert.equal(config.audio.input.turn_detection.silence_duration_ms,1600);
 relay.event({type:'session.updated',session:config});await tick();assert.equal(upstream.sent.at(-1).response.tool_choice,'none');assert.match(upstream.sent.at(-1).response.instructions,/candidate name/);
 relay.event({type:'response.created',response:{id:'opening'}});relay.event({type:'response.done',response:{id:'opening',status:'completed'}});
 for(let i=0;i<4;i++){
  relay.event({type:'input_audio_buffer.committed',item_id:'u'+i});relay.event({type:'conversation.item.input_audio_transcription.completed',item_id:'u'+i,transcript:i?'I work in a shop and I help customers every day.':'My name is Ana.'});await tick();
  assert.equal(upstream.sent.at(-1).response.tool_choice.name,'diagnostic_step');
  if(i===0){relay.event({type:'response.created',response:{id:'canceled'}});relay.event({type:'response.done',response:{id:'canceled',status:'cancelled',output:[{type:'function_call',name:'diagnostic_step',call_id:'bad',arguments:JSON.stringify(decision('unable'))}]}});assert.equal(session.diagnostic.steps.length,0);relay.request();await tick()}
  relay.event({type:'response.created',response:{id:'d'+i}});
  const done={type:'response.done',response:{id:'d'+i,status:'completed',output:[{type:'function_call',name:'diagnostic_step',call_id:'call'+i,arguments:JSON.stringify(decision(i?'unable':'clear'))}]}};
  relay.event(done);relay.event(done);await tick();assert.equal(session.diagnostic.steps.length,i+1);
  if(i<3){assert.equal(upstream.sent.at(-1).response.tool_choice,'none');relay.event({type:'response.created',response:{id:'question'+i}});relay.event({type:'response.done',response:{id:'question'+i,status:'completed'}})}
 }
 assert.equal(ended,0,'Wait for the spoken farewell before closing');assert.match(upstream.sent.at(-1).response.instructions,/farewell/);
 relay.event({type:'response.created',response:{id:'farewell'}});relay.event({type:'response.output_audio_transcript.done',response_id:'farewell',item_id:'bye',transcript:'Thank you for your time. Goodbye.'});relay.event({type:'response.done',response:{id:'farewell',status:'completed'}});await relay.closeTask;
 assert.equal(ended,1);assert.equal(saved.messages.filter(x=>x.role==='user').length,4);assert.equal(saved.diagnostic.finished,true);
 assert.equal(upstream.sent.filter(x=>x.item?.type==='function_call_output').length,0,'Private decisions do not enter the spoken conversation');
 }finally{await relay.close()}
});
test('Completed oral evidence creates one route, preserves prior routes with insufficient evidence and rejects other owners',async()=>{
 const storage=memory();let calls=0;
 const sessions=new SessionService(storage,{source:'openai',run:async()=>{throw Error('No conversation call')},budget:async()=>({})});
 const service=new AssessmentService(storage,{source:'openai',budget:async()=>({}),run:async(source,input)=>{calls++;const result=validResult(input);const nonempty=input.samples.filter(s=>s.text);result.evidence=nonempty.slice(0,2).map(s=>({sampleId:s.id,quote:s.text.slice(0,30),observation:'Evidencia concreta.'}));for(const m of result.modules)m.evidenceQuote=nonempty[0].text.slice(0,30);return {result}}});service.sessionFor=(uid,id)=>sessions.get(uid,id);
 const s=await sessions.create('alice',{id:crypto.randomUUID(),purpose:'diagnostic',profile:{}},true);
 await assert.rejects(()=>service.fromSession('bob',s.id,true),{status:404});await assert.rejects(()=>service.fromSession('alice',s.id,true),{status:409});
 let state=newOralDiagnostic();const messages=[];for(let i=0;i<6;i++){state=advanceDiagnostic(state,'u'+i,decision('clear'));messages.push({id:'u'+i,role:'user',content:i?'I helped customers solve a problem by comparing the available options and explaining the result.':'My name is Ana.'})}
 await storage.put(sessions.key('alice',s.id),{...s,status:'completed',transport:'realtime',diagnostic:state,messages});
 const results=await Promise.all([service.fromSession('alice',s.id,true),service.fromSession('alice',s.id,true)]);assert.equal(calls,1);assert.equal(results[0].assessment.status,'completed');assert.deepEqual(results[0].assessment.scores.skills,{});
 await service.fromSession('alice',s.id,true);assert.equal(calls,1);
 const short=await sessions.create('alice',{id:crypto.randomUUID(),purpose:'diagnostic'},true);await storage.put(sessions.key('alice',short.id),{...short,status:'completed',transport:'realtime',messages:[{id:'x',role:'user',content:'My name is Ana.'}]});
 assert.equal((await service.fromSession('alice',short.id,true)).assessment.status,'insufficient');assert.equal(calls,1);assert.equal((await service.state('alice')).current.id,s.id);
 assert.equal(oralSamples({messages:[{id:'bad',role:'user',content:'Wrong recognition'}],diagnostic:{steps:[{itemId:'bad',stage:2,outcome:'unclear'}]}}).every(s=>!s.text),true);
});
test('Diagnosis adapter carries oral evidence and accepts a validated structured response without network',async()=>{
 const input=draft(crypto.randomUUID());input.oral={steps:[{stage:1,outcome:'clear',reason:'Responde a la pregunta.'}],endReason:'evidence_complete'};let sent;
 const ai=createAI({mode:'openai',apiKey:'fixture',ledger:{reserve:async()=>{},recordUsage:async()=>{},snapshot:async()=>({})},fetchImpl:async(url,options)=>{sent=JSON.parse(options.body);return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(rawResult(input))}}],usage:{}})}});
 const result=await ai.run('diagnosis',input);assert.equal(result.result.level,'B1');assert.match(sent.messages[0].content,/adaptive spoken job-interview/);assert.deepEqual(JSON.parse(sent.messages[1].content).oral,input.oral);
});
