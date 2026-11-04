export const PAID_PLANS={
 esencial:{name:'Esencial',price:9.90,minutes:60,variantKey:'ESENCIAL'},
 pro:{name:'Pro',price:19.90,minutes:150,variantKey:'PRO'},
 intensivo:{name:'Intensivo',price:34.90,minutes:300,variantKey:'INTENSIVO'}
};
export function configuredVariant(env,plan){const key=PAID_PLANS[plan]?.variantKey;return key?env[`LEMONSQUEEZY_VARIANT_${key}`]||null:null}
export function planForSubscription(env,sub){if(!sub)return null;for(const [id,p] of Object.entries(PAID_PLANS)){const variant=configuredVariant(env,id);if(variant&&String(variant)===String(sub.variantId))return id;if(sub.plan===id)return id}return null}
