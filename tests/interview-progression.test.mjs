import test from 'node:test';import assert from 'node:assert/strict';
import {INTERVIEW_COMPETENCIES} from '../server/interview-competencies.mjs';
import {DIAGNOSTIC_SCHEMA,expandDiagnosis,validateDiagnosis} from '../server/diagnostic-model.mjs';
import {buildConversationRoute} from '../server/conversation-route.mjs';
import {buildActivity} from '../server/study-content.mjs';
import {assessment,routeFixture} from './route-fixtures.mjs';
import {draft,rawResult} from './diagnostic-fixtures.mjs';
import {createAI} from '../server/ai.mjs';
test('The AI selects professional competencies; progression preserves the exact learner evidence',()=>{
 const input=draft(crypto.randomUUID(),'advanced'),raw=rawResult(input,'C1');raw.modules.reverse();
 const result=validateDiagnosis(expandDiagnosis(raw,input),input.samples);
 assert.deepEqual(result.modules.map(m=>m.focus),['professional_intro','role_fit','experience_story','explain_concepts','justify_decisions','handle_followups','compare_options']);
 for(const m of result.modules){const original=raw.modules.find(x=>x.focus===m.focus);assert.equal(m.evidenceQuote,original.evidenceQuote);assert.equal(m.conversation,original.conversation);assert.equal(m.orientation,'transfer')}
 assert.deepEqual(DIAGNOSTIC_SCHEMA.properties.modules.items.properties.focus.enum,Object.keys(INTERVIEW_COMPETENCIES));assert.ok(!DIAGNOSTIC_SCHEMA.properties.priorities.items.enum.includes('grammar'));
 const duplicate=rawResult(input);duplicate.modules[1].focus=duplicate.modules[0].focus;assert.throws(()=>validateDiagnosis(expandDiagnosis(duplicate,input),input.samples),/repetidos/);
});
test('Advanced competencies add distinct capabilities without forcing a beginner introduction',()=>{
 const record=assessment('C1','Backend developer');record.result.modules=record.result.modules.map((m,i)=>({...m,focus:['defend_position','compare_options','handle_followups','justify_decisions'][i]}));
 const route=buildConversationRoute(record);assert.equal(route.stages.length,7);assert.ok(!route.stages.some(s=>s.focus==='professional_intro'));assert.deepEqual(route.stages.slice(-4).map(s=>s.focus),['justify_decisions','handle_followups','compare_options','defend_position']);
 const tasks=route.stages.flatMap(s=>s.steps.map(x=>x.task));assert.equal(new Set(tasks).size,tasks.length);
 assert.deepEqual(route.stages[3].previousCapabilities,route.stages.slice(0,3).map(s=>s.title));
 for(const stage of route.stages){for(const step of stage.steps)assert.match(step.objective,/Backend developer/);if(stage.moduleIndex<4)assert.equal(stage.steps[0].question,record.result.modules[stage.moduleIndex].conversation)}
});
test('New competencies retain working optional exercises and professional mastery criteria',()=>{
 for(const [focus,c] of Object.entries(INTERVIEW_COMPETENCIES)){
  const activity=buildActivity({focus,...c,conversation:'Explain a relevant work example.'},'B1');assert.equal(activity.title,c.title);assert.equal(activity.objective,c.objective);assert.equal(activity.criterion,c.masteryCheck);assert.ok(activity.items.length>0);assert.ok(buildActivity({...c,conversation:'Explain a relevant work example.'},'B1').items.length>0);
 }
});
test('The provider contract accepts professional modules on the first response, with no paid network',async()=>{
 const input=draft(crypto.randomUUID(),'advanced');let calls=0;
 const ai=createAI({mode:'openai',apiKey:'fixture',ledger:{reserve:async()=>{},recordUsage:async()=>{},snapshot:async()=>({})},fetchImpl:async(_url,options)=>{calls++;const body=JSON.parse(options.body);assert.ok(!body.response_format.json_schema.schema.properties.modules.items.properties.focus.enum.includes('grammar'));assert.match(body.messages[0].content,/new observable interview capability/);return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(rawResult(input,'C1'))}}],usage:{}})}});
 const output=await ai.run('diagnosis',input);assert.equal(calls,1);assert.equal(output.result.modules.length,7);assert.ok(output.result.modules.every(m=>INTERVIEW_COMPETENCIES[m.focus]));
});
test('Unstarted old routes are upgraded; any attempt or approval preserves the existing route',async()=>{
 const f=await routeFixture(),key=f.assessments.key('alice',f.record.id),old=buildConversationRoute(f.record);old.revision=1;old.stages[0].title='Ruta anterior';
 await f.storage.put(key,{...f.record,conversationRoute:old});const upgraded=await f.routes.ensure('alice',f.record.id);assert.equal(upgraded.revision,3);assert.notEqual(upgraded.stages[0].title,'Ruta anterior');
 for(const field of ['attempts','passedAt']){const started=structuredClone(old);if(field==='attempts')started.stages[0].steps[0].attempts=[crypto.randomUUID()];else started.stages[0].steps[0].passedAt=123;
  await f.storage.put(key,{...f.record,conversationRoute:started});assert.deepEqual(await f.routes.ensure('alice',f.record.id),started);
 }
});
