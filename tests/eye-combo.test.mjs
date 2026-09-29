import assert from 'node:assert/strict';
import {inMelee} from '../src/combat.mjs';
import {castLight,createMagic,updateMagic} from '../src/magic.mjs';
for(const face of [-1,1]){
 const p={x:0,y:0,face},e={x:-face*70,y:0,hp:1};assert.equal(inMelee(p,e,()=>true),false);assert.ok(inMelee({...p,stage:2},e,()=>true));assert.equal(inMelee({...p,stage:2},e,()=>false),false);
 for(const fps of [30,60,120]){const s=createMagic();castLight(s,p,0,true);const enemy={x:face*100,y:0,hp:2};for(let i=0;i<fps;i++)updateMagic(s,1/fps,i/fps,{solid:()=>false,targets:[enemy],hit:(e,d)=>e.hp-=d});assert.equal(enemy.hp,.5);assert.equal(castLight(s,p,.499),false);assert.equal(castLight(s,p,.5),true)}
 const s=createMagic();castLight(s,p,0,true);let hits=0;updateMagic(s,1,1,{solid:x=>Math.abs(x)>50,targets:[{x:face*100,y:0,hp:2}],hit:()=>hits++});assert.equal(hits,0);
}
console.log('PASS spin both sides / wall LOS, charged 1.5 damage across FPS, 0.5 second cooldown, charged wall collision');
