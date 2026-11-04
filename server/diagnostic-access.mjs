export const initialRouteKey=uid=>'initial-route:'+encodeURIComponent(uid);
export async function hasInitialRoute(storage,uid){
 if(await storage.get(initialRouteKey(uid)))return true;
 const index=await storage.get('assessment-index:'+encodeURIComponent(uid));
 if(index?.sequence>0)return true;
 if(!index?.current)return false;
 return (await storage.get('assessment:'+encodeURIComponent(uid)+':'+index.current))?.status==='completed';
}
// Only server-owned records determine eligibility; a request/profile flag cannot grant it.
export async function includeInitialDiagnostic(storage,uid,context={}){
 if(!['voice','diagnosis'].includes(context.kind)||!/^[a-f0-9-]{36}$/i.test(context.sessionId||''))return false;
 const diagnosis=context.kind==='diagnosis',prefix=diagnosis?'assessment:':'sessions:',key=prefix+encodeURIComponent(uid)+':'+context.sessionId,record=await storage.get(key);
 if(record?.source!=='openai')return false;
 if(diagnosis?record.status!=='pending':record.purpose!=='diagnostic'||record.status!=='active')return false;
 // Keep the same initial interview's feedback/recovery included even if its route finishes first.
 let included=record.initialDiagnosticIncluded===true;
 if(!included&&await hasInitialRoute(storage,uid))return false;
 if(!record.initialDiagnosticIncluded){record.initialDiagnosticIncluded=true;await storage.put(key,record)}
 return true;
}
