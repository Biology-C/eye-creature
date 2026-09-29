import assert from 'node:assert/strict';
import {createPhysics,startDash} from '../src/physics.mjs';
import {updateRat} from '../src/rats.mjs';
const map=Array.from({length:12},(_,y)=>Array.from({length:30},(_,x)=>y===0||y>=10||x===0||x===29?1:0));
const ph=createPhysics(map,32,[]);
for(const fps of [30,60,120]){const p={x:200,y:200,face:1,wing:.7,vy:0};assert.ok(startDash(p));assert.equal(startDash(p),false);for(let i=0;i<Math.round(fps*.2);i++)ph.player(p,new Set(),1/fps);assert.ok(Math.abs(p.x-317)<.01);assert.equal(startDash(p),false);for(let i=0;i<fps*1.2;i++)ph.player(p,new Set(),1/fps);assert.ok(startDash(p));}
for(const face of [-1,1]){const p={x:face===1?905:50,y:200,face,wing:.7,vy:0};startDash(p);for(let i=0;i<24;i++)ph.player(p,new Set(),1/120);assert.ok(p.x>=43&&p.x<917);}
const r={x:200,y:305.99,face:1,hp:2,state:'walk',timer:0,stun:0,vy:0,a:100,b:500};const target={x:260,y:305.99};let low=r.y,jumped=false,landed=false;
for(let i=0;i<180;i++){updateRat(r,target,ph,1/120,i/120,()=>true);low=Math.min(low,r.y);jumped ||= r.state==='jump';landed ||= jumped&&r.grounded&&r.state==='rest';}
assert.ok(jumped&&landed);assert.ok(low<280);assert.ok(r.x>250);
r.hp=1;r.state='walk';r.x=200;r.y=305.99;r.vy=0;let slimeLow=r.y,slimeLanded=false;for(let i=0;i<180;i++){updateRat(r,target,ph,1/120,3+i/120,()=>true);slimeLow=Math.min(slimeLow,r.y);if(slimeLow<300&&r.grounded)slimeLanded=true}assert.ok(slimeLow<290&&slimeLow>low);assert.ok(slimeLanded);
console.log('PASS dash physics; rat and slime jump, gravity and land; slime hop lower');
