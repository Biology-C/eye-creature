import {SLIME_JUMP,SLIME_RUN,SLIME_AIR} from './slime.mjs';

export function setSlimeForm(p,enabled){
 if(Boolean(p.slimeForm)===enabled)return false;
 Object.assign(p,{slimeForm:enabled,surface:null,vy:0,dashRemaining:0,flapping:false,gliding:false,slimeAttack:0,slimeCooldown:0});
 return true;
}
export function startSlimeAttack(p){
 if(!p.slimeForm||p.slimeCooldown>0)return false;
 p.surface=null;p.slimeAttack=.3;p.slimeCooldown=.55;p.slimeFace=p.face;
 p.vy=-240;p.grounded=false;return true;
}
export function updateSlimePlayer(p,keys,dt,physics){
 const n=Math.max(1,Math.ceil(dt*120)),step=dt/n;
 for(let i=0;i<n;i++){
  const dx=Number(keys.has('right'))-Number(keys.has('left')),up=keys.has('up'),down=keys.has('down');
  p.slimeCooldown=Math.max(0,(p.slimeCooldown||0)-step);
  p.dashRemaining=0;p.flapping=false;p.gliding=false;
  // The player's collision radius remains 11px during transformation and recovery.
  p.bodyRadius=11;
  if(p.surface){
   const wall=p.surface==='ceiling'?physics.solid(p.x,p.y-13):physics.solid(p.x+(p.surface==='right'?13:-13),p.y);
   if(!wall||down){p.surface=null;p.vy=25}
   else{
    p.vy=0;p.grounded=false;
    if(p.surface==='ceiling')physics.moveEnemy(p,dx*SLIME_RUN*step);
    else {if(up)physics.moveSurfaceY(p,-SLIME_RUN*step);if(physics.solid(p.x,p.y-13))p.surface='ceiling'}
    continue;
   }
  }
  if(p.slimeAttack>0){physics.moveEnemy(p,p.slimeFace*SLIME_AIR*step);p.slimeAttack=Math.max(0,p.slimeAttack-step)}
  else{
   if(up&&!down&&p.grounded){p.vy=SLIME_JUMP;p.grounded=false}
   physics.moveEnemy(p,dx*(p.grounded?SLIME_RUN:SLIME_AIR)*step);
  }
  if(up&&!down&&p.slimeAttack<=0){
   if(dx&&physics.solid(p.x+dx*13,p.y)){p.surface=dx>0?'right':'left';p.vy=0;continue}
   if(p.vy<0&&physics.solid(p.x,p.y-13)){p.surface='ceiling';p.vy=0;continue}
  }
  physics.enemy(p,step);
 }
}
