// Reads the existing Firebase CLI session without printing credentials.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const config=JSON.parse(fs.readFileSync(path.join(os.homedir(),'.config/configstore/firebase-tools.json'),'utf8'));
const token=config.tokens?.access_token;
if(!token)throw Error('Inicia sesión con Firebase CLI.');
const endpoints={
 billing:'https://cloudbilling.googleapis.com/v1/projects/fuentinterview/billingInfo',
 auth:'https://identitytoolkit.googleapis.com/admin/v2/projects/fuentinterview/config',
 databases:'https://firestore.googleapis.com/v1/projects/fuentinterview/databases',
 release:'https://firebaserules.googleapis.com/v1/projects/fuentinterview/releases/cloud.firestore',
 hosting:'https://firebasehosting.googleapis.com/v1beta1/projects/fuentinterview/sites'
};
for(const [kind,url] of Object.entries(endpoints)){
 const response=await fetch(url,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(15000)});const data=await response.json();
 if(!response.ok){console.log(JSON.stringify({kind,status:response.status,message:data.error?.message}));continue}
 if(kind==='billing')console.log(JSON.stringify({kind,billingEnabled:data.billingEnabled}));
 if(kind==='auth')console.log(JSON.stringify({kind,emailSignIn:data.signIn?.email,authorizedDomains:data.authorizedDomains,passwordPolicy:data.passwordPolicyConfig}));
 if(kind==='databases')console.log(JSON.stringify({kind,databases:data.databases?.map(d=>({name:d.name,locationId:d.locationId,type:d.type}))}));
 if(kind==='hosting')console.log(JSON.stringify({kind,sites:data.sites?.map(s=>({name:s.name,defaultUrl:s.defaultUrl}))}));
 if(kind==='release'){
  const rules=await fetch(`https://firebaserules.googleapis.com/v1/${data.rulesetName}`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json());
  fs.mkdirSync('.local',{recursive:true});fs.writeFileSync('.local/firestore-before.json',JSON.stringify({release:data,rules},null,2));
  console.log(JSON.stringify({kind,ruleset:data.rulesetName,files:rules.source?.files}));
 }
}
