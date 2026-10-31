(function(root){
 'use strict';
 function pcmBase64(buffer){let text='';const bytes=new Uint8Array(buffer);for(let i=0;i<bytes.length;i++)text+=String.fromCharCode(bytes[i]);return btoa(text)}
 function pcmFloat(base64){const raw=atob(base64),view=new DataView(new ArrayBuffer(raw.length));for(let i=0;i<raw.length;i++)view.setUint8(i,raw.charCodeAt(i));const data=new Float32Array(raw.length/2);for(let i=0;i<data.length;i++)data[i]=view.getInt16(i*2,true)/32768;return data}
 class Playback{
  constructor(context,idle=()=>{}){this.context=context;this.idle=idle;this.items=new Map();this.sources=new Set();this.ignored=new Set();this.next=0;}
  item(id,response){if(!this.items.has(id))this.items.set(id,{id,response,chunks:[],samples:0,done:false});return this.items.get(id)}
  append(e){
   if(this.ignored.has(e.response_id))return;const item=this.item(e.item_id,e.response_id),data=pcmFloat(e.delta),buffer=this.context.createBuffer(1,data.length,24000);buffer.copyToChannel(data,0);
   const source=this.context.createBufferSource();source.buffer=buffer;source.connect(this.context.destination);
   const start=Math.max(this.context.currentTime+0.015,this.next),duration=data.length/24000;
   item.chunks.push({start,duration});item.samples+=data.length;this.next=start+duration;this.sources.add(source);
   source.onended=()=>{this.sources.delete(source);source.disconnect();if(!this.sources.size)this.idle()};source.start(start);
  }
  audibleTime(){
   const stamp=this.context.getOutputTimestamp?.();
   if(stamp?.contextTime>0)return Math.min(this.context.currentTime,stamp.contextTime+Math.max(0,performance.now()-stamp.performanceTime)/1000);
   return Math.max(0,this.context.currentTime-(this.context.outputLatency||this.context.baseLatency||0));
  }
  interrupt(activeResponse){
   const time=this.audibleTime(),cuts=[];
   for(const item of this.items.values()){
    const played=item.chunks.reduce((n,c)=>n+Math.max(0,Math.min(c.duration,time-c.start)),0);
    if(item.response===activeResponse||played+0.001<item.samples/24000){cuts.push({item_id:item.id,content_index:0,audio_end_ms:Math.min(Math.floor(item.samples/24),Math.floor(played*1000))});this.ignored.add(item.response)}
   }
   if(activeResponse)this.ignored.add(activeResponse);
   this.clear();return cuts;
  }
  clear(){for(const source of this.sources){source.onended=null;try{source.stop();source.disconnect()}catch{}}this.sources.clear();this.items.clear();this.next=0;}
 }
 class Transcript{
  constructor(){this.items=new Map();this.order=[];this.cut=new Set();}
  item(id,role,previous){if(!this.items.has(id)){this.items.set(id,{id,role,text:'',final:false});const index=this.order.indexOf(previous);if(previous&&index>=0)this.order.splice(index+1,0,id);else this.order.push(id)}if(previous===null||previous&&this.order.includes(previous)){this.order=this.order.filter(x=>x!==id);this.order.splice(previous===null?0:this.order.indexOf(previous)+1,0,id)}return this.items.get(id)}
  event(e){
   if(e.type==='input_audio_buffer.committed')this.item(e.item_id,'user',e.previous_item_id);
   if(e.type==='conversation.item.added'&&['user','assistant'].includes(e.item?.role))this.item(e.item.id,e.item.role,e.previous_item_id);
   const user=e.type.startsWith('conversation.item.input_audio_transcription.');
   if(user||e.type.startsWith('response.output_audio_transcript.')){
    const item=this.item(e.item_id,user?'user':'assistant');if(this.cut.has(e.item_id))return;
    if(e.type.endsWith('.completed')||e.type.endsWith('.done')){item.text=e.transcript||'';item.final=true}
    else if(e.type.endsWith('.delta')&&!item.final)item.text+=e.delta||'';
   }
   if(e.type==='conversation.item.truncated')this.truncate(e.item_id);
  }
  truncate(id){this.cut.add(id);const item=this.item(id,'assistant');item.text='[Respuesta interrumpida]';item.final=true;}
  values(){const joined=[];for(const item of this.order.map(id=>this.items.get(id)).filter(x=>x.text)){const last=joined.at(-1);if(item.role==='user'&&last?.role==='user'){last.text+=' '+item.text;last.final=last.final&&item.final}else joined.push({...item})}return joined}
 }
 root.FluentRealtimeCore={Playback,Transcript,pcmBase64,pcmFloat};
})(globalThis);
