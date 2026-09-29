import {MAX_HP} from './health.mjs';
export function addBossArena(world){
 const top=world.H+2,T=world.T;
 for(let y=world.H;y<top+11;y++)world.map.push(Array(world.W).fill(1));
 for(let y=top;y<top+9;y++)for(let x=2;x<24;x++)world.map[y][x]=0;
 world.H=world.map.length;
 world.arena={left:64,right:768,top:top*T,floor:(top+9)*T,start:{x:144,y:(top+9)*T-12},exit:{x:720,y:(top+9)*T-12},mirror:{x:112,y:(top+9)*T-28}};
 for(const x of [240,432,624])world.platforms.push({x,y:(top+6)*T,w:96});
}
export function createBoss(world){const a=world.arena;return {x:576,y:a.floor-38,hp:30,maxHp:30,radiusX:34,radiusY:38,active:false,state:'rest',timer:1.5,cycle:0,cursed:false,stun:0,face:-1}}
export function enterBoss(b,p,a){b.active=true;b.x=576;b.y=a.floor-38;b.state='rest';b.timer=1.5;b.cursed=false;p.x=a.start.x;p.y=a.start.y;p.vy=0;p.wing=.7;p.hp=MAX_HP;p.dashRemaining=0}
export function resetBoss(b){b.active=false;b.cursed=false;if(b.hp>0){b.hp=30;b.state='rest';b.timer=1.5}}
export function updateBoss(b,p,dt,time,{clear,hurt}){
 if(!b.active||b.hp<=0){b.cursed=false;return}
 b.timer-=dt;
 if(b.timer<=0){
  if(b.state==='rest'){b.state='ready';b.timer=1;b.face=p.x<b.x?-1:1;b.attack=b.cycle++%3===2?'curse':'claw'}
  else if(b.state==='ready'){b.state='strike';b.timer=.3;if(b.attack==='curse')b.cursed=true}
  else{b.state='rest';b.timer=1.6}
 }
 if(b.state==='rest'&&time>=b.stun&&Math.abs(p.x-b.x)>85){b.x+=Math.sign(p.x-b.x)*60*dt;b.x=Math.max(130,Math.min(700,b.x))}
 if(b.state==='strike'&&b.attack==='claw'&&(p.x-b.x)*b.face>=-20&&(p.x-b.x)*b.face<130&&Math.abs(p.y-b.y)<68&&clear(b.x,b.y,p.x,p.y))hurt('紅熊');
}
export function drawBear(g,b,time,reduced){
 const box=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
 g.save();g.translate(Math.round(b.x),Math.round(b.y));g.scale(b.face,1);
 const c=time<b.stun?'#fbd6c2':'#913f4b';
 box(-30,-24,57,54,'#402a39');box(-25,-25,48,52,c);box(-23,-42,14,16,c);box(11,-42,14,16,c);box(-23,-32,47,29,c);
 box(12,-18,22,17,'#b76865');box(26,-15,8,7,'#302b38');box(9,-25,7,5,'#f5db97');box(-22,22,17,15,'#592c3e');box(9,22,17,15,'#592c3e');
 box(-37,-12,13,36,'#673447');box(21,0,15,25,c);for(let i=0;i<3;i++)box(23+i*5,24,3,9,'#d9c6ba');
 // Stitched body and turquoise crystal graft distinguish the chimera from a normal bear.
 for(let i=0;i<5;i++)box(-10+i*5,-1+i*3,3,6,'#e0a394');box(-18,-12,8,12,'#81c1c6');box(-15,-17,4,9,'#b1f0ed');
 if(b.state==='ready'){g.strokeStyle=b.attack==='curse'?'#a8e5ee':'#f0b48c';g.lineWidth=2;g.strokeRect(-43,-50,86,94)}
 if(b.state==='strike'&&b.attack==='claw'){g.strokeStyle='#f7c8ab';g.lineWidth=4;for(let i=0;i<3;i++){g.beginPath();g.moveTo(32,-20+i*12);g.lineTo(115,8+i*12);g.stroke()}}
 g.restore();
}
