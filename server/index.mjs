import {recordOpenAIUsage} from './openai-usage.mjs';
import {CommerceService} from './commerce.mjs';
import {commercePath,commerceRequest} from './commerce-api.mjs';
import {readWebhook} from './lemon.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {BudgetLedger} from './budget.mjs';
import {createAI,MODEL} from './ai.mjs';
import {createTokenVerifier} from './auth.mjs';
import {readJSON} from './http.mjs';
import {SessionService} from './sessions.mjs';
import {LocalSessionStorage} from './session-storage.mjs';
import {AssessmentService} from './assessments.mjs';
import {ConversationRouteService} from './conversation-route.mjs';
import {StudyService} from './study.mjs';
import {FeedbackService} from './feedback.mjs';
import {schoolPath,schoolRequest} from './school-api.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files={'/':['index.html','text/html'],'/index.html':['index.html','text/html'],'/styles.css':['styles.css','text/css'],'/account.css':['account.css','text/css'],'/app.js':['app.js','text/javascript'],'/voice.js':['voice.js','text/javascript'],'/runtime.js':['runtime.js','text/javascript'],'/config.js':['config.js','text/javascript'],'/account.bundle.js':['account.bundle.js','text/javascript']};
files['/learning.js']=['learning.js','text/javascript'];
files['/school.js']=['school.js','text/javascript'];
files['/commerce.js']=['commerce.js','text/javascript'];
for(const name of ['realtime-core.js','realtime.js','voice-realtime.js','pcm-capture.js','conversation-flow.js','oral-diagnostic.js','conversation-route.js'])files['/'+name]=[name,'text/javascript'];
files['/conversation-route.css']=['conversation-route.css','text/css'];
files['/dashboard.css']=['dashboard.css','text/css'];
files['/dashboard.js']=['dashboard.js','text/javascript'];
files['/startup.js']=['startup.js','text/javascript'];
const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value))};
export function createApplication(options={}){
 const projectId=options.projectId??process.env.FIREBASE_PROJECT_ID??'fuentinterview';
 const verify=options.verifyToken??createTokenVerifier(projectId);
 const ledger=new BudgetLedger(options.directory||path.join(root,'.local'),options.budgetUsd??Number(process.env.AI_BUDGET_USD||0));
 let ai;try{ai=createAI({mode:options.mode??process.env.AI_MODE??'mock',apiKey:options.apiKey??process.env.OPENAI_API_KEY??'',model:options.model??process.env.OPENAI_MODEL??MODEL,ledger,fetchImpl:options.fetchImpl})}catch(error){ledger.close();throw error}
 let busy=false;let recent=[];
 const storage=new LocalSessionStorage(options.directory||path.join(root,'.local'));
 const commerce=new CommerceService(storage,{env:options.commerceEnv||process.env,client:options.lemonClient,budget:async()=>ledger.snapshot()});
 const run=async(kind,source,input,{uid,sessionId})=>{
  const scopedLedger={snapshot:()=>ledger.snapshot(),recordUsage:async(u,meta)=>{ledger.recordUsage(u);const policy=await commerce.policy(uid);await storage.transaction(tx=>recordOpenAIUsage(tx,{...meta,usage:u,sessionId,uid,scope:policy.development?'development':uid===commerce.env.ADMIN_UID?'owner':'users'}))},reserve:async()=>{const policy=await commerce.policy(uid);return commerce.consume(uid,source,policy.development?()=>ledger.reserve():undefined,{kind,sessionId})}};
  if(source==='mock')await commerce.consume(uid,source);
  try{return await createAI({mode:source,apiKey:options.apiKey??process.env.OPENAI_API_KEY??'',ledger:scopedLedger,fetchImpl:options.fetchImpl}).run(kind,input)}catch(error){await commerce.audit('ai_failed',uid,String(error.status||500));throw error}
 };
 const sessions=new SessionService(storage,{source:ai.mode,budget:()=>ledger.snapshot(),authorizeSession:(uid,input,tx)=>commerce.authorizeSession(uid,input,tx),authorizePractice:(uid,tx)=>commerce.requirePractice(uid,tx),run:(source,input,context)=>run('conversation',source,{...input,messages:input.messages.slice(-8).map(m=>({...m,content:m.content.slice(0,1000)}))},context)});
 const assessments=new AssessmentService(storage,{source:ai.mode,budget:()=>ledger.snapshot(),run:(source,input,context)=>run('diagnosis',source,input,context)});
 sessions.learning=(uid,input)=>assessments.context(uid,input);
 const study=new StudyService(storage,{assessments});
 assessments.sessionFor=(uid,id)=>sessions.get(uid,id);
 const routes=new ConversationRouteService(storage,{assessments,sessions,requirePractice:uid=>commerce.requirePractice(uid)});
 sessions.learning=(uid,input)=>input.routeId?routes.context(uid,input):input.studyId?study.context(uid,input.studyId):routes.practiceContext(uid,input);
 const feedback=new FeedbackService(storage,{source:ai.mode,budget:()=>ledger.snapshot(),evidence:(uid,kind,id)=>kind==='activity'?study.evidence(uid,id):sessions.evidence(uid,id),run:(source,input,context)=>run('review',source,input,context)});
 study.reviewFor=(uid,id)=>feedback.get(uid,'activity',id);
 const server=http.createServer(async(req,res)=>{
  const host=req.headers.host||'',port=server.address()?.port;
  if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(host))return json(res,403,{error:'Este servidor solo admite acceso local.'});
  if(req.headers.origin&&req.headers.origin!==`http://${host}`)return json(res,403,{error:'Origen no permitido.'});
  if(req.headers['sec-fetch-site']==='cross-site')return json(res,403,{error:'Solicitud externa rechazada.'});
  res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','no-referrer');
  const url=new URL(req.url,`http://${host}`);
  try{
   if(url.pathname==='/api/webhooks/lemonsqueezy'){
    if(req.method!=='POST')return json(res,405,{error:'Método no permitido.'});
    const request=new Request(url,{method:'POST',headers:req.headers,body:req,duplex:'half'});
    return json(res,200,await commerce.webhook(await readWebhook(request),req.headers['x-signature']));
   }
   if(url.pathname.startsWith('/api/')){
    const user=await verify(req.headers.authorization);
    return await commerce.withUser(user.uid,async()=>{
    if(commercePath(url.pathname)){const input=req.method==='POST'?await readJSON(new Request(url,{method:'POST',headers:req.headers,body:req,duplex:'half'})):{};return json(res,200,await commerceRequest(commerce,url.pathname,req.method,input,user))}
    await commerce.guard(user.uid);
    if(schoolPath(url.pathname)){const input=req.method==='POST'?await readJSON(new Request(url,{method:'POST',headers:req.headers,body:req,duplex:'half'})):{};return json(res,200,await schoolRequest({study,feedback,routes},url.pathname,req.method,input,user))}
    const assessmentPath=url.pathname.match(/^\/api\/assessments(?:\/([a-f0-9-]{36})(?:\/(evaluate|from-session))?)?$/i);
    if(url.pathname==='/api/learning'||assessmentPath){
     const id=assessmentPath?.[1],action=assessmentPath?.[2];let result;
     if(req.method==='GET'&&url.pathname==='/api/learning')result=await assessments.state(user.uid);
     else if(assessmentPath&&req.method==='GET'&&id&&!action)result={assessment:await assessments.get(user.uid,id)};
     else if(assessmentPath&&req.method==='DELETE'&&id&&!action)result=await assessments.remove(user.uid,id);
     else if(assessmentPath&&req.method==='POST'&&(!id||action)){
      const input=await readJSON(new Request(url,{method:'POST',headers:req.headers,body:req,duplex:'half'}));
      result=id?await (action==='from-session'?assessments.fromSession(user.uid,id,user.emailVerified,input):assessments.evaluate(user.uid,id,user.emailVerified,input)):{assessment:await assessments.save(user.uid,input)};
     }else return json(res,405,{error:'Método no permitido.'});
     return json(res,200,result);
    }
    const sessionPath=url.pathname.match(/^\/api\/sessions(?:\/([a-f0-9-]{36})(?:\/(turn|end))?)?$/i);
    if(sessionPath){
     const id=sessionPath[1],action=sessionPath[2];let result;
     if(req.method==='GET'&&!action)result=id?{session:await sessions.get(user.uid,id)}:{sessions:await sessions.list(user.uid)};
     else if(req.method==='DELETE'&&id&&!action)result=await sessions.remove(user.uid,id);
     else if(req.method==='POST'&&(!id||action)){
      const input=await readJSON(new Request(url,{method:'POST',headers:req.headers,body:req,duplex:'half'}));
      if(!id)result={session:await sessions.create(user.uid,input,user.emailVerified)};
      else if(action==='end')result={session:await sessions.end(user.uid,id)};
      else result=await sessions.turn(user.uid,id,input,user.emailVerified);
     }else return json(res,405,{error:'Método no permitido.'});
     return json(res,200,result);
    }
    if(req.method==='GET'&&url.pathname==='/api/session')return json(res,200,{mode:ai.mode,budget:ledger.snapshot(),firebase:{projectId,connected:true},localOnly:true,uid:user.uid,commerce:await commerce.state(user)});
    if(req.method==='POST'&&['/api/conversation','/api/plan'].includes(url.pathname)){
     if(ai.mode==='openai'&&!user.emailVerified)return json(res,403,{error:'Verifica tu correo antes de usar la IA de pago.'});
     if(busy)return json(res,429,{error:'Espera a que termine la solicitud anterior.'});
     recent=recent.filter(t=>Date.now()-t.time<60000);if(recent.length>=20||recent.filter(t=>t.uid===user.uid).length>=10)return json(res,429,{error:'Límite de solicitudes por minuto alcanzado.'});
     busy=true;
     try{
      const request=new Request(url,{method:'POST',headers:req.headers,body:req,duplex:'half'});
      const input=await readJSON(request);recent.push({time:Date.now(),uid:user.uid});
      json(res,200,await run(url.pathname==='/api/plan'?'plan':'conversation',ai.mode,input,{uid:user.uid}));
     }finally{busy=false}
     return;
    }
    return json(res,404,{error:'Ruta no encontrada.'});
    });
   }
   if(req.method==='GET'&&files[url.pathname]){
    const [file,type]=files[url.pathname];
    if(file==='config.js'&&options.emulator){res.writeHead(200,{'Content-Type':'text/javascript'});res.end(`window.FLUENT_CONFIG=${JSON.stringify({firebase:{apiKey:'demo-key',projectId:'demo-fluentinterview',authDomain:'localhost'},emulator:true,apiBase:''})};`);return}
    res.writeHead(200,{'Content-Type':`${type}; charset=utf-8`,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    if(file==='config.js'){res.end(fs.readFileSync(path.join(root,'public',file),'utf8').replace(/apiBase:'[^']*'/,"apiBase:''"));return}
    fs.createReadStream(path.join(root,'public',file)).pipe(res);return;
   }
   json(res,404,{error:'Ruta no encontrada.'});
  }catch(error){json(res,error.status||500,{error:error.status?error.message:'No se pudo completar la operación.'})}
 });
 server.on('close',()=>ledger.close());
 return {server,ledger,commerce,storage,listen:(port=4173)=>new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve)}),close:()=>new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()))};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const app=createApplication();await app.listen(Number(process.env.PORT||4173));
 console.log(`Fluent Interview: http://127.0.0.1:${app.server.address().port}`);
 console.log(`Modo: ${process.env.AI_MODE||'mock'}. Presupuesto: $${app.ledger.snapshot().limitUsd.toFixed(2)}. Autenticación Firebase obligatoria.`);
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{app.server.closeAllConnections();app.close().then(()=>process.exit(0))});
}
