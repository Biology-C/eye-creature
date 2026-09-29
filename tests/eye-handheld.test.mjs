import assert from 'node:assert/strict';
import {buildAdventure} from '../src/adventure.mjs';
import {attackIntent,validBreachHold,createSceneMirrors} from '../src/handheld.mjs';
import {addSurfaceSpikes,removeSpikeShelters} from '../src/traps.mjs';
for(let seed=0;seed<100;seed++){
 const w=buildAdventure(seed);addSurfaceSpikes(w);removeSpikeShelters(w);
 const mirrors=createSceneMirrors(w);assert.equal(mirrors.length,6);
 for(const m of mirrors){assert.equal(w.map[Math.floor(m.y/32)][Math.floor(m.x/32)],0);assert.equal(w.map[Math.floor((m.y+29)/32)][Math.floor(m.x/32)],1);assert.ok(w.traps.every(t=>Math.hypot(t.x-m.x,t.y-m.y-28)>=110));}
}
const state={melee:false,combo:false,wall:{id:'wall'},energy:30,cost:30};
assert.equal(attackIntent(state),'breach');assert.equal(attackIntent({...state,melee:true}),'melee');assert.equal(attackIntent({...state,combo:true}),'melee');assert.equal(attackIntent({...state,energy:29}),'magic');assert.equal(attackIntent({...state,wall:null}),'magic');
assert.ok(validBreachHold({id:'wall'},{id:'wall'},false,30,30));
assert.equal(validBreachHold({id:'wall'},{id:'other'},false,30,30),false);
assert.equal(validBreachHold({id:'wall'},{id:'wall'},true,30,30),false);
assert.equal(validBreachHold({id:'wall'},null,false,30,30),false);
console.log('PASS phone action priority, held-target validation and safe scene mirrors over 100 seeds');
