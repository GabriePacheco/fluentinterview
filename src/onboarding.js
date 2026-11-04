export const SELF_LEVELS=[['A1','Estoy empezando'],['A2','Me defiendo con frases sencillas'],['B1','Puedo mantener una conversación'],['B2','Me comunico con bastante soltura'],['C1','Uso inglés avanzado'],['C2','Tengo un dominio muy alto'],['unsure','No estoy seguro']];
export function hasCompletedOnboarding(profile){return profile?.onboardingCompleted===true||(profile?.onboardingCompleted===undefined&&!!profile?.role?.trim())}
export function onboardingData(values){
 const name=String(values.get('name')||'').trim();
 if(!name||name.length>60)throw Error('Escribe tu nombre, con un máximo de 60 caracteres.');
 const selfReportedLevel=String(values.get('selfReportedLevel')||''),profession=String(values.get('profession')||'').trim();
 const targetRoles=[...new Set(String(values.get('targetRoles')||'').split(/[,;\n]/).map(s=>s.trim()).filter(Boolean))];
 if(!SELF_LEVELS.some(([key])=>key===selfReportedLevel))throw Error('Selecciona el nivel que crees tener, o «No estoy seguro».');
 if(!profession||profession.length>120)throw Error('Escribe tu profesión u ocupación, con un máximo de 120 caracteres.');
 if(!targetRoles.length||targetRoles.length>5||targetRoles.some(s=>s.length>100))throw Error('Indica entre uno y cinco puestos, separados por comas; máximo 100 caracteres por puesto.');
 return {name,selfReportedLevel,profession,targetRoles,role:targetRoles[0],onboardingCompleted:true};
}
export function onboardingView({profile,error='',busy=false},icon,escape){
 return `<section class="onboarding-shell"><div class="onboarding-welcome"><span class="onboarding-symbol">${icon('brief')}</span><span class="eyebrow">TU PRÓXIMA OPORTUNIDAD · UN SOLO PASO</span><h1>Preparemos tu próxima entrevista.</h1><p>Cuéntanos un poco de ti. Después conversarás con la IA para crear tu ruta.</p></div><form id="onboarding-form" class="card onboarding-card"><fieldset class="onboarding-levels"><legend>${icon('flag')} ¿Qué nivel de inglés crees tener?</legend><div class="onboarding-level-grid">${SELF_LEVELS.map(([key,label])=>`<label class="onboarding-level"><input type="radio" name="selfReportedLevel" value="${key}" ${profile?.selfReportedLevel===key?'checked':''} required><span><b>${key==='unsure'?'No sé todavía':key}</b><small>${label}</small></span></label>`).join('')}</div><p class="mini-info">Es solo tu percepción. El diagnóstico determinará tu nivel de práctica.</p></fieldset><div class="onboarding-fields"><label class="form-field"><span>${icon('user')} ¿Cómo te llamas?</span><input name="name" maxlength="60" autocomplete="given-name" placeholder="Tu nombre" value="${escape(profile?.name||'')}" required></label><label class="form-field"><span>${icon('brief')} Tu profesión u ocupación</span><input name="profession" maxlength="120" autocomplete="organization-title" placeholder="Por ejemplo, ingeniero de sistemas o estudiante" value="${escape(profile?.profession||'')}" required></label><label class="form-field"><span>${icon('target')} ¿Qué puestos te interesan?</span><input name="targetRoles" maxlength="504" placeholder="Software Developer, QA Engineer…" value="${escape(profile?.targetRoles?.join(', ')||profile?.role||'')}" required><small>De uno a cinco, separados por comas. Empieza por tu favorito.</small></label><div id="onboarding-role-suggestions" class="onboarding-suggestions" aria-live="polite"></div></div><p id="onboarding-error" role="alert">${escape(error)}</p><button class="btn onboarding-submit" type="submit" ${busy?'disabled':''}>${busy?'Guardando…':'Continuar al diagnóstico'} ${icon('arrow')}</button><p class="onboarding-next">${icon('mic')} Primero unas preguntas sencillas; avanzaremos según tus respuestas.</p></form><button class="text-btn" data-account="logout">Cerrar sesión</button></section>`;
}

const ROLE_GROUPS=[
 [/software|sistem|inform[aá]tic|program|comput|developer|tecnolog/i,['Software Developer','QA Engineer','Data Analyst','DevOps Engineer']],
 [/market|publicid|comunic|periodis/i,['Marketing Specialist','Content Strategist','Social Media Manager','Communications Specialist']],
 [/admin|negoci|business|comerci|gesti[oó]n/i,['Operations Coordinator','Business Analyst','Project Coordinator','Account Manager']],
 [/contab|contador|finanz|econom|account/i,['Financial Analyst','Accountant','Finance Assistant','Audit Associate']],
 [/enferm|medic|salud|health/i,['Healthcare Coordinator','Clinical Research Assistant','Patient Support Specialist']],
 [/docen|profesor|educa|teacher/i,['Teacher','Training Specialist','Learning Coordinator']],
 [/diseñ|design|arquitect/i,['UX Designer','Product Designer','Design Coordinator']],
 [/venta|servicio|atenci[oó]n|support/i,['Customer Support Specialist','Sales Representative','Customer Success Associate']],
 [/ingenier|engineer/i,['Project Engineer','Quality Engineer','Operations Engineer']],
 [/estudiant|student/i,['Intern','Junior Assistant','Trainee']]
];
export function suggestedRoles(profession){return ROLE_GROUPS.find(([pattern])=>pattern.test(profession))?.[1]||[]}
export function updateRoleSuggestions(form){const box=form.querySelector('#onboarding-role-suggestions');if(!box)return;const roles=suggestedRoles(form.elements.profession.value);box.replaceChildren();if(!roles.length)return;const label=document.createElement('small');label.textContent='Puestos que podrían interesarte · pulsa para añadir';box.append(label);for(const role of roles){const button=document.createElement('button');button.type='button';button.className='tag';button.textContent=role;button.addEventListener('click',()=>{const input=form.elements.targetRoles,selected=input.value.split(/[,;\n]/).map(x=>x.trim()).filter(Boolean);if(!selected.some(x=>x.toLowerCase()===role.toLowerCase())&&selected.length<5)selected.push(role);input.value=selected.join(', ');input.dispatchEvent(new Event('input',{bubbles:true}));});box.append(button)}}
