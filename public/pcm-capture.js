// Mono PCM16 at 24 kHz. Integrate samples across fractional resampling buckets;
// keep phase between render quanta (44.1/48 kHz devices must not drift).
class PCMCapture extends AudioWorkletProcessor{
 constructor(){super();this.ratio=sampleRate/24000;this.weight=0;this.sum=0;this.block=new Int16Array(960);this.position=0;this.enabled=true;this.port.onmessage=e=>{this.enabled=!!e.data.enabled;this.position=0;this.weight=0;this.sum=0}}
 process(inputs){
  const input=inputs[0]?.[0];if(!input||!this.enabled)return true;
  for(let i=0;i<input.length;i++){
   let remaining=1;
   while(remaining>1e-8){const amount=Math.min(remaining,this.ratio-this.weight);this.sum+=input[i]*amount;this.weight+=amount;remaining-=amount;
    if(this.weight>=this.ratio-1e-8){const value=Math.max(-1,Math.min(1,this.sum/this.ratio));this.block[this.position++]=Math.round(value*(value<0?32768:32767));this.weight=0;this.sum=0;
     if(this.position===this.block.length){this.port.postMessage(this.block.buffer,[this.block.buffer]);this.block=new Int16Array(960);this.position=0}
    }
   }
  }return true;
 }
}
registerProcessor('pcm-capture',PCMCapture);
