import fs from 'node:fs';import assert from 'node:assert/strict';
import {createApplication} from '../server/index.mjs';import {chromium,executablePath} from './browser-runtime.mjs';
const directory=fs.mkdtempSync('.local/onboarding-browser-'),email=`onboarding-${Date.now()}@example.invalid`,password='Only-local-test-753!';
const app=createApplication({directory,emulator:true,mode:'mock',budgetUsd:0,verifyToken:async header=>{
 const response=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:lookup?key=demo-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:header?.slice(7)})});
 const data=await response.json(),u=data.users?.[0];if(!u)throw Object.assign(Error('Auth required'),{status:401});return {uid:u.localId,email:u.email,emailVerified:!!u.emailVerified||u.providerUserInfo?.some(p=>p.providerId==='google.com')};
}});await app.listen(0);const base=`http://127.0.0.1:${app.server.address().port}`;
let context;const errors=[];
try{
 context=await chromium.launchPersistentContext(directory+'/browser',{executablePath,headless:true,viewport:{width:1365,height:1000}});
 let page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(18000);
 await page.goto(base);await page.getByRole('button',{name:'Continuar con Google'}).waitFor();
 await page.screenshot({path:'qa/auth-google-desktop.png',fullPage:true,animations:'disabled'});
 await page.getByRole('button',{name:'Crear cuenta',exact:true}).click();await page.locator('[name=name]').fill('Alicia');await page.locator('[name=email]').fill(email);await page.locator('[name=password]').fill(password);await page.getByRole('button',{name:'Crear mi cuenta'}).click();
 await page.getByRole('heading',{name:'Revisa tu bandeja de entrada.'}).waitFor();
 const codes=await fetch('http://127.0.0.1:9099/emulator/v1/projects/demo-fluentinterview/oobCodes').then(r=>r.json());
 const code=codes.oobCodes.find(x=>x.email===email&&x.requestType==='VERIFY_EMAIL');assert.ok(code,'Registration sends confirmation');
 const verified=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:update?key=demo-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({oobCode:code.oobCode})});assert.ok(verified.ok);
 await page.getByRole('button',{name:'Ya confirmé mi correo'}).click();await page.locator('#onboarding-form').waitFor();
 await page.locator('[name=selfReportedLevel][value=C2]').check();await page.locator('[name=profession]').fill('Ingeniera de sistemas');await page.locator('[name=targetRoles]').fill('Software Developer, QA Engineer');
 await page.screenshot({path:'qa/onboarding-desktop.png',fullPage:true,animations:'disabled'});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'qa/onboarding-mobile.png',fullPage:true,animations:'disabled'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.getByRole('button',{name:'Continuar al diagnóstico'}).click();await page.waitForURL('**/#/diagnostico');await page.waitForFunction(()=>!document.querySelector('#onboarding-form'));
 assert.equal(await page.evaluate(()=>profileForAI().selfReportedLevel),undefined);assert.equal(await page.evaluate(()=>state.role),'Software Developer');
 await context.close();context=await chromium.launchPersistentContext(directory+'/browser',{executablePath,headless:true,viewport:{width:1365,height:1000}});
 page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(18000);await page.goto(base);await page.waitForFunction(()=>window.FluentSession?.user?.emailVerified&&location.hash==='#/diagnostico');
 assert.equal(await page.evaluate(()=>window.FluentSession.user.email),email);assert.equal(await page.locator('#onboarding-form').count(),0);
 await page.locator('[data-account=logout]').first().click();await page.getByRole('button',{name:'Continuar con Google'}).waitFor();
 const popupReady=context.waitForEvent('page');await page.getByRole('button',{name:'Continuar con Google'}).click();const popup=await popupReady;await popup.waitForLoadState();
 try{
  await popup.getByText('Add new account',{exact:true}).click();
  await popup.getByLabel('Email',{exact:true}).fill(`google-${Date.now()}@example.invalid`);
  await popup.getByLabel('Display name',{exact:true}).fill('Bruno Google');
  await popup.getByRole('button',{name:/Sign in with Google/i}).click();
 }catch(e){console.log((await popup.locator('body').innerText()).slice(0,1800));throw e}
 await page.locator('#onboarding-form').waitFor();assert.equal(await page.locator('.verification-card').count(),0);
 assert.equal(await page.locator('[name=profession]').inputValue(),'');assert.equal(await page.locator('[name=targetRoles]').inputValue(),'');
 await page.locator('[name=profession]').fill('Diseñador');await page.locator('[name=targetRoles]').fill('UX Designer');await page.getByRole('button',{name:'Continuar al diagnóstico'}).click();await page.waitForURL('**/#/diagnostico');
 assert.deepEqual(errors,[]);console.log('PASS: email confirmation, Google popup in emulator, one-step onboarding, account isolation, redirect to diagnostic, self-level excluded, browser-close persistence, logout, responsive UI. No real email or OpenAI calls.');
}finally{await context?.close();await app.close()}
