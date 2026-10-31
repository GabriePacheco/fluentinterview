import http from 'node:http';import fs from 'node:fs';import assert from 'node:assert/strict';
import {chromium,executablePath} from './browser-runtime.mjs';
import {draft,validResult} from './diagnostic-fixtures.mjs';
const id=crypto.randomUUID(),fixture=draft(id);let oralPosts=0,reviewPosts=0;
let assessment={...fixture,sessionId:id,format:'oral-v1',status:'failed',attempt:1,failure:{code:'invalid_quote'},error:'La cita no coincide.'};
let review={id,status:'failed',attempt:1,source:'openai',code:'invalid_correction',error:'La corrección no coincide.'};
const session={id,purpose:'diagnostic',source:'openai',status:'completed',mode:'interview',messages:[{role:'user',content:fixture.samples[0].text}],feedback:[]};
const server=http.createServer((req,res)=>{const file=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';if(!/^[\w.-]+$/.test(file)||!fs.existsSync('public/'+file)){res.writeHead(404);res.end();return}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync('public/'+file))});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath,headless:true});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.stack));
await page.route('**/config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.FLUENT_CONFIG={apiBase:location.origin};'}));
await page.route('**/account.bundle.js',r=>r.fulfill({contentType:'text/javascript',body:`window.FluentSession={user:{uid:'fixture'},token:async()=>'fixture'};document.body.classList.remove('booting');window.dispatchEvent(new Event('fluent-auth-ready'));prepareInitialScreen().then(()=>render());`}));
await page.route('**/api/**',async r=>{const request=r.request(),p=new URL(request.url()).pathname;let result={};
 if(p==='/api/learning')result={catalog:{prompts:fixture.samples.map(s=>({id:s.id})),items:[]},history:[],current:assessment.status==='completed'?assessment:null};
 else if(p===`/api/sessions/${id}`)result={session};
 else if(p===`/api/assessments/${id}`)result={assessment};
 else if(p===`/api/assessments/${id}/from-session`){oralPosts++;assert.equal(request.postDataJSON().retryAttempt,1);assessment={...assessment,status:'completed',attempt:2,result:validResult(fixture),scores:{skills:{},details:[]},week:[]};result={assessment}}
 else if(p===`/api/feedback/session/${id}`){if(request.method()==='POST'){reviewPosts++;assert.equal(request.postDataJSON().retryAttempt,1);review={id,status:'completed',attempt:2,source:'openai',result:{summary:'Explicas una experiencia propia.',strengths:[],observations:[],corrections:[],nextStep:'Añade un resultado.',scoring:{score:8,passed:false,criteria:[]}}}}result={review}}
 else if(p==='/api/study')result={course:{id:assessment.status==='completed'?id:'foundation',modules:[]},history:[]};
 else if(p==='/api/session')result={mode:'openai'};
 else if(p==='/api/sessions')result={sessions:[]};
 else if(p.startsWith('/api/route'))result={route:null};
 await r.fulfill({json:result});
});
try{
 await page.goto(`http://127.0.0.1:${server.address().port}/#/aula`);await page.waitForFunction(()=>learning.loaded);
 await page.evaluate(id=>openReview('session',id),id);await page.locator('[data-action=oral-retry]').waitFor();assert.equal(oralPosts,0);assert.equal(reviewPosts,0);
 await page.locator('[data-action=oral-retry]').click();await page.getByRole('heading',{name:'Tu punto de partida: B1'}).waitFor();assert.equal(oralPosts,1);assert.equal(reviewPosts,0);
 await page.locator('[data-action=review-retry]').click();await page.locator('.review-score').waitFor();assert.equal(reviewPosts,1);
 await page.evaluate(id=>openReview('session',id),id);assert.equal(oralPosts,1);assert.equal(reviewPosts,1);
 const stable=await page.evaluate(()=>{render();const original=document.querySelector('#main').firstElementChild;render();render();return original===document.querySelector('#main').firstElementChild});assert.equal(stable,true,'Repeated render preserves unchanged DOM');
 assert.deepEqual(errors,[]);console.log('PASS: saved diagnosis and review recover independently, no automatic replay on reopen, unchanged renders preserve DOM. No provider calls.');
}finally{await browser.close();await new Promise(r=>server.close(r))}
