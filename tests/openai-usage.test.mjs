import test from 'node:test';
import assert from 'node:assert/strict';
import {priceUsage,recordOpenAIUsage,readOpenAIUsage,finishUsageSession} from '../server/openai-usage.mjs';
import {CommerceService} from '../server/commerce.mjs';
import {commercePath,commerceRequest} from '../server/commerce-api.mjs';
import {RealtimeRelay} from '../server/realtime.mjs';
import {createAI,MODEL} from '../server/ai.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
const voice={input_tokens:2000,output_tokens:1000,input_token_details:{text_tokens:1200,audio_tokens:800,cached_tokens:800,cached_tokens_details:{text_tokens:500,audio_tokens:300}},output_token_details:{text_tokens:200,audio_tokens:800}};
function storage(){const map=new Map();return {get:async key=>structuredClone(map.get(key)),put:async(key,v)=>map.set(key,structuredClone(v))}}
test('Voice pricing separates modalities and cached subsets; transcription is additional',()=>{
 const r=priceUsage('gpt-realtime-2.1-mini',voice);
 near(r.textUsd,.00093);near(r.audioUsd,.02109);near(r.estimatedUsd,.02202);near(r.cacheSavingsUsd,.00318);assert.equal(r.incomplete,0);
 const text=priceUsage(MODEL,{prompt_tokens:2000,completion_tokens:500,prompt_tokens_details:{cached_tokens:1000}});near(text.estimatedUsd,.0013);near(text.cacheSavingsUsd,.0003);
 near(priceUsage('whisper-1',{type:'duration',seconds:30}).transcriptionUsd,.003);
 near(priceUsage('gpt-4o-transcribe',{input_tokens:1000,output_tokens:100}).transcriptionUsd,.0035);
 for(const [model,u] of [['gpt-realtime-2.1-mini',{input_tokens:2000,output_tokens:1000}],['whisper-1',{}],['unknown',{}]]){const m=priceUsage(model,u);assert.equal(m.incomplete,1);assert.equal(m.estimatedUsd,0,'Missing data is visibly incomplete, not priced as audio or fabricated');}
 const inconsistent=structuredClone(voice);delete inconsistent.input_token_details.cached_tokens_details;assert.equal(priceUsage('gpt-realtime-2.1-mini',inconsistent).incomplete,1);
});
test('Monitor deduplicates provider events, groups a session and preserves legacy records',async()=>{
 const s=storage();await s.put('ledger',{reserved:6000000,usageEstimate:1});
 const event={id:'response-1',model:'gpt-realtime-2.1-mini',usage:voice,scope:'owner',sessionId:'session-1',now:1793577600000};
 await recordOpenAIUsage(s,event);assert.equal(await recordOpenAIUsage(s,event),null);
 await recordOpenAIUsage(s,{...event,id:'asr:one',model:'whisper-1',usage:{type:'duration',seconds:30}});
 await recordOpenAIUsage(s,{...event,id:'review-1',model:MODEL,usage:{prompt_tokens:1000,completion_tokens:500}});
 const r=await readOpenAIUsage(s);near(r.total.estimatedUsd,.02622);near(r.recent[0].estimatedUsd,r.total.estimatedUsd);assert.equal(r.total.events,3);assert.equal(r.recent.length,1);assert.equal(r.seen,undefined);assert.equal(r.scopes.owner.events,3);assert.deepEqual(await s.get('ledger'),{reserved:6000000,usageEstimate:1});
});
test('Monitor is server-owner-only, not enabled by client role or billing response',async()=>{
 const s=storage(),service=new CommerceService(s,{env:{ADMIN_UID:'owner'}}),path='/api/admin/openai-usage';assert.ok(commercePath(path));
 for(const user of [{uid:'other',emailVerified:true,admin:true},{uid:'owner',emailVerified:false}])await assert.rejects(()=>commerceRequest(service,path,'GET',{},user),{status:403});
 assert.equal((await commerceRequest(service,path,'GET',{}, {uid:'owner',emailVerified:true})).total.events,0);
 await assert.rejects(()=>commerceRequest(service,path,'POST',{estimatedUsd:0},{uid:'owner',emailVerified:true}));
});
test('Relay records cancelled generations, transcription separately and no duplicate events',async()=>{
 const events=[],socket={readyState:1,send(){},close(){}};
 const r=new RealtimeRelay({upstream:socket,downstream:socket,session:{profile:{},mode:'tutor'},save:async()=>{},authorize:async()=>{},usage:async(u,m)=>events.push({u,m}),onClose:async()=>{}});
 const done={type:'response.done',response:{id:'response-1',status:'cancelled',usage:voice}};
 r.event(done);r.event(done);
 const asr={type:'conversation.item.input_audio_transcription.completed',item_id:'audio-1',transcript:'My own answer',usage:{type:'duration',seconds:5}};
 r.event(asr);r.event(asr);await r.close();
 assert.equal(events.length,2);assert.equal(events[0].m.model,'gpt-realtime-2.1-mini');assert.equal(events[1].m.model,'whisper-1');assert.equal(events[1].m.id,'asr:audio-1');
});
test('Text adapter records usage and request identity before invalid output fails',async()=>{
 let got;const ai=createAI({mode:'openai',apiKey:'local-fixture',ledger:{reserve:async()=>{},recordUsage:async(u,m)=>got={u,m},snapshot:async()=>({})},fetchImpl:async()=>Response.json({id:'chat-test',usage:{prompt_tokens:1000,completion_tokens:20,prompt_tokens_details:{cached_tokens:500}},choices:[{finish_reason:'stop',message:{content:'{}'}}]})});
 await assert.rejects(()=>ai.run('conversation',{messages:[],profile:{}}));assert.equal(got.m.id,'chat-test');assert.equal(got.m.model,MODEL);assert.equal(got.u.prompt_tokens_details.cached_tokens,500);
});
test('Measured voice duration survives later evaluation; only admin receives joined account identity',async()=>{
 const s=storage(),start=1793577600000,service=new CommerceService(s,{env:{ADMIN_UID:'owner'}});
 await s.put('commerce:owner',{uid:'owner',email:'owner@example.invalid'});
 await s.put('sessions:owner:session-1',{createdAt:start-60000,voiceStartedAt:start,mode:'tutor',status:'completed',profile:{experience:'PRIVATE ANSWER'}});
 await recordOpenAIUsage(s,{id:'r1',model:'gpt-realtime-2.1-mini',usage:voice,scope:'owner',uid:'owner',sessionId:'session-1',startedAt:start,now:start+20000});
 await finishUsageSession(s,{uid:'owner',sessionId:'session-1',startedAt:start,endedAt:start+300000});
 await recordOpenAIUsage(s,{id:'eval1',model:MODEL,usage:{prompt_tokens:1000,completion_tokens:500},scope:'owner',uid:'owner',sessionId:'session-1',now:start+400000});
 const data=await service.openAIUsage({uid:'owner',emailVerified:true}),r=data.recent[0];
 assert.equal(r.durationSeconds,300);assert.equal(r.startedAt,start);assert.equal(r.email,'owner@example.invalid');assert.equal(r.sessionType,'tutor');assert.equal(r.events,2);assert.ok(!JSON.stringify(data).includes('PRIVATE ANSWER'));
 await assert.rejects(()=>service.openAIUsage({uid:'other',emailVerified:true}),{status:403});
 await s.put('commerce:owner',{deleted:true});assert.equal((await service.openAIUsage({uid:'owner',emailVerified:true})).recent[0].email,null);
});
test('Legacy owner records get identity without inventing duration; identical IDs of different users stay separate',async()=>{
 const s=storage(),service=new CommerceService(s,{env:{ADMIN_UID:'owner'}});
 await s.put('commerce:owner',{email:'owner@example.invalid'});
 await recordOpenAIUsage(s,{id:'old',model:MODEL,usage:{prompt_tokens:10,completion_tokens:10},scope:'owner',sessionId:'old-session'});
 const row=(await service.openAIUsage({uid:'owner',emailVerified:true})).recent[0];assert.equal(row.email,'owner@example.invalid');assert.equal(row.durationSeconds,null);
 for(const uid of ['a','b'])await recordOpenAIUsage(s,{id:uid,model:MODEL,usage:{prompt_tokens:10,completion_tokens:10},uid,sessionId:'same-id'});
 assert.equal((await readOpenAIUsage(s)).recent.filter(r=>r.id==='same-id').length,2);
});
