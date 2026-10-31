// Local development bridge. Real AI is enabled only by the server configuration.
const runtime={config:null,error:'',plan:null,planSource:null,busy:false};
const profileForAI=()=>({name:state.name,role:state.role,goal:state.goal,minutes:state.minutes,experience:(state.experience||'').slice(0,1200),job:(state.job||'').slice(0,1200)});
async function apiCall(path,input,method='POST'){
 const token=await window.FluentSession.token();
 let response;
 try{response=await fetch((window.FLUENT_CONFIG.apiBase||'')+path,{method,headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},body:input===undefined?undefined:JSON.stringify(input),signal:AbortSignal.timeout((path.endsWith('/evaluate')||path.endsWith('/from-session')||path.startsWith('/api/feedback/'))?110000:30000)})}
 catch(error){throw new Error(error.name==='TimeoutError'?'La respuesta tardó demasiado. Conservamos tu trabajo en esta pantalla; consulta el estado antes de repetir.':'Se perdió la conexión con el servidor. Conservamos tu trabajo en esta pantalla; revisa tu conexión antes de continuar.')}
 let data;try{data=await response.json()}catch{throw new Error('No pudimos leer la respuesta del servidor. Consulta el estado antes de repetir la operación.')}
 if(!response.ok)throw Object.assign(new Error(response.status===401?'Tu sesión no es válida. Copia cualquier respuesta sin guardar y vuelve a iniciar sesión.':data.error||'No se pudo completar la solicitud.'),{status:response.status});if(data.budget&&runtime.config)runtime.config.budget=data.budget;return data;
}
const prototypeShell=shell;
shell=function(route){prototypeShell(route);if(runtime.config){const badge=$('.demo-label');badge.textContent=runtime.config.mode==='mock'?'CONVERSACIÓN DE EJEMPLO':'CUENTA CONECTADA'}};
async function loadRuntime(){
 const uid=window.FluentSession?.user?.uid;if(!uid)return;
 for(let attempt=0;attempt<2;attempt++){
  try{const token=await window.FluentSession.token();const response=await fetch((window.FLUENT_CONFIG.apiBase||'')+'/api/session',{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('No se pudo recuperar la configuración.');const config=await response.json();if(window.FluentSession.user?.uid!==uid)return;runtime.config=config;runtime.error='';window.dispatchEvent(new Event('fluent-runtime-ready'));if(current()==='pruebas')render();return}
  catch{if(window.FluentSession.user?.uid!==uid)return;if(attempt===1){runtime.error='No pudimos conectar con el servidor de práctica. Actualiza la página o vuelve a cargar el diagnóstico.';window.dispatchEvent(new Event('fluent-runtime-ready'))}}
 }
}
window.addEventListener('fluent-auth-ready',loadRuntime);
