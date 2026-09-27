import assert from 'node:assert/strict';
import {createTorches,discoverTorches} from '../src/torches.mjs';
import {buildMaze} from '../src/maze.mjs';
const world=buildMaze(),list=createTorches(world);assert.ok(list.length>0);assert.ok(list.every(t=>!t.lit));
const t=list[0];discoverTorches(list,{x:t.x,y:t.y},()=>false);assert.equal(t.lit,false);discoverTorches(list,{x:t.x+161,y:t.y},()=>true);assert.equal(t.lit,false);discoverTorches(list,{x:t.x+40,y:t.y},()=>true);assert.equal(t.lit,true);discoverTorches(list,{x:-10000,y:-10000},()=>false);assert.equal(t.lit,true);assert.ok(list.some(t=>!t.lit));assert.ok(createTorches(world).every(t=>!t.lit));console.log('PASS: unlit initial state, wall/range blocking, ignition, persistence and reset');
