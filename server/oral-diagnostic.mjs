// The model interprets the answer; the server controls progression and stopping.
export const DIAGNOSTIC_STAGES=[
 'Welcome them to a first-round job interview for their target role. Ask only the candidate name as a natural greeting. Do not infer a level from the name.',
 'As a recruiter, ask one simple question about their current work, studies or interest in the target job. Seek a short professional introduction; use easy English.',
 'Ask a behavioral interview question about a real task, customer problem or team challenge relevant to the target role: their own action and what happened. Accept study or everyday examples for inexperienced candidates.',
 'Follow up on their example as a recruiter: ask why they chose that action or how they would handle a similar challenge in the target role. Ask one question, grounded in their answer.',
 'Ask a realistic role-specific interview question grounded in their experience: a job scenario, technical decision or trade-off. Ask for a practical explanation, not vocabulary definitions, trivia or an English exam.'
];
export const DIAGNOSTIC_TOOL={type:'function',name:'diagnostic_step',description:'Privately assess the latest candidate answer against the actual question. Never treat unclear audio or a request to repeat as poor English.',parameters:{type:'object',properties:{outcome:{type:'string',enum:['clear','partial','unable','unclear']},reason:{type:'string',description:'Brief Spanish explanation grounded in this answer. No level or invented evidence.'}},required:['outcome','reason'],additionalProperties:false}};
export function newOralDiagnostic(){return {stage:0,steps:[],struggles:0,clarifications:0,finished:false}}
export function advanceDiagnostic(state,itemId,input){
 if(state.finished||state.steps.some(s=>s.itemId===itemId))return state;
 if(!itemId||!['clear','partial','unable','unclear'].includes(input?.outcome)||typeof input.reason!=='string'||!input.reason.trim()||input.reason.length>500)throw Error('Invalid diagnostic decision');
 const next=structuredClone(state),{outcome,reason}=input;
 next.steps.push({itemId,stage:state.stage,outcome,reason});
 if(outcome==='unclear')next.clarifications++;else{
  next.clarifications=0;
  if(state.stage===0)next.stage=1;
  else if(outcome==='clear'){next.struggles=0;next.stage=Math.min(4,state.stage+1)}
  else{next.struggles++;next.stage=Math.max(1,state.stage-1)}
 }
 const substantive=next.steps.filter(s=>s.stage>0&&s.outcome!=='unclear').length;
 next.finished=next.steps.length>=12||next.clarifications>=3||(substantive>=3&&next.struggles>=2)||(state.stage===4&&outcome==='clear'&&substantive>=5);
 next.endReason=next.finished?(next.clarifications>=3?'audio_unclear':next.steps.length>=12?'sample_limit':next.struggles>=2?'practice_boundary':'evidence_complete'):null;
 return next;
}
export function diagnosticQuestion(state){
 const last=state.steps.at(-1);
 return DIAGNOSTIC_STAGES[state.stage]+(last?.outcome==='unclear'?' Ask them to repeat or clarify the last answer; do not raise the difficulty.':last&&last.outcome!=='clear'?' Rephrase simply with a different concrete situation. Do not supply the answer.':' Use a new question; do not repeat one already answered.');
}
export function oralSamples(session){
 const buckets={introduction:[],challenge:[],opinion:[]};
 for(const m of session.messages){if(m.role!=='user'||!m.content.trim())continue;const step=session.diagnostic?.steps.find(s=>(s.itemIds||[s.itemId]).includes(m.id));if(step?.outcome==='unclear')continue;
  const stage=step?.stage??session.diagnostic?.stage??1;const key=stage<=1?'introduction':stage===2?'challenge':'opinion';buckets[key].push(m.content.trim());
 }
 return Object.entries(buckets).map(([id,texts])=>({id,text:texts.join('\n'),mode:'dictated'}));
}
