import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {generateKeyPair,SignJWT} from 'jose';
import {createTokenVerifier} from '../server/auth.mjs';
import {BudgetLedger} from '../server/budget.mjs';
import {createAI} from '../server/ai.mjs';
import {createApplication} from '../server/index.mjs';
const project='demo-fluentinterview';
const {publicKey,privateKey}=await generateKeyPair('RS256');
const verify=createTokenVerifier(project,publicKey);
const token=(changes={})=>new SignJWT({auth_time:Math.floor(Date.now()/1000),email_verified:true,...changes}).setProtectedHeader({alg:'RS256'}).setSubject('alice').setIssuer(`https://securetoken.google.com/${project}`).setAudience(changes.aud||project).setIssuedAt().setExpirationTime(changes.exp||'1h').sign(privateKey);
function temporary(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'fluent-day1-'));t.after(()=>{if(!path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep+'fluent-day1-'))throw Error('Unsafe cleanup');fs.rmSync(dir,{recursive:true,force:true})});return dir}
test('Firebase token: signature, expiration, issuer/audience and missing session',async()=>{
 assert.equal((await verify(`Bearer ${await token()}`)).uid,'alice');
 for(const header of [undefined,'Bearer arbitrary',`Bearer ${await token({aud:'another-project'})}`,`Bearer ${await token({exp:1})}`,`Bearer ${await token({auth_time:Date.now()})}`])await assert.rejects(()=>verify(header),{status:401});
 const valid=await token();await assert.rejects(()=>verify(`Bearer ${valid.slice(0,-6)}abcdef`),{status:401});
});
test('Zero budget and simulated AI never call the provider',async t=>{
 const ledger=new BudgetLedger(temporary(t),0);t.after(()=>ledger.close());let calls=0;
 const fetchImpl=()=>{calls++;throw Error('Unexpected network')};
 assert.equal((await createAI({ledger,fetchImpl}).run('conversation',{messages:[]})).source,'mock');
 await assert.rejects(()=>createAI({mode:'openai',apiKey:'test-only',ledger,fetchImpl}).run('conversation',{messages:[]}),{status:402});
 assert.equal(calls,0);assert.equal(ledger.snapshot().attempts,0);
});
test('A failed paid attempt keeps its reservation across restart; locks prevent another writer',async t=>{
 const dir=temporary(t);let ledger=new BudgetLedger(dir,.05);
 assert.throws(()=>new BudgetLedger(dir,.05),/Otro servidor/);
 await assert.rejects(()=>createAI({mode:'openai',apiKey:'test-only',ledger,fetchImpl:async()=>{throw Error('offline')}}).run('conversation',{messages:[]}),{status:502});
 ledger.close();ledger=new BudgetLedger(dir,.05);t.after(()=>ledger.close());
 assert.equal(ledger.snapshot().attempts,1);assert.throws(()=>ledger.reserve(),{status:402});
});
test('HTTP rejects anonymous, cross-origin, oversized and privilege payloads; secrets are not served',async t=>{
 const app=createApplication({directory:temporary(t),verifyToken:verify,projectId:project,mode:'mock',budgetUsd:0});await app.listen(0);t.after(()=>app.close());
 const base=`http://127.0.0.1:${app.server.address().port}`,authorization=`Bearer ${await token()}`;
 assert.equal((await fetch(base+'/api/session')).status,401);
 assert.equal((await fetch(base+'/api/session',{headers:{authorization,Origin:'https://attacker.invalid'}})).status,403);
 assert.equal((await fetch(base+'/.env')).status,404);
 assert.equal((await fetch(base+'/server/auth.mjs')).status,404);
 const localConfig=await fetch(base+'/config.js').then(r=>r.text());assert.match(localConfig,/apiBase:''/);assert.ok(!localConfig.includes('workers.dev'));
 const session=await fetch(base+'/api/session',{headers:{authorization}}).then(r=>r.json());assert.equal(session.uid,'alice');assert.equal(session.budget.limitUsd,0);
 const send=body=>fetch(base+'/api/conversation',{method:'POST',headers:{authorization,'Content-Type':'application/json'},body});
 assert.equal((await send(JSON.stringify({messages:[],padding:'x'.repeat(17000)}))).status,413);
 const response=await send(JSON.stringify({messages:[],uid:'bob',admin:true,budgetUsd:999}));assert.equal(response.status,200);assert.equal((await response.json()).budget.limitUsd,0);
 assert.equal((await send('not-json')).status,400);
});
