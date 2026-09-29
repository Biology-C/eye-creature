import assert from 'node:assert/strict';
import {spikeState,touchesSpikes} from '../src/traps.mjs';
import {buildMaze} from '../src/maze.mjs';
const t={x:100,y:300,w:64},p={x:132,y:289};
assert.equal(spikeState(0).active,false);assert.equal(spikeState(2.5).warning,true);assert.equal(touchesSpikes(p,t,2.99),false);assert.equal(spikeState(3.3).height,38);assert.equal(touchesSpikes(p,t,3.3),true);assert.equal(touchesSpikes(p,t,6),false);assert.equal(touchesSpikes({...p,y:250},t,3.3),false);assert.equal(touchesSpikes({...p,x:80},t,3.3),false);
for(const time of [0,1,2.5,3.5,5.5])assert.equal(spikeState(time).height,spikeState(time+6).height);
const w=buildMaze();assert.equal(w.traps.length,3);for(const t of w.traps){const row=t.y/32;for(let x=Math.floor(t.x/32);x<Math.ceil((t.x+t.w)/32);x++)assert.equal(w.map[row][x],1);assert.ok(w.safes.every(s=>Math.hypot(s.x-t.x,s.y-t.y)>100));assert.ok(w.rats.every(r=>Math.abs(r.y-t.y)>50||Math.abs(r.x-t.x)>160))}
console.log('PASS: timing, warning, raised/retracted hitboxes, safe overhead/side, solid floors and separated placements');
