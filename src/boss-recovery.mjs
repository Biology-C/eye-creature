import {MAX_HP} from './health.mjs';
import {drawPickupIcon} from './pickup-art.mjs';
export const RECOVERY_COOLDOWN=20;
// The stomp reaches 126px; leave a further 120px to the pickup center.
export function dropRecovery(b,p,time){
 if(!b.active||b.hp<=0||p.hp<=0||p.hp>2||b.recovery||time-b.lastRecoveryAt<=RECOVERY_COOLDOWN)return false;
 const a=b.arena,candidates=[];
 for(let x=a.left+14;x<=a.exit.x-18-14;x+=1){
  if(Math.abs(x-b.x)<126+120)continue;
  if(b.cursed&&b.mirrors.some(m=>Math.abs(x-m.x)<120))continue;
  candidates.push(x);
 }
 candidates.sort((x,y)=>Math.abs(y-b.x)-Math.abs(x-b.x)||x-y);
 if(!candidates.length)return false;
 b.recovery={x:candidates[0],y:a.floor-17};b.lastRecoveryAt=time;return true;
}
export function collectRecovery(b,p){
 if(!b.active||b.hp<=0||!b.recovery||Math.hypot(p.x-b.recovery.x,p.y-b.recovery.y)>28)return false;
 p.hp=Math.min(MAX_HP,p.hp+1);b.recovery=null;return true;
}
export function drawRecovery(g,b,time,reduced){
 const r=b.recovery;if(!r)return;
 const pulse=reduced?.7:.65+.35*Math.sin(time*4);
 g.save();g.fillStyle='#68dfff';g.globalAlpha=.12+pulse*.12;
 g.beginPath();g.arc(r.x,r.y,28+pulse*7,0,Math.PI*2);g.fill();
 g.globalAlpha=.4+pulse*.25;g.strokeStyle='#b8ffff';g.lineWidth=2;g.beginPath();g.arc(r.x,r.y,21+pulse*3,0,Math.PI*2);g.stroke();
 g.globalAlpha=1;drawPickupIcon(g,'wing',r.x,r.y,1.5);g.restore();
}
