import test from 'node:test';import assert from 'node:assert/strict';
import {routeFixture,assessment} from './route-fixtures.mjs';
import {buildConversationRoute,routeAttemptKey} from '../server/conversation-route.mjs';
import {weeklyPlan} from '../server/assessments.mjs';
import {validateDiagnosis,expandDiagnosis} from '../server/diagnostic-model.mjs';
import {draft,rawResult} from './diagnostic-fixtures.mjs';
import {StudyService} from '../server/study.mjs';

test('Four-stage saved route expands to seven preserving original steps, attempts, approvals and module indexes',async()=>{
 const f=await routeFixture(assessment('B1'));
 const original=buildConversationRoute(f.record);original.revision=2;
 original.stages=original.stages.filter(s=>s.moduleIndex<4);
 original.stages.forEach((s,i)=>s.id='stage'+i);
 const first=original.stages[0].steps[0],attemptId=crypto.randomUUID();
 first.attempts=[attemptId];first.passedAt=123;first.passedScore=8;first.passedSessionId=attemptId;
 await f.storage.put(f.assessments.key('alice',f.record.id),{...f.record,conversationRoute:original});
 await f.storage.put(routeAttemptKey('alice',attemptId),{id:attemptId,context:{stepId:first.id}});
 const upgraded=await f.routes.ensure('alice',f.record.id);
 assert.equal(upgraded.stages.length,7);assert.equal(new Set(upgraded.stages.map(s=>s.id)).size,7);
 assert.equal(new Set(upgraded.stages.flatMap(s=>s.steps.map(x=>x.id))).size,upgraded.stages.flatMap(s=>s.steps).length);
 for(const old of original.stages){const kept=upgraded.stages.find(s=>s.moduleIndex===old.moduleIndex);assert.equal(kept.id,old.id);assert.deepEqual(kept.steps.map(({order,...s})=>s),old.steps.map(({order,...s})=>s))}
 assert.deepEqual(await f.routes.ensure('alice',f.record.id),upgraded);
 assert.equal((await f.storage.get(routeAttemptKey('alice',attemptId))).context.stepId,first.id);
 const saved=await f.assessments.get('alice',f.record.id);assert.equal(saved.result.modules.length,7);
 assert.equal((await f.assessments.context('alice',{moduleIndex:6})).moduleIndex,6);
 const study=new StudyService(f.storage,{assessments:f.assessments});assert.equal((await study.course('alice',f.record.id)).modules.length,7);
 assert.equal((await study.create('alice',{id:crypto.randomUUID(),courseId:f.record.id,moduleIndex:6})).moduleIndex,6);
 assert.equal(weeklyPlan(saved.result,saved.profile)[6].moduleIndex,6);
});

test('New diagnoses require seven distinct stages; insufficient evidence still creates none',()=>{
 const input=draft(crypto.randomUUID(),'advanced'),raw=rawResult(input);
 assert.equal(validateDiagnosis(expandDiagnosis(raw,input),input.samples).modules.length,7);
 raw.modules=raw.modules.slice(0,4);assert.throws(()=>validateDiagnosis(expandDiagnosis(raw,input),input.samples),/7 etapas/);
 raw.level='insufficient_evidence';raw.modules=[];assert.equal(validateDiagnosis(expandDiagnosis(raw,input),input.samples).modules.length,0);
});
