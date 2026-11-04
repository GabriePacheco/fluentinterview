import test from 'node:test';
import fs from 'node:fs';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,getDocs,collection,updateDoc,serverTimestamp} from 'firebase/firestore';
test('Firestore enforces profile ownership, schema and server-only entitlements',async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-fluentinterview',firestore:{host:'127.0.0.1',port:8080,rules:fs.readFileSync('firestore.rules','utf8')}});
 try{
  await env.clearFirestore();const alice=env.authenticatedContext('alice').firestore(),bob=env.authenticatedContext('bob').firestore(),anonymous=env.unauthenticatedContext().firestore();
  const data={name:'Alice',role:'Developer',goal:'Interview',minutes:'20 minutos',experience:'',job:'',schemaVersion:1,createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
  await assertSucceeds(setDoc(doc(alice,'fi_users/alice'),data));
  await assertSucceeds(getDoc(doc(alice,'fi_users/alice')));
  await assertFails(getDoc(doc(bob,'fi_users/alice')));
  await assertFails(getDoc(doc(anonymous,'fi_users/alice')));
  await assertFails(setDoc(doc(bob,'fi_users/alice'),data));
  await assertFails(getDocs(collection(alice,'fi_users')));
  await assertFails(updateDoc(doc(alice,'fi_users/alice'),{plan:'pro',updatedAt:serverTimestamp()}));
  await assertFails(updateDoc(doc(alice,'fi_users/alice'),{admin:true,updatedAt:serverTimestamp()}));
  await assertFails(updateDoc(doc(alice,'fi_users/alice'),{name:'x'.repeat(61),updatedAt:serverTimestamp()}));
  await assertSucceeds(updateDoc(doc(alice,'fi_users/alice'),{role:'Data Analyst',updatedAt:serverTimestamp()}));
  await assertSucceeds(updateDoc(doc(alice,'fi_users/alice'),{profession:'Analyst',targetRoles:['Data Analyst','BI Analyst'],selfReportedLevel:'C1',onboardingCompleted:true,updatedAt:serverTimestamp()}));
  await assertFails(updateDoc(doc(alice,'fi_users/alice'),{selfReportedLevel:'invented',updatedAt:serverTimestamp()}));
  await assertFails(updateDoc(doc(alice,'fi_users/alice'),{targetRoles:['a','b','c','d','e','f'],updatedAt:serverTimestamp()}));
  await assertFails(updateDoc(doc(alice,'fi_users/alice'),{profession:'',updatedAt:serverTimestamp()}));
  await assertFails(updateDoc(doc(alice,'fi_users/alice'),{level:'C1',updatedAt:serverTimestamp()}));
  await assertFails(setDoc(doc(alice,'fi_entitlements/alice'),{plan:'pro'}));
  await assertFails(getDoc(doc(bob,'fi_entitlements/alice')));
  await assertFails(setDoc(doc(alice,'fi_users/alice/routes/fake'),{level:'C1'}));
  await assertFails(setDoc(doc(alice,'budgets/global'),{remaining:1000}));
  await assertFails(getDoc(doc(alice,'legacy/anything')));
 }finally{await env.cleanup()}
});
