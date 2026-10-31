import test from 'node:test';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {SessionService} from '../server/sessions.mjs';import {LocalSessionStorage} from '../server/session-storage.mjs';
function setup(t,run,source='openai'){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'fluent-sessions-'));t.after(()=>{if(!path.resolve(directory).startsWith(path.resolve(os.tmpdir())+path.sep+'fluent-sessions-'))throw Error('Unsafe cleanup');fs.rmSync(directory,{recursive:true,force:true})});
 const storage=new LocalSessionStorage(directory);const service=new SessionService(storage,{source,run,budget:async()=>({attempts:0})});return {service,storage,directory};
}
const result={result:{reply:'What changed because of your work?',focus:'Resultados concretos',feedback:'Añade un resultado observable.'}};
test('More than twenty saved conversations remain available without blocking new practice',async t=>{
 const {service,storage}=setup(t,async()=>{throw Error('Creating history must not call AI')});
 const ids=[];
 for(let i=0;i<25;i++){
  const id=crypto.randomUUID();ids.push(id);
  await service.create('alice',{id,profile:{}},true);
  await service.end('alice',id);
 }
 const restarted=new SessionService(storage,{source:'openai',run:async()=>{throw Error('Must not call AI')}});
 const input={id:crypto.randomUUID(),profile:{}};
 const created=await restarted.create('alice',input,true);
 assert.equal(created.status,'active');
 assert.deepEqual(await restarted.create('alice',input,true),created);
 assert.deepEqual((await restarted.list('alice')).map(s=>s.id),[input.id,...ids.toReversed()]);
 for(const id of ids)assert.equal((await restarted.get('alice',id)).status,'completed');
 assert.deepEqual(await restarted.list('bob'),[]);
});
test('Concurrent duplicate turns call the model once, replay after restart and reject conflicting text',async t=>{
 let calls=0;const {service,storage}=setup(t,async()=>{calls++;await new Promise(r=>setTimeout(r,30));return result});
 const session=await service.create('alice',{id:crypto.randomUUID(),profile:{}},true);
 const input={requestId:crypto.randomUUID(),text:'',expectedTurn:0};
 const [a,b]=await Promise.all([service.turn('alice',session.id,input,true),service.turn('alice',session.id,input,true)]);
 assert.equal(calls,1);assert.equal(a.session.messages.length,1);assert.deepEqual(a,b);
 const restarted=new SessionService(storage,{run:async()=>{throw Error('Must not call again')},budget:async()=>({})});
 assert.equal((await restarted.turn('alice',session.id,input,true)).replayed,true);
 await assert.rejects(()=>restarted.turn('alice',session.id,{...input,text:'different'},true),{status:409});
});
test('Sessions cannot be read, ended or answered by another account; unverified users only get mock',async t=>{
 const {service}=setup(t,async()=>result);await assert.rejects(()=>service.create('alice',{id:crypto.randomUUID()},false),{status:403});
 const s=await service.create('alice',{id:crypto.randomUUID(),source:'mock'},false);
 for(const fn of [()=>service.get('bob',s.id),()=>service.end('bob',s.id),()=>service.turn('bob',s.id,{requestId:crypto.randomUUID(),expectedTurn:0},false)])await assert.rejects(fn,{status:404});
 assert.deepEqual(await service.list('bob'),[]);assert.equal((await service.get('alice',s.id)).source,'mock');
});
test('Unknown provider failure is never retried; transcript remains as evidence',async t=>{
 let calls=0;const {service}=setup(t,async()=>{if(++calls===1)return result;throw Error('Network failure')});
 const s=await service.create('alice',{id:crypto.randomUUID()},true);await service.turn('alice',s.id,{requestId:crypto.randomUUID(),expectedTurn:0,text:''},true);
 const input={requestId:crypto.randomUUID(),expectedTurn:1,text:'I built a reporting tool.'};
 await assert.rejects(()=>service.turn('alice',s.id,input,true),{status:502});await assert.rejects(()=>service.turn('alice',s.id,input,true),{status:502});assert.equal(calls,2);
 const saved=await service.get('alice',s.id);assert.equal(saved.blocked,true);assert.equal(saved.messages.at(-1).content,input.text);
});
test('Free practice ends at its answer target without another paid question',async t=>{
 let calls=0;const {service}=setup(t,async()=>{calls++;return result});const s=await service.create('alice',{id:crypto.randomUUID()},true);
 let current=(await service.turn('alice',s.id,{requestId:crypto.randomUUID(),expectedTurn:0,text:''},true)).session;
 for(let i=1;i<=s.practiceGoal.targetAnswers;i++)current=(await service.turn('alice',s.id,{requestId:crypto.randomUUID(),expectedTurn:current.feedback.length,text:`I delivered project ${i} with my team.`},true)).session;
 assert.equal(calls,s.practiceGoal.targetAnswers);assert.equal(current.summary.learnerTurns,s.practiceGoal.targetAnswers);assert.equal(current.status,'completed');assert.equal(current.summary.level,null);assert.equal(current.summary.pronunciationEvaluated,false);
 await service.remove('alice',s.id);assert.deepEqual(await service.list('alice'),[]);
});
test('Interrupted in-flight calls recover as blocked instead of risking another charge',async t=>{
 const {service,storage}=setup(t,async()=>{throw Error('Must not run')});const s=await service.create('alice',{id:crypto.randomUUID()},true);
 await storage.transaction(async tx=>{const saved=await tx.get(service.key('alice',s.id));saved.pending={requestId:crypto.randomUUID(),text:'',expectedTurn:0,startedAt:Date.now()-60000};await tx.put(service.key('alice',s.id),saved)});
 assert.equal((await service.get('alice',s.id)).blocked,true);
});
