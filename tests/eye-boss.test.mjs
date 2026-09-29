import assert from 'node:assert/strict';
import {buildMaze} from '../src/maze.mjs';
import {addBossArena,createBoss,enterBoss,updateBoss,resetBoss} from '../src/boss.mjs';
const w=buildMaze();addBossArena(w);const b=createBoss(w),p={};enterBoss(b,p,w.arena);assert.equal(b.hp,30);assert.equal(w.map[Math.floor(p.y/32)][Math.floor(p.x/32)],0);
let hits=0;for(let i=0;i<1200;i++)updateBoss(b,p,.02,i*.02,{clear:()=>true,hurt:()=>hits++});assert.ok(b.cursed);assert.ok(hits>0);b.hp=9;resetBoss(b);assert.equal(b.hp,30);assert.equal(b.active,false);assert.equal(b.cursed,false);b.hp=0;resetBoss(b);assert.equal(b.hp,0);
console.log('PASS arena placement, red bear 30HP, telegraph/strike/curse, retry reset, defeated boss remains defeated');
