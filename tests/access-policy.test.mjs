import test from 'node:test';import assert from 'node:assert/strict';
import {CommerceService} from '../server/commerce.mjs';import {RealtimeService,RealtimeRelay} from '../server/realtime.mjs';
function setup(){let rows=new Map([['ledger',{reserved:6000000,attempts:120,usageEstimate:.06}]]);let queue=Promise.resolve();const store={get:async k=>structuredClone(rows.get(k)),put:async(k,v)=>rows.set(k,structuredClone(v)),transaction(fn){const task=queue.then(async()=>{const next=structuredClone(rows);const result=await fn({get:async k=>structuredClone(next.get(k)),put:async(k,v)=>next.set(k,structuredClone(v)),delete:async k=>next.delete(k)});rows=next;return result});queue=task.catch(()=>{});return task}};const commerce=new CommerceService(store,{env:{ADMIN_UID:'owner',USER_BILLING_ENABLED:'true'}});const service=new RealtimeService({storage:store,commerce,env:{AI_BUDGET_USD:'6'}});return {store,commerce,service}}
test('Voice owner and subscription usage are independent from exhausted developer budget',async()=>{
 const {store,commerce,service}=setup();await commerce.touch({uid:'owner',email:'owner@example.com'});await commerce.touch({uid:'user',email:'member@example.com'});await commerce.touch({uid:'dev',email:'qa@example.invalid'});
 const owner=await commerce.policy('owner');assert.equal(owner.seconds,1800);assert.equal(owner.maxResponses,null);assert.equal(owner.development,false);
 await service.reserveResponse('owner');await service.reserveResponse('user');await assert.rejects(()=>service.reserveResponse('dev'),{status:402});assert.equal((await store.get('ledger')).reserved,6000000);assert.equal((await store.get('usage-ledger:owner')).reserved,0);
 assert.equal(commerce.realLimit('owner'),null);assert.equal((await commerce.policy('user')).seconds,600);
 const active={status:'active',renewsAt:new Date(Date.now()+86400000).toISOString()};await store.put('subscription-user:user',active);assert.equal(commerce.realLimit('user',active),200);assert.equal((await commerce.policy('user')).seconds,1200);
 await store.put('subscription-user:user',{...active,status:'expired'});assert.equal((await commerce.policy('user')).seconds,600);assert.equal(commerce.realLimit('user',{...active,status:'expired'}),10);
 await store.put('commerce-settings',{aiPaused:true});await assert.rejects(()=>service.reserveResponse('owner'),{status:403});
});
test('Normal conversations pass six responses; closing preserves a readable reason',async()=>{
 class Socket extends EventTarget{readyState=1;sent=[];send(s){this.sent.push(JSON.parse(s))}close(){this.readyState=3}}
 const upstream=new Socket(),downstream=new Socket();let reason;
 const relay=new RealtimeRelay({upstream,downstream,session:{},policy:{seconds:1800,maxResponses:null,maxSegments:600},save:async()=>{},usage:async()=>{},authorize:async()=>{},onClose:async r=>reason=r});relay.ready=true;relay.responses=6;relay.request();await relay.serial;assert.equal(relay.responses,7);assert.equal(upstream.sent.at(-1).type,'response.create');await relay.close('Terminó el tiempo de esta sesión.');assert.equal(reason,'Terminó el tiempo de esta sesión.');
});
