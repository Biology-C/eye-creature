export const RUN_SPEED=260,MAX_WING=.7;
export function startDash(o){
 if((o.dashCooldown||0)>0||(o.dashRemaining||0)>0)return false;
 o.dashRemaining=.18;o.dashCooldown=o.abilities?.dash ? .6 : 1.2;o.dashFace=o.face||1;return true;
}
export function createPhysics(map,T,platforms){
 const solid=(x,y)=>map[Math.floor(y/T)]?.[Math.floor(x/T)]!==0;
 function free(x,y,r){return ![[x-r,y-r],[x+r,y-r],[x-r,y+r],[x+r,y+r]].some(([a,b])=>solid(a,b))}
 function fall(o,dy,r,allowPlatforms){
  const steps=Math.max(1,Math.ceil(Math.abs(dy)/3));o.grounded=false;
  for(let i=0;i<steps;i++){
   const next=o.y+dy/steps,feet=o.y+r,nextFeet=next+r;
   let floor=Infinity;
   if(dy>=0){
    const row=Math.floor(nextFeet/T);for(const x of [o.x-r,o.x+r])if(solid(x,nextFeet))floor=Math.min(floor,row*T);
    if(allowPlatforms)for(const p of platforms)if(o.x+r>p.x&&o.x-r<p.x+p.w&&feet<=p.y+.01&&nextFeet>=p.y)floor=Math.min(floor,p.y);
   }
   if(floor<Infinity){o.y=floor-r-.01;o.vy=0;o.grounded=true;return}
   if(free(o.x,next,r))o.y=next;else{o.vy=0;return}
  }
 }
 function horizontal(o,dx,r){const n=Math.max(1,Math.ceil(Math.abs(dx)/3));for(let i=0;i<n;i++)if(free(o.x+dx/n,o.y,r))o.x+=dx/n;}
 function player(o,keys,dt){
  const n=Math.max(1,Math.ceil(dt*120)),step=dt/n;
  for(let i=0;i<n;i++){
   o.dashCooldown=Math.max(0,(o.dashCooldown||0)-step);
   if((o.dashRemaining||0)>0){
    const burst=Math.min(step,o.dashRemaining);horizontal(o,o.dashFace*650*burst,11);
    o.dashRemaining=Math.max(0,o.dashRemaining-step);o.vy=0;o.flapping=false;o.gliding=false;continue;
   }
   const up=keys.has('up'),down=keys.has('down');
   if(o.grounded)o.wing=Math.min(MAX_WING,o.wing+step*1.4);
   o.flapping=up&&!down&&o.wing>0&&(!o.grounded||o.wing>=.35);
   o.gliding=up&&!down&&!o.flapping&&!o.grounded;
   if(o.flapping){o.wing=Math.max(0,o.wing-step);o.vy=-260;o.grounded=false}
   else o.vy=Math.min(down?480:o.gliding?65:360,o.vy+(o.gliding?200:850)*step);
   horizontal(o,(Number(keys.has('right'))-Number(keys.has('left')))*RUN_SPEED*step,11);
   fall(o,o.vy*step,11,!down);
  }
 }
 function enemy(o,dt){o.vy=Math.min(400,(o.vy||0)+850*dt);fall(o,o.vy*dt,14,false)}
 function walkEnemy(o,dx){const ahead=o.x+dx+Math.sign(dx)*16;if(solid(ahead,o.y)||!solid(ahead,o.y+17))return false;horizontal(o,dx,14);return true}
 return {player,enemy,walkEnemy,solid,moveEnemy:(o,dx)=>horizontal(o,dx,14)};
}
