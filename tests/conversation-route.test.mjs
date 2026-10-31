import test from 'node:test';import assert from 'node:assert/strict';
import {buildConversationRoute,ConversationRouteService,routeAttemptKey} from '../server/conversation-route.mjs';
import {CommerceService} from '../server/commerce.mjs';
import {realtimeConfig,RealtimeRelay} from '../server/realtime.mjs';
import {schoolRequest,schoolPath} from '../server/school-api.mjs';
import {assessment,routeFixture,ratings,finishAttempt} from './route-fixtures.mjs';
const steps=route=>route.stages.flatMap(s=>s.steps);
test('Route length, scaffolding, priorities and questions derive from level and individual diagnosis',()=>{
 const a=buildConversationRoute(assessment('A1')),b=buildConversationRoute(assessment('B2'));
 assert.equal(steps(a).length,22);assert.equal(steps(b).length,10);assert.notEqual(steps(a)[0].task,steps(b)[0].task);assert.equal(steps(a)[0].targetAnswers,3);
 const sameLevel=buildConversationRoute(assessment('A1','Backend developer','technical_clarity'));
 assert.notDeepEqual(a.stages.map(s=>s.title),sameLevel.stages.map(s=>s.title));assert.notEqual(steps(a)[0].question,steps(sameLevel)[0].question);assert.match(steps(sameLevel)[0].objective,/Backend developer/);
});
test('Exact 9 advances; near 9 fails, retries vary, reopening is idempotent and approvals survive later failure/deletion',async()=>{
 const f=await routeFixture(),{routes,record,sessions,storage}=f;let route=(await routes.state('alice')).route;const first=steps(route)[0],second=steps(route)[1];
 const input={id:crypto.randomUUID(),routeId:record.id,stepId:first.id};const [a,b]=await Promise.all([routes.start('alice',input,true),routes.start('alice',input,true)]);assert.equal(a.session.id,b.session.id);assert.equal(steps((await routes.state('alice')).route)[0].attempts.length,1);
 const edge=ratings(9);edge.english.points=8.99;await finishAttempt(f,a.session,edge);route=(await routes.state('alice')).route;assert.equal(route.completed,0);assert.equal(steps(route)[0].latest.score,8.99);assert.match(steps(route)[0].latest.reason,/Inglés/);
 await assert.rejects(()=>routes.start('alice',{...input,id:crypto.randomUUID(),stepId:second.id},true),{status:409});
 const retry=(await routes.start('alice',{...input,id:crypto.randomUUID()},true)).session;assert.notEqual(retry.learning.scenario,a.session.learning.scenario);assert.match(retry.learning.retryFocus,/Inglés/);assert.ok(retry.learning.avoidQuestions.length);
 await finishAttempt(f,retry,9);
 const storedReview=await storage.get('feedback:alice:session:'+retry.id);
 await schoolRequest({routes,feedback:{get:async()=>storedReview}},'/api/feedback/session/'+retry.id,'GET',{}, {uid:'alice',emailVerified:true});
 assert.ok((await storage.get(f.assessments.key('alice',record.id))).conversationRoute.stages[0].steps[0].passedAt,'approval is persisted before feedback is delivered');
 route=(await routes.state('alice')).route;assert.equal(route.completed,1);assert.equal(route.nextStepId,second.id);
 const later=(await routes.start('alice',{...input,id:crypto.randomUUID()},true)).session;await finishAttempt(f,later,7);assert.equal((await routes.state('alice')).route.completed,1);
 await sessions.remove('alice',retry.id);const restarted=new ConversationRouteService(storage,{assessments:f.assessments,sessions});assert.equal((await restarted.state('alice')).route.completed,1);assert.equal(steps((await restarted.state('alice')).route)[0].passedScore,9);
});
test('Ownership, prerequisites, real audio evidence and route versions are enforced on server',async()=>{
 const f=await routeFixture(),{routes,record,storage,assessments}=f;const route=(await routes.state('alice')).route,input={id:crypto.randomUUID(),routeId:record.id,stepId:steps(route)[0].id};
 assert.deepEqual(await routes.state('bob'),{route:null});await assert.rejects(()=>routes.state('bob',record.id),{status:404});await assert.rejects(()=>routes.start('alice',input,false),{status:403});
 for(const options of [{count:1},{transport:'text'},{source:'mock'}]){const s=(await routes.start('alice',{...input,id:crypto.randomUUID()},true)).session;await finishAttempt(f,s,10,options);assert.equal((await routes.state('alice')).route.completed,0)}
 const updated=assessment('B1','Data analyst');await storage.put(assessments.key('alice',updated.id),updated);await storage.put(assessments.index('alice'),{ids:[updated.id,record.id],current:updated.id});
 assert.equal((await routes.state('alice')).route.completed,0);assert.equal((await routes.state('alice',record.id)).route.current,false);await assert.rejects(()=>routes.start('alice',{...input,id:crypto.randomUUID()},true),{status:409});
 assert.equal(schoolPath('/api/route/start'),true);assert.equal((await schoolRequest({routes},'/api/route','GET',{}, {uid:'alice',emailVerified:true})).route.assessmentId,updated.id);
});
test('Focused tutor receives the step and ends after sufficient saved question/answer pairs',async()=>{
 const f=await routeFixture(),route=(await f.routes.state('alice')).route;const session=(await f.routes.start('alice',{id:crypto.randomUUID(),routeId:route.assessmentId,stepId:steps(route)[0].id},true)).session;
 assert.match(realtimeConfig(session).session.instructions,/NOT a general introduction/);assert.match(realtimeConfig(session).session.instructions,/Customer support/);assert.equal(session.mode,'tutor');
 class Socket extends EventTarget{readyState=1;send(){}close(){this.readyState=3}}let closed=0;const relay=new RealtimeRelay({upstream:new Socket(),downstream:new Socket(),session,save:async()=>{},authorize:async()=>{},usage:async()=>{},onClose:async()=>closed++});
 for(let i=0;i<3;i++){relay.event({type:'response.output_audio_transcript.done',item_id:'a'+i,transcript:'What happened in that situation?'});relay.event({type:'conversation.item.input_audio_transcription.completed',item_id:'u'+i,transcript:'I helped the customer choose a suitable product.'})}
 await relay.close();assert.equal(closed,1);assert.equal(relay.snapshot().filter(m=>m.role==='user').length,3);
});
test('Deleting a diagnosis or account removes its attempt records even when conversations were deleted earlier',async()=>{
 for(const account of [false,true]){const f=await routeFixture(),route=(await f.routes.state('alice')).route;const s=(await f.routes.start('alice',{id:crypto.randomUUID(),routeId:route.assessmentId,stepId:steps(route)[0].id},true)).session;await finishAttempt(f,s);await f.routes.captureReview('alice',s.id);await f.sessions.remove('alice',s.id);assert.ok(await f.storage.get(routeAttemptKey('alice',s.id)));if(account)await new CommerceService(f.storage,{env:{}}).erase({uid:'alice'});else await f.assessments.remove('alice',f.record.id);assert.equal(await f.storage.get(routeAttemptKey('alice',s.id)),undefined)}
});
