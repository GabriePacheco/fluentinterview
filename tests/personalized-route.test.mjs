import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {draft,rawResult} from './diagnostic-fixtures.mjs';
import {expandDiagnosis,validateDiagnosis} from '../server/diagnostic-model.mjs';
import {buildConversationRoute} from '../server/conversation-route.mjs';
import {routeFixture} from './route-fixtures.mjs';
import {realtimeConfig} from '../server/realtime.mjs';

test('Distinct same-level professions retain model order, objectives, steps and examples through tutor context',async()=>{
 const routes=[];
 for(const [role,focus,title,task,answer] of [
  ['Jefe de mecánicos','justify_decisions','Prioriza una reparación segura','Explain why you inspected the brakes before replacing the part.','Primero revisaría los frenos para identificar la causa.'],
  ['Software Developer','explain_concepts','Explica un fallo de acceso','Explain how you investigated a login failure before changing the code.','Primero reproduciría el fallo de acceso y revisaría los registros.']
 ]){
  const input=draft(crypto.randomUUID());input.profile.role=role;
  const raw=rawResult(input,'A2');raw.modules.sort((a,b)=>(a.focus===focus?-1:b.focus===focus?1:0));
  Object.assign(raw.modules[0],{title,objective:title,masteryCheck:title,conversation:task,steps:[{title:'Investiga el caso',task},{title:'Explica tu decisión',task:'Justify the next action in this specific case.'}],examples:[{question:'¿Qué harías primero?',answer},{question:'¿Por qué?',answer:'Para comprobar la causa antes de intervenir.'}]});
  const result=validateDiagnosis(expandDiagnosis(raw,input),input.samples);
  assert.equal(result.modules[0].focus,focus);assert.equal(result.modules[0].title,title);
  const record={id:input.id,status:'completed',source:'openai',profile:input.profile,result};
  const route=buildConversationRoute(record);routes.push(route);
  assert.equal(route.stages[0].title,title);assert.equal(route.stages[0].focus,focus);
  assert.equal(route.stages[0].steps[0].task,task);assert.equal(route.stages[0].steps[0].examples[0].answer,answer);
  const f=await routeFixture(record),session=(await f.routes.start('alice',{id:crypto.randomUUID(),routeId:record.id,stepId:route.stages[0].steps[0].id},true)).session;
  assert.equal(session.learning.task,task);assert.equal(session.learning.examples[0].answer,answer);
  assert.ok(realtimeConfig(session).session.instructions.includes(task));
  const browser=vm.createContext({escapeHTML:s=>s});vm.runInContext(fs.readFileSync('public/practice-examples.js','utf8')+';globalThis.exampleHTML=practiceExamplesHTML',browser);
  assert.ok(browser.exampleHTML(session.learning).includes(answer));
 }
 assert.notEqual(routes[0].stages[0].title,routes[1].stages[0].title);
 assert.notEqual(routes[0].stages[0].steps[0].task,routes[1].stages[0].steps[0].task);
});
