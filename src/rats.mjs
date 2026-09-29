import {isSlime,crawlSlime,SLIME_JUMP,SLIME_RUN,SLIME_AIR} from './slime.mjs';
// Slimes have double ballistic jump height, 1.25x speed, and surface adhesion.
export function updateRat(r,player,physics,dt,time,clearPath){
 const slime=isSlime(r),speed=r.big?.75:1;
 if(crawlSlime(r,physics,dt,time))return;
 physics.enemy(r,dt);
 if(time<r.stun)return;
 if(r.state==='jump'){
  if(!r.grounded){physics.moveEnemy(r,r.face*(slime?SLIME_AIR:165)*speed*dt);return}
  r.state='rest';r.timer=.85;
 }
 if(!r.grounded)return;
 const near=Math.abs(player.x-r.x)<(slime?162.5:130)&&Math.abs(player.y-r.y)<(slime?100:80)&&clearPath(r.x,r.y,player.x,player.y);
 if(r.state==='walk'&&near){r.state='ready';r.timer=slime?.65/1.25:.65;r.face=player.x>r.x?1:-1}
 if(r.state==='ready'){
  r.timer-=dt;
  if(r.timer<=0){r.state='jump';r.vy=slime?SLIME_JUMP:-250;r.grounded=false}
 }else if(r.state==='dash'){
  if(!physics.walkEnemy(r,r.face*95*dt)){r.state='rest';r.timer=.85}
  r.timer-=dt;if(r.timer<=0){r.state='rest';r.timer=.85}
 }else if(r.state==='rest'){
  r.timer-=dt;if(r.timer<=0)r.state='walk';
 }else{
  const walked=physics.walkEnemy(r,r.face*(slime?SLIME_RUN:34)*speed*dt);
  if(!walked||r.x<=r.a||r.x>=r.b){r.x=Math.max(r.a,Math.min(r.b,r.x));r.face*=-1}
 }
}
