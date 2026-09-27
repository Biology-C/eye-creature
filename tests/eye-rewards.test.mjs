import assert from 'node:assert/strict';
import {buildMaze} from '../src/maze.mjs';
import {createRewards,collectReward} from '../src/rewards.mjs';
const w=buildMaze(),r=createRewards(w),p={wing:.1,hp:1.5,healCharge:0};
assert.deepEqual(r,createRewards(w));assert.equal(r.filter(r=>r.kind==='relic').length,3);
for(const a of r){assert.equal(w.map[Math.floor(a.y/32)][Math.floor(a.x/32)],0);if(a.kind==='relic')assert.equal(w.graph[a.node].length,1)}
const shards=r.filter(r=>r.kind==='wing');
assert.equal(collectReward(shards[0],p,.7,10),true);assert.ok(Math.abs(p.wing-.38)<.0001);assert.equal(p.healCharge,40);assert.equal(p.hp,1.5);
assert.equal(collectReward(shards[0],p,.7,20),false);assert.equal(p.healCharge,40);
p.wing=.7;assert.equal(collectReward(shards[1],p,.7,20),true);assert.equal(p.wing,.7);assert.equal(p.healCharge,80);
collectReward(shards[2],p,.7,21);assert.equal(p.hp,2);assert.equal(p.healCharge,20);assert.equal(shards[2].healed,.5);
collectReward(shards[3],p,.7,22);collectReward(shards[4],p,.7,23);assert.equal(p.hp,2.5);assert.equal(p.healCharge,0);
p.healCharge=80;collectReward(shards[5],p,.7,24);assert.equal(p.hp,3);assert.equal(p.healCharge,20);
p.healCharge=80;collectReward(shards[6],p,.7,25);assert.equal(p.hp,3);assert.equal(p.healCharge,20);assert.equal(shards[6].healed,0);
assert.equal(collectReward(r.find(r=>r.kind==='relic'),p,.7,26),true);assert.equal(p.healCharge,20);
collectReward(r.find(r=>r.kind==='energy'),p,.7,27);assert.equal(p.healCharge,20);assert.equal(p.energy,1);
console.log('Rewards: deterministic, once-only, full stamina absorption, 100% half-heart healing, overflow, health cap, separate orange energy passed');
