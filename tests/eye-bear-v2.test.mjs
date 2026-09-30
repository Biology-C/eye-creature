import assert from 'node:assert/strict';
import {buildMaze} from '../src/maze.mjs';
import {createPhysics} from '../src/physics.mjs';
import {addBossArena,createBoss,enterBoss,resetBoss,updateBoss,bossSummons} from '../src/boss.mjs';
import {setSlimeForm,startSlimeAttack,updateSlimePlayer} from '../src/player-form.mjs';
const w=buildMaze();addBossArena(w);
const b=createBoss(w),p={};enterBoss(b,p,w.arena);p.x=400;
const waves=[],events={clear:()=>true,hurt:()=>{},summon:(k,i)=>waves.push([i,k.length])};
for(const hp of [23,22.5,22.5,16,15,15,7,6,6]){b.hp=hp;updateBoss(b,p,.01,0,events)}
assert.deepEqual(waves,[[0,2],[1,3],[2,1]]);
resetBoss(b);enterBoss(b,p,w.arena);b.hp=5;waves.length=0;updateBoss(b,p,.01,0,events);assert.equal(waves.length,3);
assert.equal(bossSummons(b,p,['rat','slime','big'],5).length,1);
const summons=bossSummons(b,p,['rat','slime','big']);assert.deepEqual(summons.map(s=>s.hp),[2,1,3]);assert.equal(new Set(summons.map(s=>s.id)).size,3);
for(const s of summons)assert.equal(w.map[Math.floor((s.y+s.bodyRadius+1)/32)][Math.floor(s.x/32)],1);
const flight=[];
for(const fps of [30,60,120]){
 const boss=createBoss(w),player={};enterBoss(boss,player,w.arena);player.x=400;
 boss.cursed=true;boss.state='ready';boss.attack='stomp';boss.timer=.01;
 let dropped=0,cured=0;
 const hooks={...events,mirrorDrop:()=>dropped++,cured:()=>cured++};
 for(let i=0;i<fps*2;i++)updateBoss(boss,player,1/fps,i/fps,hooks);
 assert.equal(dropped,1);assert.equal(boss.mirrors.length,1);assert.ok(boss.mirrors[0].landed);
 const mirror=boss.mirrors[0];assert.ok(Math.abs(mirror.x-boss.x)>126);assert.equal(mirror.y,w.arena.floor-16);
 Object.assign(player,{x:mirror.x,y:mirror.y});updateBoss(boss,player,1/fps,3,hooks);assert.equal(cured,1);assert.equal(boss.cursed,false);assert.equal(boss.mirrors.length,0);
 boss.state='ready';boss.attack='bolt';boss.timer=.001;boss.aim=Math.PI;let hits=0;
 player.x=boss.x-110;player.y=boss.y-17;
 for(let i=0;i<fps;i++)updateBoss(boss,player,1/fps,4+i/fps,{clear:()=>true,hurt:()=>hits++});assert.ok(hits>0);
 // A wall between projectile and player must absorb every bolt.
 boss.shots=[{x:300,y:100,vx:245,vy:0,life:3,radius:9,kind:'bolt'}];boss.arena={...boss.arena,top:0,floor:500};boss.timer=10;
 player.x=400;player.y=100;hits=0;updateBoss(boss,player,.8,6,{clear:()=>true,solid:(x)=>x>=330&&x<=345,hurt:()=>hits++});assert.equal(hits,0);assert.equal(boss.shots.length,0);
 resetBoss(boss);assert.equal(boss.hp,30);assert.deepEqual(boss.waves,[]);assert.deepEqual(boss.mirrors,[]);assert.deepEqual(boss.shots,[]);
 const map=Array.from({length:20},(_,y)=>Array.from({length:24},(_,x)=>y===19||x===0||x===23||y===0?1:0));
 const physics=createPhysics(map,32,[]),slime={x:160,y:19*32-11.01,grounded:true,face:1,hp:4,wing:.7,abilities:{dash:true}};
 setSlimeForm(slime,true);assert.ok(startSlimeAttack(slime));assert.equal(startSlimeAttack(slime),false);
 for(let i=0;i<fps;i++)updateSlimePlayer(slime,new Set(),1/fps,physics);
 assert.equal(slime.hp,4);assert.equal(slime.wing,.7);assert.equal(slime.dashRemaining,0);assert.ok(slime.grounded);flight.push(slime.x);
 // Holding jump produces a ballistic arc, never sustained flight.
 slime.x=160;let minY=slime.y;for(let i=0;i<fps*.7;i++){updateSlimePlayer(slime,new Set(['up','right']),1/fps,physics);minY=Math.min(minY,slime.y)}assert.ok(minY<540);assert.ok(slime.vy>0);
 Object.assign(slime,{x:23*32-11.01,y:300,vy:0,surface:null,slimeAttack:0});updateSlimePlayer(slime,new Set(['up','right']),1/fps,physics);assert.equal(slime.surface,'right');const y=slime.y;updateSlimePlayer(slime,new Set(['up']),.5,physics);assert.ok(slime.y<y);
 Object.assign(slime,{x:300,y:32+11.01,surface:'ceiling'});updateSlimePlayer(slime,new Set(['right']),.25,physics);assert.ok(slime.x>300);updateSlimePlayer(slime,new Set(['down']),.1,physics);assert.equal(slime.surface,null);
 setSlimeForm(slime,false);assert.equal(slime.slimeForm,false);assert.equal(startSlimeAttack(slime),false);
}
assert.ok(Math.max(...flight)-Math.min(...flight)<2);
// A death callback must not restore surviving projectiles after reset via Array.filter.
enterBoss(b,p,w.arena);b.timer=999;b.shots=[{x:p.x,y:p.y,vx:0,vy:0,life:2,radius:9,kind:'bolt'},{x:p.x+100,y:p.y,vx:0,vy:0,life:2,radius:9,kind:'bolt'}];
updateBoss(b,p,.05,0,{clear:()=>true,hurt:()=>resetBoss(b)});assert.equal(b.active,false);assert.equal(b.shots.length,0);
console.log('PASS threshold waves once, multi-threshold hit, grounded summons, stomp mirror/cure, projectile collision, reset, slime jump/climb/contact attack, 30/60/120 FPS');
