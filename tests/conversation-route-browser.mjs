import http from 'node:http';import fs from 'node:fs';import assert from 'node:assert/strict';
import {chromium,executablePath} from './browser-runtime.mjs';
import {routeFixture,finishAttempt} from './route-fixtures.mjs';
import {schoolRequest} from '../server/school-api.mjs';
const f=await routeFixture();let session,reviewCalls=0,score=7.4;
const reviewData=()=>({status:'completed',source:'openai',result:{summary:'Explicas una experiencia de atención al cliente.',strengths:[{comment:'Identificas tu contribución.',quote:'I helped a customer.'}],observations:[],corrections:[],nextStep:'Añade qué cambió gracias a tu acción.',scoring:{score,passed:score>=7.5,criteria:[{label:'Detalles y ejemplos',points:score,reason:'Conecta tu acción con el resultado.'}]}}});
const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';if(!/^[\w.-]+$/.test(name)||!fs.existsSync('public/'+name)){res.writeHead(404);res.end();return}res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync('public/'+name))});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath,headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']});const page=await browser.newPage({viewport:{width:1365,height:950}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.FLUENT_CONFIG={apiBase:location.origin};'}));
await page.route('**/account.bundle.js',r=>r.fulfill({contentType:'text/javascript',body:`window.FluentSession={user:{uid:'alice'},token:async()=>'fixture'};document.body.classList.remove('booting');runtime.config={mode:'openai'};installSchoolViews();installCommerce();learning.loaded=true;learning.current=${JSON.stringify(f.record)};render();`}));
await page.route('**/api/**',async route=>{const request=route.request(),p=new URL(request.url()).pathname,method=request.method(),input=method==='POST'?request.postDataJSON():{};let result={};try{
 if(p.startsWith('/api/route')){result=await schoolRequest({routes:f.routes},p,method,input,{uid:'alice',emailVerified:true});if(result.session)session=result.session}
 else if(p==='/api/realtime/ticket'){await f.storage.put(f.sessions.key('alice',session.id),{...session,transport:'realtime'});result={uid:'alice',ticket:'fixture',seconds:120}}
 else if(p==='/api/sessions')result={sessions:await f.sessions.list('alice')};
 else if(p.startsWith('/api/sessions/'))result={session:await f.sessions.get('alice',p.split('/')[3])};
 else if(p.startsWith('/api/feedback/')){if(method==='POST'){reviewCalls++;await finishAttempt(f,session,score)}const stored=await f.storage.get('feedback:alice:session:'+session.id);result={review:stored?reviewData():null}}
 else if(p==='/api/learning')result={current:f.record,history:[],catalog:{},pending:null};
 await route.fulfill({json:result});}catch(error){await route.fulfill({status:error.status||500,json:{error:error.message}})}});
await page.addInitScript(()=>{window.WebSocket=class{readyState=0;bufferedAmount=0;constructor(){window.__socket=this;setTimeout(()=>{this.readyState=1;this.receive({type:'fluent.ready'})},20)}receive(e){this.onmessage?.({data:JSON.stringify(e)})}send(text){const e=JSON.parse(text);if(e.type==='fluent.end')setTimeout(()=>this.receive({type:'fluent.closed',completed:true,message:''}),10)}close(){this.readyState=3;this.onclose?.()}}});
try{
 await page.goto(`http://127.0.0.1:${server.address().port}/#/ruta`);await page.locator('.path-step.current').waitFor();assert.equal(await page.locator('.path-step.current').count(),1);assert.equal(await page.locator('.path-step.locked button[data-action=path-start]:enabled').count(),0);
 assert.equal(await page.locator('.path-capability').count(),7);await page.screenshot({path:'qa/personal-route-desktop.png',fullPage:true,animations:'disabled'});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'qa/interview-route-mobile.png',fullPage:true,animations:'disabled'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.setViewportSize({width:1280,height:720});
 await page.locator('.path-step.current [data-action=path-start]').click();await page.locator('[data-action=voice-start]').waitFor();assert.equal(await page.locator('[data-conversation-mode]').count(),0);
 await page.locator('[data-action=voice-start]').click();await page.waitForFunction(()=>realtimeVoice?.ready);assert.equal(session.learning.level,'A2');assert.equal(session.learning.routeStep,true);
 await finishAttempt(f,session,score);await f.storage.delete('feedback:alice:session:'+session.id);await page.evaluate(()=>window.__socket.receive({type:'fluent.closed',completed:true,message:'Paso terminado.'}));
 await page.waitForFunction(()=>current()==='resultado'&&pathState.data?.stages[0].steps[0].latest?.reviewedAt);assert.equal(reviewCalls,1);assert.equal(await page.evaluate(()=>pathState.data.completed),0);assert.ok((await page.locator('.path-review').innerText()).includes('Añade una acción'));
 await page.locator('.path-review [data-action=path-start]').last().click();await page.locator('[data-action=voice-start]').click();await page.waitForFunction(()=>realtimeVoice?.ready);assert.equal(session.learning.attempt,2);assert.ok(session.learning.retryFocus);assert.ok(session.learning.avoidQuestions.length);
 score=7.5;await finishAttempt(f,session,score);await f.storage.delete('feedback:alice:session:'+session.id);await page.evaluate(()=>window.__socket.receive({type:'fluent.closed',completed:true,message:'Paso terminado.'}));
 await page.waitForFunction(()=>pathState.data?.completed===1&&current()==='resultado');assert.equal(reviewCalls,2);await page.getByRole('heading',{name:'✓ Paso aprobado',exact:true}).waitFor();
 await page.evaluate(()=>go('ruta'));await page.locator('.path-step.passed').waitFor();assert.equal(await page.locator('.path-step.current').count(),1);
 await page.reload();await page.locator('.path-step.passed').waitFor();assert.equal(await page.locator('.path-step.passed').count(),1);assert.equal(reviewCalls,2);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'qa/personal-route-mobile.png',fullPage:true,animations:'disabled'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.setViewportSize({width:1536,height:1024});await page.evaluate(()=>go('inicio'));
 await page.locator('.grade-ring').waitFor();await page.locator('.journey-ribbon [aria-current=step]').waitFor();
 assert.equal(await page.locator('.ribbon-step.passed').count(),1);assert.match(await page.locator('.last-conversation').innerText(),/Identificas tu contribución/);assert.equal(await page.locator('.grade-ring b').innerText(),'7,5');
 assert.ok((await page.locator('.ribbon-title').allTextContents()).every(title=>title.trim().length>0),'Each visible step has its real title');
 assert.doesNotMatch(await page.locator('.journey-ribbon').innerText(),/Pendiente/);
 assert.equal(await page.locator('.ribbon-caption').innerText(),'Estás aquí');
 await page.locator('.journey-card').screenshot({path:'qa/route-ribbon-desktop.png',animations:'disabled'});
 assert.equal(reviewCalls,2,'Home only reads the existing evaluation');
 assert.equal(await page.locator('main img').count(),0,'No character or generated illustration');
 await page.screenshot({path:'qa/step6-home-desktop.png',fullPage:true,animations:'disabled'});
 for(const width of [390,768]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);if(width===390){await page.screenshot({path:'qa/step6-home-mobile.png',fullPage:true,animations:'disabled'});await page.locator('.journey-card').screenshot({path:'qa/route-ribbon-mobile.png',animations:'disabled'})}}
 await page.locator('[data-action=dashboard-interview]').click();await page.locator('#school-interview-form').waitFor();assert.equal(await page.locator('select[name=mode]').inputValue(),'interview');
 await page.evaluate(()=>go('inicio'));await page.locator('.launch-actions [data-action=path-start]').click();await page.locator('.path-room-title').waitFor();assert.equal(await page.evaluate(()=>pathState.selection.stepId),await page.evaluate(()=>pathState.data.nextStepId));
 await page.evaluate(()=>{learning.current=null;pathState.epoch++;Object.assign(pathState,{data:null,key:'current',loadingKey:null});go('inicio')});await page.locator('.journey-empty').waitFor();assert.equal(await page.locator('.journey-ribbon').count(),0,'No generic route is presented as personal');
 await page.locator('[data-action=dashboard-tutor]').click();assert.equal(await page.evaluate(()=>school.conversationMode),'tutor');await page.locator('[data-conversation-mode=tutor]').waitFor();
 assert.equal(reviewCalls,2);assert.deepEqual(errors,[]);console.log('PASS: personalized route, locked steps, simulated voice, retry, 7.5/10 unlock, persistence, new dashboard with saved strengths/grade, no character, distinct modes, empty diagnosis, responsive desktop/mobile. No provider calls.');
}finally{await browser.close();await new Promise(r=>server.close(r))}
