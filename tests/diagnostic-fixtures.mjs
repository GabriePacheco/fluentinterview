import {REVISION,ITEMS,PROMPTS} from '../server/diagnostic-content.mjs';
export const CASES={
 beginner:[
  'My name is Ana. I work shop. I like help people. I want new job and speak English with customers.',
  'Last week customer angry. I no understand problem. I ask friend help. We change product and customer happy. I learn listen more.',
  'I like team because friend help me. Alone is difficult. Team sometimes much noise. I want learn explain my ideas better.'
 ],
 intermediate:[
  'I work as a data analyst for a small company. I create weekly reports and explain the results to my manager. I enjoy finding useful patterns, although I sometimes find it difficult to explain technical details in English.',
  'Last month our sales report was late because several records were missing. I contacted the sales team and compared their files with our database. We corrected the dates and finished the report the next day. Next time I would check the data earlier.',
  'I prefer working with a team because different people notice different problems. For example, a colleague helped me find an error in a report. However, too many meetings can slow us down, so I think we need clear responsibilities.'
 ],
 advanced:[
  'As a research coordinator, I translate ambiguous stakeholder concerns into testable questions. My role involves negotiating priorities across teams whose incentives do not always align. I am particularly interested in opportunities where careful analysis informs decisions without obscuring the uncertainty behind them.',
  'When a promising pilot produced contradictory findings, I resisted the temptation to select the most favourable metric. Instead, I separated measurement error from genuine variation, invited colleagues to challenge my assumptions, and proposed a narrower follow-up. Although this delayed the recommendation, it prevented us from investing in an intervention whose apparent benefit depended on a misleading comparison.',
  'Collaboration is valuable when perspectives are genuinely complementary, but adding participants does not automatically improve a decision. In my experience, individual preparation followed by a structured discussion offers a better balance: it preserves independent judgement while exposing blind spots. The trade-off is the coordination effort required, which may be disproportionate for routine, reversible decisions.'
 ],
 insufficient:['Hello.','I work.','Team.']
};
export function draft(id,kind='intermediate',source='openai'){return {id,expectedRevision:0,source,catalogRevision:REVISION,profile:{name:'Prueba',role:kind==='advanced'?'Research Coordinator':kind==='beginner'?'Customer Support':'Data Analyst',goal:'Preparar entrevistas en inglés',minutes:'20 minutos'},samples:PROMPTS.map((p,i)=>({id:p.id,text:CASES[kind][i],mode:'text'})),answers:Object.fromEntries(ITEMS.map((x,i)=>[x.id,kind==='beginner'?0:kind==='intermediate'&&i===3?1:x.correct])),audio:{played:true,revealed:false}}}
export function validResult(input,level='B1'){return {level,confidence:'low',summary:'La evidencia permite una orientación inicial de expresión en inglés.',strengths:['Comunicas experiencias propias.'],priorities:['Explicar resultados','Conectar razones'],evidence:input.samples.slice(0,2).map(s=>({sampleId:s.id,quote:s.text.slice(0,35),observation:'Aporta una experiencia para practicar.'})),modules:Array.from({length:4},(_,i)=>({title:`Objetivo ${i+1}`,objective:'Explicar una idea y un resultado concreto.',reason:'La muestra permite practicar esta habilidad.',evidenceQuote:input.samples[i%3].text.slice(0,35),conversation:'Tell me about an experience.',exercise:'Añadir un resultado a una respuesta.',masteryCheck:'Explicar una experiencia nueva con una razón.'})),changeReason:'Primera ruta basada en las muestras.'}}
export function rawResult(input,level='B1'){const result=validResult(input,level);return {...result,priorities:['cohesion','evidence'],modules:['cohesion','evidence','reasoning','concision'].map((focus,i)=>({focus,orientation:'transfer',reason:result.modules[i].reason,evidenceQuote:result.modules[i].evidenceQuote,conversation:result.modules[i].conversation}))}}
