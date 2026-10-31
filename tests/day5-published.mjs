// Read-only publication checks. No accounts, payment attempts or OpenAI calls.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parseEnv} from 'node:util';
const web='https://fuentinterview--day1-0vs64ic5.web.app';
const api='https://fluent-interview-api.fluent-interview-local.workers.dev';
const secretNames=['OPENAI_API_KEY','LEMONSQUEEZY_API_KEY','LEMONSQUEEZY_WEBHOOK_SECRET'];
const secrets=['.env','.env.lemon.local'].filter(f=>fs.existsSync(f)).flatMap(f=>{const env=parseEnv(fs.readFileSync(f,'utf8'));return secretNames.map(k=>env[k]).filter(Boolean)});
const files=fs.readdirSync('public').filter(f=>/\.(js|css|html)$/.test(f));
for(const file of files){const local=fs.readFileSync('public/'+file);const response=await fetch(web+'/'+file,{signal:AbortSignal.timeout(30000)});assert.equal(response.status,200,file);const remote=Buffer.from(await response.arrayBuffer());assert.ok(local.equals(remote),'Published file differs: '+file);for(const secret of secrets)assert.ok(!remote.includes(Buffer.from(secret)),'Private configuration found in public assets');}
const checks=[];
for(const route of ['/api/billing','/api/admin']){const r=await fetch(api+route,{signal:AbortSignal.timeout(20000)});assert.equal(r.status,401);checks.push(route+' rejects unauthenticated access');}
const webhook=await fetch(api+'/api/webhooks/lemonsqueezy',{method:'POST',body:'{}',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(20000)});assert.equal(webhook.status,401);checks.push('Unsigned provider notification rejected');
assert.ok(!fs.existsSync('.local/day5-cloud-state.json'),'Synthetic account cleanup is still pending');
fs.writeFileSync('qa/day5-published.json',JSON.stringify({testedAt:new Date().toISOString(),matchingPublicFiles:files.length,privateSecretsAbsent:true,checks,paidOpenAICalls:0},null,2));
console.log(JSON.stringify({matchingPublicFiles:files.length,privateSecretsAbsent:true,checks,paidOpenAICalls:0}));
