// Authentication listeners and the initial screen share the same in-flight reads.
function sharedLoad(loader){
 let task=null,owner=null;
 return function(...args){const uid=window.FluentSession?.user?.uid;if(task&&uid===owner)return task;owner=uid;
  const currentTask=Promise.resolve().then(()=>loader(...args));task=currentTask;
  currentTask.finally(()=>{if(task===currentTask)task=null}).catch(()=>{});return currentTask;
 };
}
loadRuntime=sharedLoad(loadRuntime);loadLearning=sharedLoad(loadLearning);
loadSchool=sharedLoad(loadSchool);loadCommerce=sharedLoad(loadCommerce);loadDashboard=sharedLoad(loadDashboard);
async function prepareInitialScreen(){
 await Promise.allSettled([loadRuntime(),loadLearning(),loadSchool(),loadCommerce(),...(current()==='inicio'?[loadDashboard()]:[])]);
 if(['inicio','ruta','progreso'].includes(current()))await loadPath(learning.current?.id||null);
}
