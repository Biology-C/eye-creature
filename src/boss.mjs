import {MAX_HP} from './health.mjs';
export const BOSS_WAVES=[{ratio:.75,kinds:['rat','rat']},{ratio:.5,kinds:['slime','slime','slime']},{ratio:.2,kinds:['big']}];
export function addBossArena(world){
 const top=world.H+2,T=world.T;
 for(let y=world.H;y<top+11;y++)world.map.push(Array(world.W).fill(1));
 for(let y=top;y<top+9;y++)for(let x=2;x<24;x++)world.map[y][x]=0;
 world.H=world.map.length;
 world.arena={left:64,right:768,top:top*T,floor:(top+9)*T,start:{x:144,y:(top+9)*T-12},exit:{x:720,y:(top+9)*T-12}};
 for(const x of [240,432,624])world.platforms.push({x,y:(top+6)*T,w:96});
}
function resetEncounter(b){Object.assign(b,{state:'rest',timer:1.5,cycle:0,cursed:false,stun:0,attack:null,waves:[],shots:[],mirrors:[],effects:[],serial:0})}
export function createBoss(world){const a=world.arena,b={x:576,y:a.floor-38,hp:30,maxHp:30,radiusX:34,radiusY:38,active:false,face:-1,arena:a};resetEncounter(b);return b}
export function enterBoss(b,p,a){resetEncounter(b);b.active=true;b.x=576;b.y=a.floor-38;Object.assign(p,{x:a.start.x,y:a.start.y,vy:0,wing:.7,hp:MAX_HP,dashRemaining:0})}
export function resetBoss(b){b.active=false;resetEncounter(b);if(b.hp>0)b.hp=b.maxHp}
export function clearBossCurse(b){if(!b.cursed)return false;b.cursed=false;b.mirrors=[];return true}
export function bossSummons(b,p,kinds,living=0){
 const a=b.arena,positions=[a.left+104,a.right-104,a.left+216,a.right-216,a.left+312,a.right-312];
 // Ground spawns prefer the side away from the player, with a full second of grace.
 positions.sort((x,y)=>Math.abs(y-p.x)-Math.abs(x-p.x));
 return kinds.slice(0,Math.max(0,6-living)).map((kind,i)=>{const x=positions[i],big=kind==='big',r=big?22:14;return {id:`bear-${++b.serial}`,bossMinion:true,x,y:a.floor-r-.01,spawn:x,y0:a.floor-r-.01,a:a.left+40,b:a.right-40,face:x<p.x?1:-1,hp:big?3:kind==='rat'?2:1,pure:kind!=='rat',big,bodyRadius:r,radiusX:r,radiusY:r,surface:null,state:'rest',timer:1,stun:0,vy:0}});
}
function beginStrike(b,p,time,events){
 b.state='strike';b.timer=b.attack==='stomp'?.45:.3;
 if(b.attack==='curse'){b.cursed=true;events.curse?.()}
 if(b.attack==='bolt')for(const offset of [-.18,0,.18]){const angle=b.aim+offset;b.shots.push({x:b.x+b.face*34,y:b.y-17,vx:Math.cos(angle)*245,vy:Math.sin(angle)*245,life:3,radius:9,kind:'bolt'})}
 if(b.attack==='stomp'){
  b.effects.push({x:b.x,y:b.arena.floor,until:time+.45,kind:'stomp'});
  if(Math.abs(p.x-b.x)<126&&p.y>b.arena.floor-46&&events.clear(b.x,b.y,p.x,p.y))events.hurt('紅熊重踏');
  for(const dir of [-1,1])b.shots.push({x:b.x+dir*40,y:b.arena.floor-10,vx:dir*190,vy:0,life:2.6,radius:10,kind:'wave'});
  if(b.cursed&&!b.mirrors.length){
   const x=b.x>(b.arena.left+b.arena.right)/2?b.arena.left+104:b.arena.right-104;
   b.mirrors.push({id:`mirror-${++b.serial}`,x,y:b.arena.top+36,vy:0,landed:false});events.mirrorDrop?.();
  }
 }
}
export function updateBoss(b,p,dt,time,events){
 if(!b.active||b.hp<=0){b.cursed=false;b.shots=[];b.mirrors=[];b.effects=[];return}
 for(let i=0;i<BOSS_WAVES.length;i++)if(b.hp<=b.maxHp*BOSS_WAVES[i].ratio&&!b.waves.includes(i)){b.waves.push(i);events.summon?.(BOSS_WAVES[i].kinds,i)}
 // Fixed substeps retain collision and timing at 30/60/120 FPS.
 const n=Math.max(1,Math.ceil(dt*120)),step=dt/n;
 for(let i=0;i<n;i++){
  if(!b.active||b.hp<=0)break;
  b.timer-=step;
  if(b.timer<=0){
   if(b.state==='rest'){b.state='ready';b.timer=1;b.face=p.x<b.x?-1:1;b.attack=b.cursed?'stomp':['claw','bolt','curse','stomp','bolt','stomp'][b.cycle++%6];b.aim=Math.atan2(p.y-(b.y-17),p.x-(b.x+b.face*34))}
   else if(b.state==='ready')beginStrike(b,p,time,events);
   else{b.state='rest';b.timer=1.35}
  }
  if(b.state==='rest'&&time>=b.stun&&Math.abs(p.x-b.x)>110){b.x+=Math.sign(p.x-b.x)*60*step;b.x=Math.max(b.arena.left+66,Math.min(b.arena.right-68,b.x))}
  if(b.state==='strike'&&b.attack==='claw'&&(p.x-b.x)*b.face>=-20&&(p.x-b.x)*b.face<130&&Math.abs(p.y-b.y)<68&&events.clear(b.x,b.y,p.x,p.y))events.hurt('紅熊揮爪');
  b.shots=b.shots.filter(s=>{
   s.x+=s.vx*step;s.y+=s.vy*step;s.life-=step;
   if(s.life<=0||s.x-s.radius<b.arena.left||s.x+s.radius>b.arena.right||s.y-s.radius<b.arena.top||s.y+s.radius>b.arena.floor||events.solid?.(s.x,s.y))return false;
   if(Math.abs(s.x-p.x)<s.radius+11&&Math.abs(s.y-p.y)<s.radius+11){events.hurt(s.kind==='bolt'?'紅熊吐息':'重踏震波');return false}return true;
  });
  for(const m of b.mirrors){m.vy=Math.min(320,m.vy+620*step);m.y=Math.min(b.arena.floor-16,m.y+m.vy*step);m.landed=m.y>=b.arena.floor-16;}
 }
 if(!b.active||b.hp<=0){b.shots=[];b.mirrors=[];b.effects=[];return}
 b.effects=b.effects.filter(e=>e.until>time);
 if(b.cursed&&b.mirrors.some(m=>m.landed&&Math.hypot(m.x-p.x,m.y-p.y)<34)&&clearBossCurse(b))events.cured?.();
}
export const BOSS_ATTACK_LABELS={claw:'揮爪',bolt:'吐息：離開瞄準線',curse:'認知顛倒',stomp:'重踏：跳離地面'};
export function drawBear(g,b,time,reduced){
 const box=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
 const poly=(pts,c)=>{g.fillStyle=c;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill()};
 const ready=b.state==='ready',striking=b.state==='strike',stomp=b.attack==='stomp',cast=b.attack==='bolt'||b.attack==='curse';
 const bodyY=stomp&&ready?-7:stomp&&striking?4:reduced?0:Math.round(Math.sin(time*5));
 g.save();g.translate(Math.round(b.x),Math.round(b.y));g.scale(b.face,1);
 // Original crimson chimera: heavy shoulders, bear muzzle, graft seams and crystal spine.
 box(-32,30,66,8,'#171e29');box(-26,15,21,23,'#582336');box(10,15,23,23,'#6e2938');
 for(const x of [-24,-17,-10,15,22,29])box(x,34,5,4,'#e5c8a9');
 g.translate(0,bodyY);
 poly([[-37,-24],[-25,-40],[0,-35],[25,-23],[30,18],[15,30],[-20,25],[-34,8]],'#281e2c');
 poly([[-32,-22],[-21,-33],[1,-29],[23,-20],[25,13],[10,23],[-20,18]],time<b.stun?'#ebad9a':'#a5414d');
 poly([[-26,-13],[-4,-22],[17,-14],[17,18],[-6,22],[-24,7]],'#723042');
 poly([[-8,-18],[12,-15],[18,3],[6,15],[-12,10]],'#c66361');
 for(let j=0;j<3;j++)poly([[-34,-17+j*12],[-45,-27+j*12],[-42,-8+j*12],[-32,-3+j*12]],j%2?'#52989d':'#8acdc4');
 for(let j=0;j<5;j++)box(-17+j*5,-9+j*5,6,2,'#edb2a1');
 const armY=ready&&stomp?-32:striking&&b.attack==='claw'?-4:4;
 poly([[-28,-21],[-41,-14+armY],[-44,17+armY],[-28,24+armY],[-20,10]],'#65293b');
 poly([[17,-16],[33,-17+armY],[42,6+armY],[36,25+armY],[19,19+armY]],'#b34c53');
 for(let j=0;j<3;j++)box(23+j*6,20+armY,4,10,'#ead1b4');
 box(-20,-48,13,16,'#2a202a');box(11,-46,14,15,'#2a202a');box(-17,-45,7,9,'#c27270');box(14,-43,7,8,'#c27270');
 poly([[-22,-37],[-11,-45],[17,-42],[29,-29],[28,-13],[9,-7],[-17,-15]],'#52273a');
 poly([[-15,-35],[-7,-40],[17,-36],[24,-24],[16,-13],[-11,-20]],'#b75156');
 box(15,-27,7,5,'#ffd994');box(20,-28,3,4,'#211e2c');box(21,-20,16,11,'#d68576');box(32,-22,8,7,'#241f2b');
 if(cast&&(ready||striking)){box(19,-10,18,14,'#211b2a');box(20,-10,4,5,'#ffe5bd');box(30,-10,4,5,'#ffe5bd');box(23,1,10,3,'#df779b');g.fillStyle=b.attack==='curse'?'#a9f1ec':'#ffbb98';g.beginPath();g.arc(39,-5,ready?4+Math.max(0,1-b.timer)*9:12,0,Math.PI*2);g.fill()}
 if(striking&&b.attack==='claw'){g.strokeStyle='#f7c8ab';g.lineWidth=3;for(let i=0;i<3;i++){g.beginPath();g.moveTo(31,-24+i*12);g.quadraticCurveTo(91,-20+i*12,114,25+i*9);g.stroke()}}
 g.restore();
 drawBossTelegraph(g,b);
}
export function drawBossTelegraph(g,b){
 if(b.state==='ready'){g.save();g.strokeStyle=(b.attack==='bolt'||b.attack==='curse')?'#e4a3db':'#f4be8a';g.lineWidth=2;g.setLineDash([5,5]);g.beginPath();
  if(b.attack==='bolt'){const x=b.x+b.face*34,y=b.y-17;g.moveTo(x,y);g.lineTo(x+Math.cos(b.aim)*480,y+Math.sin(b.aim)*480)}
  else if(b.attack==='stomp'){g.moveTo(b.x-126,b.arena.floor-3);g.lineTo(b.x+126,b.arena.floor-3)}
  else g.rect(b.x-44,b.y-54,88,94);g.stroke();g.restore();
 }
}
export function drawBossEffects(g,b,time,reduced){
 g.save();
 for(const s of b.shots){g.fillStyle=s.kind==='wave'?'#d97678':'#9b4770';g.beginPath();g.ellipse(s.x,s.y,s.radius+5,s.radius,0,0,Math.PI*2);g.fill();g.fillStyle='#ffe0ae';g.beginPath();g.arc(s.x,s.y,s.radius*.55,0,Math.PI*2);g.fill()}
 for(const e of b.effects){g.globalAlpha=(e.until-time)/.45;g.strokeStyle='#efba9c';g.lineWidth=3;g.beginPath();g.ellipse(e.x,e.y-2,reduced?85:35+(1-g.globalAlpha)*110,12,0,Math.PI*2);g.stroke()}g.globalAlpha=1;
 for(const m of b.mirrors){g.fillStyle='#4a3e54';g.fillRect(m.x-12,m.y-18,24,34);g.fillStyle='#88b7be';g.fillRect(m.x-9,m.y-15,18,28);g.fillStyle='#e1fff1';g.fillRect(m.x-6,m.y-12,5,20);g.fillRect(m.x+2,m.y-6,4,12);if(!m.landed){g.strokeStyle='#b3dbe0';g.beginPath();g.moveTo(m.x,m.y-40);g.lineTo(m.x,m.y-24);g.stroke()}}
 g.restore();
}
