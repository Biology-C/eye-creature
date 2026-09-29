import {drawSweptSlash} from './slash-vfx.mjs';
export function createMagic(){return {shots:[],effects:[],ready:0}}
export function castLight(s,p,time,charged=false){
 if(time<s.ready)return false;
 s.ready=time+.5;const hitTargets=new Set();for(const angle of (!charged&&p.abilities?.spread?[-.24,0,.24]:[0]))s.shots.push({x:p.x,y:p.y,face:p.face,damage:charged?1.5:1,radius:charged?12:4,charged,hitTargets,dx:p.face*Math.cos(angle),dy:Math.sin(angle),travel:0});
 s.effects.push({x:p.x+p.face*12,y:p.y,kind:'cast',until:time+.18});return true;
}
export function updateMagic(s,dt,time,{solid,targets,hit}){
 s.effects=s.effects.filter(e=>e.until>time);
 s.shots=s.shots.filter(b=>{
  const distance=Math.min(620*dt,320-b.travel),steps=Math.max(1,Math.ceil(distance/3));
  for(let i=0;i<steps;i++){
   b.x+=(b.dx??b.face)*distance/steps;b.y+=(b.dy||0)*distance/steps;b.travel+=distance/steps;
   const wall=[-1,0,1].some(dy=>[-1,0,1].some(dx=>solid(b.x+dx*(b.radius||4),b.y+dy*(b.radius||4))));
   const target=wall?null:targets.find(t=>t.hp>0&&Math.abs(t.x-b.x)<(t.radiusX||18)+(b.radius||4)&&Math.abs(t.y-b.y)<(t.radiusY||16)+(b.radius||4));
   if(wall||target){if(target&&!b.hitTargets?.has(target)){b.hitTargets?.add(target);hit(target,b.damage||1);}s.effects.push({x:b.x,y:b.y,kind:'hit',until:time+.24});return false}
  }
  return b.travel<320;
 });
}
// Chunky screen-space pixels keep the effects consistent with the character artwork.
export function drawEffects(g,s,time,reduced){
 const box=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,w,h)};
 for(const b of s.shots){
  if(b.charged){g.save();g.fillStyle='#468dc7';g.beginPath();g.arc(b.x,b.y,16,0,Math.PI*2);g.fill();g.fillStyle='#a8efff';g.beginPath();g.arc(b.x,b.y,12,0,Math.PI*2);g.fill();g.strokeStyle='#efffff';g.lineWidth=2;g.beginPath();g.ellipse(b.x,b.y,20,13,reduced?0:time*8,0,Math.PI*2);g.stroke();g.restore()}
  const tail=reduced?12:b.charged?48:30;
  box(b.x-(b.face>0?tail:0),b.y-4,tail,8,'#518fc7');
  box(b.x-(b.face>0?tail-6:0),b.y-2,tail-6,4,'#b8efff');
  box(b.x-6,b.y-6,12,12,'#8edcff');box(b.x-4,b.y-4,8,8,'#ffffff');
 }
 for(const e of s.effects){const progress=Math.max(0,1-(e.until-time)/.24),r=reduced?8:6+progress*17;
  for(let i=0;i<8;i++){const a=i*Math.PI/4;box(e.x+Math.cos(a)*r-2,e.y+Math.sin(a)*r-2,4,4,e.kind==='hurt'?'#ff9393':e.kind==='melee'?'#ffe6aa':'#b5edff')}
  if(e.kind==='melee'||e.kind==='hurt'){g.fillStyle=e.kind==='hurt'?'#ffb2b2':'#fff1ba';g.font='bold 14px system-ui';g.fillText('−'+(e.damage||1),e.x-8,e.y-22-(reduced?0:progress*12))}
  box(e.x-2,e.y-6,4,12,'#fff9e5');box(e.x-6,e.y-2,12,4,'#fff9e5');
 }
}
export const SLASH_STYLES=['銀青弧光','暗影掃刃','赤金重斬'];
export function drawSlash(g,slash,progress,reduced,style=0){drawSweptSlash(g,slash,progress,reduced,style)}
