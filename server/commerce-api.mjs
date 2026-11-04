import {fail} from './http.mjs';
export const commercePath=p=>['/api/billing','/api/billing/checkout','/api/billing/portal','/api/billing/sync','/api/billing/cancel','/api/admin','/api/admin/openai-usage','/api/account/delete'].includes(p);
export async function commerceRequest(service,path,method,input,user){
 if(path==='/api/admin/openai-usage'&&method==='GET')return service.openAIUsage(user);
 if(path==='/api/billing'&&method==='GET')return service.state(user);
 if(path==='/api/admin'){if(method==='GET')return service.dashboard(user);if(method==='POST')return service.administer(user,input)}
 if(method==='POST'){
  if(path==='/api/billing/checkout')return service.checkout(user,input.planId||'pro');
  if(path==='/api/billing/portal')return service.sync(user,{portal:true});
  if(path==='/api/billing/sync')return service.sync(user);
  if(path==='/api/billing/cancel'){if(input.confirm!==true)throw fail('Confirma la cancelación.');return service.sync(user,{cancel:true})}
  if(path==='/api/account/delete'){if(input.confirm!=='ELIMINAR'||!user.authTime||Date.now()/1000-user.authTime>300)throw fail('Vuelve a confirmar tu contraseña antes de eliminar la cuenta.',401);return service.erase(user)}
 }
 throw fail('Método no permitido.',405);
}
