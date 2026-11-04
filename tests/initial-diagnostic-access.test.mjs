import test from 'node:test';import assert from 'node:assert/strict';
import {CommerceService} from '../server/commerce.mjs';import {AssessmentService} from '../server/assessments.mjs';
import {hasInitialRoute,initialRouteKey} from '../server/diagnostic-access.mjs';import {memory} from './route-fixtures.mjs';import {draft,validResult} from './diagnostic-fixtures.mjs';
import {BudgetCoordinator} from '../worker/index.mjs';import {rawResult} from './diagnostic-fixtures.mjs';
async function setup(){const storage=memory(),commerce=new CommerceService(storage,{env:{USER_BILLING_ENABLED:'true',ADMIN_UID:'owner'}});await commerce.touch({uid:'member',email:'member@example.com'});await storage.put('quota:member',{period:new Date().toISOString().slice(0,7),real:10,test:0});return {storage,commerce}}

test('Initial voice, feedback and evaluation are included even with exhausted monthly practice',async()=>{
 const {storage,commerce}=await setup(),id=crypto.randomUUID(),key='sessions:member:'+id;
 await storage.put(key,{id,source:'openai',purpose:'diagnostic',status:'active',createdAt:100});
 await commerce.consume('member','openai',undefined,{kind:'voice',sessionId:id});
 await storage.put(key,{...await storage.get(key),status:'completed'});
 await storage.put('assessment:member:'+id,{id,sessionId:id,source:'openai',status:'pending',createdAt:200});
 let recordedCalls=0;for(let i=0;i<3;i++)await commerce.consume('member','openai',()=>recordedCalls++,{kind:'diagnosis',sessionId:id});
 await storage.put(initialRouteKey('member'),{assessmentId:id,completedAt:300});
 assert.equal((await storage.get('quota:member')).real,10);assert.equal(recordedCalls,3);assert.equal((await commerce.state({uid:'member'})).initialDiagnosticIncluded,false);
});

test('Saved failed diagnosis recovers without quota; completion survives deleting that diagnosis',async()=>{
 const {storage,commerce}=await setup(),input=draft(crypto.randomUUID());let failOnce=true;
 const assessments=new AssessmentService(storage,{source:'openai',budget:async()=>({}),run:async(_,data,{sessionId})=>{
  await commerce.consume('member','openai',undefined,{kind:'diagnosis',sessionId});
  if(failOnce){failOnce=false;throw Error('Internal fixture failure')}
  return {result:validResult(data)};
 }});
 await assessments.save('member',input);const failed=(await assessments.evaluate('member',input.id,true)).assessment;
 assert.equal(failed.status,'failed');assert.equal(await hasInitialRoute(storage,'member'),false);
 const recovered=(await assessments.evaluate('member',input.id,true,{retryAttempt:1})).assessment;
 assert.equal(recovered.status,'completed');assert.equal(recovered.result.modules.length,7);assert.deepEqual(recovered.samples,failed.samples);assert.equal((await storage.get('quota:member')).real,10);
 await assessments.remove('member',input.id);assert.equal(await hasInitialRoute(storage,'member'),true);
 const next=draft(crypto.randomUUID());await assessments.save('member',next);const blocked=(await assessments.evaluate('member',next.id,true)).assessment;
 assert.equal(blocked.failure.code,'quota_limit');
});

test('Old failed initial evaluation and its feedback remain included whichever finishes first',async()=>{
 const {storage,commerce}=await setup(),id=crypto.randomUUID();
 await storage.put('sessions:member:'+id,{id,source:'openai',purpose:'diagnostic',status:'completed',createdAt:100});
 await storage.put('assessment:member:'+id,{id,sessionId:id,source:'openai',status:'pending',createdAt:200});
 await commerce.consume('member','openai',undefined,{kind:'diagnosis',sessionId:id});
 await storage.put(initialRouteKey('member'),{assessmentId:id,completedAt:300});
 assert.equal((await storage.get('quota:member')).real,10);
 // A newly created voice session cannot reuse the old assessment's exemption.
 await storage.put('sessions:member:'+id,{id,source:'openai',purpose:'diagnostic',status:'active',createdAt:400});
 await assert.rejects(()=>commerce.consume('member','openai',undefined,{kind:'voice',sessionId:id}),{status:429});
});

