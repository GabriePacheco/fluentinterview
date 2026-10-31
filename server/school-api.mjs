import {fail} from './http.mjs';
export function schoolPath(path){return /^\/api\/route(?:\/(start|[a-f0-9-]{36}))?$/i.test(path)||/^\/api\/study(?:\/([a-f0-9-]{36})(?:\/(save|submit))?)?$/i.test(path)||/^\/api\/feedback\/(activity|session)\/([a-f0-9-]{36})$/i.test(path)}
export async function schoolRequest({study,feedback,routes},path,method,payload,user){
 const route=path.match(/^\/api\/route(?:\/(start|[a-f0-9-]{36}))?$/i);
 if(route){if(method==='GET'&&route[1]!=='start')return routes.state(user.uid,route[1]);if(method==='POST'&&route[1]==='start')return routes.start(user.uid,payload,user.emailVerified);throw fail('Método no permitido.',405)}
 const review=path.match(/^\/api\/feedback\/(activity|session)\/([a-f0-9-]{36})$/i);
 if(review){let result;if(method==='GET')result={review:await feedback.get(user.uid,review[1],review[2])};else if(method==='POST')result=await feedback.evaluate(user.uid,review[1],review[2],user.emailVerified,payload);else throw fail('Método no permitido.',405);if(review[1]==='session'&&result.review&&result.review.status!=='pending')await routes?.captureReview(user.uid,review[2]);return result}
 const match=path.match(/^\/api\/study(?:\/([a-f0-9-]{36})(?:\/(save|submit))?)?$/i);if(!match)throw fail('Ruta no encontrada.',404);
 const [,id,action]=match;
 if(method==='GET'&&!action)return id?{activity:await study.get(user.uid,id)}:study.state(user.uid);
 if(method==='DELETE'&&id&&!action)return study.remove(user.uid,id);
 if(method==='POST'&&!id)return {activity:await study.create(user.uid,payload)};
 if(method==='POST'&&action==='save')return {activity:await study.save(user.uid,id,payload)};
 if(method==='POST'&&action==='submit')return {activity:await study.submit(user.uid,id)};
 throw fail('Método no permitido.',405);
}
