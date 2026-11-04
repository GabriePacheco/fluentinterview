import {initializeApp} from 'firebase/app';
import {getAuth,setPersistence,browserLocalPersistence,onIdTokenChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,sendPasswordResetEmail,sendEmailVerification,reload,connectAuthEmulator,EmailAuthProvider,reauthenticateWithCredential,deleteUser,GoogleAuthProvider,signInWithPopup,reauthenticateWithPopup} from 'firebase/auth';
import {getFirestore,doc,getDoc,setDoc,serverTimestamp,runTransaction,connectFirestoreEmulator,deleteDoc} from 'firebase/firestore';
import {hasCompletedOnboarding,onboardingData,updateRoleSuggestions,onboardingView} from './onboarding.js';

const config=window.FLUENT_CONFIG;
const app=initializeApp(config.firebase),auth=getAuth(app),db=getFirestore(app);
auth.languageCode='es';
const googleProvider=new GoogleAuthProvider();googleProvider.setCustomParameters({prompt:'select_account'});
const usesGoogle=user=>user?.providerData?.some(p=>p.providerId==='google.com');
const verifiedUser=user=>!!user&&(user.emailVerified||usesGoogle(user));
if(config.emulator&&['localhost','127.0.0.1'].includes(location.hostname)){
 connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});connectFirestoreEmulator(db,'127.0.0.1',8080);
}
const account={ready:false,user:null,profile:null,mode:'login',busy:false,error:'',success:'',profileError:'',signupName:'',generation:0};
const defaults={name:'',role:'',profession:'',goal:'Conseguir un trabajo internacional',minutes:'20 minutos',experience:'',job:'',lessonDone:false,diagnosed:false,plan:'free'};
const profileKeys=['name','role','profession','goal','minutes','experience','job'];
function clearLearner(){
 const main=document.querySelector('#main');main._viewKey=null;main._viewHTML=null;main._shellKey=null;delete main.dataset.accountGate;
 if(typeof resetLearning==='function')resetLearning();
 if(typeof resetSchool==='function')resetSchool();
 stopVoiceSession();voice.run++;voice.session=null;voice.pending=null;voice.busy=false;voice.owner=null;voice.transcript=[];voice.index=0;voice.currentPrompt='';sessionHistory.items=[];sessionHistory.loaded=false;sessionHistory.error='';
 for(const key of Object.keys(state))delete state[key];Object.assign(state,defaults);
 runtime.plan=null;runtime.previous=null;runtime.planSource=null;runtime.config=null;
 diagStep=0;diagAnswer=null;lessonStep=0;lessonChoice=null;lessonChecked=false;interviewIndex=0;interviewAnswers=[];
 document.querySelector('#modal')?.close();
}
function readableError(error){
 const googleErrors={'auth/popup-closed-by-user':'Cerraste la ventana de Google. Puedes intentarlo de nuevo.','auth/cancelled-popup-request':'Ya hay una ventana de acceso abierta.','auth/popup-blocked':'Permite las ventanas emergentes de este sitio y vuelve a pulsar Continuar con Google.','auth/unauthorized-domain':'Este dominio todavía no está habilitado para acceder con Google.','auth/account-exists-with-different-credential':'Ya tienes una cuenta con ese correo. Inicia sesión con tu método habitual para conservarla.','auth/operation-not-allowed':'Este método de acceso todavía no está habilitado. Prueba con tu correo.'};
 if(googleErrors[error.code])return googleErrors[error.code];
 const messages={'auth/wrong-password':'El correo o la contraseña no son correctos.','auth/user-not-found':'El correo o la contraseña no son correctos.','auth/invalid-credential':'El correo o la contraseña no son correctos.','auth/email-already-in-use':'No pudimos crear la cuenta. Prueba iniciar sesión o recuperar tu contraseña.','auth/invalid-email':'Escribe un correo válido.','auth/weak-password':'Usa una contraseña de al menos 10 caracteres.','auth/too-many-requests':'Hay demasiados intentos. Espera unos minutos y vuelve a probar.','auth/network-request-failed':'No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.','auth/user-disabled':'Esta cuenta no está disponible.','auth/operation-not-allowed':'El acceso por correo todavía no está habilitado.','permission-denied':'No se pudo acceder al perfil. Revisa las reglas de acceso del proyecto.','unavailable':'No se pudo conectar con tus datos. Inténtalo de nuevo.'};
 return messages[error.code]||'No se pudo completar la operación. Inténtalo de nuevo.';
}
function authView(){
 const reset=account.mode==='reset',signup=account.mode==='signup';
 return `<div class="auth-layout"><section class="auth-story"><a class="brand" href="#/inicio"><span class="brand-mark">${icon('chat')}</span><span>fluent<span style="color:var(--purple)">interview</span><small>YOUR NEXT CHAPTER</small></span></a><h1>Tu próxima oportunidad<br>empieza hablando.</h1><p>Un espacio para preparar tu inglés, contar tu experiencia y llegar con más confianza a tu próxima entrevista.</p><div class="row wrap"><span class="tag">Tu objetivo</span><span class="tag">Tu ritmo</span><span class="tag">Tu próximo paso</span></div></section><section class="card auth-card">
 ${reset?'':`<div class="auth-switch"><button type="button" data-account="login" class="${signup?'':'active'}">Iniciar sesión</button><button type="button" data-account="signup" class="${signup?'active':''}">Crear cuenta</button></div>`}
 <div class="eyebrow">${reset?'VOLVAMOS A TU CAMINO':signup?'TU PRIMER PASO':'BIENVENIDO DE NUEVO'}</div><h2>${reset?'Recupera tu acceso':signup?'Haz espacio para tu futuro':'Tu espacio te espera'}</h2>
 <p class="muted">${reset?'Te enviaremos un enlace para elegir una nueva contraseña.':signup?'Crea tu cuenta y guarda tu objetivo profesional.':'Entra para continuar con tu preparación.'}</p>
 ${reset?'':`<button type="button" class="google-signin" data-account="google" ${account.busy?'disabled':''}><svg class="google-mark" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.17 7.09-10.32 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59C10.05 27.14 9.78 25.6 9.78 24s.27-3.14.76-4.59l-7.98-6.19C.93 16.46 0 20.12 0 24s.93 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>Continuar con Google</button><div class="auth-divider"><span>o continúa con tu correo</span></div>`}
 <form id="account-form">${signup?`<div class="form-field account-field"><label for="account-name">Tu nombre</label><div class="account-input">${icon('user')}<input id="account-name" name="name" maxlength="60" autocomplete="given-name" required></div></div>`:''}
 <div class="form-field account-field"><label for="account-email">Correo electrónico</label><div class="account-input">${icon('mail')}<input id="account-email" name="email" type="email" autocomplete="email" maxlength="254" required></div></div>
 ${reset?'':`<div class="form-field account-field"><label for="account-password">Contraseña</label><div class="account-input password-input">${icon('lock')}<input id="account-password" name="password" type="password" autocomplete="${signup?'new-password':'current-password'}" ${signup?'minlength="10"':''} maxlength="128" spellcheck="false" autocapitalize="off" required><button type="button" class="password-toggle" data-password-toggle="account-password" aria-controls="account-password" aria-label="Mostrar contraseña" title="Mostrar contraseña">${icon('eye')}</button></div></div>${signup?'<p class="mini-info">Al menos 10 caracteres. No uses una contraseña compartida con otros servicios.</p>':''}`}
 <div role="alert" id="account-error">${escapeHTML(account.error)}</div>${account.success?`<p class="auth-success" role="status">${escapeHTML(account.success)}</p>`:''}
 <button class="btn" type="submit" ${account.busy?'disabled':''}>${account.busy?'Un momento…':reset?'Enviar enlace':signup?'Crear mi cuenta':'Entrar a mi espacio'} ${icon('arrow')}</button></form>
 <button type="button" class="text-btn" data-account="${reset?'login':'reset'}">${reset?'← Volver al inicio de sesión':'Olvidé mi contraseña'}</button><p class="mini-info" style="margin-top:24px">Tu perfil y tu avance se guardan en tu cuenta. Crear una cuenta no genera cobros. <a href="#/privacidad">Privacidad y soporte</a>.</p></section></div>`;
}
const applicationRender=render;
function verificationView(){return `<section class="card verification-card"><span class="onboarding-symbol">${icon('mail')}</span><span class="eyebrow">CONFIRMA TU CORREO</span><h1>Revisa tu bandeja de entrada.</h1><p>Abre el enlace que enviamos a <strong>${escapeHTML(account.user.email)}</strong>. Después prepararemos tu perfil y comenzarás el diagnóstico.</p><p class="mini-info">Si no lo encuentras, revisa la carpeta de correo no deseado.</p><button class="btn" data-account="refresh">Ya confirmé mi correo ${icon('arrow')}</button><button class="text-btn" data-account="verify">Reenviar correo de confirmación</button><p class="mini-info" role="status">${escapeHTML(account.success||'')}</p><button class="text-btn" data-account="logout">Usar otra cuenta</button></section>`}
render=function(){
 if(!account.ready)return;
 document.body.classList.remove('booting');document.body.classList.toggle('auth-page',!account.user);
 if(!account.user){document.querySelector('#main').innerHTML=current()==='privacidad'?privacyView():authView();document.title='Tu cuenta · Fluent Interview';return}
 if(!account.profile||account.initializing){
  delete document.querySelector('#main').dataset.accountGate;
  document.querySelector('#sidebar').innerHTML='';document.querySelector('#topbar').innerHTML='';
  const main=document.querySelector('#main'),html=`<section class="card account-loading"><h1>${account.profileError?'No pudimos cargar tu perfil':'Preparando tu espacio…'}</h1><p>${escapeHTML(account.profileError)}</p>${account.profileError?'<button class="btn" data-account="retry">Volver a intentar</button>':''}<button class="text-btn" data-account="logout">Cerrar sesión</button></section>`;if(main.innerHTML!==html)main.innerHTML=html;main._viewKey=null;main._shellKey=null;return;
 }
 if(current()!=='privacidad'&&(!verifiedUser(account.user)||!hasCompletedOnboarding(account.profile))){
  document.body.classList.add('auth-page');
  const main=document.querySelector('#main'),key=account.user.uid+':'+(verifiedUser(account.user)?'onboarding':'verification');
  if(main.dataset.accountGate!==key){main.innerHTML=verifiedUser(account.user)?onboardingView({profile:account.profile},icon,escapeHTML):verificationView();main.dataset.accountGate=key;main._viewKey=null;main._viewHTML=null;main._shellKey=null}
  document.title=verifiedUser(account.user)?'Tu primer paso · Fluent Interview':'Confirma tu correo · Fluent Interview';return;
 }
 delete document.querySelector('#main').dataset.accountGate;
 applicationRender();
 const badge=document.querySelector('.demo-label');if(badge)badge.textContent='PILOTO · CUENTA CONECTADA';
 document.querySelector('#sidebar .count')?.remove();
 if(!document.querySelector('.top-actions [data-account="logout"]')){const logout=document.createElement('button');logout.className='text-btn';logout.dataset.account='logout';logout.textContent='Cerrar sesión';document.querySelector('.top-actions').append(logout)}
 document.querySelector('[data-email-notice]')?.remove();
 if(!['inicio','perfil','planes','progreso','pruebas','aula','entrevista','diagnostico','nivel','ruta','ejercicios','entrevistas','resultado','leccion-completa','administracion','privacidad'].includes(current())){const notice=document.createElement('div');notice.className='account-notice';notice.textContent='Actividad en preparación. Los ejemplos y resultados de esta pantalla todavía no representan una evaluación de tu nivel.';document.querySelector('#main').prepend(notice)}
};
views.inicio=studyHome;
views.perfil=()=>`${heading('UNA META CON NOMBRE PROPIO','¿Hacia dónde quieres ir?','Conecta tu preparación con lo que quieres conseguir.')}<div class="grid interview-layout"><section class="card form-card"><h2>Tu objetivo profesional</h2><form id="profile-form"><label class="form-field"><span>Tu nombre</span><input id="profile-name" name="name" maxlength="60" required value="${escapeHTML(state.name)}"></label><label class="form-field"><span>Profesión u ocupación</span><input name="profession" maxlength="120" value="${escapeHTML(state.profession||'')}" placeholder="Tu profesión actual"></label><label class="form-field"><span>Puesto deseado</span><input id="profile-role" name="role" maxlength="100" value="${escapeHTML(state.role)}" placeholder="Por ejemplo, Software Developer"></label><label class="form-field"><span>Tu objetivo</span><input name="goal" maxlength="200" required value="${escapeHTML(state.goal)}"></label><label class="form-field"><span>Tiempo al día</span><select name="minutes">${['10 minutos','20 minutos','30 minutos'].map(x=>`<option ${state.minutes===x?'selected':''}>${x}</option>`).join('')}</select></label><label class="form-field"><span>Sobre tu experiencia</span><textarea name="experience" maxlength="3000" placeholder="Cuéntanos tus habilidades y proyectos…">${escapeHTML(state.experience)}</textarea></label><label class="form-field"><span>Vacante que te interesa</span><textarea name="job" maxlength="6000" placeholder="Pega aquí la descripción de una vacante…">${escapeHTML(state.job)}</textarea></label><p id="profile-status" role="status" class="mini-info">Solo tú puedes acceder a este perfil desde la aplicación.</p><button class="btn" type="submit">Guardar mi objetivo ${icon('check')}</button></form></section><aside class="card"><h2>Tu cuenta</h2><p class="account-email">${escapeHTML(account.user.email)}</p><p class="mini-info">${verifiedUser(account.user)?'Acceso confirmado':'Correo pendiente de verificación'}</p><button class="text-btn" data-account="logout">Cerrar sesión</button></aside></div>${openAIUsageView()}`;
views.progreso=()=>`${heading('CADA PASO CUENTA','Tu progreso empieza contigo.','Aquí aparecerán tus sesiones y avances reales.')}<section class="card account-empty"><div class="stat-icon">${icon('chart')}</div><h2>Todavía no tienes sesiones registradas.</h2><p class="muted">Tu cuenta y tu objetivo ya pueden guardarse. Completa tu diagnóstico y empieza a practicar para ver tu progreso aquí.</p>${link('perfil','Preparar mi objetivo','btn','brief')}</section>`;
views.planes=()=>`${heading('TU SUSCRIPCIÓN','Empieza con tu cuenta gratuita.','Estamos preparando los planes de práctica para el piloto.')}<section class="card form-card narrow"><span class="tag">PLAN GRATUITO</span><h2>Tu próximo paso ya tiene un espacio.</h2><p>Crear tu cuenta y guardar tu objetivo no genera cobros.</p><div class="feedback note">Las suscripciones de pago todavía no están habilitadas. Verás el precio, la frecuencia y los límites antes de contratar.</div>${link('perfil','Completar mi objetivo','btn','arrow')}</section>`;
views.pruebas=()=>{const d=runtime.config,c=commerce.data||d?.commerce,limited=c?.limits?.real,available=d?.mode==='openai'&&!!c&&!c.aiPaused&&!c.suspended&&(c.plan==='owner'||limited&&limited.used<limited.limit);return `${heading('TU ESPACIO DE PRÁCTICA','Todo listo para tu próxima conversación.','Tu preparación y tu cuenta, en un mismo lugar.',button('pilot-refresh','Actualizar estado','btn secondary'))}<div class="grid cols-2"><section class="card"><h2>Tu recorrido</h2><p>Define tu objetivo, conversa para conocer tu punto de partida y practica los pasos de tu ruta.</p><div class="row wrap">${link('diagnostico','Mi diagnóstico','btn secondary')}${link('ruta','Mi ruta','btn secondary')}${link('aula','Conversar con IA','btn')}</div></section><section class="card"><h2>${!d||!c?'Comprobando conexión…':available?'Práctica con IA disponible':d.mode==='mock'?'Conversaciones de ejemplo':c.aiPaused?'Práctica temporalmente pausada':c.suspended?'Contacta con soporte':'Revisa tu práctica disponible'}</h2><p>${runtime.error?escapeHTML(runtime.error):available?'Puedes conversar y recibir retroalimentación según el acceso de tu cuenta.':'Consulta tu suscripción para conocer tu acceso. Tu historial y los ejercicios guardados siguen disponibles.'}</p>${link('planes','Ver mi suscripción','text-btn')}</section><section class="card"><h2>Voz y resultados</h2><p>Inicia el micrófono una vez y conversa. Puedes pausar cuando lo necesites. Al terminar verás tu retroalimentación.</p><p>Tu ruta se adapta a tu diagnóstico y a tu objetivo profesional. Los pasos se aprueban desde 7,5/10.</p></section><section class="card"><h2>Suscripción y ayuda</h2><p>Las suscripciones están en prueba: todavía no hay cobros reales.</p>${link('privacidad','Privacidad y soporte','btn secondary')}</section></div>`};
document.addEventListener('click',event=>{if(event.target.closest('[data-action="pilot-refresh"]')){loadRuntime();loadCommerce()}});

