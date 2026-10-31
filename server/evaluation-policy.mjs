// A second provider call is allowed only after a definite, invalid model output.
// Network failures and ambiguous timeouts are recovered by reads, never replayed.
export const EVALUATION_PENDING_MS=150000;
export const REPAIRABLE_EVALUATION_CODES=new Set(['unmeasured_skill','unsupported_goal','unsupported_priority','invalid_level','invalid_quote','invalid_correction','invalid_rating','inconsistent_result','incomplete_route','oversized_result','duplicate_modules','incomplete_response','invalid_response','invalid_format']);
export function retryEvaluation(record,options={}){
 return record?.status==='failed'&&Number.isInteger(options.retryAttempt)&&options.retryAttempt===(record.attempt||1);
}
// Match typography/spacing only. Never change words, case, grammar or meaning.
export function sourceQuote(source,quote){
 if(typeof source!=='string'||typeof quote!=='string'||!quote.trim())return null;
 if(source.includes(quote))return quote;
 const normalize=c=>/[\u2018\u2019]/.test(c)?"'":/[\u201c\u201d]/.test(c)?'"':/\s/.test(c)?' ':c;
 let text='',positions=[];
 for(let i=0;i<source.length;i++){const c=normalize(source[i]);if(c===' '&&text.endsWith(' '))continue;text+=c;positions.push(i)}
 const wanted=Array.from(quote.trim(),normalize).join('').replace(/\s+/g,' '),at=text.indexOf(wanted);
 return at<0?null:source.slice(positions[at],positions[at+wanted.length-1]+1);
}
