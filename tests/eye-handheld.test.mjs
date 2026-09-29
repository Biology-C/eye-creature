import assert from 'node:assert/strict';
import {buildMaze} from '../src/maze.mjs';
import {createFauna} from '../src/fauna.mjs';
import {addSurfaceSpikes,removeSpikeShelters} from '../src/traps.mjs';
import {createSceneMirrors,nearbyTouchSideWall,attackIntent,validBreachHold} from '../src/handheld.mjs';
for(let seed=0;seed<100;seed++){
 const w=buildMaze(seed);addSurfaceSpikes(w);removeSpikeShelters(w);const zones=createFauna(w).zones;
 const before=JSON.stringify(w.map),mirrors=createSceneMirrors(w,zones);
 assert.equal(mirrors.length,20);assert.equal(JSON.stringify(w.map),before,'props do not change the original map');
 for(const m of mirrors){assert.equal(w.map[Math.floor(m.y/32)][Math.floor(m.x/32)],0);assert.equal(w.map[Math.floor((m.y+29)/32)][Math.floor(m.x/32)],1);assert.ok(w.traps.every(t=>Math.hypot(t.x-m.x,t.y-m.y-28)>=110));}
}
const wall={id:'w',x:100,y:100,w:96,h:96},p={x:75,y:217,face:1};
assert.equal(nearbyTouchSideWall(p,[wall]),wall);
assert.equal(nearbyTouchSideWall({...p,y:229},[wall]),null);
assert.equal(nearbyTouchSideWall({...p,x:40},[wall]),null);
assert.equal(nearbyTouchSideWall({...p,face:-1},[wall]),null);
assert.equal(nearbyTouchSideWall(p,[wall],'up'),null);
assert.equal(nearbyTouchSideWall(p,[{...wall,broken:true}]),null);
const s={wall,energy:30,cost:30,melee:false,combo:false};
assert.equal(attackIntent(s),'breach');assert.equal(attackIntent({...s,energy:29}),'magic');assert.equal(attackIntent({...s,melee:true}),'melee');assert.equal(attackIntent({...s,combo:true}),'melee');
assert.ok(validBreachHold({id:'w'},wall,false,30,30));assert.equal(validBreachHold({id:'w'},wall,true,30,30),false);assert.equal(validBreachHold({id:'w'},{id:'other'},false,30,30),false);
console.log('PASS original map remains unchanged, 20 safe mirrors over 100 seeds, grounded phone breach aiming and action priority');
