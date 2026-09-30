// Original synthesized interface tones. Only unlock on a user action.
export function createCues(){
 let ctx,muted=false,volume=1;
 function unlock(){try{ctx??=new (globalThis.AudioContext||globalThis.webkitAudioContext)();ctx.resume().catch(()=>{})}catch{/* Audio is optional. */}}
 return {unlock,get muted(){return muted},set muted(v){muted=!!v},get volume(){return volume},set volume(v){volume=Math.max(0,Math.min(1,v))},play(kind='discover'){
  if(muted||!volume||!ctx)return;
  try{const now=ctx.currentTime;for(const [i,f]of (kind==='break'?[160,240]:kind==='save'?[440,660,880]:[600,900]).entries()){
   const o=ctx.createOscillator(),v=ctx.createGain();o.type='sine';o.frequency.value=f;v.gain.setValueAtTime(.035*volume,now+i*.07);v.gain.exponentialRampToValueAtTime(.001*volume,now+i*.07+.14);o.connect(v).connect(ctx.destination);o.start(now+i*.07);o.stop(now+i*.07+.15);
  }}catch{/* Audio is optional. */}
 }};
}