test('Practice, foreign records, fake flags, development and access blocks cannot bypass quotas',async()=>{
 const {storage,commerce}=await setup(),id=crypto.randomUUID();
 await storage.put('sessions:member:'+id,{id,source:'openai',purpose:'practice',status:'active',initialDiagnosticIncluded:true});
 for(const context of [{},{kind:'voice',sessionId:id},{kind:'diagnosis',sessionId:id,initialDiagnosticIncluded:true}])await assert.rejects(()=>commerce.consume('member','openai',undefined,context),{status:429});
 await storage.put('assessment:someone-else:'+id,{id,source:'openai',status:'pending'});await assert.rejects(()=>commerce.consume('member','openai',undefined,{kind:'diagnosis',sessionId:id}),{status:429});
 await storage.put('assessment:member:'+id,{id,source:'openai',status:'pending'});
 await storage.put('commerce-settings',{aiPaused:true});await assert.rejects(()=>commerce.consume('member','openai',undefined,{kind:'diagnosis',sessionId:id}),{status:503});
 await storage.put('commerce-settings',{aiPaused:false});await storage.put('commerce:member',{uid:'member',suspended:true});await assert.rejects(()=>commerce.consume('member','openai',undefined,{kind:'diagnosis',sessionId:id}),{status:403});
 await storage.put('commerce:member',{uid:'member',development:true});await assert.rejects(()=>commerce.consume('member','openai',undefined,{kind:'diagnosis',sessionId:id}),{status:429});
 assert.equal((await storage.get('quota:member')).real,10);
});

test('Worker completes a short diagnosis from saved evidence in one provider call and preserves both ledgers',async t=>{
 const {storage}=await setup(),input=draft(crypto.randomUUID()),ledger={reserved:6000000,attempts:120,usageEstimate:.1};await storage.put('ledger',ledger);
 const worker=new BudgetCoordinator({storage},{USER_BILLING_ENABLED:'true',ADMIN_UID:'owner',AI_BUDGET_USD:'6',AI_MODE:'openai',OPENAI_API_KEY:'fixture'});
 const originalFetch=globalThis.fetch;let calls=0;t.after(()=>{globalThis.fetch=originalFetch});
 globalThis.fetch=async url=>{assert.equal(url,'https://api.openai.com/v1/chat/completions');calls++;const raw=rawResult(input);if(calls===1)raw.modules=raw.modules.slice(0,4);return Response.json({id:'fixture-'+calls,choices:[{finish_reason:'stop',message:{content:JSON.stringify(raw)}}],usage:{prompt_tokens:100,completion_tokens:100}})};
 const request=async(path,extra={})=>{const response=await worker.fetch(new Request('https://budget'+path,{method:'POST',body:JSON.stringify({uid:'member',...extra})}));return {status:response.status,data:await response.json()}};
 assert.equal((await request('/learning/save',{payload:input})).status,200);
 const result=await request('/learning/evaluate',{id:input.id,canUseReal:true});assert.equal(result.status,200);assert.equal(result.data.assessment.status,'completed');assert.equal(result.data.assessment.result.modules.length,7);
 assert.equal(calls,1);assert.equal((await storage.get('quota:member')).real,10);assert.deepEqual(await storage.get('ledger'),ledger);assert.equal((await storage.get('usage-ledger:member')).attempts,1);assert.equal((await storage.get('openai-usage-v1')).total.events,1);
 assert.equal((await request('/reserve',{quota:true})).status,429);
 await worker.commerce.touch({uid:'developer',email:'qa@example.invalid'});const denied=await worker.fetch(new Request('https://budget/reserve',{method:'POST',body:JSON.stringify({uid:'developer',quota:true})}));assert.equal(denied.status,402);
});
