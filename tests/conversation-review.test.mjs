import test from 'node:test';import assert from 'node:assert/strict';
import {scoreReview,expandReview} from '../server/review-model.mjs';import {createAI,validatePayload} from '../server/ai.mjs';import {SessionService} from '../server/sessions.mjs';
const ratings=n=>Object.fromEntries(['relevance','structure','evidence','english'].map(k=>[k,{points:n,reason:'Respuesta concreta para esta pregunta.'}]));
const input={kind:'session',transcribed:true,profile:{role:'Analyst'},answers:[{id:'answer1',question:'Tell me about your work.',text:'I has five years of experience and I create weekly reports for customers.'}]};
const result={summary:'Describes tu trabajo con un ejemplo concreto.',strengths:[{answerId:'answer1',comment:'Explicas qué haces y para quién.'}],ratings:ratings(8.5),corrections:[{answerId:'answer1',original:'I has',replacement:'I have',reason:'Con I corresponde have.',kind:'error'}],observations:[{answerId:'answer1',focus:'grammar',finding:'practice',comment:'Revisa la forma del verbo.',suggestion:'Practica otra presentación con I have.'}],nextStep:'Cuenta una tarea distinta y a quién ayuda.'};
test('Passing is based on exact criterion values, never an upward-rounded display',()=>{
 for(const n of [8.9,8.95])assert.equal(scoreReview(ratings(n)).passed,false);
 const edge=ratings(9);edge.english.points=8.99;const score=scoreReview(edge);assert.equal(score.raw,8.9975);assert.equal(score.score,8.99);assert.equal(score.passed,false);
 assert.equal(scoreReview(ratings(9)).passed,true);assert.throws(()=>scoreReview(ratings(10.01)));assert.throws(()=>scoreReview(ratings(NaN)));
});
test('Corrections quote actual words; invented quotations and unmeasured claims are rejected',()=>{
 const expanded=expandReview(result,input);assert.equal(expanded.scoring.score,8.5);assert.equal(expanded.rubricVersion,4);assert.equal(expanded.strengths[0].quote,input.answers[0].text);
 const bad=structuredClone(result);bad.corrections[0].original='I managed a department';assert.throws(()=>expandReview(bad,input),/tus palabras/);
 const claim=structuredClone(result);claim.ratings.english.reason='Demuestras fluidez.';assert.throws(()=>expandReview(claim,input),/no se ha medido/);
});
test('New structured review schema validates numeric ratings through the provider adapter',async()=>{
 let calls=0;const ai=createAI({mode:'openai',apiKey:'fixture',ledger:{reserve:async()=>calls++,recordUsage:async()=>{},snapshot:async()=>({attempts:calls})},fetchImpl:async(_url,options)=>{
  const body=JSON.parse(options.body);assert.equal(body.max_completion_tokens,2600);assert.ok(body.response_format.json_schema.schema.required.includes('ratings'));assert.equal(JSON.parse(body.messages[1].content).transcribed,true);
  return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}],usage:{prompt_tokens:100,completion_tokens:100}});
 }});const output=await ai.run('review',input);assert.equal(output.result.scoring.passed,false);assert.equal(calls,1);
});
test('Long Realtime sessions sample start, middle and end, marking interrupted questions',async()=>{
 const id=crypto.randomUUID(),s={id,source:'openai',transport:'realtime',status:'completed',mode:'interview',profile:{},messages:[],feedback:[]};
 for(let i=0;i<14;i++){s.messages.push({role:'assistant',content:'Question '+i,interrupted:i===13});s.messages.push({role:'user',content:'My answer number '+i+' explains the work I did for customers.'})}
 const service=new SessionService({get:async()=>s},{budget:async()=>({})});const evidence=await service.evidence('user',id);
 assert.equal(evidence.answers.length,6);assert.ok(evidence.answers[0].text.includes('number 0 '));assert.ok(evidence.answers.at(-1).text.includes('number 13 '));assert.ok(evidence.answers.at(-1).question.includes('interrumpida'));assert.equal(evidence.sampled,true);
});

test('Expanding a contraction and guessing a company article is not a tense correction',()=>{
 const evidence=structuredClone(input),review=structuredClone(result);
 evidence.answers[0].text="I've been working for the Amazonas since 2008";
 review.corrections=[{answerId:'answer1',original:evidence.answers[0].text,replacement:'I have been working for Amazonas since 2008',reason:'Uso correcto del presente perfecto.',kind:'error'}];
 const expanded=expandReview(review,evidence);assert.equal(expanded.corrections.length,0);assert.equal(expanded.scoring.score,8.5,'Filtering is not an invented regrade');
 assert.equal(expandReview(result,input).corrections[0].original,'I has','A genuine agreement correction remains');
});

test('Uncertain recognition is retained as uncertainty without rewriting the evidence',()=>{
 const evidence=structuredClone(input),review=structuredClone(result);evidence.answers[0].text='How many apps are going to be on the screen?';
 review.corrections=[{answerId:'answer1',original:'apps',replacement:'ads',reason:'Puede ser una confusión de la transcripción; no podemos confirmarlo con este texto.',kind:'uncertain_transcription'}];
 const expanded=expandReview(review,evidence);assert.equal(expanded.corrections[0].kind,'uncertain_transcription');assert.equal(evidence.answers[0].text,'How many apps are going to be on the screen?');
});

test('Step criterion survives the context limit and clipped evidence is explicitly marked',async()=>{
 const id=crypto.randomUUID(),criterion='Explica tu aportación. '.repeat(30)+'No se requieren cifras.',target={routeStep:true,title:'Tu función',level:'A2',objective:'Describe tu trabajo. '.repeat(35),criterion};
 const session={id,status:'completed',source:'openai',transport:'realtime',mode:'tutor',profile:{},learning:target,feedback:[],messages:[{role:'assistant',content:'Tell me about your work. '.repeat(20)},{role:'user',content:'I create the transmission plan. '.repeat(40)}]};
 const service=new SessionService({get:async()=>session},{}),evidence=await service.evidence('u',id),payload=validatePayload('review',evidence);
 assert.equal(payload.context.length,600);assert.equal(payload.assessmentTarget.criterion,criterion);assert.equal(payload.assessmentTarget.objective,target.objective);
 assert.equal(payload.answers[0].answerTruncated,true);assert.equal(payload.answers[0].questionTruncated,true);
 const expanded=expandReview({...result,corrections:[]},payload);assert.equal(expanded.assessmentTarget.title,'Tu función');
});
