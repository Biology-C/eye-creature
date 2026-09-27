import assert from 'node:assert/strict';
import {createMagic,castLight,updateMagic} from '../src/magic.mjs';
for(const face of [-1,1])for(const fps of [30,60,120]){
 const s=createMagic(),p={x:0,y:0,face},a={x:face*100,y:0,hp:2},b={x:face*180,y:0,hp:2};
 assert.ok(castLight(s,p,0));assert.equal(castLight(s,p,.1),false);
 for(let i=0;i<fps;i++)updateMagic(s,1/fps,i/fps,{solid:()=>false,targets:[a,b],hit:t=>t.hp--});
 assert.equal(a.hp,1);assert.equal(b.hp,2);assert.equal(s.shots.length,0);
 castLight(s,p,1);updateMagic(s,1,2,{solid:x=>Math.abs(x)>40,targets:[a],hit:t=>t.hp--});assert.equal(a.hp,1);assert.equal(s.shots.length,0);
 castLight(s,p,3);updateMagic(s,1,4,{solid:()=>false,targets:[],hit:()=>{}});assert.equal(s.shots.length,0);
}
console.log('PASS light cooldown, both directions, first hit only, swept walls, max range at 30/60/120 fps');
