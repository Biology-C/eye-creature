// Crystal rats jump with gravity; slimes use shorter, slower hops.
export function updateRat(r,player,physics,dt,time,clearPath){
 physics.enemy(r,dt);
 if(time<r.stun)return;
 if(r.state==='jump'){
  if(!r.grounded){physics.moveEnemy(r,r.face*(r.hp===1?110:165)*dt);return}
  r.state='rest';r.timer=.85;
 }
 if(!r.grounded)return;
 const near=Math.abs(player.x-r.x)<130&&Math.abs(player.y-r.y)<80&&clearPath(r.x,r.y,player.x,player.y);
 if(r.state==='walk'&&near){r.state='ready';r.timer=.65;r.face=player.x>r.x?1:-1}
 if(r.state==='ready'){
  r.timer-=dt;
  if(r.timer<=0){r.state='jump';r.vy=r.hp===1?-205:-250;r.grounded=false}
 }else if(r.state==='dash'){
  if(!physics.walkEnemy(r,r.face*95*dt)){r.state='rest';r.timer=.85}
  r.timer-=dt;if(r.timer<=0){r.state='rest';r.timer=.85}
 }else if(r.state==='rest'){
  r.timer-=dt;if(r.timer<=0)r.state='walk';
 }else{
  const walked=physics.walkEnemy(r,r.face*(r.hp===1?22:34)*dt);
  if(!walked||r.x<=r.a||r.x>=r.b){r.x=Math.max(r.a,Math.min(r.b,r.x));r.face*=-1}
 }
}
