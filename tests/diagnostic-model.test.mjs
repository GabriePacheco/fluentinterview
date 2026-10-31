import test from 'node:test';
import assert from 'node:assert/strict';
import {createAI} from '../server/ai.mjs';
import {expandDiagnosis,validateDiagnosis} from '../server/diagnostic-model.mjs';
import {scoreTasks} from '../server/diagnostic-content.mjs';
import {draft,rawResult} from './diagnostic-fixtures.mjs';
const input=draft('model-test','advanced');
const payload={profile:input.profile,samples:input.samples,scores:scoreTasks(input),previous:null};
test('Selected goals expand into measurable modules while retaining individual evidence and questions',()=>{
 const raw=rawResult(input,'C1'),result=validateDiagnosis(expandDiagnosis(raw,payload),input.samples);
 assert.equal(result.modules.length,4);
 assert.match(result.modules[0].masteryCheck,/experiencia nueva/);
 assert.equal(result.modules[0].evidenceQuote,raw.modules[0].evidenceQuote);
 assert.equal(result.modules[0].conversation,raw.modules[0].conversation);
 assert.doesNotMatch(result.priorities.join(' '),/confianza|fluidez/i);
});
test('Unobserved speaking claims and unsupported comprehension priorities are rejected',()=>{
 for(const claim of ['Tienes buena pronunciación.','Necesitas fluidez.','Debes aumentar tu confianza.']){
  const raw=rawResult(input);raw.modules[0].reason=claim;
  assert.throws(()=>expandDiagnosis(raw,payload),/no se ha medido/);
 }
 for(const focus of ['reading_details','listening_details']){
  const raw=rawResult(input);raw.priorities[0]=focus;
  assert.throws(()=>expandDiagnosis(raw,payload),/no está respaldada/);
 }
 const raw=rawResult(input);raw.modules[0].focus='unknown';
 assert.throws(()=>expandDiagnosis(raw,payload),/no admitido/);
});
test('Repeated provider truncation stops after one repair and retains both reservations',async()=>{
 let reservations=0,calls=0;
 const ledger={reserve:async()=>reservations++,recordUsage:async()=>{},snapshot:async()=>({})};
 const ai=createAI({mode:'openai',apiKey:'test-only',ledger,fetchImpl:async()=>{calls++;return Response.json({choices:[{finish_reason:'length',message:{content:JSON.stringify(rawResult(input))}}],usage:{prompt_tokens:10,completion_tokens:10}})}});
 await assert.rejects(()=>ai.run('diagnosis',payload),/resultado completo/);
 assert.equal(reservations,2);assert.equal(calls,2);
});
