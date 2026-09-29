import assert from 'node:assert/strict';
import {buildAdventure,LEVEL_VERSION} from '../src/adventure.mjs';
import {createExploration,collectEchoes,updateGaze,syncWinds,windAt,hitObstacle,syncStumps,updateCamera} from '../src/exploration.mjs';
import {createFauna,updateFauna} from '../src/fauna.mjs';
import {createPhysics} from '../src/physics.mjs';
import {ordinaryWall,breakWall} from '../src/breach.mjs';
import {readSave,writeSave} from '../src/save.mjs';
const fingerprint=[];
for(let seed=0;seed<100;seed++){
 const w=buildAdventure(seed);assert.equal(w.branches.length,6);assert.deepEqual([w.rats.length,w.pureSpawns.length,w.bigSpawns.length,w.faunaSpec.trees.length,w.faunaSpec.birds.length],[12,10,3,3,6]);assert.equal(w.rewardSpec.filter(r=>r.id.startsWith('intro-energy')).reduce((n,r)=>n+r.amount,0),30);assert.equal(w.winds.length,3);
 for(const r of w.rewardSpec)assert.equal(w.map[Math.floor(r.y/32)][Math.floor(r.x/32)],0,`embedded reward ${r.id}`);
 const q=[w.main[0]],seen=new Set(q);for(let i=0;i<q.length;i++)for(const n of w.graph[q[i]])if(!seen.has(n)){seen.add(n);q.push(n)}for(const n of [...w.lightNodes,w.exitNode,...w.branches.map(b=>b.node)])assert.ok(seen.has(n));
 // Tile flood is separate from the authored graph, catches accidental corridor gaps.
 for(const wall of w.crackedSpec)breakWall({energy:30},wall,w.map,w.T,w.platforms);
 const start=[Math.floor(w.start.x/32),Math.floor(w.start.y/32)],cells=[start],visited=new Set([start.join(',')]);for(let i=0;i<cells.length;i++){const [x,y]=cells[i];for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=`${nx},${ny}`;if(w.map[ny]?.[nx]===0&&!visited.has(k)){visited.add(k);cells.push([nx,ny])}}}
 for(const p of [...w.lights,w.exit,...w.echoes,...w.rewardSpec.filter(r=>r.kind==='relic')])assert.ok(visited.has(`${Math.floor(p.x/32)},${Math.floor(p.y/32)}`));
 fingerprint.push(w.branches.map(b=>b.node).join(','));
}assert.ok(new Set(fingerprint).size>1);
for(const [dx,dy,key]of [[1,0,null],[-1,0,null],[0,-1,'up'],[0,1,'down']]){const s=createExploration({}),p={x:200,y:200,face:dx||1},w={id:'w',x:200+dx*100-16,y:200+dy*100-16,w:32,h:32};const keys=new Set(key?[key]:[]);assert.equal(updateGaze(s,p,keys,[w],.59,()=>false),null);assert.equal(updateGaze(s,p,keys,[w],.01,()=>false),w);w.discovered=false;assert.equal(updateGaze(s,p,keys,[w],1,()=>true),null)}
for(const fps of [30,60,120]){const p={x:100,y:1000,face:1,vy:0,wing:.7},map=Array.from({length:50},()=>Array(10).fill(0)),phy=createPhysics(map,32,[]);for(let i=0;i<fps;i++)phy.player(p,new Set(),1/fps,true);assert.equal(p.wing,.7);assert.ok(p.vy>=-220);assert.ok(p.y<840&&p.y>800);for(let i=0;i<fps;i++)phy.player(p,new Set(['down']),1/fps,true);assert.ok(p.y>900)}
const o={hp:1,stage:3};assert.equal(hitObstacle(o,2),false);assert.equal(hitObstacle(o,3),true);assert.equal(hitObstacle(o,3),false);
const platforms=[];syncStumps(platforms,[{id:0,hp:0,x:10,y:10}]);syncStumps(platforms,[{id:0,hp:0,x:10,y:10}]);assert.equal(platforms.length,1);
const memory=new Map(),storage={setItem:(k,v)=>memory.set(k,v),getItem:k=>memory.get(k)};const state={time:2,player:{hp:3},rats:[],walls:[],checkpoint:{x:0,y:0}};assert.ok(writeSave(storage,LEVEL_VERSION,2917,state).ok);assert.equal(readSave(storage,LEVEL_VERSION,2917).status,'ready');assert.equal(readSave(storage,'old',2917).status,'incompatible');assert.equal(writeSave({setItem(){throw Error()}},LEVEL_VERSION,2917,state).ok,false);
const w=buildAdventure(),f=createFauna(w),z=f.zones[0];z.seen=true;const n=f.birds.length,env={clear:()=>true,free:()=>true,hurt(){},visible:()=>false,regionAt:()=>99};updateFauna(f,{x:-9999,y:-9999},2,2,env);assert.equal(f.birds.length,n);env.regionAt=()=>z.region;updateFauna(f,{x:-9999,y:-9999},4,2,env);assert.ok(f.birds.length>n);
const c={};updateCamera(c,{x:1000,y:1000,face:1},960,540,{w:5000,h:5000},0,true);const y=c.y;updateCamera(c,{x:1000,y:1005,face:1},960,540,{w:5000,h:5000},.1);assert.equal(c.y,y);
console.log('PASS 100 seeded branches: graph/tile reachability, resources/counts; four-way gaze; wind FPS; obstacles/stumps; save errors; bird zones; camera buffer');

// Boundary and portal protection; the charged-light door is a gameplay predicate, not destructible terrain.
const protectionWorld=buildAdventure();protectionWorld.mazeHeight=protectionWorld.H;
for(const p of [protectionWorld.start,...protectionWorld.safes,protectionWorld.exit])for(const dir of ['up','down',null])for(const face of [-1,1]){const candidate=ordinaryWall({...p,face,abilities:{breach:true}},protectionWorld,dir);assert.equal(candidate,null)}
// Each duct has an uninterrupted vertical collision corridor after its own cover is broken.
for(const w of protectionWorld.crackedSpec)breakWall({energy:30},w,protectionWorld.map,32,protectionWorld.platforms);
for(const wind of protectionWorld.winds){const x=Math.floor((wind.x+wind.w/2)/32);for(let y=wind.y/32;y<(wind.y+wind.h)/32;y++)assert.equal(protectionWorld.map[y][x],0,wind.id+' blocked at '+y)}
console.log('PASS protected lamps/exit and all three wind shafts');

const es=createExploration({echoes:[{id:'a',x:0,y:0,text:'one'},{id:'b',x:100,y:0,text:'two'},{id:'c',x:200,y:0,text:'three'}]});
for(const [i,x]of [0,100,200].entries())assert.equal(collectEchoes(es,{x,y:0},i*4,false).text,['one','two','three'][i]);assert.equal(es.pending.length,0);
console.log('PASS three sequential memory reveals');
