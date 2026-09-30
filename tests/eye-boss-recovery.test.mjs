import assert from 'node:assert/strict';
import {buildAdventure} from '../src/adventure.mjs';
import {addBossArena,createBoss,enterBoss,resetBoss,updateBoss} from '../src/boss.mjs';
import {collectRecovery} from '../src/boss-recovery.mjs';
import {MAX_HP} from '../src/health.mjs';
const w=buildAdventure();addBossArena(w);
function encounter(hp=2){const b=createBoss(w),p={};enterBoss(b,p,w.arena);p.hp=hp;p.x=400;p.y=w.arena.floor-100;return {b,p}}
function stomp(b,p,time){b.state='ready';b.attack='stomp';b.timer=.001;updateBoss(b,p,.002,time,{clear:()=>true,hurt:()=>{}})}
for(const hp of [.5,1,2,3,4,5]){const {b,p}=encounter(hp);stomp(b,p,1);assert.equal(!!b.recovery,hp<=2);assert.equal(b.hp,30)}
const {b,p}=encounter();stomp(b,p,1);const first={...b.recovery};stomp(b,p,50);assert.deepEqual(b.recovery,first,'existing energy is never replaced or expired');
Object.assign(p,b.recovery);assert.ok(collectRecovery(b,p));assert.equal(p.hp,3);assert.equal(collectRecovery(b,p),false);
p.hp=2;p.y=w.arena.floor-100;stomp(b,p,20.999);assert.equal(b.recovery,null);stomp(b,p,21);assert.equal(b.recovery,null);stomp(b,p,21.001);assert.ok(b.recovery);
Object.assign(p,b.recovery);p.hp=MAX_HP-.5;collectRecovery(b,p);assert.equal(p.hp,MAX_HP);
// All legal bear positions have a deterministic, grounded, clear drop, even with the mirror.
for(let x=w.arena.left+66;x<=w.arena.right-68;x+=1){const {b,p}=encounter();b.x=x;b.cursed=true;stomp(b,p,1);assert.ok(b.recovery,`no drop at ${x}`);assert.ok(Math.abs(b.recovery.x-b.x)>=246);assert.ok(Math.abs(b.recovery.x-b.mirrors[0].x)>=120);assert.equal(b.recovery.y,w.arena.floor-17);assert.equal(w.map[Math.floor(w.arena.floor/32)][Math.floor(b.recovery.x/32)],1)}
for(const reset of [b=>resetBoss(b),b=>enterBoss(b,p,w.arena),b=>{b.hp=0;updateBoss(b,p,.01,2,{})}]){const {b,p}=encounter();stomp(b,p,1);reset(b);assert.equal(b.recovery,null)}
// Death inside the stomp must not leave a new reward behind after reset.
const dead=encounter();dead.p.x=dead.b.x;dead.p.y=w.arena.floor-11;dead.b.state='ready';dead.b.attack='stomp';dead.b.timer=.001;updateBoss(dead.b,dead.p,.01,1,{clear:()=>true,hurt:()=>resetBoss(dead.b)});assert.equal(dead.b.recovery,null);
console.log('PASS deterministic low-HP recovery, strict 20s cooldown, singleton/no expiry, all arena drop positions and mirror spacing, capped healing, death/retry/victory cleanup');