async function loadProfile(user){
 const generation=++account.generation;account.profileError='';account.initializing=true;render();
 try{
  const ref=doc(db,'fi_users',user.uid);
  const profile=await runTransaction(db,async transaction=>{
   const existing=await transaction.get(ref);if(existing.exists())return existing.data();
   const data={name:(account.signupName||user.displayName||'Miembro').slice(0,60),role:'',profession:'',targetRoles:[],selfReportedLevel:'unsure',onboardingCompleted:false,goal:defaults.goal,minutes:defaults.minutes,experience:'',job:'',schemaVersion:1,createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
   transaction.set(ref,data);return data;
  });
  if(generation!==account.generation||auth.currentUser?.uid!==user.uid)return;
  account.profile=profile;state.targetRoles=profile.targetRoles||[];Object.assign(state,Object.fromEntries(profileKeys.map(k=>[k,profile[k]??defaults[k]])));
  if(verifiedUser(user)&&hasCompletedOnboarding(profile)){window.dispatchEvent(new Event('fluent-auth-ready'));await prepareInitialScreen()}
  if(generation!==account.generation||auth.currentUser?.uid!==user.uid)return;
  account.initializing=false;
  if(verifiedUser(user)&&profile.onboardingCompleted&&learning.loaded&&!learning.current&&current()!=='privacidad')go('diagnostico');
  render();
 }catch(error){if(generation!==account.generation)return;account.initializing=false;account.profileError=readableError(error);render()}
}
window.FluentSession={get user(){return auth.currentUser},async token(){const user=auth.currentUser;if(!user)throw Error('Inicia sesión para continuar.');const result=await user.getIdTokenResult();if(auth.currentUser?.uid!==user.uid)throw Error('Tu sesión cambió. Vuelve a iniciar sesión.');return user.emailVerified&&!result.claims.email_verified?user.getIdToken(true):result.token},get projectId(){return config.firebase.projectId},async erase(password){
 const user=auth.currentUser;if(!user)throw Error('Inicia sesión para eliminar tu cuenta.');
 try{if(usesGoogle(user))await reauthenticateWithPopup(user,googleProvider);else await reauthenticateWithCredential(user,EmailAuthProvider.credential(user.email,password));await user.getIdToken(true)}catch{throw Error('No se pudo confirmar tu identidad. No se eliminó la cuenta.')}
 await apiCall('/api/account/delete',{confirm:'ELIMINAR'});
 try{await deleteDoc(doc(db,'fi_users',user.uid));await deleteUser(user)}catch{throw Error('Los datos educativos se eliminaron, pero falta terminar el borrado del perfil o acceso. Vuelve a confirmar la eliminación para completar el proceso.')}
 }};
document.addEventListener('submit',async event=>{
 if(event.target.id==='account-form'){
  event.preventDefault();if(account.busy)return;account.busy=true;account.error='';account.success='';
  const form=event.target,values=new FormData(form),submit=form.querySelector('[type=submit]');submit.disabled=true;submit.textContent='Un momento…';
  try{
   const email=String(values.get('email')).trim(),password=String(values.get('password')||'');
   if(account.mode==='reset'){await sendPasswordResetEmail(auth,email);account.success='Si este correo tiene una cuenta, recibirás un enlace para recuperar el acceso.'}
   else if(account.mode==='signup'){
    account.signupName=String(values.get('name')||'').trim();if(!account.signupName)throw {code:'invalid-name'};
    const credential=await createUserWithEmailAndPassword(auth,email,password);
    try{await sendEmailVerification(credential.user,{url:location.origin+'/#/diagnostico'})}catch{toast('Tu cuenta está creada. Pulsa Reenviar correo de confirmación para continuar.')}
   }else await signInWithEmailAndPassword(auth,email,password);
  }catch(error){if(account.mode==='reset'&&error.code==='auth/user-not-found')account.success='Si este correo tiene una cuenta, recibirás un enlace para recuperar el acceso.';else account.error=readableError(error)}finally{account.busy=false;if(!auth.currentUser)render()}
 }
 if(event.target.id==='onboarding-form'){
  event.preventDefault();const user=auth.currentUser;if(!verifiedUser(user)||account.busy)return;
  const form=event.target,button=form.querySelector('[type=submit]'),error=form.querySelector('#onboarding-error');account.busy=true;button.disabled=true;error.textContent='';
  try{
   const data=onboardingData(new FormData(form));await setDoc(doc(db,'fi_users',user.uid),{...data,updatedAt:serverTimestamp()},{merge:true});
   if(auth.currentUser?.uid!==user.uid)return;
   account.profile={...account.profile,...data};Object.assign(state,{name:data.name,role:data.role,profession:data.profession,targetRoles:data.targetRoles});
   account.initializing=true;delete document.querySelector('#main').dataset.accountGate;render();
   window.dispatchEvent(new Event('fluent-auth-ready'));await prepareInitialScreen();
   if(auth.currentUser?.uid!==user.uid)return;
   account.initializing=false;go('diagnostico');render();
  }catch(e){error.textContent=e.code?readableError(e):e.message}finally{account.busy=false;button.disabled=false}
 }
 if(event.target.id==='profile-form'){
  event.preventDefault();const user=auth.currentUser;if(!user||account.busy)return;
  const form=event.target,values=new FormData(form),data=Object.fromEntries(profileKeys.map(k=>[k,String(values.get(k)||'').trim()]));
  const submit=form.querySelector('[type=submit]'),status=form.querySelector('#profile-status');account.busy=true;submit.disabled=true;status.textContent='Guardando…';
  try{await setDoc(doc(db,'fi_users',user.uid),{...data,updatedAt:serverTimestamp()},{merge:true});if(auth.currentUser?.uid!==user.uid)return;Object.assign(state,data);account.profile={...account.profile,...data};status.textContent='Tu objetivo se guardó en tu cuenta.';toast('Objetivo guardado.')}catch(error){status.textContent=readableError(error)}finally{account.busy=false;submit.disabled=false}
 }
});
document.addEventListener('click',async event=>{
 const toggle=event.target.closest('[data-password-toggle]');
 if(toggle){
  const input=document.getElementById(toggle.dataset.passwordToggle);if(!input)return;
  const reveal=input.type==='password',start=input.selectionStart,end=input.selectionEnd;
  input.type=reveal?'text':'password';toggle.setAttribute('aria-label',reveal?'Ocultar contraseña':'Mostrar contraseña');toggle.title=reveal?'Ocultar contraseña':'Mostrar contraseña';toggle.innerHTML=icon(reveal?'eye-off':'eye');
  if(event.detail>0){input.focus({preventScroll:true});if(start!==null)input.setSelectionRange(start,end)}
  return;
 }
 const target=event.target.closest('[data-account]');if(!target)return;const action=target.dataset.account;
 if(['login','signup','reset'].includes(action)){if(account.busy)return;account.mode=action;account.error='';account.success='';render();return}
 target.disabled=true;
 try{
  if(action==='google'){
   if(account.busy)return;account.busy=true;account.error='';account.signupName='';
   try{await signInWithPopup(auth,googleProvider)}catch(error){account.error=readableError(error)}finally{account.busy=false;if(!auth.currentUser)render()}
  }
  if(action==='logout'){stopVoiceSession();await signOut(auth);if(current()==='privacidad')go('inicio')}
  if(action==='retry'&&auth.currentUser)await loadProfile(auth.currentUser);
  if(action==='refresh'&&auth.currentUser){await refreshVerification();if(!verifiedUser(auth.currentUser))toast('La confirmación todavía no aparece. Revisa el enlace de tu correo.')}
  if(action==='verify'&&auth.currentUser){await sendEmailVerification(auth.currentUser,{url:location.origin+'/#/diagnostico'});toast('Revisa tu correo para confirmar tu cuenta.')}
 }catch(error){toast(readableError(error))}finally{target.disabled=false}
});
// Stop prototype-only purchase controls before their original handlers run.
document.addEventListener('click',event=>{
 const action=event.target.closest('[data-action]')?.dataset.action;
 if(['choose-plan','activate-plan','cancel-plan','deactivate-plan','save-profile'].includes(action)){event.stopImmediatePropagation();event.preventDefault();toast('Esta acción no está disponible en el piloto.')}
},true);
async function refreshVerification(){
 if(!auth.currentUser||verifiedUser(auth.currentUser)||account.checkingVerification)return;
 account.checkingVerification=true;const user=auth.currentUser;
 try{await reload(user);if(auth.currentUser?.uid!==user.uid)return;await user.getIdToken(true);account.user=user;if(verifiedUser(user))await loadProfile(user)}finally{account.checkingVerification=false}
}
window.addEventListener('focus',()=>{refreshVerification().catch(()=>{})});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshVerification().catch(()=>{})});
setPersistence(auth,browserLocalPersistence).then(()=>{
 onIdTokenChanged(auth,user=>{
  if(account.ready&&user?.uid&&user.uid===account.user?.uid){account.user=user;return}
  account.generation++;clearLearner();account.user=user;account.profile=null;account.profileError='';account.ready=true;account.error='';account.success='';
  if(user)loadProfile(user);else{account.mode='login';account.signupName='';render();window.dispatchEvent(new Event('fluent-auth-cleared'))}
 });
}).catch(()=>{account.ready=true;account.error='Tu navegador no permite guardar la sesión. Habilita el almacenamiento del sitio y recarga.';render()});

document.addEventListener('input',event=>{if(event.target.name==='profession'&&event.target.form?.id==='onboarding-form')updateRoleSuggestions(event.target.form)});
