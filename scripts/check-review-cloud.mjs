// Exactly one new model call, using a synthetic development identity and the
// server's existing developer ledger. Never uses the owner's production access.
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import vm from 'node:vm';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),context={window:{}};vm.runInNewContext(fs.readFileSync('public/config.js','utf8'),context);const config=context.window.FLUENT_CONFIG;
const privateFile='.local/review-cloud-account.json',reportFile='qa/review-v2-cloud.json';let account=fs.existsSync(privateFile)?JSON.parse(fs.readFileSync(privateFile,'utf8')):null;
const report={testedAt:new Date().toISOString(),maxNewModelCalls:1,passed:false,cleaned:false};
function save(){if(account)fs.writeFileSync(privateFile,JSON.stringify(account));fs.writeFileSync(reportFile,JSON.stringify(report,null,2))}
async function identity(action,body,admin){const r=await fetch(`https://identitytoolkit.googleapis.com/v1/${admin?'projects/fuentinterview/':''}accounts:${action}${admin?'':'?key='+config.firebase.apiKey}`,{method:'POST',headers:{'Content-Type':'application/json',...(admin?{Authorization:'Bearer '+admin}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('Identity '+action+': '+r.status);return r.json()}
async function api(route,body){const r=await fetch(config.apiBase+route,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+account.token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(60000)});const data=await r.json();if(!r.ok)throw Error(route+': '+r.status);return data}
async function cleanup(){if(!account)return;account.token=(await identity('signInWithPassword',{email:account.email,password:account.password,returnSecureToken:true})).idToken;save();await api('/api/account/delete',{confirm:'ELIMINAR'});await identity('delete',{idToken:account.token});fs.unlinkSync(privateFile);account=null;report.cleaned=true;save()}
try{
 if(process.argv.includes('--cleanup'))await cleanup();
 else{
  if(account)throw Error('Prior test account must be cleaned first.');
  const email='fluent-review-'+crypto.randomUUID()+'@example.invalid',password=crypto.randomBytes(24).toString('base64url')+'aA1!';const signup=await identity('signUp',{email,password,returnSecureToken:true});account={uid:signup.localId,token:signup.idToken,email,password};save();
  report.before=(await api('/api/session')).budget;assert.equal(report.before.limitUsd,6);assert.ok(report.before.remainingCalls>=1);save();console.log(JSON.stringify({before:report.before}));
  const cli=JSON.parse(fs.readFileSync(path.join(os.homedir(),'.config/configstore/firebase-tools.json'),'utf8'));const auth=require('E:/node/npm-global/node_modules/firebase-tools/lib/auth.js');const tokens=await auth.getAccessToken(cli.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform','https://www.googleapis.com/auth/firebase']);
  await identity('update',{localId:account.uid,emailVerified:true},tokens.access_token);account.token=(await identity('signInWithPassword',{email,password,returnSecureToken:true})).idToken;save();
  const id=crypto.randomUUID();let activity=(await api('/api/study',{id,moduleIndex:0,courseId:'foundation',profile:{role:'Data Analyst'}})).activity;
  const text='I has five years of experience and I create weekly reports for customers. In my last project, I checked missing records and explained the findings to my team.';
  activity=(await api(`/api/study/${id}/save`,{expectedRevision:activity.revision,text,answers:Object.fromEntries(activity.content.items.map(q=>[q.id,0])),audio:{played:false,revealed:false}})).activity;
  await api(`/api/study/${id}/submit`,{});
  const review=(await api(`/api/feedback/activity/${id}`,{})).review;report.status=review.status;assert.equal(review.status,'completed',review.error);assert.equal(review.result.rubricVersion,2);
  assert.equal(review.result.scoring.passed,review.result.scoring.raw>=9);assert.ok(review.result.strengths.length>0);assert.ok(review.result.corrections.every(c=>text.includes(c.original)));
  const cached=await api(`/api/feedback/activity/${id}`,{});assert.equal(cached.replayed,true);
  const billing=await api('/api/billing');report.after=billing.budget;report.ownCalls=billing.limits.real.used;assert.equal(report.ownCalls,1);assert.ok(report.after.attempts>=report.before.attempts+1);
  report.score=review.result.scoring.score;report.corrections=review.result.corrections.length;report.passed=true;save();
 }
}catch(error){report.error=error.message;save();console.log('Review check failed: '+error.message);process.exitCode=1}
finally{if(account){try{await cleanup()}catch(error){report.cleanupError=error.message;save();process.exitCode=1}}console.log(JSON.stringify(report))}
