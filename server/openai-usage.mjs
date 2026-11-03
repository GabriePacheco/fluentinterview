// Public standard USD rates verified 2026-11-01. Estimates, never billing balance.
// https://developers.openai.com/api/docs/pricing
export const RATE_DATE='2026-11-01';
const KEY='openai-usage-v1';
const count=x=>Number.isFinite(x)&&x>=0?x:0;
const valid=x=>Number.isFinite(x)&&x>=0;
const empty=()=>({events:0,incomplete:0,inputTokens:0,outputTokens:0,cachedTokens:0,textUsd:0,audioUsd:0,transcriptionUsd:0,cacheSavingsUsd:0,estimatedUsd:0});
export function priceUsage(model,usage){
 const u=usage||{},r=empty();r.events=1;
 const input=u.prompt_tokens??u.input_tokens,output=u.completion_tokens??u.output_tokens;
 r.inputTokens=count(input);r.outputTokens=count(output);
 if(model==='whisper-1'){
  if(u.type==='duration'&&valid(u.seconds))r.transcriptionUsd=u.seconds*.006/60;else r.incomplete=1;
 }else if(model==='gpt-4o-transcribe'){
  if(valid(input)&&valid(output))r.transcriptionUsd=(input*2.5+output*10)/1e6;else r.incomplete=1;
 }else if(model==='gpt-4.1-mini-2025-04-14'){
  if(valid(input)&&valid(output)){
   r.cachedTokens=Math.min(input,count(u.prompt_tokens_details?.cached_tokens));
   r.textUsd=((input-r.cachedTokens)*.4+r.cachedTokens*.1+output*1.6)/1e6;
   r.cacheSavingsUsd=r.cachedTokens*.3/1e6;
  }else r.incomplete=1;
 }else if(model==='gpt-realtime-2.1-mini'){
  const i=u.input_token_details,o=u.output_token_details,c=i?.cached_tokens_details;
  r.cachedTokens=count(i?.cached_tokens);
  // Never pretend aggregate audio/text tokens all have the same price.
  if(!i||!o||!valid(i.text_tokens)||!valid(i.audio_tokens)||!valid(o.text_tokens)||!valid(o.audio_tokens)||!valid(input)||!valid(output))r.incomplete=1;
  else if((r.cachedTokens>0&&(!c||!valid(c.text_tokens)||!valid(c.audio_tokens)))||count(i.image_tokens)>0||i.text_tokens+i.audio_tokens!==input||o.text_tokens+o.audio_tokens!==output||count(c?.text_tokens)+count(c?.audio_tokens)!==r.cachedTokens||count(c?.text_tokens)>i.text_tokens||count(c?.audio_tokens)>i.audio_tokens)r.incomplete=1;
  else{
   const ct=count(c?.text_tokens),ca=count(c?.audio_tokens);
   r.textUsd=((i.text_tokens-ct)*.6+ct*.06+o.text_tokens*2.4)/1e6;
   r.audioUsd=((i.audio_tokens-ca)*10+ca*.3+o.audio_tokens*20)/1e6;
   r.cacheSavingsUsd=(ct*.54+ca*9.7)/1e6;
  }
 }else r.incomplete=1;
 r.estimatedUsd=r.textUsd+r.audioUsd+r.transcriptionUsd;return r;
}
function add(target,value){for(const key of Object.keys(empty()))target[key]=(target[key]||0)+value[key];return target}
function initial(now){return {since:now,updatedAt:now,rateDate:RATE_DATE,total:empty(),scopes:{},models:{},days:{},recent:[],seen:[]}}
// Call inside the same transaction as the legacy ledger. No personal text/audio.
export async function recordOpenAIUsage(tx,{id,model,usage,scope='users',kind='conversation',sessionId=null,uid=null,startedAt=null,now=Date.now()}){
 const data=await tx.get(KEY)||initial(now),eventId=String(id||crypto.randomUUID()).slice(0,180);
 if(data.seen.includes(eventId))return null;
 const measured=priceUsage(model,usage),day=new Date(now).toISOString().slice(0,10);
 data.seen.push(eventId);data.seen=data.seen.slice(-300);
 data.updatedAt=now;add(data.total,measured);
 scope=['owner','development'].includes(scope)?scope:'users';
 add(data.scopes[scope]??=empty(),measured);
 const modelKey=['gpt-realtime-2.1-mini','gpt-4.1-mini-2025-04-14','gpt-4o-transcribe','whisper-1'].includes(model)?model:'unknown';
 add(data.models[modelKey]??=empty(),measured);add(data.days[day]??=empty(),measured);
 data.days=Object.fromEntries(Object.entries(data.days).sort(([a],[b])=>b.localeCompare(a)).slice(0,31));
 if(sessionId){
  let item=data.recent.find(x=>x.id===sessionId&&(x.uid===uid||!x.uid&&!x.deletedUser&&(uid===null||scope==='owner'&&x.scope==='owner')));
  if(!item){item={id:sessionId,uid,scope,kind,startedAt:startedAt||now,updatedAt:now,...empty()};data.recent.push(item)}
  if(uid)item.uid=uid;
  if(valid(startedAt)&&startedAt>0)item.startedAt=startedAt;
  item.updatedAt=now;add(item,measured);
  data.recent.sort((a,b)=>b.updatedAt-a.updatedAt);data.recent=data.recent.slice(0,30);
 }
 await tx.put(KEY,data);return measured;
}
// The connected duration excludes evaluation time. Never use the allowed limit
// (voiceSeconds), first/last billing event, or token count as conversation length.
export async function finishUsageSession(tx,{sessionId,uid,startedAt,endedAt}){
 const data=await tx.get(KEY);if(!data)return;
 const item=data.recent.find(x=>x.id===sessionId&&(!x.uid||x.uid===uid));if(!item)return;
 if(!valid(startedAt)||!valid(endedAt)||endedAt<startedAt)return;
 Object.assign(item,{uid,startedAt,endedAt,durationSeconds:(endedAt-startedAt)/1000});
 await tx.put(KEY,data);
}
export async function unlinkUsageUser(tx,uid){
 const data=await tx.get(KEY);if(!data)return;
 for(const row of data.recent)if(row.uid===uid){delete row.uid;row.deletedUser=true}
 await tx.put(KEY,data);
}
export async function readOpenAIUsage(storage){const data=await storage.get(KEY);if(!data)return {...initial(null),seen:undefined};const {seen,...view}=data;return view}
