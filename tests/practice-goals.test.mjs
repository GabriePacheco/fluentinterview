import test from 'node:test';import assert from 'node:assert/strict';
import {buildPracticeGoal,countPracticeAnswers,practiceOutcome} from '../server/practice-goals.mjs';
import {RealtimeRelay,realtimeConfig} from '../server/realtime.mjs';
import {scoreReview} from '../server/review-model.mjs';
import {SessionService} from '../server/sessions.mjs';import {FeedbackService} from '../server/feedback.mjs';
class Socket{readyState=1;sent=[];send(s){this.sent.push(JSON.parse(s))}close(){this.readyState=3}}
const tick=()=>new Promise(r=>setTimeout(r,0));
test('Free goals use the existing objective/level and exclude diagnostic and route steps',()=>{
 const g=buildPracticeGoal({mode:'tutor',learning:{level:'A1',title:'Tu aportación',objective:'Explicar tu tarea.'}});assert.equal(g.targetAnswers,3);assert.equal(g.objective,'Explicar tu tarea.');
 assert.equal(buildPracticeGoal({mode:'interview',interviewType:'project'}).title,'Defiende una decisión de tu proyecto');assert.equal(buildPracticeGoal({purpose:'diagnostic'}),null);assert.equal(buildPracticeGoal({learning:{routeStep:true}}),null);
 const prompt=realtimeConfig({mode:'tutor',practiceGoal:g}).session.instructions;assert.ok(!prompt.includes('briefly acknowledge a strength'));assert.match(prompt,/strengths come first only in the final evaluation/);
});
test('Four independent answers end voice practice; pauses and delayed ASR do not create extra questions',async()=>{
 const session={mode:'tutor',practiceGoal:buildPracticeGoal({mode:'tutor'})},upstream=new Socket(),downstream=new Socket();let ended=0;
 const relay=new RealtimeRelay({upstream,downstream,session,save:async()=>{},authorize:async()=>{},usage:async()=>{},onClose:async()=>ended++,policy:{seconds:480,maxResponses:null,maxSegments:30}});relay.ready=true;
 for(let i=0;i<4;i++){
  relay.event({type:'response.created',response:{id:'q'+i}});relay.event({type:'response.output_audio_transcript.done',response_id:'q'+i,item_id:'qitem'+i,transcript:'What was your contribution?'});relay.event({type:'response.done',response:{id:'q'+i,status:'completed'}});
  for(let part=0;part<2;part++){const id=`u${i}-${part}`;relay.event({type:'input_audio_buffer.committed',item_id:id});if(i<3||part===0)relay.event({type:'conversation.item.input_audio_transcription.completed',item_id:id,transcript:part?'and explained the result.':'I helped the customer'});}
  await tick();assert.equal(upstream.sent.filter(e=>e.type==='response.create').length,Math.min(i+1,3));
 }
 assert.equal(ended,0);assert.equal(relay.practiceWaiting,true);
 relay.event({type:'conversation.item.input_audio_transcription.completed',item_id:'u3-1',transcript:'and explained the final result.'});await tick();
 assert.equal(upstream.sent.filter(e=>e.type==='response.create').length,4);assert.match(upstream.sent.at(-1).response.instructions,/farewell/);assert.equal(countPracticeAnswers(relay.snapshot()),4);
 relay.event({type:'response.created',response:{id:'bye'}});relay.event({type:'response.done',response:{id:'bye',status:'completed'}});await relay.closeTask;assert.equal(ended,1);assert.equal(downstream.sent.at(-1).completed,true);
});
test('Objective requires the full practice and at least 9, without rounding 8.95 into a pass',()=>{
 const goal=buildPracticeGoal({mode:'tutor'}),result=points=>({nextStep:'Añade un resultado concreto.',scoring:scoreReview(Object.fromEntries(['relevance','structure','evidence','english'].map(k=>[k,{points,reason:'Evidencia'}])))});
 assert.equal(practiceOutcome(goal,result(8.95),4).achieved,false);assert.equal(practiceOutcome(goal,result(9),4).achieved,true);assert.equal(practiceOutcome(goal,result(10),1).achieved,false);
 assert.equal(countPracticeAnswers([{role:'user',content:'I helped'},{role:'assistant',interrupted:true,content:'cut'},{role:'user',content:'my team.'}]),1);
});
test('The saved review receives the goal and preserves its outcome without a second evaluation',async()=>{
 const values=new Map(),storage={get:async k=>structuredClone(values.get(k)),put:async(k,v)=>values.set(k,structuredClone(v)),transaction:async fn=>fn(storage)},goal=buildPracticeGoal({mode:'tutor'}),id=crypto.randomUUID();
 const sessions=new SessionService(storage,{source:'openai'}),messages=[];for(let i=0;i<4;i++)messages.push({role:'assistant',content:'Tell me about a task.'},{role:'user',content:'I explained the process to a customer and helped them finish their application.'});
 await storage.put(sessions.key('u',id),{id,source:'openai',status:'completed',mode:'tutor',profile:{},practiceGoal:goal,messages,feedback:[],requests:{}});
 let calls=0;const feedback=new FeedbackService(storage,{source:'openai',evidence:()=>sessions.evidence('u',id),budget:async()=>({}),run:async(_source,input)=>{calls++;assert.match(input.context,/Objetivo:/);assert.ok(input.context.includes(goal.objective));return {result:{nextStep:'Practica un ejemplo nuevo.',scoring:{score:9,passed:true}}}}});
 const first=await feedback.evaluate('u','session',id,true);assert.equal(first.review.result.practiceOutcome.achieved,true);const again=await feedback.evaluate('u','session',id,true);assert.deepEqual(again.review.result.practiceOutcome,first.review.result.practiceOutcome);assert.equal(calls,1);
});
