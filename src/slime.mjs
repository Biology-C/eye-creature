export const SLIME_JUMP=-250*Math.SQRT2,SLIME_RUN=34*1.25,SLIME_AIR=165*1.25;
export function createPureSlimes(world,seed=928,count=20){
 let s=seed>>>0;const random=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296};const out=[];
 for(let n=4;n<world.graph.length;n++){if(n===world.exitNode||world.lightNodes.includes(n)||world.traps.some(t=>t.node===n))continue;const p=world.tile(n),pos=world.position(n);if(world.safes.some(a=>a.x===pos.x&&a.y===pos.y)||world.rats.some(r=>Math.abs(r.x-pos.x)<80&&Math.abs(r.y-pos.y)<160))continue;
 if(![1,2,3].every(dx=>world.map[p.y+5]?.[p.x+dx]===1))continue;
 out.push({x:(p.x+2.5)*world.T,y:(p.y+5)*world.T-14.01,a:(p.x+1)*world.T,b:(p.x+4)*world.T,pure:true});
 }for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out.slice(0,count);
}
export const isSlime=r=>r.pure||r.big||(r.hp>0&&r.hp<=1);
export function createBigSlimes(world){return createPureSlimes(world,928,25).slice(20).map(r=>({...r,y:r.y-8,big:true,bodyRadius:22,radiusX:22,radiusY:22}))}
export function splitSlime(r,free){if(!r.big||r.hp>0||r.split)return [];r.split=true;const children=[];for(const [i,offset]of [-18,-6,6,18].entries()){let x=r.x+offset,y=r.y-8;if(!free(x,y,14)){x=r.x;y=r.y}children.push({x,y,spawn:x,y0:y,a:r.a,b:r.b,face:i%2?1:-1,hp:1,pure:true,child:true,state:'jump',timer:0,stun:0,vy:-180,surface:null})}return children}
function detach(r){r.surface=null;r.grounded=false;r.vy=0;r.state='rest';r.timer=.4}
export function crawlSlime(r,physics,dt,time){
 if(!isSlime(r))return false;
 const radius=r.bodyRadius||14,probe=radius+2,speed=SLIME_RUN*(r.big?.75:1);
 const solid=physics.solid;
 if(r.surface){
  const supported=r.surface==='ceiling'?solid(r.x,r.y-probe):solid(r.x+(r.surface==='right'?probe:-probe),r.y);
  if(!supported){detach(r);return false}
  r.vy=0;r.grounded=false;if(time<r.stun)return true;
  if(r.surface==='ceiling'){
   const next=r.x+r.face*speed*dt;
   if(physics.free(next,r.y,radius))physics.moveEnemy(r,r.face*speed*dt);else{r.surface=r.face>0?'right':'left';r.crawlDown=true}
  }else{
   const dir=r.crawlDown?1:-1;
   physics.moveSurfaceY(r,dir*speed*dt);
   if(!r.crawlDown&&solid(r.x,r.y-probe)){const old=r.surface;r.surface='ceiling';r.face=old==='right'?-1:1}
   else if(r.crawlDown&&solid(r.x,r.y+probe)){r.face=r.surface==='right'?-1:1;detach(r);r.crawlDown=false}
  }
  return true;
 }
 if(time<r.stun)return false;
 const side=solid(r.x+r.face*probe,r.y)?r.face:0;
 if(side){r.surface=side>0?'right':'left';r.crawlDown=false;r.vy=0;r.grounded=false;r.state='crawl';return true}
 if(r.vy<0&&solid(r.x,r.y-probe)){r.surface='ceiling';r.vy=0;r.state='crawl';return true}
 return false;
}
