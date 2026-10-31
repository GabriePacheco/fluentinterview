// Explicit authorized rollout. Creates/removes a synthetic account; no AI calls.
import fs from 'node:fs';
import crypto from 'node:crypto';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const context={window:{}};vm.runInNewContext(fs.readFileSync('public/config.js','utf8'),context);
const config=context.window.FLUENT_CONFIG,privateFile='.local/budget-increase-check.json';
if(fs.existsSync(privateFile))throw Error('A prior verification account needs cleanup before repeating.');
let account,before,after,cleaned=false;
async function identity(action,payload){const r=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:'+action+'?key='+config.firebase.apiKey,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('Synthetic identity '+action+': HTTP '+r.status);return r.json()}
async function api(path,body){const r=await fetch(config.apiBase+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+account.idToken,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('Verification '+path+': HTTP '+r.status);return r.json()}
try{
 account=await identity('signUp',{email:'fluent-budget-'+crypto.randomUUID()+'@example.invalid',password:crypto.randomBytes(24).toString('base64url')+'aA1!',returnSecureToken:true});
 fs.writeFileSync(privateFile,JSON.stringify({idToken:account.idToken,uid:account.localId}));
 before=(await api('/api/session')).budget;assert.equal(before.limitUsd,2);
 console.log(JSON.stringify({before}));
 const deployment=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','deploy'],{stdio:'inherit',env:{...process.env,NODE_USE_SYSTEM_CA:'1'},timeout:180000,windowsHide:true});
 if(deployment.status!==0)throw Error('Worker deployment did not complete successfully.');
 after=(await api('/api/session')).budget;
 assert.equal(after.limitUsd,6);assert.ok(after.attempts>=before.attempts);assert.ok(after.reservedUsd>=before.reservedUsd);assert.ok(after.estimatedUsageUsd>=before.estimatedUsageUsd);assert.equal(after.reservationPerCallUsd,.05);
 assert.equal(after.remainingCalls,Math.floor((6000000-Math.round(after.reservedUsd*1e6))/50000));
 console.log(JSON.stringify({after,paidOpenAICalls:0}));
}finally{
 if(account){await api('/api/account/delete',{confirm:'ELIMINAR'});await identity('delete',{idToken:account.idToken});fs.unlinkSync(privateFile);cleaned=true;}
 fs.writeFileSync('qa/budget-increase.json',JSON.stringify({testedAt:new Date().toISOString(),before,after,cleanup:cleaned,paidOpenAICalls:0},null,2));
}
