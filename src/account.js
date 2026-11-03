import {initializeApp} from 'firebase/app';
import {getAuth,setPersistence,browserSessionPersistence,onIdTokenChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,sendPasswordResetEmail,sendEmailVerification,reload,connectAuthEmulator,EmailAuthProvider,reauthenticateWithCredential,deleteUser} from 'firebase/auth';
import {getFirestore,doc,getDoc,setDoc,serverTimestamp,runTransaction,connectFirestoreEmulator,deleteDoc} from 'firebase/firestore';

const config=window.FLUENT_CONFIG;
const app=initializeApp(config.firebase),auth=getAuth(app),db=getFirestore(app);
if(config.emulator&&['localhost','127.0.0.1'].includes(location.hostname)){
 connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});connectFirestoreEmulator(db,'127.0.0.1',8080);
}
const account={ready:false,user:null,profile:null,mode:'login',busy:false,error:'',success:'',profileError:'',signupName:'',generation:0};
const defaults={name:'',role:'',goal:'Conseguir un trabajo internacional',minutes:'20 minutos',experience:'',job:'',lessonDone:false,diagnosed:false,plan:'free'};
const profileKeys=['name','role','goal','minutes','experience','job'];
function clearLearner(){
 const main=document.querySelector('#main');main._viewKey=null;main._viewHTML=null;main._shellKey=null;
 if(typeof resetLearning==='function')resetLearning();
 if(typeof resetSchool==='function')resetSchool();
 stopVoiceSession();voice.run++;voice.session=null;voice.pending=null;voice.busy=false;voice.owner=null;voice.transcript=[];voice.index=0;voice.currentPrompt='';sessionHistory.items=[];sessionHistory.loaded=false;sessionHistory.error='';
 for(const key of Object.keys(state))delete state[key];Object.assign(state,defaults);
 runtime.plan=null;runtime.previous=null;runtime.planSource=null;runtime.config=null;
 diagStep=0;diagAnswer=null;lessonStep=0;lessonChoice=null;lessonChecked=false;interviewIndex=0;interviewAnswers=[];
 document.querySelector('#modal')?.close();
}
function readableError(error){
 const messages={'auth/wrong-password':'El correo o la contraseña no son correctos.','auth/user-not-found':'El correo o la contraseña no son correctos.','auth/invalid-credential':'El correo o la contraseña no son correctos.','auth/email-already-in-use':'No pudimos crear la cuenta. Prueba iniciar sesión o recuperar tu contraseña.','auth/invalid-email':'Escribe un correo válido.','auth/weak-password':'Usa una contraseña de al menos 10 caracteres.','auth/too-many-requests':'Hay demasiados intentos. Espera unos minutos y vuelve a probar.','auth/network-request-failed':'No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.','auth/user-disabled':'Esta cuenta no está disponible.','auth/operation-not-allowed':'El acceso por correo todavía no está habilitado.','permission-denied':'No se pudo acceder al perfil. Revisa las reglas de acceso del proyecto.','unavailable':'No se pudo conectar con tus datos. Inténtalo de nuevo.'};
 return messages[error.code]||'No se pudo completar la operación. Inténtalo de nuevo.';
}
function authView(){
 const reset=account.mode==='reset',signup=account.mode==='signup';
 return `<div class="auth-layout"><section class="auth-story"><a class="brand" href="#/inicio"><span class="brand-mark">${icon('chat')}</span><span>fluent<span style="color:var(--purple)">interview</span><small>YOUR NEXT CHAPTER</small></span></a><h1>Tu próxima oportunidad<br>empieza hablando.</h1><p>Un espacio para preparar tu inglés, contar tu experiencia y llegar con más confianza a tu próxima entrevista.</p><div class="row wrap"><span class="tag">Tu objetivo</span><span class="tag">Tu ritmo</span><span class="tag">Tu próximo paso</span></div></section><section class="card auth-card">
 ${reset?'':`<div class="auth-switch"><button type="button" data-account="login" class="${signup?'':'active'}">Iniciar sesión</button><button type="button" data-account="signup" class="${signup?'active':''}">Crear cuenta</button></div>`}
 <div class="eyebrow">${reset?'VOLVAMOS A TU CAMINO':signup?'TU PRIMER PASO':'BIENVENIDO DE NUEVO'}</div><h2>${reset?'Recupera tu acceso':signup?'Haz espacio para tu futuro':'Tu espacio te espera'}</h2>
 <p class="muted">${reset?'Te enviaremos un enlace para elegir una nueva contraseña.':signup?'Crea tu cuenta y guarda tu objetivo profesional.':'Entra para continuar con tu preparación.'}</p>
 <form id="account-form">${signup?'<label class="form-field"><span>Tu nombre</span><input name="name" maxlength="60" autocomplete="given-name" required></label>':''}
 <label class="form-field"><span>Correo electrónico</span><input name="email" type="email" autocomplete="email" maxlength="254" required></label>
 ${reset?'':`<label class="form-field"><span>Contraseña</span><input name="password" type="password" autocomplete="${signup?'new-password':'current-password'}" ${signup?'minlength="10"':''} maxlength="128" required></label>${signup?'<p class="mini-info">Al menos 10 caracteres. No uses una contraseña compartida con otros servicios.</p>':''}`}
 <div role="alert" id="account-error">${escapeHTML(account.error)}</div>${account.success?`<p class="auth-success" role="status">${escapeHTML(account.success)}</p>`:''}
 <button class="btn" type="submit" ${account.busy?'disabled':''}>${account.busy?'Un momento…':reset?'Enviar enlace':signup?'Crear mi cuenta':'Entrar a mi espacio'} ${icon('arrow')}</button></form>
 <button type="button" class="text-btn" data-account="${reset?'login':'reset'}">${reset?'← Volver al inicio de sesión':'Olvidé mi contraseña'}</button><p class="mini-info" style="margin-top:24px">Piloto de Fluent Interview. Tu perfil se guarda en tu cuenta. Las actividades educativas se incorporan por etapas; crear una cuenta no genera cobros. <a href="#/privacidad">Privacidad y soporte</a>.</p></section></div>`;
}
const applicationRender=render;
render=function(){
 if(!account.ready)return;
 document.body.classList.remove('booting');document.body.classList.toggle('auth-page',!account.user);
 if(!account.user){document.querySelector('#main').innerHTML=current()==='privacidad'?privacyView():authView();document.title='Tu cuenta · Fluent Interview';return}
 if(!account.profile||account.initializing){
  document.querySelector('#sidebar').innerHTML='';document.querySelector('#topbar').innerHTML='';
  const main=document.querySelector('#main'),html=`<section class="card account-loading"><h1>${account.profileError?'No pudimos cargar tu perfil':'Preparando tu espacio…'}</h1><p>${escapeHTML(account.profileError)}</p>${account.profileError?'<button class="btn" data-account="retry">Volver a intentar</button>':''}<button class="text-btn" data-account="logout">Cerrar sesión</button></section>`;if(main.innerHTML!==html)main.innerHTML=html;main._viewKey=null;main._shellKey=null;return;
 }
 applicationRender();
 const badge=document.querySelector('.demo-label');if(badge)badge.textContent='PILOTO · CUENTA CONECTADA';
 document.querySelector('#sidebar .count')?.remove();
 if(!document.querySelector('.top-actions [data-account="logout"]')){const logout=document.createElement('button');logout.className='text-btn';logout.dataset.account='logout';logout.textContent='Cerrar sesión';document.querySelector('.top-actions').append(logout)}
 if(account.user.emailVerified)document.querySelector('[data-email-notice]')?.remove();
 if(!account.user.emailVerified&&!document.querySelector('[data-email-notice]')){const notice=document.createElement('div');notice.className='account-notice';notice.dataset.emailNotice='true';notice.innerHTML='<span>Confirma tu correo para proteger el acceso a tu cuenta.</span><button class="text-btn" data-account="verify">Enviar verificación</button><button class="text-btn" data-account="refresh">Ya confirmé mi correo</button>';document.querySelector('#main').prepend(notice)}
 if(!['inicio','perfil','planes','progreso','pruebas','aula','entrevista','diagnostico','nivel','ruta','ejercicios','entrevistas','resultado','leccion-completa','administracion','privacidad'].includes(current())){const notice=document.createElement('div');notice.className='account-notice';notice.textContent='Actividad en preparación. Los ejemplos y resultados de esta pantalla todavía no representan una evaluación de tu nivel.';document.querySelector('#main').prepend(notice)}
};
views.inicio=studyHome;
views.perfil=()=>`${heading('UNA META CON NOMBRE PROPIO','¿Hacia dónde quieres ir?','Conecta tu preparación con lo que quieres conseguir.')}<div class="grid interview-layout"><section class="card form-card"><h2>Tu objetivo profesional</h2><form id="profile-form"><label class="form-field"><span>Tu nombre</span><input id="profile-name" name="name" maxlength="60" required value="${escapeHTML(state.name)}"></label><label class="form-field"><span>Puesto deseado</span><input id="profile-role" name="role" maxlength="100" value="${escapeHTML(state.role)}" placeholder="Por ejemplo, Software Developer"></label><label class="form-field"><span>Tu objetivo</span><input name="goal" maxlength="200" required value="${escapeHTML(state.goal)}"></label><label class="form-field"><span>Tiempo al día</span><select name="minutes">${['10 minutos','20 minutos','30 minutos'].map(x=>`<option ${state.minutes===x?'selected':''}>${x}</option>`).join('')}</select></label><label class="form-field"><span>Sobre tu experiencia</span><textarea name="experience" maxlength="3000" placeholder="Cuéntanos tus habilidades y proyectos…">${escapeHTML(state.experience)}</textarea></label><label class="form-field"><span>Vacante que te interesa</span><textarea name="job" maxlength="6000" placeholder="Pega aquí la descripción de una vacante…">${escapeHTML(state.job)}</textarea></label><p id="profile-status" role="status" class="mini-info">Solo tú puedes acceder a este perfil desde la aplicación.</p><button class="btn" type="submit">Guardar mi objetivo ${icon('check')}</button></form></section><aside class="card"><h2>Tu cuenta</h2><p class="account-email">${escapeHTML(account.user.email)}</p><p class="mini-info">${account.user.emailVerified?'Correo verificado':'Correo pendiente de verificación'}</p><button class="text-btn" data-account="logout">Cerrar sesión</button></aside></div>${openAIUsageView()}`;
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
   const data={name:account.signupName||user.displayName||'Miembro',role:'',goal:defaults.goal,minutes:defaults.minutes,experience:'',job:'',schemaVersion:1,createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
   transaction.set(ref,data);return data;
  });
  if(generation!==account.generation||auth.currentUser?.uid!==user.uid)return;
  account.profile=profile;Object.assign(state,Object.fromEntries(profileKeys.map(k=>[k,profile[k]??defaults[k]])));
  window.dispatchEvent(new Event('fluent-auth-ready'));await prepareInitialScreen();
  if(generation!==account.generation||auth.currentUser?.uid!==user.uid)return;
  account.initializing=false;render();
 }catch(error){if(generation!==account.generation)return;account.initializing=false;account.profileError=readableError(error);render()}
}
window.FluentSession={get user(){return auth.currentUser},async token(){const user=auth.currentUser;if(!user)throw Error('Inicia sesión para continuar.');const result=await user.getIdTokenResult();if(auth.currentUser?.uid!==user.uid)throw Error('Tu sesión cambió. Vuelve a iniciar sesión.');return user.emailVerified&&!result.claims.email_verified?user.getIdToken(true):result.token},get projectId(){return config.firebase.projectId},async erase(password){
 const user=auth.currentUser;if(!user)throw Error('Inicia sesión para eliminar tu cuenta.');
 try{await reauthenticateWithCredential(user,EmailAuthProvider.credential(user.email,password));await user.getIdToken(true)}catch{throw Error('No se pudo confirmar tu contraseña. No se eliminó la cuenta.')}
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
    await createUserWithEmailAndPassword(auth,email,password);
   }else await signInWithEmailAndPassword(auth,email,password);
  }catch(error){if(account.mode==='reset'&&error.code==='auth/user-not-found')account.success='Si este correo tiene una cuenta, recibirás un enlace para recuperar el acceso.';else account.error=readableError(error)}finally{account.busy=false;if(!auth.currentUser)render()}
 }
 if(event.target.id==='profile-form'){
  event.preventDefault();const user=auth.currentUser;if(!user||account.busy)return;
  const form=event.target,values=new FormData(form),data=Object.fromEntries(profileKeys.map(k=>[k,String(values.get(k)||'').trim()]));
  const submit=form.querySelector('[type=submit]'),status=form.querySelector('#profile-status');account.busy=true;submit.disabled=true;status.textContent='Guardando…';
  try{await setDoc(doc(db,'fi_users',user.uid),{...data,updatedAt:serverTimestamp()},{merge:true});if(auth.currentUser?.uid!==user.uid)return;Object.assign(state,data);account.profile={...account.profile,...data};status.textContent='Tu objetivo se guardó en tu cuenta.';toast('Objetivo guardado.')}catch(error){status.textContent=readableError(error)}finally{account.busy=false;submit.disabled=false}
 }
});
document.addEventListener('click',async event=>{
 const target=event.target.closest('[data-account]');if(!target)return;const action=target.dataset.account;
 if(['login','signup','reset'].includes(action)){if(account.busy)return;account.mode=action;account.error='';account.success='';render();return}
 target.disabled=true;
 try{
  if(action==='logout'){stopVoiceSession();await signOut(auth);if(current()==='privacidad')go('inicio')}
  if(action==='retry'&&auth.currentUser)await loadProfile(auth.currentUser);
  if(action==='refresh'&&auth.currentUser){await reload(auth.currentUser);await auth.currentUser.getIdToken(true);account.user=auth.currentUser;render();toast(account.user.emailVerified?'Correo confirmado. Ya puedes practicar.':'La confirmación todavía no aparece. Revisa el enlace de tu correo.')}
  if(action==='verify'&&auth.currentUser){await sendEmailVerification(auth.currentUser);toast('Revisa tu correo para confirmar tu cuenta.')}
 }catch(error){toast(readableError(error))}finally{target.disabled=false}
});
// Stop prototype-only purchase controls before their original handlers run.
document.addEventListener('click',event=>{
 const action=event.target.closest('[data-action]')?.dataset.action;
 if(['choose-plan','activate-plan','cancel-plan','deactivate-plan','save-profile'].includes(action)){event.stopImmediatePropagation();event.preventDefault();toast('Esta acción no está disponible en el piloto.')}
},true);
setPersistence(auth,browserSessionPersistence).then(()=>{
 onIdTokenChanged(auth,user=>{
  if(account.ready&&user?.uid&&user.uid===account.user?.uid){account.user=user;return}
  account.generation++;clearLearner();account.user=user;account.profile=null;account.profileError='';account.ready=true;account.error='';account.success='';
  if(user)loadProfile(user);else{account.mode='login';account.signupName='';render();window.dispatchEvent(new Event('fluent-auth-cleared'))}
 });
}).catch(()=>{account.ready=true;account.error='Tu navegador no permite guardar la sesión. Habilita el almacenamiento del sitio y recarga.';render()});
