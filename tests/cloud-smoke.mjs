// Explicit live smoke check. Creates only temporary accounts and deletes them.
// Does not send emails, call OpenAI or print tokens/passwords.
import {createRequire} from 'node:module';import crypto from 'node:crypto';import fs from 'node:fs';import assert from 'node:assert/strict';
import {createApplication} from '../server/index.mjs';
const {chromium,executablePath}=await import('./browser-runtime.mjs');
const url=process.env.FLUENT_PREVIEW_URL;if(!url?.startsWith('https://fuentinterview--day1-'))throw Error('Set the verified preview URL.');
const remoteApi=process.env.FLUENT_API_URL||'';
if(remoteApi&&!/^https:\/\/fluent-interview-api\.[a-z0-9-]+\.workers\.dev$/.test(remoteApi))throw Error('Set the verified Worker URL.');
const browser=await chromium.launch({executablePath,headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(30000);
const accounts=[],checks=[],errors=[];page.on('pageerror',e=>errors.push(e.message));let config,app;
const fsRoot='https://firestore.googleapis.com/v1/projects/fuentinterview/databases/(default)/documents/fi_users/';
try{
 await page.goto(url);await page.getByRole('button',{name:'Entrar a mi espacio'}).waitFor();config=await page.evaluate(()=>window.FLUENT_CONFIG.firebase);checks.push('Published HTTPS login loads');
 for(const name of ['Prueba Alicia','Prueba Bruno']){
  await page.getByRole('button',{name:'Crear cuenta',exact:true}).click();await page.locator('[name=name]').fill(name);await page.locator('[name=email]').fill(`fluent-qa-${crypto.randomUUID()}@example.invalid`);await page.locator('[name=password]').fill(crypto.randomBytes(24).toString('base64url')+'aA1!');await page.getByRole('button',{name:'Crear mi cuenta'}).click();
  await page.waitForFunction(()=>window.FluentSession?.user?.uid);
  const credentials=await page.evaluate(async()=>({uid:window.FluentSession.user.uid,token:await window.FluentSession.token()}));accounts.push(credentials);
  await page.getByRole('heading',{name:`Bienvenido, ${name}.`}).waitFor();
  await page.evaluate(()=>location.hash='/perfil');await page.locator('[name=role]').waitFor();assert.equal(await page.locator('[name=role]').inputValue(),'');
  if(accounts.length===1){await page.locator('[name=role]').fill('QA Data Analyst');await page.getByRole('button',{name:'Guardar mi objetivo'}).click();await page.getByText('Tu objetivo se guardó en tu cuenta.').waitFor();await page.reload();await page.locator('[name=role]').waitFor();assert.equal(await page.locator('[name=role]').inputValue(),'QA Data Analyst');
   if(remoteApi){
    assert.equal(await page.evaluate(()=>window.FLUENT_CONFIG.apiBase),remoteApi);
    await page.waitForFunction(()=>runtime.config?.localOnly===false);
    const turn=await page.evaluate(()=>apiCall('/api/conversation',{messages:[],mode:'tutor'}));
    assert.equal(turn.source,'mock');assert.equal(turn.budget.limitUsd,0);assert.equal(turn.budget.attempts,0);
    assert.ok(turn.result.reply.length>0);checks.push('Published browser calls authenticated Worker across origins; mock response and zero spend');
   }
  }
  await page.locator('[data-account=logout]').first().click();await page.getByRole('button',{name:'Entrar a mi espacio'}).waitFor();await page.evaluate(()=>location.hash='/inicio');
 }
 checks.push('Two real Firebase accounts created; profile persists; second account isolated');
 const [alice,bob]=accounts;
 assert.equal((await fetch(fsRoot+alice.uid,{headers:{Authorization:`Bearer ${alice.token}`}})).status,200);
 assert.equal((await fetch(fsRoot+alice.uid,{headers:{Authorization:`Bearer ${bob.token}`}})).status,403);
 assert.ok([401,403].includes((await fetch(fsRoot+alice.uid)).status));
 assert.equal((await fetch(fsRoot+alice.uid+'?updateMask.fieldPaths=plan',{method:'PATCH',headers:{Authorization:`Bearer ${alice.token}`,'Content-Type':'application/json'},body:JSON.stringify({fields:{plan:{stringValue:'pro'}}})})).status,403);
 checks.push('Deployed Firestore rules reject cross-user access and plan escalation');
 app=createApplication({directory:'.local/cloud-smoke',mode:'mock',budgetUsd:0});await app.listen(0);
 const api=`http://127.0.0.1:${app.server.address().port}`;
 assert.equal((await fetch(api+'/api/session')).status,401);
 assert.equal((await fetch(api+'/api/session',{headers:{Authorization:`Bearer ${alice.token}`}})).status,200);
 checks.push('Local backend verifies a real signed Firebase ID token; anonymous rejected');
 if(remoteApi){
  assert.equal((await fetch(remoteApi+'/api/session')).status,401);
  assert.equal((await fetch(remoteApi+'/api/session',{headers:{Authorization:'Bearer invalid.token.signature'}})).status,401);
  assert.equal((await fetch(remoteApi+'/api/session',{headers:{Authorization:`Bearer ${alice.token}`,Origin:'https://attacker.invalid'}})).status,403);
  const session=await fetch(remoteApi+'/api/session',{headers:{Authorization:`Bearer ${alice.token}`,Origin:new URL(url).origin}});
  assert.equal(session.status,200);assert.equal(session.headers.get('access-control-allow-origin'),new URL(url).origin);
  const data=await session.json();assert.equal(data.uid,alice.uid);assert.equal(data.mode,'mock');assert.equal(data.budget.limitUsd,0);assert.equal(data.budget.attempts,0);
  assert.equal((await fetch(remoteApi+'/.env')).status,404);
  checks.push('Published Worker rejects missing/invalid sessions and foreign origins; secrets inaccessible');
 }
 await page.screenshot({path:'qa/day1-published-login.png',fullPage:true,animations:'disabled'});assert.deepEqual(errors,[]);
}finally{
 for(const account of accounts){
  const headers={Authorization:`Bearer ${account.token}`};
  const deletion=await fetch(fsRoot+account.uid,{method:'DELETE',headers});if(![200,404].includes(deletion.status))throw Error('Temporary profile cleanup failed.');
  const removal=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${config.apiKey}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:account.token})});if(!removal.ok)throw Error('Temporary account cleanup failed.');
 }
 await browser.close();if(app)await app.close();
}
checks.push('Temporary cloud accounts and profiles removed');fs.writeFileSync('qa/day1-cloud.json',JSON.stringify({url,remoteApi,checks,errors,openAICalls:0},null,2));console.log(JSON.stringify({url,remoteApi,checks,errors,openAICalls:0}));
