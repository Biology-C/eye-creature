import assert from 'node:assert/strict';
import {inMelee} from '../src/combat.mjs';
for(const face of [-1,1]){const p={x:0,y:0,face};assert.ok(inMelee(p,{x:face*105,y:55,hp:2},()=>true));assert.equal(inMelee(p,{x:face*115,y:0,hp:2},()=>true),false);assert.equal(inMelee(p,{x:-face*40,y:0,hp:2},()=>true),false);assert.equal(inMelee(p,{x:face*50,y:0,hp:2},()=>false),false);}
console.log('PASS shared melee selection/damage bounds, target body tolerance, facing and wall block');
