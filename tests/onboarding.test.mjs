import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {onboardingData,hasCompletedOnboarding} from '../src/onboarding.js';
import {validatePayload} from '../server/ai.mjs';
import {generateKeyPair,SignJWT} from 'jose';import {createTokenVerifier} from '../server/auth.mjs';
test('One-step profile validates roles and retains an explicitly unknown self assessment',()=>{
 const values=new Map([['name','Gabriel'],['profession',' Developer '],['selfReportedLevel','unsure'],['targetRoles','Developer, QA Engineer, Developer']]);
 const result=onboardingData(values);assert.equal(result.profession,'Developer');assert.deepEqual(result.targetRoles,['Developer','QA Engineer']);assert.equal(result.role,'Developer');assert.equal(result.onboardingCompleted,true);
 values.set('selfReportedLevel','invented');assert.throws(()=>onboardingData(values));
 assert.equal(hasCompletedOnboarding({role:'Developer'}),true);assert.equal(hasCompletedOnboarding({role:'Developer',onboardingCompleted:false}),false);
});
test('Self-reported level never enters AI profile or overrides diagnostic level',()=>{
 const profile={name:'Test',profession:'Engineer',role:'Developer',selfReportedLevel:'C2',level:'C2'};
 const browser=vm.createContext({state:profile,views:{},document:{addEventListener(){}},window:{addEventListener(){}}});
 // Use the actual profile serializer, without executing unrelated UI code.
 vm.runInContext(fs.readFileSync('public/runtime.js','utf8').split('\n').find(line=>line.startsWith('const profileForAI='))+';globalThis.result=profileForAI();',browser);
 assert.equal(browser.result.selfReportedLevel,undefined);assert.equal(browser.result.level,undefined);
 const payload=validatePayload('diagnosis',{profile,samples:['introduction','challenge','opinion'].map(id=>({id,text:'My own answer.'})),scores:{}});
 assert.equal(payload.profile.selfReportedLevel,undefined);assert.equal(payload.profile.level,undefined);assert.equal(payload.profile.profession,'Engineer');
});
test('Google exemption requires the verified JWT provider; password still requires verified email',async()=>{
 const {publicKey,privateKey}=await generateKeyPair('RS256'),verify=createTokenVerifier('demo-fluentinterview',publicKey);
 for(const [provider,expected] of [['google.com',true],['password',false]]){
  const jwt=await new SignJWT({auth_time:Math.floor(Date.now()/1000),email_verified:false,firebase:{sign_in_provider:provider}}).setProtectedHeader({alg:'RS256'}).setSubject('test-user').setIssuer('https://securetoken.google.com/demo-fluentinterview').setAudience('demo-fluentinterview').setIssuedAt().setExpirationTime('1h').sign(privateKey);
  assert.equal((await verify('Bearer '+jwt)).emailVerified,expected);
 }
});
