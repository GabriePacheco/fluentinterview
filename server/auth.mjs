import {createRemoteJWKSet,jwtVerify} from 'jose';
const googleKeys=createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),{timeoutDuration:10000});
export function createTokenVerifier(projectId,keys=googleKeys){
 if(!/^[a-z][a-z0-9-]{4,40}$/.test(projectId))throw Error('Proyecto Firebase no válido.');
 return async header=>{
  if(typeof header!=='string'||!/^Bearer [A-Za-z0-9_.-]+$/.test(header)||header.length>8000)throw unauthorized();
  try{
   const {payload}=await jwtVerify(header.slice(7),keys,{algorithms:['RS256'],issuer:`https://securetoken.google.com/${projectId}`,audience:projectId,requiredClaims:['exp','iat','sub','auth_time'],clockTolerance:5});
   const now=Math.floor(Date.now()/1000);
   if(typeof payload.sub!=='string'||!payload.sub||payload.sub.length>128||payload.sub.includes('/')||typeof payload.auth_time!=='number'||payload.auth_time>now+5||payload.iat>now+5)throw Error();
   // Only the verified Firebase JWT can establish Google sign-in, never client profile fields.
   return {uid:payload.sub,emailVerified:payload.email_verified===true||payload.firebase?.sign_in_provider==='google.com',...(typeof payload.email==='string'?{email:payload.email}:{}),authTime:payload.auth_time};
  }catch{throw unauthorized()}
 };
}
export function unauthorized(){return Object.assign(Error('Inicia sesión de nuevo para continuar.'),{status:401})}
