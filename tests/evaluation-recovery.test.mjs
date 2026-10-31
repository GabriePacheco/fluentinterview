import test from 'node:test';
import assert from 'node:assert/strict';
import {createAI} from '../server/ai.mjs';
import {AssessmentService} from '../server/assessments.mjs';
import {FeedbackService} from '../server/feedback.mjs';
import {sourceQuote} from '../server/evaluation-policy.mjs';
import {draft,rawResult,validResult} from './diagnostic-fixtures.mjs';
import {memory,routeFixture,finishAttempt} from './route-fixtures.mjs';

test('Typography is recovered from original evidence; invented or corrected words are not accepted',()=>{
 assert.equal(sourceQuote('I’m a developer.\nI build apps.',"I'm a developer. I build apps."),'I’m a developer.\nI build apps.');
 assert.equal(sourceQuote('I has experience.','I have experience.'),null);
});
test('A definite invalid output is repaired once, retaining evidence and accounting for both calls',async()=>{
 const input=draft(crypto.randomUUID());let calls=0,reservations=0,usages=0;
 const ai=createAI({mode:'openai',apiKey:'fixture',ledger:{reserve:async()=>reservations++,recordUsage:async()=>usages++,snapshot:async()=>({})},fetchImpl:async(url,options)=>{
  calls++;const body=JSON.parse(options.body);assert.deepEqual(JSON.parse(body.messages[1].content).samples,input.samples);
  const result=rawResult(input);if(calls===1)result.evidence[0].quote='Invented words';else assert.match(body.messages.at(-1).content,/previous output failed/);
  return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}],usage:{prompt_tokens:1,completion_tokens:1}});
 }});
 const {result}=await ai.run('diagnosis',{profile:input.profile,samples:input.samples,scores:{skills:{}}});
 assert.equal(result.level,'B1');assert.equal(calls,2);assert.equal(reservations,2);assert.equal(usages,2);
});
test('Ambiguous provider failures and refusals never trigger automatic paid repair',async()=>{
 for(const failure of ['connection','refusal']){let calls=0;
  const ai=createAI({mode:'openai',apiKey:'fixture',ledger:{reserve:async()=>{},recordUsage:async()=>{},snapshot:async()=>({})},fetchImpl:async()=>{calls++;if(failure==='connection')throw Error('timeout');return Response.json({choices:[{finish_reason:'stop',message:{refusal:'refused'}}]})}});
  const input=draft(crypto.randomUUID());await assert.rejects(()=>ai.run('diagnosis',{profile:input.profile,samples:input.samples}));assert.equal(calls,1);
 }
});
test('Saved oral diagnosis can be reevaluated without changing samples or charging stale retries',async()=>{
 const storage=memory();let calls=0;const service=new AssessmentService(storage,{source:'openai',budget:async()=>({}),run:async(_,input)=>{calls++;if(calls===1)throw Error('La evaluación contiene una cita que no está en tus respuestas.');return {result:validResult(input)}}});
 const id=crypto.randomUUID(),input=draft(id);
 const session={id,purpose:'diagnostic',transport:'realtime',status:'completed',source:'openai',profile:input.profile,messages:input.samples.map((s,i)=>({id:'u'+i,role:'user',content:s.text})),diagnostic:{steps:[1,2,3].map((stage,i)=>({itemId:'u'+i,stage,outcome:'clear',reason:'Respuesta pertinente.'})),endReason:'evidence_complete'}};
 service.sessionFor=async uid=>{if(uid!=='owner')throw Object.assign(Error('Not found'),{status:404});return session};
 const failed=(await service.fromSession('owner',id,true)).assessment;assert.equal(failed.status,'failed');assert.equal(failed.attempt,1);
 assert.equal((await service.fromSession('owner',id,true)).assessment.status,'failed');assert.equal(calls,1);
 await assert.rejects(()=>service.fromSession('other',id,true,{retryAttempt:1}),{status:404});
 const [a,b]=await Promise.all([service.fromSession('owner',id,true,{retryAttempt:1}),service.fromSession('owner',id,true,{retryAttempt:1})]);
 assert.equal(a.assessment.status,'completed');assert.equal(b.assessment.status,'completed');assert.equal(a.assessment.attempt,2);assert.deepEqual(a.assessment.samples,failed.samples);assert.equal(calls,2);
 await service.fromSession('owner',id,true,{retryAttempt:1});assert.equal(calls,2);
});
test('Recovered practice review updates a previously failed route attempt and preserves its pass',async()=>{
 const f=await routeFixture();await f.routes.state('alice');
 const {session}=await f.routes.start('alice',{id:crypto.randomUUID(),routeId:f.record.id,stepId:'m0s0'},true);
 await finishAttempt(f,session,9);const key=`feedback:alice:session:${session.id}`,good=await f.storage.get(key);
 await f.storage.put(key,{status:'failed',source:'openai',attempt:1,error:'Fallo de formato.'});await f.routes.captureReview('alice',session.id);
 let calls=0;const feedback=new FeedbackService(f.storage,{evidence:(uid,kind,id)=>f.sessions.evidence(uid,id),budget:async()=>({}),run:async()=>{calls++;return {result:good.result}}});
 const [a,b]=await Promise.all([feedback.evaluate('alice','session',session.id,true,{retryAttempt:1}),feedback.evaluate('alice','session',session.id,true,{retryAttempt:1})]);
 assert.equal(a.review.status,'completed');assert.equal(b.review.attempt,2);assert.equal(calls,1);
 await f.routes.captureReview('alice',session.id);assert.equal((await f.routes.state('alice')).route.completed,1);
 await feedback.evaluate('alice','session',session.id,true,{retryAttempt:1});assert.equal(calls,1);
});
