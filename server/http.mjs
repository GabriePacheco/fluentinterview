export function fail(message,status=400){return Object.assign(Error(message),{status})}
export function json(value,status=200,extra={}){return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}})}
export async function readJSON(request){
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))throw fail('Se requiere JSON.',415);
 if(Number(request.headers.get('content-length'))>16000)throw fail('Solicitud demasiado grande.',413);
 const reader=request.body?.getReader();if(!reader)throw fail('Falta el cuerpo de la solicitud.');
 const parts=[];let length=0;
 while(true){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>16000){await reader.cancel();throw fail('Solicitud demasiado grande.',413)}parts.push(value)}
 const bytes=new Uint8Array(length);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length}
 try{return JSON.parse(new TextDecoder().decode(bytes))}catch{throw fail('JSON no válido.')}
}
