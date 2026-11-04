import {readOpenAIUsage,unlinkUsageUser} from './openai-usage.mjs';
import {fail} from './http.mjs';
import {LemonClient,verifyWebhook,digest,lemonURL} from './lemon.mjs';
import {routeAttemptKey} from './conversation-route.mjs';
import {hasInitialRoute,includeInitialDiagnostic,initialRouteKey} from './diagnostic-access.mjs';
import {PAID_PLANS,configuredVariant,planForSubscription} from './plans.mjs';
export const FREE_CALLS=10,PRO_CALLS=200;
const uidKey=uid=>encodeURIComponent(uid),month=now=>new Date(now).toISOString().slice(0,7);
const validId=x=>typeof x==='string'&&x.length>0&&x.length<=128&&!x.includes('/');
const minuteKey=(uid,period)=>`minutes:${uidKey(uid)}:${period}`;
export {PAID_PLANS,configuredVariant,planForSubscription} from './plans.mjs';
export function entitlement(sub,now=Date.now()){
 if(!sub)return false;
 const end=sub.status==='cancelled'?sub.endsAt:sub.status==='on_trial'?sub.trialEndsAt:sub.renewsAt;
 return ['active','on_trial','cancelled'].includes(sub.status)&&Number.isFinite(Date.parse(end))&&Date.parse(end)>now;
}
export class CommerceService{
 constructor(storage,{env={},client,now=()=>Date.now(),budget=async()=>({})}={}){this.storage=storage;this.env=env;this.client=client||new LemonClient(env);this.now=now;this.budget=budget;this.queue=Promise.resolve();this.userQueues=new Map()}
 key(uid){if(!validId(uid))throw fail('Cuenta no válida.');return 'commerce:'+uidKey(uid)}
 async plan(uid,store=this.storage){const account=await store.get(this.key(uid)),sub=await store.get('subscription-user:'+uidKey(uid));if(uid===this.env.ADMIN_UID)return {id:'owner',minutes:null};const development=this.env.USER_BILLING_ENABLED!=='true'||account?.development===true;if(development)return {id:'development',minutes:null};if(!entitlement(sub,this.now()))return null;const id=planForSubscription(this.env,sub);return id?{id,minutes:PAID_PLANS[id].minutes}:null}
 async requirePractice(uid,store=this.storage){const r=await store.get(this.key(uid));if(r?.deleted||r?.suspended)throw fail('La cuenta no tiene acceso de práctica.',403);const plan=await this.plan(uid,store);if(!plan)throw fail('Para iniciar una conversación necesitas un plan activo. Tu diagnóstico y tu ruta ya están guardados.',402);return plan}
 async authorizeSession(uid,input,tx){if(input.purpose!=='diagnostic')return this.requirePractice(uid,tx);const r=await tx.get(this.key(uid));if(r?.deleted||r?.suspended)throw fail('La cuenta no tiene acceso de práctica.',403);const plan=await this.plan(uid,tx),hasRoute=await hasInitialRoute(tx,uid),markerKey='initial-diagnostic:'+uidKey(uid),marker=await tx.get(markerKey);if(!hasRoute){if(!marker){await tx.put(markerKey,{id:input.id,startedAt:this.now()});return {plan,initialIncluded:true}}if(marker.id===input.id)return {plan,initialIncluded:true};if(!plan)throw fail('Tu diagnóstico gratuito ya está en curso o fue utilizado. Recupera ese resultado para continuar.',402);return {plan,initialIncluded:false}}if(plan)return {plan,initialIncluded:false};throw fail('El diagnóstico gratuito ya fue utilizado. Activa un plan para iniciar otra conversación.',402)}
 admin(user){return !!this.env.ADMIN_UID&&user.uid===this.env.ADMIN_UID&&user.emailVerified===true}
 realLimit(uid,sub){if(this.env.USER_BILLING_ENABLED==='true'){if(uid===this.env.ADMIN_UID)return null;return entitlement(sub,this.now())?PRO_CALLS:FREE_CALLS}const limit=Number(this.env.ADMIN_REAL_CALLS||FREE_CALLS);return uid===this.env.ADMIN_UID&&Number.isInteger(limit)&&limit>=FREE_CALLS&&limit<=120?limit:FREE_CALLS}
 async policy(uid,store=this.storage){
  const account=await store.get(this.key(uid)),sub=await store.get('subscription-user:'+uidKey(uid));
  const development=this.env.USER_BILLING_ENABLED!=='true'||account?.development===true;
  const owner=uid===this.env.ADMIN_UID,plan=await this.plan(uid,store);
  return {development,ledgerKey:development?'ledger':'usage-ledger:'+uidKey(uid),seconds:development?120:owner?1800:1200,maxResponses:development?6:null,maxSegments:development?20:600,plan:plan?.id||'free'};
 }
 requireAdmin(user){if(!this.admin(user))throw fail('Acceso de administración requerido.',403)}
 async withUser(uid,fn){const previous=this.userQueues.get(uid)||Promise.resolve(),task=previous.catch(()=>{}).then(fn);this.userQueues.set(uid,task);try{return await task}finally{if(this.userQueues.get(uid)===task)this.userQueues.delete(uid)}}
 async erase(user){
  if(this.admin(user))throw fail('Transfiere la administración antes de eliminar esta cuenta.',409);
  const uid=user.uid,k=uidKey(uid),sub=await this.storage.get('subscription-user:'+k);
  if(sub&&!['cancelled','expired'].includes(sub.status))await this.sync(user,{cancel:true});
  await this.storage.transaction(async tx=>{
   const sessions=await tx.get('session-index:'+k)||[],studies=await tx.get('study-index:'+k)||[],assessments=(await tx.get('assessment-index:'+k))?.ids||[];
   const keys=[...sessions.map(id=>'sessions:'+k+':'+id),...studies.map(id=>'study:'+k+':'+id),...assessments.map(id=>'assessment:'+k+':'+id),...sessions.map(id=>'feedback:'+k+':session:'+id),...studies.map(id=>'feedback:'+k+':activity:'+id)];
   for(const id of assessments){const a=await tx.get('assessment:'+k+':'+id);for(const stage of a?.conversationRoute?.stages||[])for(const step of stage.steps)for(const attempt of step.attempts)keys.push(routeAttemptKey(uid,typeof attempt==='string'?attempt:attempt.id))}
   for(const key of keys){const r=await tx.get(key);const started=r?.pending?.startedAt||(r?.status==='pending'?r.startedAt:0);if(started&&this.now()-started<120000)throw fail('Espera a que terminen las solicitudes en proceso antes de eliminar.',409)}
   for(const key of keys)await tx.delete(key);
   for(const prefix of ['session-index:','study-index:','assessment-index:','quota:','usage-ledger:','realtime-ticket:','realtime-lease:','initial-diagnostic:'])await tx.delete(prefix+k);
   await tx.delete(initialRouteKey(uid));
   const intent=await tx.get('checkout-user:'+k);if(intent)await tx.delete('checkout-token:'+intent.token);await tx.delete('checkout-user:'+k);
   // Keep only a tombstone so a still-valid Firebase token cannot restore erased data.
   await tx.put(this.key(uid),{uid,deleted:true,deletedAt:this.now(),suspended:true});
   await unlinkUsageUser(tx,uid);
   await tx.delete('subscription-user:'+k);await tx.put('commerce-users',(await tx.get('commerce-users')||[]).filter(x=>x!==uid));
   await tx.put('commerce-audit',(await tx.get('commerce-audit')||[]).filter(x=>x.uid!==uid));
  });return {deleted:true,firebaseCleanupRequired:true};
 }
 async touch(user){const key=this.key(user.uid);return this.storage.transaction(async tx=>{let record=await tx.get(key);if(!record){record={uid:user.uid,email:user.email||'',createdAt:this.now(),suspended:false,deleted:false};const ids=await tx.get('commerce-users')||[];if(!ids.includes(user.uid))await tx.put('commerce-users',[user.uid,...ids].slice(0,500))}if(!record.deleted){
   // user comes exclusively from the verified Firebase token, never request JSON.
   if(user.email){record.email=user.email;record.development=user.uid!==this.env.ADMIN_UID&&/@example\.invalid$/i.test(user.email)}
   await tx.put(key,record);
  }return record})}
 async guard(uid){const r=await this.storage.get(this.key(uid));if(r?.deleted)throw fail('La cuenta está en proceso de eliminación.',403);if(r?.suspended)throw fail('El acceso de práctica está suspendido. Contacta con soporte.',403)}
 async state(user){const r=await this.touch(user),now=this.now(),sub=await this.storage.get('subscription-user:'+uidKey(user.uid)),period=month(now),usage=await this.storage.get('quota:'+uidKey(user.uid))||{},settings=await this.storage.get('commerce-settings')||{},plan=await this.plan(user.uid),minutes=plan?.minutes??0,meter=minutes?await this.storage.get(minuteKey(user.uid,period))||{usedSeconds:0,reservedSeconds:0}:null,usedSeconds=meter?(meter.usedSeconds||0)+(meter.reservedSeconds||0):0;
  const paidPlans=Object.entries(PAID_PLANS).map(([id,p])=>({id,name:p.name,price:p.price,minutes:p.minutes,available:!!configuredVariant(this.env,id)}));
  const remaining=minutes?Math.max(0,Math.ceil((minutes*60-usedSeconds)/60)):0;
  return {initialDiagnosticIncluded:!(await this.policy(user.uid)).development&&!await hasInitialRoute(this.storage,user.uid),provider:'Lemon Squeezy',testMode:true,ready:this.client.ready,admin:this.admin(user),supportEmail:this.env.SUPPORT_EMAIL||null,deleted:!!r.deleted,suspended:!!r.suspended,aiPaused:!!settings.aiPaused,subscription:sub?{id:sub.id,status:sub.status,endsAt:sub.endsAt,renewsAt:sub.renewsAt,active:entitlement(sub,now),testMode:true,plan:planForSubscription(this.env,sub)}:null,plan:plan?.id||'free',plans:paidPlans,minutes:plan?.minutes===null?{used:null,limit:null,remaining:null,unlimited:true,period}:{used:Math.min(minutes,Math.ceil(usedSeconds/60)),limit:minutes,remaining,unlimited:false,period,warning:remaining<=10},voice:await this.policy(user.uid),limits:{free:FREE_CALLS,pro:PRO_CALLS,period,resetAt:new Date(Date.UTC(new Date(now).getUTCFullYear(),new Date(now).getUTCMonth()+1,1)).toISOString(),real:{used:usage.period===period?usage.real||0:0,limit:this.realLimit(user.uid,sub)},test:{used:usage.period===period?usage.test||0:0,limit:PRO_CALLS}},budget:await this.budget()};
 }
 async reserveMinutes(tx,uid,session,{diagnostic=false}={}){if(diagnostic&&session.initialDiagnosticIncluded)return null;const plan=await this.requirePractice(uid,tx);if(plan.minutes===null)return {seconds:plan.id==='owner'?1800:1200,unlimited:true};const now=this.now(),period=month(now),key=minuteKey(uid,period),meter=await tx.get(key)||{period,usedSeconds:0,reservedSeconds:0};if(meter.active&&meter.active.sessionId!==session.id)throw fail('Ya tienes una conversación abierta. Termínala antes de iniciar otra.',409);const remaining=plan.minutes*60-meter.usedSeconds-meter.reservedSeconds;if(remaining<=0)throw fail('Agotaste los minutos de conversación de este mes. Tu avance está guardado; puedes elegir otro plan o volver al iniciar tu siguiente periodo.',429);const seconds=Math.min(1200,remaining);meter.reservedSeconds+=seconds;meter.active={sessionId:session.id,period,reserved:seconds,startedAt:now};await tx.put(key,meter);return {key,period,seconds,remainingBefore:remaining,unlimited:false}}
 async settleMinutes(uid,sessionId,startedAt,endedAt,release=false,periodOverride){const period=periodOverride||month(startedAt),key=minuteKey(uid,period);await this.storage.transaction(async tx=>{const meter=await tx.get(key);if(meter?.active?.sessionId!==sessionId)return;const reserved=meter.active.reserved,actual=release?0:Math.max(0,Math.min(reserved,(endedAt-meter.active.startedAt)/1000));meter.reservedSeconds=Math.max(0,meter.reservedSeconds-reserved);meter.usedSeconds+=actual;delete meter.active;await tx.put(key,meter)})}
 async reserve(tx,uid,source,context={}){const now=this.now(),r=await tx.get(this.key(uid));if(r?.deleted||r?.suspended)throw fail('La cuenta no tiene acceso de práctica.',403);const settings=await tx.get('commerce-settings');if(source==='openai'&&settings?.aiPaused)throw fail('La práctica con IA está pausada por administración.',503);
  const key='quota:'+uidKey(uid),period=month(now),old=await tx.get(key),q=old?.period===period?old:{period,real:0,test:0};const kind=source==='openai'?'real':'test',sub=await tx.get('subscription-user:'+uidKey(uid));const limit=kind==='real'?this.realLimit(uid,sub):(entitlement(sub,now)?PRO_CALLS:FREE_CALLS);
  if(source==='openai'&&!(await this.policy(uid,tx)).development&&await includeInitialDiagnostic(tx,uid,context))return {key,value:q,includedDiagnostic:true};
  if(limit!==null&&(q[kind]||0)>=limit)throw fail('Has usado la práctica incluida este mes en tu plan. Revisa tu suscripción para continuar.',429);q[kind]=(q[kind]||0)+1;return {key,value:q};
 }
 async consume(uid,source,beforeCommit,context={}){return this.storage.transaction(async tx=>{const change=await this.reserve(tx,uid,source,context);if(beforeCommit)await beforeCommit();await tx.put(change.key,change.value)})}
 async audit(type,uid,detail=''){await this.storage.transaction(async tx=>{const rows=await tx.get('commerce-audit')||[];await tx.put('commerce-audit',[{at:this.now(),type,uid,detail},...rows].slice(0,100))})}
 async checkout(user,planId='pro'){if(!user.emailVerified)throw fail('Confirma tu correo antes de suscribirte.',403);await this.guard(user.uid);if(!PAID_PLANS[planId]||!configuredVariant(this.env,planId))throw fail('Este plan todavía se está preparando. Vuelve pronto.',503);if(!this.client.ready)throw fail('La conexión con Lemon Squeezy todavía está pendiente.',503);const key='checkout-user:'+uidKey(user.uid),token=crypto.randomUUID();
  const prior=await this.storage.transaction(async tx=>{const sub=await tx.get('subscription-user:'+uidKey(user.uid));if(sub&&!['expired'].includes(sub.status))throw fail('Ya tienes una suscripción. Usa Gestionar suscripción.',409);const p=await tx.get(key);if(p&&p.expiresAt>this.now()){if(p.planId!==planId)throw fail('Ya hay otra solicitud de suscripción pendiente. Espera o continúa esa solicitud.',409);return p}const value={uid:user.uid,token,planId,expiresAt:this.now()+30*60000,status:'pending'};await tx.put(key,value);await tx.put('checkout-token:'+token,value);return null});
  if(prior){if(prior.url)return {url:prior.url,replayed:true};throw fail('Hay una solicitud de pago pendiente. Espera antes de repetir.',409)}
  try{const url=await this.client.checkout(token,planId);await this.storage.transaction(async tx=>{const p=await tx.get(key);if(p?.token===token){p.url=url;p.status='ready';await tx.put(key,p)}});return {url,testMode:true}}catch(error){if(error.checkoutNotCreated)await this.storage.transaction(async tx=>{if((await tx.get(key))?.token===token)await tx.delete(key);await tx.delete('checkout-token:'+token)});await this.audit('checkout_failed',user.uid,'provider_unavailable');throw error}
 }
 async apply(uid,data){const a=data.attributes,id=String(data.id),updated=Date.parse(a.updated_at);if(!Number.isFinite(updated)||!['active','on_trial','cancelled','past_due','unpaid','paused','expired'].includes(a.status))throw fail('Estado de suscripción no válido.');
  return this.storage.transaction(async tx=>{if((await tx.get(this.key(uid)))?.deleted)return null;const mapped=await tx.get('subscription-owner:'+id);if(mapped&&mapped!==uid)throw fail('Suscripción ya vinculada a otra cuenta.',409);const key='subscription-user:'+uidKey(uid),previous=await tx.get(key);if(previous?.id!==id&&previous&&!['expired'].includes(previous.status))throw fail('La cuenta ya tiene otra suscripción.',409);if(previous?.id===id&&previous.updated>updated)return previous;
   const record={id,status:a.status,variantId:String(a.variant_id),plan:planForSubscription(this.env,{variantId:a.variant_id}),endsAt:a.ends_at||null,renewsAt:a.renews_at||null,trialEndsAt:a.trial_ends_at||null,updated,syncedAt:this.now(),testMode:true};await tx.put('subscription-owner:'+id,uid);await tx.put(key,record);return record;
  });
 }
 async webhook(raw,signature){const event=await verifyWebhook(raw,signature,this.env.LEMONSQUEEZY_WEBHOOK_SECRET);if(!event)return {received:true,ignored:true};const hash=await digest(raw);const task=this.queue.then(async()=>{
  if(await this.storage.get('webhook:'+hash))return {received:true,replayed:true};const payment=event.meta.event_name.startsWith('subscription_payment_');const id=String(payment?event.data?.attributes?.subscription_id:event.data?.id);if(!/^\d+$/.test(id))throw fail('Suscripción no válida.');
  let uid=await this.storage.get('subscription-owner:'+id);if(!uid){const token=event.meta?.custom_data?.fluent_checkout;if(!/^[a-f0-9-]{36}$/i.test(token||''))return {received:true,ignored:true};const intent=await this.storage.get('checkout-token:'+token);if(!intent)return {received:true,ignored:true};uid=intent.uid;}
  if((await this.storage.get(this.key(uid)))?.deleted)return {received:true,ignored:true};
  const data=await this.client.subscription(id);await this.apply(uid,data);await this.storage.transaction(async tx=>{await tx.put('webhook:'+hash,{at:this.now()});const ids=await tx.get('webhook-history')||[];for(const old of ids.slice(199))await tx.delete('webhook:'+old);await tx.put('webhook-history',[hash,...ids.slice(0,199)]);const intent=await tx.get('checkout-user:'+uidKey(uid));if(intent?.token){await tx.delete('checkout-token:'+intent.token);await tx.delete('checkout-user:'+uidKey(uid))}});await this.audit(event.meta.event_name,uid,data.attributes.status);return {received:true};
 });this.queue=task.catch(()=>{});return task;}
 async sync(user,{portal=false,cancel=false}={}){const s=await this.storage.get('subscription-user:'+uidKey(user.uid));if(!s)throw fail('No tienes una suscripción vinculada.',404);const data=await this.client.subscription(s.id,cancel?'DELETE':'GET');await this.apply(user.uid,data);if(portal)return {url:lemonURL(data.attributes.urls?.customer_portal)};return this.state(user)}
 async openAIUsage(user){
  this.requireAdmin(user);const data=await readOpenAIUsage(this.storage),accounts=new Map();
  data.recent=await Promise.all(data.recent.map(async row=>{
   const uid=row.uid||(row.scope==='owner'?this.env.ADMIN_UID:null);
   if(!uid)return {...row,email:null,sessionType:null,status:null};
   if(!accounts.has(uid))accounts.set(uid,this.storage.get(this.key(uid)));
   const account=await accounts.get(uid);
   if(account?.deleted)return {...row,uid:null,email:null,deletedUser:true,sessionType:null,status:null};
   const session=await this.storage.get('sessions:'+uidKey(uid)+':'+row.id);
   return {...row,uid,email:account?.email||null,startedAt:session?.voiceStartedAt||session?.createdAt||row.startedAt,
    durationSeconds:row.durationSeconds??session?.voiceDurationSeconds??null,
    sessionType:session?(session.purpose==='diagnostic'?'diagnostic':session.mode==='interview'?'interview':'tutor'):null,
    status:session?.status||null};
  }));
  data.recent.sort((a,b)=>b.startedAt-a.startedAt);return data;
 }
 async dashboard(user){this.requireAdmin(user);const ids=await this.storage.get('commerce-users')||[],users=[];for(const uid of ids){const r=await this.storage.get(this.key(uid));if(!r||r.deleted)continue;const sub=await this.storage.get('subscription-user:'+uidKey(uid)),q=await this.storage.get('quota:'+uidKey(uid));users.push({uid,email:r.email,suspended:r.suspended,subscription:sub?.status||'none',testPlan:entitlement(sub,this.now()),usage:q?.period===month(this.now())?q:{period:month(this.now()),real:0,test:0}})}return {users,audit:await this.storage.get('commerce-audit')||[],settings:await this.storage.get('commerce-settings')||{aiPaused:false},budget:await this.budget(),testMode:true}}
 async administer(user,input){this.requireAdmin(user);if(input.action==='pause-ai'&&typeof input.paused==='boolean'){await this.storage.transaction(tx=>tx.put('commerce-settings',{aiPaused:input.paused}));await this.audit('admin_ai_pause',user.uid,String(input.paused))}else if(input.action==='suspend'&&validId(input.uid)&&typeof input.suspended==='boolean'){if(input.uid===user.uid)throw fail('No puedes suspender tu propia cuenta administrativa.');await this.storage.transaction(async tx=>{const r=await tx.get(this.key(input.uid));if(!r||r.deleted)throw fail('Cuenta no encontrada.',404);r.suspended=input.suspended;await tx.put(this.key(input.uid),r)});await this.audit('admin_suspend',input.uid,String(input.suspended))}else throw fail('Acción no permitida.');return this.dashboard(user)}
}
