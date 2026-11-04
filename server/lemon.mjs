import {fail} from './http.mjs';
import {PAID_PLANS,configuredVariant} from './plans.mjs';
export const LEMON_EVENTS=['subscription_created','subscription_updated','subscription_cancelled','subscription_resumed','subscription_expired','subscription_paused','subscription_unpaused','subscription_payment_success','subscription_payment_failed','subscription_payment_recovered','subscription_payment_refunded'];
const encoder=new TextEncoder();
export async function digest(text){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(text)))].map(x=>x.toString(16).padStart(2,'0')).join('')}
export async function verifyWebhook(raw,signature,secret){
 if(!secret)throw fail('Webhook todavía no configurado.',503);
 if(!/^[a-f0-9]{64}$/i.test(signature||''))throw fail('Firma no válida.',401);
 const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 const bytes=Uint8Array.from(signature.match(/../g).map(x=>parseInt(x,16)));
 if(!await crypto.subtle.verify('HMAC',key,bytes,encoder.encode(raw)))throw fail('Firma no válida.',401);
 let event;try{event=JSON.parse(raw)}catch{throw fail('Notificación no válida.')}
 if(!LEMON_EVENTS.includes(event.meta?.event_name))return null;
 if(event.meta?.test_mode===false||event.data?.attributes?.test_mode!==true)throw fail('Solo se admiten notificaciones de prueba.',400);
 return event;
}
export async function readWebhook(request){
 if(Number(request.headers.get('content-length'))>65536)throw fail('Notificación demasiado grande.',413);
 const reader=request.body?.getReader();if(!reader)throw fail('Falta la notificación.');const chunks=[];let size=0;
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>65536){await reader.cancel();throw fail('Notificación demasiado grande.',413)}chunks.push(value)}
 const all=new Uint8Array(size);let offset=0;for(const c of chunks){all.set(c,offset);offset+=c.length}return new TextDecoder('utf-8',{fatal:true}).decode(all);
}
export function lemonURL(value){let u;try{u=new URL(value)}catch{throw fail('El proveedor no devolvió un enlace válido.',502)}if(u.protocol!=='https:'||u.username||u.password||!(u.hostname==='lemonsqueezy.com'||u.hostname.endsWith('.lemonsqueezy.com')))throw fail('Enlace del proveedor no permitido.',502);return u.href}
export class LemonClient{
 constructor(env,fetchImpl=fetch){this.env=env;this.fetchImpl=fetchImpl}
 get ready(){return !!(this.env.LEMONSQUEEZY_API_KEY&&/^\d+$/.test(this.env.LEMONSQUEEZY_STORE_ID||'')&&Object.keys(PAID_PLANS).some(id=>/^\d+$/.test(configuredVariant(this.env,id)||''))&&this.env.LEMONSQUEEZY_WEBHOOK_SECRET)}
 variant(plan='pro'){const id=configuredVariant(this.env,plan);if(!PAID_PLANS[plan]||!/^\d+$/.test(id||''))throw fail('Este plan todavía se está preparando.',503);return id}
 async request(route,method='GET',body){
  if(!this.ready)throw fail('Lemon Squeezy está pendiente de conexión en modo de prueba.',503);
  const fetchImpl=this.fetchImpl;let r;try{r=await fetchImpl('https://api.lemonsqueezy.com/v1/'+route,{method,headers:{Accept:'application/vnd.api+json','Content-Type':'application/vnd.api+json',Authorization:'Bearer '+this.env.LEMONSQUEEZY_API_KEY},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)})}catch{throw fail('No se pudo confirmar la operación con Lemon Squeezy. Consulta el estado antes de repetir.',502)}
  if(!r.ok)throw fail('Lemon Squeezy no pudo completar la operación. No se modificó tu acceso.',502);return r.json();
 }
 async offer(plan='pro'){const variant=this.variant(plan),expected=Math.round(PAID_PLANS[plan].price*100),{data}=await this.request('variants/'+variant),a=data?.attributes;if(a?.test_mode!==true||a.is_subscription!==true||a.interval!=='month'||a.interval_count!==1||a.price!==expected)throw fail(`Configura la variante mensual de prueba de ${PAID_PLANS[plan].name} a US$${PAID_PLANS[plan].price.toFixed(2)}.`,503);const product=await this.request('products/'+a.product_id);if(String(product.data?.attributes?.store_id)!==this.env.LEMONSQUEEZY_STORE_ID||product.data?.attributes?.test_mode!==true)throw fail('El producto no corresponde a la tienda de prueba.',503);return {name:PAID_PLANS[plan].name,priceCents:a.price,testMode:true,variant}}
 async checkout(token,plan='pro'){let offer;try{offer=await this.offer(plan)}catch(error){error.checkoutNotCreated=true;throw error}const {data}=await this.request('checkouts','POST',{data:{type:'checkouts',attributes:{test_mode:true,expires_at:new Date(Date.now()+30*60000).toISOString(),product_options:{name:`Fluent Interview ${offer.name}`,description:`Suscripción mensual de prueba · ${PAID_PLANS[plan].minutes} minutos de conversación.`,enabled_variants:[Number(offer.variant)],redirect_url:this.env.APP_URL+'/#/planes'},checkout_options:{locale:'es',embed:false,subscription_preview:true,discount:false},checkout_data:{custom:{fluent_checkout:token}}},relationships:{store:{data:{type:'stores',id:this.env.LEMONSQUEEZY_STORE_ID}},variant:{data:{type:'variants',id:offer.variant}}}}});if(data?.attributes?.test_mode!==true)throw fail('El proveedor no confirmó el modo de prueba.',502);return lemonURL(data.attributes.url)}
 async subscription(id,method='GET'){if(!/^\d+$/.test(String(id)))throw fail('Suscripción no válida.');const {data}=await this.request('subscriptions/'+id,method),a=data?.attributes,variants=[...Object.keys(PAID_PLANS).map(plan=>configuredVariant(this.env,plan)),this.env.LEMONSQUEEZY_VARIANT_ID].filter(Boolean).map(String);if(data?.type!=='subscriptions'||String(data.id)!==String(id)||a?.test_mode!==true||String(a.store_id)!==this.env.LEMONSQUEEZY_STORE_ID||!variants.includes(String(a.variant_id)))throw fail('La suscripción no corresponde a un plan de prueba configurado.',400);return data}
}
