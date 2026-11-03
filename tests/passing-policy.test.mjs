import test from 'node:test';import assert from 'node:assert/strict';
import {buildConversationRoute,MIN_ROUTE_STEPS,routeAttemptKey} from '../server/conversation-route.mjs';
import {assessment,routeFixture,finishAttempt,ratings,memory} from './route-fixtures.mjs';
import {FeedbackService} from '../server/feedback.mjs';

test('Every supported level and reinforcement/transfer mix generates at least seven meaningful steps',()=>{
 for(const level of ['A1','A2','B1','B2','C1'])for(const orientation of ['reinforce','transfer']){
  const record=assessment(level);record.result.modules.forEach(m=>m.orientation=orientation);
  const steps=buildConversationRoute(record).stages.flatMap(s=>s.steps);
  assert.ok(steps.length>=MIN_ROUTE_STEPS);assert.equal(new Set(steps.map(s=>s.title)).size,steps.length);
 }
 const invalid=assessment('C1');invalid.result.modules=invalid.result.modules.slice(0,1);
 assert.throws(()=>buildConversationRoute(invalid),/al menos 7/);
});

test('An existing failed 8-point route attempt unlocks under 7.5 without new AI calls',async()=>{
 const f=await routeFixture(),route=(await f.routes.state('alice')).route;
 const session=(await f.routes.start('alice',{id:crypto.randomUUID(),routeId:route.assessmentId,stepId:route.nextStepId},true)).session;
 await finishAttempt(f,session,8);
 const key=routeAttemptKey('alice',session.id),attempt=await f.storage.get(key);
 Object.assign(attempt,{reviewedAt:123,reviewAttempt:1,passed:false,score:8,passThreshold:9});await f.storage.put(key,attempt);
 const updated=(await f.routes.state('alice')).route;
 assert.equal(updated.completed,1);assert.equal(updated.stages[0].steps[0].passedScore,8);
 assert.equal((await f.storage.get(key)).passThreshold,7.5);
});

test('Saved review reuses its numeric grades and updates the practice outcome idempotently',async()=>{
 const storage=memory(),id=crypto.randomUUID(),goal={objective:'Describe tu tarea.',criterion:'Un ejemplo propio.',targetAnswers:3};
 const feedback=new FeedbackService(storage,{evidence:async()=>({practiceGoal:goal,answerCount:3}),run:async()=>{throw Error('Must not call AI')}});
 const key=feedback.key('alice','session',id),original={status:'completed',source:'openai',result:{ratings:ratings(8),scoring:{score:8,passed:false,threshold:9},nextStep:'Otro ejemplo.'}};
 await storage.put(key,original);const review=await feedback.get('alice','session',id);
 assert.deepEqual(review.result.ratings,original.result.ratings);assert.equal(review.result.scoring.passed,true);assert.equal(review.result.practiceOutcome.achieved,true);
 assert.deepEqual(await feedback.get('alice','session',id),review);
});
