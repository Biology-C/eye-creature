export function createMagic(){return {shots:[],effects:[],ready:0}}
export function castLight(s,p,time){
 if(time<s.ready)return false;
 s.ready=time+.65;const hitTargets=new Set();for(const angle of (p.abilities?.spread?[-.24,0,.24]:[0]))s.shots.push({x:p.x,y:p.y,face:p.face,hitTargets,dx:p.face*Math.cos(angle),dy:Math.sin(angle),travel:0});
 s.effects.push({x:p.x+p.face*12,y:p.y,kind:'cast',until:time+.18});return true;
}
export function updateMagic(s,dt,time,{solid,targets,hit}){
 s.effects=s.effects.filter(e=>e.until>time);
 s.shots=s.shots.filter(b=>{
  const distance=Math.min(620*dt,320-b.travel),steps=Math.max(1,Math.ceil(distance/3));
  for(let i=0;i<steps;i++){
   b.x+=(b.dx??b.face)*distance/steps;b.y+=(b.dy||0)*distance/steps;b.travel+=distance/steps;
   const wall=[-4,0,4].some(dy=>solid(b.x,b.y+dy));
   const target=wall?null:targets.find(t=>t.hp>0&&Math.abs(t.x-b.x)<(t.radiusX||18)+4&&Math.abs(t.y-b.y)<(t.radiusY||16)+4);
   if(wall||target){if(target&&!b.hitTargets?.has(target)){b.hitTargets?.add(target);hit(target);}s.effects.push({x:b.x,y:b.y,kind:'hit',until:time+.24});return false}
  }
  return b.travel<320;
 });
}
// Chunky screen-space pixels keep the effects consistent with the character artwork.
export function drawEffects(g,s,time,reduced){
 const box=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,w,h)};
 for(const b of s.shots){
  const tail=reduced?12:30;
  box(b.x-(b.face>0?tail:0),b.y-4,tail,8,'#518fc7');
  box(b.x-(b.face>0?tail-6:0),b.y-2,tail-6,4,'#b8efff');
  box(b.x-6,b.y-6,12,12,'#8edcff');box(b.x-4,b.y-4,8,8,'#ffffff');
 }
 for(const e of s.effects){const progress=Math.max(0,1-(e.until-time)/.24),r=reduced?8:6+progress*17;
  for(let i=0;i<8;i++){const a=i*Math.PI/4;box(e.x+Math.cos(a)*r-2,e.y+Math.sin(a)*r-2,4,4,e.kind==='hurt'?'#ff9393':e.kind==='melee'?'#ffe6aa':'#b5edff')}
  if(e.kind==='melee'||e.kind==='hurt'){g.fillStyle=e.kind==='hurt'?'#ffb2b2':'#fff1ba';g.font='bold 14px system-ui';g.fillText('−1',e.x-8,e.y-22-(reduced?0:progress*12))}
  box(e.x-2,e.y-6,4,12,'#fff9e5');box(e.x-6,e.y-2,12,4,'#fff9e5');
 }
}
export const SLASH_STYLES=['銀白細刃','暗影爪痕','赤金重斬'];
export function drawSlash(g,slash,progress,reduced,style=0){
 g.save();g.translate(slash.x,slash.y);g.scale(slash.face,1);g.globalAlpha=Math.max(.05,1-progress);g.lineCap='round';
 const phase=reduced?.45:progress;
 if(style===0){
  g.strokeStyle='#91b7c0';g.lineWidth=5;g.beginPath();g.ellipse(0,0,94,53,0,-1.15,1.15);g.stroke();
  g.strokeStyle='#e9f6ec';g.lineWidth=2;g.beginPath();g.ellipse(0,0,97,53,0,-1.15,1.15);g.stroke();
  g.fillStyle='#e9f6ec';g.beginPath();g.moveTo(26,-48);g.quadraticCurveTo(135,-5,28,48);g.quadraticCurveTo(110,0,26,-48);g.fill();
 }else if(style===1){
  for(let i=0;i<3;i++){g.strokeStyle='#293343';g.lineWidth=10;g.beginPath();g.moveTo(25,-48+i*24);g.quadraticCurveTo(105,-30+i*24,80,1+i*24);g.stroke();g.strokeStyle='#91d1cf';g.lineWidth=2;g.stroke()}
 }else{
  g.strokeStyle='#b45c45';g.lineWidth=12;g.beginPath();g.ellipse(0,0,88,51,0,-1.05,1.05);g.stroke();g.strokeStyle='#f3d5a0';g.lineWidth=4;g.stroke();
  if(!reduced)for(let i=0;i<7;i++){const a=-1+i/3;g.fillStyle='#f3be73';g.fillRect(Math.cos(a)*(95+phase*14),Math.sin(a)*54,4,3)}
 }
 g.restore();
}
