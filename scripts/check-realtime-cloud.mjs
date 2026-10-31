// One explicit bounded Realtime connection; cleanup is supported separately.
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import vm from 'node:vm';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import WebSocket from 'ws';
const require=createRequire(import.meta.url),context={window:{}};vm.runInNewContext(fs.readFileSync('public/config.js','utf8'),context);const config=context.window.FLUENT_CONFIG;
const privateFile='.local/realtime-cloud-account.json',reportFile='qa/realtime-cloud.json';let account=fs.existsSync(privateFile)?JSON.parse(fs.readFileSync(privateFile,'utf8')):null;
let report=fs.existsSync(reportFile)?JSON.parse(fs.readFileSync(reportFile,'utf8')):{date:new Date().toISOString(),physicalAudioTested:false};
function save(){fs.writeFileSync(privateFile,JSON.stringify(account));fs.writeFileSync(reportFile,JSON.stringify(report,null,2))}
async function identity(action,body,admin){const r=await fetch(`https://identitytoolkit.googleapis.com/v1/${admin?'projects/fuentinterview/':''}accounts:${action}${admin?'':'?key='+config.firebase.apiKey}`,{method:'POST',headers:{'Content-Type':'application/json',...(admin?{Authorization:'Bearer '+admin}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('Identity '+action+': '+r.status);return r.json()}
async function api(route,body){const r=await fetch(config.apiBase+route,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+account.token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});const data=await r.json();if(!r.ok)throw Error(route+': '+r.status+' '+data.error);return data}
async function cleanup(){if(!account)return;account.token=(await identity('signInWithPassword',{email:account.email,password:account.password,returnSecureToken:true})).idToken;save();await api('/api/account/delete',{confirm:'ELIMINAR'});await identity('delete',{idToken:account.token});fs.unlinkSync(privateFile);report.cleaned=true;fs.writeFileSync(reportFile,JSON.stringify(report,null,2));console.log('Synthetic account deleted.');}
try{
 if(process.argv.includes('--cleanup')){await cleanup();}
 else if(process.argv.includes('--prepare')){
  if(account)throw Error('Existing verification account requires cleanup.');
  const email='fluent-realtime-'+crypto.randomUUID()+'@example.invalid',password=crypto.randomBytes(24).toString('base64url')+'aA1!';
  const signup=await identity('signUp',{email,password,returnSecureToken:true});account={uid:signup.localId,token:signup.idToken,email,password};save();
  report.before=(await api('/api/session')).budget;save();console.log(JSON.stringify({budget:report.before,paidCalls:0}));
  const cli=JSON.parse(fs.readFileSync(path.join(os.homedir(),'.config/configstore/firebase-tools.json'),'utf8'));
  const auth=require('E:/node/npm-global/node_modules/firebase-tools/lib/auth.js');const tokens=await auth.getAccessToken(cli.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform','https://www.googleapis.com/auth/firebase']);
  await identity('update',{localId:account.uid,emailVerified:true},tokens.access_token);
  account.token=(await identity('signInWithPassword',{email,password,returnSecureToken:true})).idToken;save();console.log('Verified synthetic identity ready; no AI calls.');
 }else if(process.argv.includes('--connect')){
  if(!account)throw Error('Prepare first.');if(report.attempted&&!process.argv.includes('--recheck-fixed'))throw Error('This check never opens a second connection automatically.');
  if(report.attempted){report.previousFailure={error:report.error,at:report.date};delete report.error;}
  report.before=(await api('/api/session')).budget;assert.equal(report.before.limitUsd,6);assert.ok(6-report.before.reservedUsd>=.13,'Insufficient reserved budget');
  const id=crypto.randomUUID();await api('/api/sessions',{id,source:'openai',mode:'tutor',profile:{role:'Data analyst'}});const ticket=await api('/api/realtime/ticket',{id});
  report.attempted=true;save();const url=new URL('/api/realtime/connect',config.apiBase);url.protocol='wss:';url.searchParams.set('uid',ticket.uid);url.searchParams.set('ticket',ticket.ticket);
  const socket=new WebSocket(url,{origin:'https://fuentinterview--day1-0vs64ic5.web.app',family:4});let active,item,received=0,cancelled=false;const types=new Set();
  await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{socket.close();reject(Error('Realtime check timed out'))},20000);
   socket.on('error',()=>{clearTimeout(timer);reject(Error('WebSocket connection failed'))});
   socket.on('unexpected-response',(_,response)=>{let body='';response.on('data',x=>body+=x);response.on('end',()=>{let d;try{d=JSON.parse(body)}catch{}clearTimeout(timer);socket.terminate();reject(Error('Handshake '+response.statusCode+': '+(d?.diagnostic||d?.error||'unavailable')))})});
   socket.on('message',raw=>{
    const e=JSON.parse(raw);types.add(e.type);
    if(e.type==='response.created')active=e.response.id;
    if(e.type==='response.output_audio.delta'){
     received+=Buffer.from(e.delta,'base64').length;item=e.item_id;
     if(received>4800&&!cancelled){cancelled=true;socket.send(JSON.stringify({type:'response.cancel',response_id:active}));socket.send(JSON.stringify({type:'conversation.item.truncate',item_id:item,content_index:0,audio_end_ms:0}));}
    }
    if(e.type==='conversation.item.truncated')socket.send(JSON.stringify({type:'fluent.end'}));
    if(e.type==='fluent.closed'){report.closeMessage=e.message;report.diagnostic=e.diagnostic;clearTimeout(timer);resolve();}
   });
   socket.on('close',()=>{clearTimeout(timer);resolve()});
  });
  report.events=[...types];report.audioBytes=received;report.session=(await api('/api/sessions/'+id)).session.status;report.after=(await api('/api/session')).budget;
  report.passed=received>0&&types.has('conversation.item.truncated')&&report.session==='completed';save();console.log(JSON.stringify(report));if(!report.passed)throw Error('Realtime live check did not pass');
  await cleanup();
 }else throw Error('Use --prepare, --connect or --cleanup.');
}catch(error){report.error=error.message;fs.writeFileSync(reportFile,JSON.stringify(report,null,2));console.log('Check failed: '+error.message);process.exitCode=1;}
