(function(root){
 'use strict';
 const {Playback,Transcript,pcmBase64}=FluentRealtimeCore;
 class Conversation{
  constructor(callback){this.callback=callback;this.log=new Transcript();this.closed=false;this.paused=false;this.ready=false;this.activeResponse=null;this.completedAudio=new Set();this.metrics=[];this.done=new Promise(resolve=>this.resolveDone=resolve)}
  emit(type,data={}){this.callback({type,...data})}
  async prepare(){
   if(!navigator.mediaDevices?.getUserMedia||!root.AudioWorkletNode)throw Error('Este navegador no permite la conversación de voz. Usa Chrome, Edge o Safari actualizado.');
   this.context=new (root.AudioContext||root.webkitAudioContext)({latencyHint:'interactive'});await this.context.resume();
   const stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
   if(this.closed){stream.getTracks().forEach(t=>t.stop());throw Error('Conversación cancelada.')}
   this.stream=stream;await this.context.audioWorklet.addModule('/pcm-capture.js');if(this.closed)throw Error('Conversación cancelada.');
   this.playback=new Playback(this.context,()=>{this.ackPlayback();if(this.finishing)this.drainPlayback();else if(!this.closed&&!this.paused)this.emit('listening')});
   this.capture=new AudioWorkletNode(this.context,'pcm-capture');this.mic=this.context.createMediaStreamSource(stream);this.mic.connect(this.capture);
   // Worklet output is silence. The input is never sent to the local speaker.
   this.capture.connect(this.context.destination);
   this.capture.port.onmessage=e=>{if(this.ready&&!this.paused&&!this.closed){if(this.socket.bufferedAmount>96000){this.fail('La conexión es demasiado lenta para conversar.');return}this.send({type:'input_audio_buffer.append',audio:pcmBase64(e.data)})}};
   stream.getAudioTracks()[0].onended=()=>{if(!this.closed)this.fail('El micrófono se desconectó.')};
  }
  async connect(base,ticket){
   const url=new URL('/api/realtime/connect',base||location.origin);url.protocol=url.protocol==='https:'?'wss:':'ws:';url.searchParams.set('uid',ticket.uid);url.searchParams.set('ticket',ticket.ticket);
   this.socket=new WebSocket(url);
   const timeout=setTimeout(()=>this.fail('No pudimos abrir la conversación. Revisa tu conexión y el acceso de tu cuenta.'),15000);
   this.socket.onmessage=e=>{try{const event=JSON.parse(e.data);if(event.type==='fluent.ready')clearTimeout(timeout);this.event(event)}catch{this.fail('No pudimos reproducir el audio recibido.')}};
   this.socket.onerror=()=>{clearTimeout(timeout);this.fail('No pudimos conectar con la voz. Revisa tu conexión y el acceso de tu cuenta.')};
   this.socket.onclose=()=>{clearTimeout(timeout);if(!this.closed&&!this.finishing)this.finishAfterPlayback('La conexión terminó. Tu conversación recibida se ha guardado.',false)};
  }
  send(event){if(this.socket?.readyState===1)this.socket.send(JSON.stringify(event))}
  ackPlayback(){clearTimeout(this.playbackAckTimer);if(this.playback?.sources.size||!this.completedAudio.size)return;const latency=(this.context?.outputLatency||this.context?.baseLatency||0)*1000;this.playbackAckTimer=setTimeout(()=>{if(this.closed||this.playback?.sources.size)return;for(const response_id of this.completedAudio)this.send({type:'fluent.playback.done',response_id});this.completedAudio.clear()},Math.ceil(latency)+40)}
  interrupt(){
   const start=performance.now(),response=this.activeResponse,cuts=this.playback?.interrupt(response)||[];
   if(response)this.send({type:'response.cancel',response_id:response});
   for(const cut of cuts){this.log.truncate(cut.item_id);this.send({type:'conversation.item.truncate',...cut})}
   this.metrics.push({eventToStopMs:performance.now()-start,cuts});return cuts;
  }
  event(e){
   if(this.closed)return;
   if(e.type==='fluent.ready'){this.ready=true;this.emit('listening');return}
   if(e.type==='fluent.notice'){this.emit('notice',{message:e.message});return}
   if(e.type==='fluent.closed'){this.finishAfterPlayback(e.message,e.completed===true);window.dispatchEvent(new Event('fluent-conversation-closed'));return}
   if(this.requestedEnd&&['input_audio_buffer.speech_started','input_audio_buffer.speech_stopped'].includes(e.type))return;
   if(e.type==='response.created'){this.activeResponse=e.response.id;if(this.userSpeaking||this.paused)this.interrupt();}
   if(e.type==='response.output_item.added'&&e.item?.role==='assistant')this.playback.item(e.item.id,e.response_id);
   if(e.type==='input_audio_buffer.speech_started'){this.userSpeaking=true;this.interrupt();if(!this.paused&&this.ready)this.emit('listening')}
   if(e.type==='input_audio_buffer.speech_stopped'){this.userSpeaking=false;if(!this.paused&&this.ready)this.emit('thinking')}
   if(e.type==='response.output_audio.delta'&&!this.paused){this.playback.append(e);if(!this.playback.ignored.has(e.response_id))this.emit('speaking')}
   if(e.type==='response.done'){if(this.activeResponse===e.response.id)this.activeResponse=null;this.completedAudio.add(e.response.id);this.ackPlayback()}
   this.log.event(e);this.emit('transcript',{items:this.log.values()});
  }
  pause(){if(this.closed)return;this.interrupt();this.paused=true;this.userSpeaking=false;this.capture?.port.postMessage({enabled:false});this.stream?.getTracks().forEach(t=>t.enabled=false);this.send({type:'fluent.pause'});this.emit('paused')}
  async resume(){if(this.closed)return;await this.context.resume();this.send({type:'fluent.resume'});this.paused=false;this.stream?.getTracks().forEach(t=>t.enabled=true);this.capture?.port.postMessage({enabled:true});this.emit('listening')}
  async end(){if(this.closed)return this.done;if(this.requestedEnd)return this.done;this.requestedEnd=true;this.interrupt();this.userSpeaking=false;this.paused=false;if(this.finishing){this.drainPlayback();return this.done}this.ready=false;this.capture?.port.postMessage({enabled:false});this.stream?.getTracks().forEach(t=>t.enabled=false);this.send({type:'fluent.end'});this.endTimer=setTimeout(()=>this.finish('Revisa el historial para confirmar el guardado.'),45000);return this.done}
  finishAfterPlayback(message,completed){
   if(this.closed||this.finishing)return;this.finishing={message,completed};this.ready=false;
   this.capture?.port.postMessage({enabled:false});this.stream?.getTracks().forEach(t=>t.enabled=false);
   // Socket/generation completion does not mean the queued sound has been heard.
   this.drainPlayback();
  }
  drainPlayback(){
   if(this.closed||!this.finishing)return;clearTimeout(this.drainTimer);
   if(this.playback?.sources.size){this.drainTimer=setTimeout(()=>this.drainPlayback(),100);return}
   const latency=(this.context?.outputLatency||this.context?.baseLatency||0)*1000;
   this.drainTimer=setTimeout(()=>{const {message,completed}=this.finishing;this.finish(message,completed)},Math.ceil(latency)+40);
  }
  fail(message){this.emit('error',{message});this.finishAfterPlayback(message,false)}
  finish(message='',completed=false){if(this.closed)return;this.closed=true;clearTimeout(this.endTimer);clearTimeout(this.drainTimer);this.release();this.emit('closed',{message,completed});this.resolveDone()}
  release(){this.ready=false;clearTimeout(this.playbackAckTimer);this.stream?.getTracks().forEach(t=>t.stop());this.capture?.disconnect();this.mic?.disconnect();this.playback?.clear();this.context?.close().catch(()=>{});try{this.socket?.close(1000,'finished')}catch{}}
  dispose(){if(this.closed)return;this.interrupt();this.send({type:'fluent.abort'});this.finish()}
 }
 root.FluentRealtime=Conversation;
})(window);
