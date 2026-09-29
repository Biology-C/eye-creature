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
export const SLASH_STYLES=['銀白細刃','暗影爪痕','赤金重斬'];
export function drawSlash(g,slash,progress,reduced,style=0){
 g.save();g.translate(slash.x,slash.y);g.scale(slash.face,1);g.globalAlpha=Math.max(.05,1-progress);g.lineCap='round';
 const phase=reduced?.45:progress;
 if(slash.stage){
 const color=['#d7f5ff','#9be5df','#ffda99'][style];
 const shape=()=>{if(slash.stage===2){g.ellipse(0,0,96,58,0,phase*6,phase*6+Math.PI*1.8)}else if(slash.stage===3){g.moveTo(18,-45);g.lineTo(92,45);g.moveTo(18,45);g.lineTo(92,-45)}else{g.moveTo(28,-52);g.quadraticCurveTo(111,-4,55,52)}};
 if(slash.stage===3){for(const flip of [-1,1]){g.save();g.scale(1,flip);g.fillStyle=color;g.beginPath();g.moveTo(12,-57);g.quadraticCurveTo(63,-6,106,54);g.quadraticCurveTo(54,20,12,-57);g.fill();g.strokeStyle='#ffffff';g.lineWidth=2;g.beginPath();g.moveTo(18,-49);g.quadraticCurveTo(63,3,100,47);g.stroke();g.restore()}}
 else for(const [w,c] of [[16,'#344c61'],[9,color],[3,'#ffffff']]){g.strokeStyle=c;g.lineWidth=w;g.beginPath();shape();g.stroke()}
 if(!reduced)for(let i=0;i<7;i++){const a=i*.9+phase*4;g.fillStyle=color;g.fillRect((slash.stage===2?0:55)+Math.cos(a)*(20+phase*65),Math.sin(a)*(20+phase*36),4,2)}
 }else if(style===0){
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
