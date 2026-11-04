import {priceUsage,recordOpenAIUsage} from '../server/openai-usage.mjs';
import {CommerceService} from '../server/commerce.mjs';
import {commercePath,commerceRequest} from '../server/commerce-api.mjs';
import {readWebhook} from '../server/lemon.mjs';
import {createAI,MODEL} from '../server/ai.mjs';
import {createTokenVerifier} from '../server/auth.mjs';
import {json,readJSON,fail} from '../server/http.mjs';
import {SessionService} from '../server/sessions.mjs';
import {AssessmentService} from '../server/assessments.mjs';
import {StudyService} from '../server/study.mjs';
import {FeedbackService} from '../server/feedback.mjs';
import {schoolPath,schoolRequest} from '../server/school-api.mjs';
import {RealtimeService} from '../server/realtime.mjs';
import {ConversationRouteService} from '../server/conversation-route.mjs';
export class BudgetCoordinator {
 constructor(ctx,env){
  this.storage=ctx.storage;this.env=env;
  const op=async(name,extra={})=>{const r=await this.fetch(new Request(`https://budget${name}`,{method:'POST',body:JSON.stringify({uid:'internal-ledger',...extra})}));const data=await r.json();if(!r.ok)throw fail(data.error,r.status);return data};
  const ledger={snapshot:()=>op('/snapshot'),reserve:()=>op('/reserve'),recordUsage:(usage,meta)=>op('/usage',{usage,meta})};
  this.commerce=new CommerceService(this.storage,{env,budget:ledger.snapshot});
  const run=async(kind,source,input,{uid,sessionId})=>{
   if(source==='openai'&&env.AI_MODE!=='openai')throw fail('La IA está pausada.',503);
   const scopedLedger={...ledger,reserve:()=>op('/reserve',{uid,quota:true,context:{kind,sessionId}}),recordUsage:(usage,meta)=>op('/usage',{uid,quota:true,usage,meta:{...meta,sessionId}})};
   if(source==='mock')await this.commerce.consume(uid,source);
   try{return await createAI({mode:source,apiKey:env.OPENAI_API_KEY||'',model:MODEL,ledger:scopedLedger}).run(kind,input)}catch(error){await this.commerce.audit('ai_failed',uid,String(error.status||500));throw error}
  };
  this.assessments=new AssessmentService(this.storage,{source:env.AI_MODE||'mock',budget:ledger.snapshot,run:(source,input,context)=>run('diagnosis',source,input,context)});
  this.sessions=new SessionService(this.storage,{source:env.AI_MODE||'mock',budget:ledger.snapshot,authorizeSession:(uid,input,tx)=>this.commerce.authorizeSession(uid,input,tx),authorizePractice:(uid,tx)=>this.commerce.requirePractice(uid,tx),run:(source,input,context)=>run('conversation',source,{...input,messages:input.messages.slice(-8).map(m=>({...m,content:m.content.slice(0,1000)}))},context)});
  this.study=new StudyService(this.storage,{assessments:this.assessments});
  this.assessments.sessionFor=(uid,id)=>this.sessions.get(uid,id);
  this.routes=new ConversationRouteService(this.storage,{assessments:this.assessments,sessions:this.sessions,requirePractice:uid=>this.commerce.requirePractice(uid)});
  this.sessions.learning=(uid,input)=>input.routeId?this.routes.context(uid,input):input.studyId?this.study.context(uid,input.studyId):this.routes.practiceContext(uid,input);
  this.feedback=new FeedbackService(this.storage,{source:env.AI_MODE||'mock',budget:ledger.snapshot,evidence:(uid,kind,id)=>kind==='activity'?this.study.evidence(uid,id):this.sessions.evidence(uid,id),run:(source,input,context)=>run('review',source,input,context)});
  this.study.reviewFor=(uid,id)=>this.feedback.get(uid,'activity',id);
  this.realtime=new RealtimeService(this);
 }
 async fetch(request){
  try{
   const operation=new URL(request.url).pathname;
   const limit=Number(this.env.AI_BUDGET_USD||0);
   if(!Number.isFinite(limit)||limit<0||limit>6)throw fail('Presupuesto no permitido.',503);
   if(operation==='/realtime/connect')return await this.realtime.connect(request);
   const input=await request.json();
   if(typeof input.uid!=='string'||!input.uid)throw fail('Falta el usuario.',401);
   const serialized=operation==='/school'||operation.startsWith('/sessions/')||operation.startsWith('/learning/')||operation==='/commerce';
   if(serialized&&!input.serialized)return this.commerce.withUser(input.uid,()=>this.fetch(new Request(request.url,{method:'POST',body:JSON.stringify({...input,serialized:true})})));
   if(serialized&&operation!=='/commerce')await this.commerce.guard(input.uid);
   if(operation==='/webhook')return json(await this.commerce.webhook(input.raw,input.signature));
   if(operation==='/commerce'){
    if(input.path==='/api/account/delete'&&input.method==='POST')await this.realtime.stop(input.uid);
    const result=await commerceRequest(this.commerce,input.path,input.method,input.payload,input.user);
    for(const [uid,relay] of this.realtime.active){try{await this.commerce.guard(uid);if((await this.storage.get('commerce-settings'))?.aiPaused)await relay.close()}catch{await relay.close()}}
    return json(result);
   }
   if(operation==='/realtime/ticket')return json(await this.realtime.ticket(input.uid,input.id,input.canUseReal));
   if(operation==='/account-state')return json(await this.commerce.state(input.user));
   if(operation==='/access'){if(input.user)await this.commerce.touch(input.user);await this.commerce.guard(input.uid);return json({allowed:true})}
   if(operation==='/school')return json(await schoolRequest(this,input.path,input.method,input.payload,{uid:input.uid,emailVerified:input.canUseReal}));
   if(operation.startsWith('/learning/')){
    const {uid,payload={},id,canUseReal}=input;let result;
    if(operation==='/learning/state')result=await this.assessments.state(uid);
    else if(operation==='/learning/save')result={assessment:await this.assessments.save(uid,payload)};
    else if(operation==='/learning/get')result={assessment:await this.assessments.get(uid,id)};
    else if(operation==='/learning/evaluate')result=await this.assessments.evaluate(uid,id,canUseReal,payload);
    else if(operation==='/learning/from-session')result=await this.assessments.fromSession(uid,id,canUseReal,payload);
    else if(operation==='/learning/delete')result=await this.assessments.remove(uid,id);
    else throw fail('Ruta no encontrada.',404);
    return json(result);
   }
   if(operation.startsWith('/sessions/')){
    const {uid,payload={},id,canUseReal}=input;let result;
    if(['/sessions/end','/sessions/delete'].includes(operation))await this.realtime.stop(uid);
    if(operation==='/sessions/create')result={session:await this.sessions.create(uid,payload,canUseReal)};
    else if(operation==='/sessions/list')result={sessions:await this.sessions.list(uid)};
    else if(operation==='/sessions/get')result={session:await this.sessions.get(uid,id)};
    else if(operation==='/sessions/end')result={session:await this.sessions.end(uid,id)};
    else if(operation==='/sessions/delete')result=await this.sessions.remove(uid,id);
    else if(operation==='/sessions/turn')result=await this.sessions.turn(uid,id,payload,canUseReal);
    else throw fail('Ruta no encontrada.',404);
    return json(result);
   }
   const result=await this.storage.transaction(async tx=>{
    const policy=input.quota?await this.commerce.policy(input.uid,tx):{development:true,ledgerKey:'ledger'};
    const ledgerKey=policy.ledgerKey;
    const data=await tx.get(ledgerKey)||{reserved:0,attempts:0,usageEstimate:0};
    if(!Number.isSafeInteger(data.reserved)||data.reserved<0||!Number.isSafeInteger(data.attempts)||!Number.isFinite(data.usageEstimate))throw fail('Registro de presupuesto no válido.',503);
    if(operation==='/allow'){
     const now=Date.now(),key=`rate:${input.uid}`,rate=await tx.get(key)||{start:now,count:0};
     if(now-rate.start>=60000){rate.start=now;rate.count=0}
     if(rate.count>=10)throw fail('Espera un minuto antes de continuar.',429);
     rate.count++;await tx.put(key,rate);
     if(!await tx.getAlarm())await tx.setAlarm(now+120000);
    }else if(operation==='/reserve'){
     if(policy.development&&data.reserved+50000>Math.floor(limit*1e6))throw fail('Presupuesto de pruebas agotado. No se realizó la llamada.',402);
     const quota=input.quota?await this.commerce.reserve(tx,input.uid,'openai',input.context):null;
     if(policy.development)data.reserved+=50000;data.attempts++;await tx.put(ledgerKey,data);if(quota)await tx.put(quota.key,quota.value);
    }else if(operation==='/usage'){
     const usage=input.usage;
     if(Number.isInteger(usage?.prompt_tokens)&&Number.isInteger(usage?.completion_tokens)&&usage.prompt_tokens>=0&&usage.completion_tokens>=0){data.usageEstimate+=priceUsage(MODEL,usage).estimatedUsd;await tx.put(ledgerKey,data)}
     await recordOpenAIUsage(tx,{...input.meta,model:MODEL,usage,uid:input.uid,id:input.meta?.id,scope:policy.development?'development':input.uid===this.env.ADMIN_UID?'owner':'users'});
    }else if(operation!=='/snapshot')throw fail('Operación desconocida.',404);
    return {limitUsd:limit,reservedUsd:data.reserved/1e6,estimatedUsageUsd:data.usageEstimate,attempts:data.attempts,reservationPerCallUsd:.05,remainingCalls:Math.max(0,Math.floor((Math.floor(limit*1e6)-data.reserved)/50000))};
   });
   return json(result);
  }catch(error){return json({error:error.status?error.message:'Control de presupuesto no disponible.',...(error.realtimeDetail?{diagnostic:error.realtimeDetail}:{})},error.status||503)}
 }
 async alarm(){const entries=await this.storage.list({prefix:'rate:'});const now=Date.now();for(const [key,value] of entries)if(now-value.start>=60000)await this.storage.delete(key);else await this.storage.setAlarm(now+120000)}
}
export default {
 async fetch(request,env){
  const origin=request.headers.get('origin');const allowed=(env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);
  if(origin&&!allowed.includes(origin))return json({error:'Origen no permitido.'},403);
  const cors=origin?{'Access-Control-Allow-Origin':origin,'Vary':'Origin'}:{};
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...cors,'Access-Control-Allow-Methods':'GET, POST, DELETE, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Max-Age':'600'}});
  try{
   const path=new URL(request.url).pathname;
   if(path==='/api/realtime/connect'){
    if(!origin||!allowed.includes(origin))throw fail('Origen no permitido.',403);
    const stub=env.BUDGET.get(env.BUDGET.idFromName('global-v1'));
    return await stub.fetch(new Request('https://budget/realtime/connect'+new URL(request.url).search,request));
   }
   if(path==='/api/webhooks/lemonsqueezy'){
    if(request.method!=='POST')throw fail('Método no permitido.',405);
    const raw=await readWebhook(request),stub=env.BUDGET.get(env.BUDGET.idFromName('global-v1'));
    const r=await stub.fetch('https://budget/webhook',{method:'POST',body:JSON.stringify({uid:'provider-webhook',raw,signature:request.headers.get('x-signature')})});return new Response(r.body,{status:r.status,headers:r.headers});
   }
   const sessionPath=path.match(/^\/api\/sessions(?:\/([a-f0-9-]{36})(?:\/(turn|end))?)?$/i);
   const assessmentPath=path.match(/^\/api\/assessments(?:\/([a-f0-9-]{36})(?:\/(evaluate|from-session))?)?$/i);
   if(!sessionPath&&!assessmentPath&&!schoolPath(path)&&!commercePath(path)&&!['/api/session','/api/conversation','/api/plan','/api/learning','/api/realtime/ticket'].includes(path))return json({error:'Ruta no encontrada.'},404,cors);
   const user=await createTokenVerifier(env.FIREBASE_PROJECT_ID)(request.headers.get('authorization'));
   const stub=env.BUDGET.get(env.BUDGET.idFromName('global-v1'));
   const operation=async(name,extra={})=>{const response=await stub.fetch(`https://budget${name}`,{method:'POST',body:JSON.stringify({uid:user.uid,...extra})});const data=await response.json();if(!response.ok)throw fail(data.error,response.status);return data};
   const ledger={snapshot:()=>operation('/snapshot'),reserve:()=>operation('/reserve'),recordUsage:(usage,meta)=>operation('/usage',{usage,meta})};
   if(commercePath(path)){const payload=request.method==='POST'?await readJSON(request):{};if(request.method!=='GET')await operation('/allow');return json(await operation('/commerce',{path,method:request.method,payload,user}),200,cors)}
   await operation('/access',{user});
   if(path==='/api/realtime/ticket'){
    if(request.method!=='POST')throw fail('Método no permitido.',405);
    await operation('/allow');const input=await readJSON(request);
    return json(await operation('/realtime/ticket',{id:input.id,canUseReal:user.emailVerified}),200,cors);
   }
   if(schoolPath(path)){const payload=request.method==='POST'?await readJSON(request):{};if(request.method!=='GET')await operation('/allow');return json(await operation('/school',{path,method:request.method,payload,canUseReal:user.emailVerified}),200,cors)}
   if(path==='/api/learning'||assessmentPath){
    const id=assessmentPath?.[1],action=assessmentPath?.[2];let name,payload={};
    if(path==='/api/learning'&&request.method==='GET')name='state';
    else if(assessmentPath&&request.method==='GET'&&id&&!action)name='get';
    else if(assessmentPath&&request.method==='DELETE'&&id&&!action)name='delete';
    else if(assessmentPath&&request.method==='POST'&&(!id||action)){name=id?action:'save';payload=await readJSON(request)}
    else throw fail('Método no permitido.',405);
    if(request.method!=='GET')await operation('/allow');
    return json(await operation(`/learning/${name}`,{id,payload,canUseReal:user.emailVerified}),200,cors);
   }
   if(sessionPath){
    const id=sessionPath[1],action=sessionPath[2];let name,payload={};
    if(request.method==='GET'&&!action)name=id?'get':'list';
    else if(request.method==='DELETE'&&id&&!action)name='delete';
    else if(request.method==='POST'&&(!id||action)){name=id?action:'create';payload=await readJSON(request)}
    else throw fail('Método no permitido.',405);
    if(request.method!=='GET')await operation('/allow');
    return json(await operation(`/sessions/${name}`,{id,payload,canUseReal:user.emailVerified}),200,cors);
   }
   if(request.method==='GET'&&path==='/api/session')return json({mode:env.AI_MODE||'mock',budget:await ledger.snapshot(),firebase:{projectId:env.FIREBASE_PROJECT_ID,connected:true},localOnly:false,uid:user.uid,commerce:await operation('/account-state',{user})},200,cors);
   if(request.method!=='POST'||path==='/api/session')throw fail('Método no permitido.',405);
   if(env.AI_MODE==='openai')throw fail('Inicia una conversación desde el aula o una evaluación desde Mi diagnóstico.',409);
   if(env.AI_MODE==='openai'&&!user.emailVerified)throw fail('Verifica tu correo antes de usar la IA de pago.',403);
   const input=await readJSON(request);await operation('/allow');
   const ai=createAI({mode:env.AI_MODE||'mock',apiKey:env.OPENAI_API_KEY||'',model:MODEL,ledger});
   return json(await ai.run(path==='/api/plan'?'plan':'conversation',input),200,cors);
  }catch(error){return json({error:error.status?error.message:'No se pudo completar la operación.'},error.status||500,cors)}
 }
};
