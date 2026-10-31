import {createRequire} from 'node:module';import fs from 'node:fs';import assert from 'node:assert/strict';import {decodeJwt} from 'jose';
import {createApplication} from '../server/index.mjs';
const {chromium,executablePath}=await import('./browser-runtime.mjs');
const verifyToken=async header=>{const token=decodeJwt((header||'').slice(7));if(token.aud!=='demo-fluentinterview'||!token.sub)throw Object.assign(Error('Only emulator tokens'),{status:401});return {uid:token.sub,emailVerified:false}};
const app=createApplication({directory:'.local/day2-browser',emulator:true,verifyToken,mode:'mock',budgetUsd:0});await app.listen(0);
const browser=await chromium.launch({executablePath,headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(15000);const errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{
 window.__speaking=false;window.__echoOverlap=false;window.__starts=0;
 class Recognition{start(){window.__rec=this;window.__starts++;if(window.__speaking)window.__echoOverlap=true;setTimeout(()=>this.onstart?.(),5)}abort(){if(window.__rec===this)window.__rec=null}}
 window.SpeechRecognition=Recognition;window.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};
 Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[],cancel(){window.__speaking=false},speak(u){window.__speaking=true;setTimeout(()=>{window.__speaking=false;u.onend?.()},25)}}});
});
try{
 await page.goto(`http://127.0.0.1:${app.server.address().port}/#/aula`);await page.getByRole('button',{name:'Crear cuenta',exact:true}).click();await page.locator('[name=name]').fill('Prueba Voz');await page.locator('[name=email]').fill(`voice-${Date.now()}@example.invalid`);await page.locator('[name=password]').fill('Testing-Day2-strong!');await page.getByRole('button',{name:'Crear mi cuenta'}).click();await page.waitForFunction(()=>runtime.config?.mode==='mock');
 await page.locator('[data-action=voice-start]').click();await page.waitForFunction(()=>voice.status==='listening');
 const id=await page.evaluate(()=>voice.session.id);await page.evaluate(()=>voice.waitMs=10);
 for(let i=1;i<=5;i++){
  await page.evaluate(n=>{const r=[{transcript:`I built project ${n} and helped my team improve reporting.`}];r.isFinal=true;window.__rec.onresult({results:[r]})},i);
  await page.waitForFunction(n=>voice.index===n&&voice.status==='listening',i);
 }
 assert.equal(await page.evaluate(()=>window.__echoOverlap),false);checks.push('Five automatic exchanges after one start; recognition never overlaps tutor audio');
 await page.locator('[data-action=voice-pause]').click();assert.equal(await page.evaluate(()=>window.__rec),null);assert.equal(await page.evaluate(()=>window.__speaking),false);checks.push('Pause releases microphone and speech');
 await page.locator('[data-action=voice-text]').click();await page.locator('#voice-text').fill('I reduced reporting time by two hours each week.');await page.locator('#voice-text-form [type=submit]').click();await page.waitForFunction(()=>voice.session?.status==='completed');assert.equal(await page.evaluate(()=>voice.session.summary.learnerTurns),6);checks.push('Text fallback preserves session and saves sixth answer with summary');
 await page.screenshot({path:'qa/day2-conversation.png',fullPage:true,animations:'disabled'});
 await page.reload();await page.waitForFunction(()=>runtime.config?.mode==='mock');await page.evaluate(()=>location.hash='/progreso');await page.locator(`[data-action=voice-open][data-id="${id}"]`).click();await page.waitForFunction(()=>voice.session?.summary.learnerTurns===6);checks.push('History reload restores transcript and summary from server');
 await page.locator('[data-action=voice-new]').click();await page.evaluate(()=>{window.SpeechRecognition=undefined;window.webkitSpeechRecognition=undefined});await page.locator('[data-action=voice-start]').click();await page.waitForFunction(()=>voice.status==='error');await page.locator('[data-action=voice-text]').click();await page.waitForFunction(()=>voice.status==='text'&&voice.session.messages.length===1);checks.push('Unsupported microphone falls back to text with the same saved session');
 await page.locator('#voice-text').fill('I work in customer support.');await page.locator('#voice-text-form [type=submit]').click();await page.waitForFunction(()=>voice.index===1&&!voice.busy);await page.locator('[data-action=voice-end]').click();await page.waitForFunction(()=>voice.status==='complete');
 await page.locator('[data-action=voice-new]').click();await page.locator('[data-action=voice-start-text]').click();await page.waitForFunction(()=>voice.status==='text'&&!voice.busy);
 let dropped=false;await page.route('**/api/sessions/*/turn',async route=>{if(!dropped){dropped=true;await route.fetch();await route.abort('connectionreset')}else await route.continue()});
 await page.locator('#voice-text').fill('I fixed a slow report for my team.');await page.locator('#voice-text-form [type=submit]').click();await page.waitForFunction(()=>voice.status==='error'&&!voice.busy);
 await page.locator('[data-action=voice-resume]').click();await page.waitForFunction(()=>voice.status==='text'&&!voice.busy);assert.equal(await page.evaluate(()=>voice.session.messages.length),3);assert.equal(await page.evaluate(()=>voice.index),1);await page.unroute('**/api/sessions/*/turn');checks.push('Lost HTTP response recovers saved answer without duplicate transcript');
 await page.locator('[data-action=voice-end]').click();await page.waitForFunction(()=>voice.status==='complete');
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:'qa/day2-mobile.png',fullPage:true,animations:'disabled'});checks.push('Conversation layout fits 390px viewport');
 await page.locator('[data-account=logout]').first().click();await page.getByRole('button',{name:'Entrar a mi espacio'}).waitFor();assert.equal(await page.evaluate(()=>voice.session),null);checks.push('Logout clears conversation and stops audio');assert.deepEqual(errors,[]);
 fs.writeFileSync('qa/day2-browser.json',JSON.stringify({checks,errors,audio:'Browser speech test doubles; physical microphone not tested',openAICalls:0},null,2));console.log(JSON.stringify({checks,errors}));
}catch(error){await page.screenshot({path:'qa/day2-failure.png',fullPage:true});console.log(JSON.stringify({errors,state:await page.evaluate(()=>({status:voice.status,error:voice.error,busy:voice.busy}))}));throw error}finally{await browser.close();await app.close()}
