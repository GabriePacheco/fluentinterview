import http from 'node:http';import fs from 'node:fs';import assert from 'node:assert/strict';
import {chromium,executablePath} from './browser-runtime.mjs';
import {recordOpenAIUsage,readOpenAIUsage,finishUsageSession} from '../server/openai-usage.mjs';
const map=new Map(),storage={get:async k=>map.get(k),put:async(k,v)=>map.set(k,v)};
await recordOpenAIUsage(storage,{id:'fixture-voice',model:'gpt-realtime-2.1-mini',scope:'owner',sessionId:'fixture-conversation',usage:{input_tokens:2000,output_tokens:1000,input_token_details:{text_tokens:1200,audio_tokens:800,cached_tokens:800,cached_tokens_details:{text_tokens:500,audio_tokens:300}},output_token_details:{text_tokens:200,audio_tokens:800}}});
await recordOpenAIUsage(storage,{id:'fixture-partial',model:'whisper-1',scope:'owner',sessionId:'fixture-conversation'});
await finishUsageSession(storage,{sessionId:'fixture-conversation',uid:'fixture',startedAt:Date.now()-300000,endedAt:Date.now()});
const data=await readOpenAIUsage(storage);Object.assign(data.recent[0],{email:'gabriel@example.invalid',sessionType:'tutor',status:'completed',durationSeconds:300});
data.recent.push({...data.recent[0],id:'other-conversation',email:'ana@example.invalid',scope:'users',incomplete:0,durationSeconds:null,startedAt:Date.now()-86400000});
const profile=fs.readFileSync('src/account.js','utf8').split('views.perfil=')[1].split('views.progreso=')[0];
const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';if(!/^[\w.-]+$/.test(name)||!fs.existsSync('public/'+name)){res.writeHead(404);res.end();return}res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync('public/'+name))});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath,headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));let reads=0;
await page.route('**/account.bundle.js',route=>route.fulfill({contentType:'text/javascript',body:'const account={user:{uid:"fixture",email:"owner@example.invalid",emailVerified:true}};window.FluentSession={user:account.user,token:async()=>"fixture"};document.body.classList.remove("booting");views.perfil='+profile+';render();loadCommerce();'}));
await page.route('**/api/**',route=>{const path=new URL(route.request().url()).pathname;let result={};if(path==='/api/billing')result={admin:true,plan:'owner',limits:{real:{used:0,limit:100}},voice:{}};if(path==='/api/admin')result={budget:{reservedUsd:6,limitUsd:6,estimatedUsageUsd:.02},settings:{aiPaused:false},users:[],audit:[]};if(path==='/api/admin/openai-usage'){reads++;result=data}return route.fulfill({contentType:'application/json',body:JSON.stringify(result)})});
try{
 await page.goto(`http://127.0.0.1:${server.address().port}/#/perfil`);await page.getByRole('heading',{name:'Consumo de OpenAI'}).waitFor();await page.getByText('Hay datos de coste incompletos.',{exact:false}).waitFor();
 await page.getByText('Modelos y tokens registrados',{exact:true}).click();assert.match(await page.locator('[data-openai-monitor]').innerText(),/gpt-realtime-2.1-mini/);
 await page.locator('#profile-name').fill('Cambio sin guardar');await page.locator('[data-openai-refresh]').click();await page.waitForFunction(()=>!commerce.usageLoading);assert.equal(await page.locator('#profile-name').inputValue(),'Cambio sin guardar');assert.ok(reads>=2);
 await page.goto(`http://127.0.0.1:${server.address().port}/#/administracion`);await page.locator('.usage-latest h3').waitFor();assert.equal(await page.locator('.usage-latest h3').innerText(),'gabriel@example.invalid');assert.match(await page.locator('.usage-latest').innerText(),/5 min 00 s/);
 await page.getByRole('searchbox',{name:'Buscar conversaciones'}).fill('ana@');assert.equal(await page.locator('.usage-table tbody tr').count(),1);assert.match(await page.locator('.usage-table tbody').innerText(),/ana@example/);
 await page.getByRole('searchbox',{name:'Buscar conversaciones'}).fill('sin-coincidencias');assert.equal(await page.locator('.usage-table tbody tr').count(),0);
 await page.getByRole('searchbox',{name:'Buscar conversaciones'}).fill('');await page.locator('[data-usage-scope]').selectOption('owner');assert.equal(await page.locator('.usage-table tbody tr').count(),1);await page.locator('[data-usage-scope]').selectOption('all');
 fs.mkdirSync('qa',{recursive:true});await page.locator('.usage-dashboard').screenshot({path:'qa/openai-dashboard-desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.locator('.usage-dashboard').screenshot({path:'qa/openai-dashboard-mobile.png'});
 await page.evaluate(()=>{commerce.data.admin=false;updateOpenAIUsage()});assert.equal(await page.locator('[data-openai-monitor]').innerText(),'');
 await page.evaluate(()=>window.dispatchEvent(new Event('fluent-auth-cleared')));assert.equal(await page.evaluate(()=>commerce.openai),null);assert.deepEqual(errors,[]);
 console.log('Owner monitor: estimates, missing data, refresh preserves unsaved profile, mobile and account clearing OK. No paid calls.');
}finally{await browser.close();server.close()}
