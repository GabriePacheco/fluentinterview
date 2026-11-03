import test from 'node:test';
import assert from 'node:assert/strict';
import {routeFixture,assessment,finishAttempt} from './route-fixtures.mjs';
import {buildPracticeGoal} from '../server/practice-goals.mjs';
import {realtimeConfig} from '../server/realtime.mjs';

test('Free tutor follows the next unpassed small step and does not create route attempts',async()=>{
 const f=await routeFixture(assessment('A1'));
 const first=await f.routes.practiceContext('alice',{mode:'tutor'});
 assert.equal(first.focusedPractice,true);assert.equal(first.routeStep,undefined);
 assert.equal(first.targetAnswers,3);assert.equal(first.level,'A1');
 let route=(await f.routes.state('alice')).route;
 assert.equal(first.objective,route.stages[0].steps[0].objective);
 assert.equal(route.stages.flatMap(s=>s.steps).flatMap(s=>s.attempts).length,0);
 const attempt=(await f.routes.start('alice',{id:crypto.randomUUID(),routeId:route.assessmentId,stepId:route.nextStepId},true)).session;
 await finishAttempt(f,attempt,9);
 const next=await f.routes.practiceContext('alice',{mode:'tutor'});
 route=(await f.routes.state('alice')).route;
 assert.equal(route.completed,1);assert.equal(next.objective,route.stages[0].steps[1].objective);
 assert.notEqual(next.task,first.task);
 assert.equal(route.stages.flatMap(s=>s.steps).flatMap(s=>s.attempts).length,1);
});

test('Free practice preserves level/goal in the saved session and uses the same voice settings',async()=>{
 const f=await routeFixture(assessment('B2'));
 f.sessions.learning=(uid,input)=>f.routes.practiceContext(uid,input);
 const session=await f.sessions.create('alice',{id:crypto.randomUUID(),source:'openai',mode:'tutor',profile:f.record.profile},true);
 assert.equal(session.practiceGoal.focused,true);assert.equal(session.practiceGoal.targetAnswers,4);
 assert.equal(session.practiceGoal.criterion,session.learning.criterion);
 const config=realtimeConfig(session).session;
 assert.match(config.instructions,/Start directly with one short task question/);
 assert.doesNotMatch(config.instructions,/Start with a brief greeting|State the goal briefly/);
 assert.match(config.instructions,/finish_conversation/);
 assert.deepEqual(config.audio,realtimeConfig({mode:'tutor'}).session.audio);
 assert.equal(config.model,realtimeConfig({mode:'tutor'}).session.model);
});

test('No diagnosis, another user, explicit module and simulated interview keep existing behavior',async()=>{
 const f=await routeFixture();
 assert.equal(await f.routes.practiceContext('bob',{mode:'tutor'}),null);
 for(const input of [{mode:'interview',interviewType:'project'},{mode:'tutor',assessmentId:f.record.id,moduleIndex:2}]){
  assert.deepEqual(await f.routes.practiceContext('alice',input),await f.assessments.context('alice',input));
 }
 assert.equal(buildPracticeGoal({learning:{routeStep:true},mode:'tutor'}),null);
});

test('A completed route offers its final small task without resetting approvals',async()=>{
 const f=await routeFixture();await f.routes.ensure('alice');
 const record=await f.assessments.get('alice',f.record.id),steps=record.conversationRoute.stages.flatMap(s=>s.steps);
 for(const step of steps)step.passedAt=123;
 await f.storage.put(f.assessments.key('alice',record.id),record);
 const context=await f.routes.practiceContext('alice',{mode:'tutor'});
 assert.equal(context.objective,steps.at(-1).objective);
 assert.equal((await f.routes.state('alice')).route.finished,true);
});
