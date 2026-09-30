export function createExploration(world){return {gaze:null,elapsed:0,obstacles:structuredClone(world.obstacles||[]),winds:(world.winds||[]).map(w=>({...w,active:false})),echoes:structuredClone(world.echoes||[]),tutorials:[],teaching:[],pending:[],echoText:null,echoUntil:0}}
export function updateGaze(s,p,keys,walls,dt,solid){
 const dir=keys.has('down')?[0,1]:keys.has('up')?[0,-1]:[p.face,0];
 const targets=walls.filter(w=>!w.ordinary&&!w.broken&&!w.discovered).map(w=>{const x=w.x+w.w/2,y=w.y+w.h/2,dx=x-p.x,dy=y-p.y;return {w,x,y,dx,dy,d:Math.hypot(dx,dy)}}).filter(t=>t.d<=160&&(t.dx*dir[0]+t.dy*dir[1])>0&&Math.abs(t.dx*dir[1]-t.dy*dir[0])<=70).sort((a,b)=>a.d-b.d);
 const t=targets.find(t=>{const steps=Math.ceil(t.d/4);for(let i=0;i<steps;i++){const x=p.x+t.dx*i/steps,y=p.y+t.dy*i/steps;if(x>=t.w.x&&x<=t.w.x+t.w.w&&y>=t.w.y&&y<=t.w.y+t.w.h)break;if(solid(x,y))return false}return true});
 if(!t){s.gaze=null;s.elapsed=0;return null}if(s.gaze!==t.w.id){s.gaze=t.w.id;s.elapsed=0}s.elapsed+=dt;
 if(s.elapsed+1e-8>=.6){t.w.discovered=true;s.gaze=null;s.elapsed=0;return t.w}return null;
}
export function syncWinds(s,walls){for(const w of s.winds)w.active=walls.some(a=>a.id===w.wall&&a.broken)}
export function windAt(s,p){return s.winds.some(w=>w.active&&p.x>=w.x&&p.x<=w.x+w.w&&p.y>=w.y&&p.y<=w.y+w.h)}
export function hitObstacle(o,stage){if(o.broken||stage<o.stage)return false;o.broken=true;o.hp=0;return true}
export function collectEchoes(s,p,time,fighting){for(const e of s.echoes)if(!e.got&&Math.hypot(p.x-e.x,p.y-e.y)<=32){e.got=true;s.pending.push(e.id)}if(!fighting&&s.pending.length&&time>=s.echoUntil){const id=s.pending.shift(),e=s.echoes.find(e=>e.id===id);if(!e)return null;s.echoText=e.text;s.echoUntil=time+3;return e}return null}
export function syncStumps(platforms,trees){for(const t of trees)if(!t.hp&&!platforms.some(p=>p.id==='stump-'+t.id))platforms.push({id:'stump-'+t.id,x:t.x-20,y:t.y+20,w:40})}
export const DESKTOP_CAMERA = Object.freeze({lookAhead:.06,turnDelay:.25,response:4,deadZone:.04});
export function updateCamera(c,p,width,height,bounds,dt,snap=false,options={}){
 if(snap||!c.initialized){c.face=p.face;c.pending=p.face;c.delay=0;c.x=p.x-width/2;c.y=p.y-height/2;c.initialized=true}
 const gentle=options.gentleDesktop;
 if(gentle){
  // A tap followed by release must never trigger a delayed camera reversal.
  const direction=options.moveDirection||0;
  if(!direction||direction===c.face){c.pending=c.face;c.delay=0}
  else {if(c.pending!==direction){c.pending=direction;c.delay=0}c.delay+=dt;if(c.delay+1e-8>=DESKTOP_CAMERA.turnDelay)c.face=direction}
 }else{if(c.pending!==p.face){c.pending=p.face;c.delay=0}else c.delay+=dt;if(c.delay>=.2)c.face=c.pending}
 let targetX=p.x-width*(.5-c.face*(gentle?DESKTOP_CAMERA.lookAhead:.12));
 if(gentle){const dx=targetX-c.x,buffer=width*DESKTOP_CAMERA.deadZone;targetX=snap?c.x:Math.abs(dx)>buffer?targetX-Math.sign(dx)*buffer:c.x}
 const centerY=c.y+height/2,margin=height*.075;
 const targetY=Math.abs(p.y-centerY)>margin?p.y-height/2-Math.sign(p.y-centerY)*margin:c.y;
 const k=snap?1:1-Math.exp(-8*dt),kx=snap?1:1-Math.exp(-(gentle?DESKTOP_CAMERA.response:8)*dt);c.x+=(targetX-c.x)*kx;c.y+=(targetY-c.y)*k;
 c.x=Math.max(0,Math.min(bounds.w-width,Math.max(p.x-width+40,Math.min(p.x-40,c.x))));c.y=Math.max(0,Math.min(bounds.h-height,Math.max(p.y-height+40,Math.min(p.y-40,c.y))));return c;
}
