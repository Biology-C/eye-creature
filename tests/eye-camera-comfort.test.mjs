import assert from 'node:assert/strict';
import {updateCamera,DESKTOP_CAMERA} from '../src/exploration.mjs';
const bounds={w:8000,h:4000},w=960,h=540;
assert.equal(DESKTOP_CAMERA.lookAhead,.06);
function scenario(fps,gentleDesktop=true){
 const p={x:3000,y:1000,face:1},c={},dt=1/fps;
 function step(direction,speed=0){if(direction)p.face=direction;p.x+=direction*speed*dt;updateCamera(c,p,w,h,bounds,dt,false,{gentleDesktop,moveDirection:direction});assert.ok(p.x-c.x>=40-1e-6&&p.x-c.x<=w-40+1e-6)}
 function hold(seconds,direction,speed=0){for(let i=0;i<Math.round(seconds*fps);i++)step(direction,speed)}
 updateCamera(c,p,w,h,bounds,0,true,{gentleDesktop,moveDirection:0});
 assert.ok(Number.isFinite(c.x));hold(3,1);const right=c.x;
 hold(.1,-1);hold(1,0);
 if(gentleDesktop)assert.equal(c.face,1,'released tap must not reverse the camera later');
 hold(3,-1);const left=c.x;
 hold(2,1,400);const moving=c.x;
 hold(.3,1,1100); // dash: safety clamp must retain player on screen
 updateCamera(c,{x:100,y:80,face:1},w,h,bounds,0,true,{gentleDesktop,moveDirection:0});assert.equal(c.x,0);assert.equal(c.y,0);
 return {swing:right-left,moving};
}
const old=scenario(60,false),results=[30,60,120].map(fps=>scenario(fps));
for(const r of results)assert.ok(r.swing<=old.swing/2,JSON.stringify({old,r}));
assert.ok(Math.max(...results.map(r=>r.moving))-Math.min(...results.map(r=>r.moving))<9,'frame rates should differ by less than one small movement step');
const c={},p={x:3000,y:1000,face:1};updateCamera(c,p,w,h,bounds,0,true,{gentleDesktop:true});
for(let i=0;i<14;i++)updateCamera(c,{...p,face:-1},w,h,bounds,1/60,false,{gentleDesktop:true,moveDirection:-1});assert.equal(c.face,1);
updateCamera(c,{...p,face:-1},w,h,bounds,1/60,false,{gentleDesktop:true,moveDirection:-1});assert.equal(c.face,-1);
console.log('PASS camera comfort: held-direction delay, released taps, half-amplitude limit, FPS, dash and respawn',JSON.stringify({oldSwing:old.swing,newSwing:results[1].swing}));
