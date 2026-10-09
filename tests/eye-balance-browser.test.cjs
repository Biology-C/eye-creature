const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{});try{
 const p=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>requestAnimationFrame=()=>1);
 await p.route('**/src/game.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('src/game.js','utf8')+`
 window.balance={
 prepare(){reset();beginBoss();resume();boss.x=500;boss.timer=9999;boss.stun=9999;Object.assign(player,{x:300,y:world.arena.floor-11.01,vy:0,face:1,inv:9999,grounded:true,abilities:{spread:true}});rats.forEach(r=>{r.hp=0;r.split=!!r.big});fauna.birds.forEach(r=>r.hp=0);fauna.trees.forEach(r=>r.hp=0)},
 tick(n){for(let i=0;i<n;i++){boss.x=500;boss.stun=9999;update(1/60);for(const r of rats.filter(r=>r.bossMinion)){r.x=world.arena.right-40;r.stun=9999}}},
 shot(charged){pressAttack();if(charged)this.tick(55);releaseAttack();const projectiles=magic.shots.map(s=>({damage:s.damage,charged:s.charged}));this.tick(35);return {projectiles,hp:boss.hp,waves:[...boss.waves]}},
 hud(){const texts=[],widths=[],fillText=g.fillText,fillRect=g.fillRect;g.fillText=function(t,...a){texts.push(t);return fillText.call(this,t,...a)};g.fillRect=function(x,y,w,h){if(this.fillStyle==='#d7777c')widths.push(w);return fillRect.call(this,x,y,w,h)};try{render()}finally{g.fillText=fillText;g.fillRect=fillRect}return {texts,widths}},
 retry(){player.inv=0;player.hp=1;hurt('test');const hp=boss.hp;beginBoss();return {hp,entry:boss.hp,max:boss.maxHp}},
 rat(charged){this.prepare();boss.active=false;const r=rats[0];Object.assign(r,{x:500,y:world.arena.floor-14.01,hp:2,state:'walk',stun:9999,vy:0});this.shot(charged);const first=r.hp;this.tick(5);if(!charged)this.shot(false);this.tick(60);return {first,final:r.hp,split:r.split||false,active:rats.filter(e=>e.hp>0).length}},
 };
 `}));await p.goto((process.env.BASE_URL||'http://127.0.0.1:8768/')+'?boss-preview=1');await p.locator('#start:not([disabled])').waitFor();await p.click('#start');
 assert.deepEqual(await p.evaluate(()=>[levelSnapshot().boss.hp,levelSnapshot().boss.maxHp]),[36,36]);
 await p.evaluate(()=>balance.prepare());assert.ok((await p.evaluate(()=>balance.hud())).texts.includes('紅熊 36 / 36'));assert.deepEqual((await p.evaluate(()=>balance.hud())).widths,[240]);
 for(let shot=1;shot<=12;shot++){
  const result=await p.evaluate(()=>balance.shot(true));assert.deepEqual(result.projectiles,[{damage:3,charged:true}]);assert.equal(result.hp,36-shot*3);
  assert.deepEqual(result.waves,shot<3?[]:shot<6?[0]:shot<10?[0,1]:[0,1,2]);
  if(shot===1){const hud=await p.evaluate(()=>balance.hud());assert.ok(hud.texts.includes('紅熊 33 / 36'));assert.deepEqual(hud.widths,[220])}
 }
 await p.evaluate(()=>{balance.prepare();balance.shot(true)});assert.deepEqual(await p.evaluate(()=>balance.retry()),{hp:36,entry:36,max:36});
 await p.evaluate(()=>balance.prepare());const normal=await p.evaluate(()=>balance.shot(false));assert.deepEqual(normal.projectiles,Array.from({length:3},()=>({damage:1,charged:false})));assert.equal(normal.hp,35);
 assert.deepEqual(await p.evaluate(()=>balance.rat(true)),{first:0,final:0,split:false,active:0});
 assert.deepEqual(await p.evaluate(()=>balance.rat(false)),{first:1,final:0,split:false,active:0});
 const healingColors=await p.evaluate(async()=>{
  const {drawPickupIcon}=await import('/src/pickup-art.mjs'),{drawRecovery}=await import('/src/boss-recovery.mjs');
  const c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d',{willReadFrequently:true});
  return [()=>drawPickupIcon(g,'wing',48,48),()=>drawRecovery(g,{recovery:{x:48,y:48}},0,true)].map(draw=>{g.clearRect(0,0,96,96);draw();const data=g.getImageData(0,0,96,96).data;let pixels=0,green=0;for(let i=0;i<data.length;i+=4)if(data[i+3]>200){pixels++;if(data[i+1]>data[i]&&data[i+1]>data[i+2])green++}return pixels>0&&green===pixels});
 });assert.deepEqual(healingColors,[true,true]);assert.ok((await p.locator('#healing').innerText()).includes('綠能回血'));
 assert.deepEqual(errors,[]);console.log('PASS actual charge/release: 12 x 3 defeats 36HP bear, dynamic HUD/bar, thresholds once, retry 36, spread normal only, charged rat instant defeat/nonnegative/no slime residue, normal two-stage rat');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
