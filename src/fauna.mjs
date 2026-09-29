import {updateTornadoes} from './tornado.mjs';
import {inMelee} from './combat.mjs';
export function createFauna(world){
 const candidates=[];const {T,map}=world;
 for(let n=2;n<world.graph.length;n++){const p=world.tile(n);if(n%6===3||world.lightNodes.includes(n)||world.exitNode===n||world.safes.some(s=>s.x===world.position(n).x&&s.y===world.position(n).y)||world.traps.some(t=>t.node===n))continue;if([0,1,2,3,4].every(dx=>map[p.y+5]?.[p.x+dx]===1))candidates.push(n)}
 const nodes=[0,.3,.6,.85].map(f=>candidates[Math.floor(f*candidates.length)]).filter(n=>n!==undefined);
 const trees=nodes.map((node,id)=>{const p=world.tile(node);return {id,node,x:(p.x+2.5)*T,y:(p.y+5)*T-35,hp:5,state:'idle',timer:0,stun:0,castTimer:2,casting:0}});
 const zones=trees.map((t,id)=>({id,x:t.x,y:t.y-55,elapsed:0,serial:0}));
 for(const node of candidates.filter(n=>!nodes.includes(n))){if(zones.length>=20)break;const p=world.position(node);zones.push({id:zones.length,x:p.x,y:p.y,elapsed:0,serial:0})}
 const state={trees,zones,birds:[],tornadoes:[],mirrorUntil:0,mirrorReady:0};
 for(const z of zones)spawnBird(state,z);return state;
}
function spawnBird(state,z){if(state.birds.filter(b=>b.hp&&b.zone===z.id).length>=6)return false;state.birds.push({id:`${z.id}-${z.serial++}`,zone:z.id,x:z.x,y:z.y,hp:1,mode:'circle',timer:1.2,angle:z.serial*1.6,dx:0,dy:0});return true}
export function meleeFauna(s,p,time,clear,targets=null){let killed=0,felled=0;for(const e of [...s.trees,...s.birds]){const dx=(e.x-p.x)*p.face;if((!targets||targets.includes(e))&&inMelee(p,e,clear)){e.hp=Math.max(0,e.hp-1);e.stun=time+.6;if(!e.hp){killed++;if('node'in e){felled++;const z=s.zones[e.id];spawnBird(s,z);spawnBird(s,z)}}}}return {killed,felled}}
export function mirrorFauna(s,p,time,clear){if(time<s.mirrorReady)return -1;s.mirrorReady=time+6;s.mirrorUntil=time+.7;let count=0;for(const b of s.birds)if(b.hp&&Math.hypot(b.x-p.x,b.y-p.y)<=180&&clear(p.x,p.y,b.x,b.y)){b.mode='mirror';b.timer=.65;count++}return count}
export function resetFaunaAfterDeath(s){s.tornadoes=[];for(const b of s.birds)if(b.hp){const z=s.zones[b.zone];b.x=z.x;b.y=z.y;b.mode='circle';b.timer=1.2;b.stun=0}for(const t of s.trees){t.state='idle';t.timer=0;t.stun=0;t.castTimer=2;t.casting=0}}
export function updateFauna(s,p,time,dt,{clear,free,hurt,visible}){
 let kills=0;
 s.tornadoes=updateTornadoes(s.tornadoes||[],dt,{free,player:p,hurt});
 for(const t of s.trees){if(!t.hp||time<t.stun)continue;const near=Math.hypot(t.x-p.x,t.y-p.y)<300&&clear(t.x,t.y,p.x,p.y);if(!near){t.casting=0;continue}if(t.casting>0){t.casting-=dt;if(t.casting<=0){const len=Math.hypot(p.x-t.x,p.y-t.y)||1;s.tornadoes.push({x:t.x,y:t.y,dx:(p.x-t.x)/len,dy:(p.y-t.y)/len,bounces:0,life:7});t.castTimer=3.5}}else{t.castTimer=(t.castTimer??2)-dt;if(t.castTimer<=0)t.casting=.8}}
 for(const z of s.zones){const birds=s.birds.filter(b=>b.hp&&b.zone===z.id);if(birds.some(b=>(visible?visible(b):Math.hypot(p.x-b.x,p.y-b.y)<320)&&clear(p.x,p.y,b.x,b.y)))z.seen=true;
 if(z.seen&&birds.length){z.elapsed=Math.min(1.5,z.elapsed+dt);if(z.elapsed>=1.5&&birds.length<6){spawnBird(s,z);z.elapsed=0}}else z.elapsed=0;}
 for(const t of s.trees){if(!t.hp||time<t.stun)continue;const near=Math.hypot(t.x-p.x,t.y-p.y)<95&&clear(t.x,t.y,p.x,p.y);if(t.state==='idle'&&near){t.state='ready';t.timer=.8}else if(t.state!=='idle'){t.timer-=dt;if(t.timer<=0){if(t.state==='ready'){t.state='strike';t.timer=.25}else if(t.state==='strike'){t.state='rest';t.timer=1.3}else t.state='idle'}}if(t.state==='strike'&&near)hurt('樹妖')}
 for(const b of s.birds){if(!b.hp)continue;const z=s.zones[b.zone];if(b.mode==='mirror'){b.timer-=dt;if(b.timer<=0){b.hp=0;kills++}continue}if(time<(b.stun||0))continue;const near=Math.hypot(p.x-b.x,p.y-b.y)<220&&clear(b.x,b.y,p.x,p.y);if(b.mode==='circle'&&near){b.mode='ready';b.timer=.7}
 let tx=z.x+Math.cos(b.angle)*38,ty=z.y+Math.sin(b.angle)*22,speed=45;b.angle+=dt*1.8;
 if(b.mode==='ready'){b.timer-=dt;speed=0;if(b.timer<=0){b.mode='dash';b.timer=.55;const len=Math.hypot(p.x-b.x,p.y-b.y)||1;b.dx=(p.x-b.x)/len;b.dy=(p.y-b.y)/len}}
 else if(b.mode==='dash'){tx=b.x+b.dx*100;ty=b.y+b.dy*100;speed=145;b.timer-=dt;if(b.timer<=0){b.mode='rest';b.timer=1}}
 else if(b.mode==='rest'){b.timer-=dt;if(b.timer<=0)b.mode='circle'}
 const len=Math.hypot(tx-b.x,ty-b.y)||1,n=Math.max(1,Math.ceil(speed*dt/4));for(let i=0;i<n;i++){const dx=(tx-b.x)/len*speed*dt/n,dy=(ty-b.y)/len*speed*dt/n;if(free(b.x+dx,b.y,10))b.x+=dx;if(free(b.x,b.y+dy,10))b.y+=dy}
 if(Math.hypot(b.x-p.x,b.y-p.y)<24&&clear(b.x,b.y,p.x,p.y))hurt('青影鳥');
 }return kills;
}
