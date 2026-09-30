const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>window.requestAnimationFrame=()=>1);
 await page.route('**/src/game.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('src/game.js','utf8')+`
 window.ba={reset,resume,beginBoss,update,mirror,hurt,pressAttack,releaseAttack,applySlimeHit,attack,fireLight,dash,syncForm,syncChargeSound,finishBoss,saveCheckpoint,restoreCheckpoint,captureCheckpoint,breach,keys,world,combatSounds,music,sfx,sceneMirrors,
 get p(){return player},get b(){return boss},get rats(){return rats},get fauna(){return fauna},get env(){return exploration},get walls(){return crackedWalls},get mode(){return mode},get t(){return time},get magic(){return magic},calls:[],
 prepare(){reset();resume();rats.forEach(r=>r.hp=0);fauna.birds.forEach(r=>r.hp=0);fauna.trees.forEach(r=>r.hp=0);rewards.forEach(r=>r.got=true);player.inv=1e9;ba.calls=[]},
 arena(){ba.prepare();beginBoss();boss.timer=999;boss.stun=1e9;ba.calls=[]},
 tick(n){for(let i=0;i<n;i++)update(.01)},
 enterFromExit(){lights.forEach(l=>l.got=true);Object.assign(player,world.exit);update(.001)}};
 const oldPlay=sfx.play;sfx.play=(name,opts)=>{ba.calls.push({name,...opts});return oldPlay(name,opts)};
 `}));
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:8768/');await page.click('#start');
 const mirror=await page.evaluate(()=>{const t=ba;t.prepare();t.mirror();const noTarget=t.calls.length;t.fauna.mirrorReady=0;Object.assign(t.fauna.birds[0],{x:t.p.x+40,y:t.p.y-10,hp:1,mode:'circle'});t.mirror();t.mirror();return {noTarget,calls:t.calls}});
 assert.deepEqual(mirror,{noTarget:0,calls:[{name:'mirror'}]});
 const curse=await page.evaluate(()=>{const t=ba;t.arena();t.pressAttack();t.tick(15);t.syncChargeSound();const charging=t.sfx.charging;t.b.cursed=true;t.tick(2);t.syncChargeSound();return {charging,stopped:!t.sfx.charging,form:t.p.slimeForm,calls:t.calls}});
 assert.deepEqual(curse,{charging:true,stopped:true,form:true,calls:[{name:'curse'}]});
 const hop=await page.evaluate(()=>{const t=ba;t.calls=[];Object.assign(t.p,{x:t.b.x-24,y:t.b.y,face:1});t.pressAttack();t.applySlimeHit();t.applySlimeHit();t.combatSounds.flush();return {hp:t.b.hp,calls:t.calls}});
 assert.deepEqual(hop,{hp:29,calls:[{name:'hit',big:true}]});
 const cure=await page.evaluate(()=>{const t=ba;t.calls=[];const x=t.world.arena.left+104;Object.assign(t.p,{x,y:t.world.arena.floor-11.01});t.b.mirrors=[{x,y:t.world.arena.floor-16,vy:0,landed:true}];t.tick(2);return {form:t.p.slimeForm,calls:t.calls}});
 assert.deepEqual(cure,{form:false,calls:[{name:'mirror'}]});
 const summons=await page.evaluate(()=>{const t=ba;t.arena();t.b.hp=6;t.tick(2);const first=t.calls.filter(c=>c.name==='bossSummon').length;t.b.hp=5;t.tick(2);return {first,total:t.calls.filter(c=>c.name==='bossSummon').length,waves:t.b.waves,ids:t.rats.filter(r=>r.bossMinion).map(r=>r.id)}});
 assert.equal(summons.first,1);assert.equal(summons.total,1);assert.deepEqual(summons.waves,[0,1,2]);assert.equal(new Set(summons.ids).size,6);
 const split=await page.evaluate(()=>{const t=ba,r=t.rats.find(r=>r.bossMinion&&r.big);r.hp=0;t.tick(1);const ids=t.rats.filter(r=>r.bossMinion&&r.child).map(r=>r.id);return ids});assert.equal(split.length,4);assert.equal(new Set(split).size,4);
 // Every lethal damage path uses the same boss-defeat priority, including slime form.
 for(const action of ['melee','magic','dash','hop']){
  const defeat=await page.evaluate(action=>{const t=ba;t.arena();t.b.hp=1;Object.assign(t.p,{x:t.b.x-35,y:t.b.y,face:1});
   if(action==='hop'){t.b.cursed=true;t.syncForm();t.calls=[];t.pressAttack();t.applySlimeHit()}
   if(action==='melee')t.attack();
   if(action==='magic'){t.fireLight();t.tick(8)}
   if(action==='dash'){t.p.abilities.dash=true;t.dash();t.tick(8)}
   t.finishBoss();t.combatSounds.flush();t.tick(2);
   return {hp:t.b.hp,form:!!t.p.slimeForm,calls:t.calls.filter(c=>['hit','defeat','bossDefeat'].includes(c.name))};
  },action);assert.deepEqual(defeat,{hp:0,form:false,calls:[{name:'bossDefeat'}]},action);
 }
 const death=await page.evaluate(()=>{const t=ba;t.arena();t.b.cursed=true;t.syncForm();t.calls=[];t.p.inv=0;t.p.hp=1;t.hurt('紅熊吐息');t.hurt('針刺');return {hp:t.p.hp,form:!!t.p.slimeForm,calls:t.calls}});
 assert.deepEqual(death,{hp:5,form:false,calls:[{name:'death'}]});
 const clear=await page.evaluate(()=>{const t=ba;t.arena();t.music.setVolume(.2);t.b.hp=0;Object.assign(t.p,t.world.arena.exit);t.tick(2);return {mode:t.mode,calls:t.calls,volume:t.music.snapshot().volume,effective:t.music.snapshot().effectiveVolume}});
 assert.deepEqual(clear,{mode:'won',calls:[{name:'levelClear'}],volume:.2,effective:.1});
 await page.waitForTimeout(1600);assert.equal(await page.evaluate(()=>ba.music.snapshot().effectiveVolume),.2);
 // Full adventure state stays intact on boss death/retry and checkpoint restore.
 const progress=await page.evaluate(()=>{const t=ba;t.prepare();t.p.energy=30;const w=t.walls[0];Object.assign(t.p,{x:w.x-25,y:w.y+48,face:1});t.breach();t.env.echoes[0].got=true;t.env.obstacles[0].broken=true;t.env.obstacles[0].hp=0;t.p.abilities.spread=true;t.enterFromExit();const s=t.captureCheckpoint();t.b.hp=6;t.tick(1);t.b.cursed=true;t.syncForm();t.p.inv=0;t.p.hp=1;t.hurt('test');const clean=t.rats.every(r=>!r.bossMinion)&&!t.p.slimeForm&&!t.b.active;const restored=t.restoreCheckpoint(s);t.enterFromExit();return {clean,restored,wind:t.env.winds[0].active,wall:t.walls[0].broken,echo:t.env.echoes[0].got,obstacle:t.env.obstacles[0].broken,ability:t.p.abilities.spread,boss:t.b.active,waves:t.b.waves,minions:t.rats.filter(r=>r.bossMinion).length}});
 assert.deepEqual(progress,{clean:true,restored:true,wind:true,wall:true,echo:true,obstacle:true,ability:true,boss:true,waves:[],minions:0});
 await page.goto((process.env.BASE_URL||'http://127.0.0.1:8768/')+'?handheld=1');await page.click('#start');
 const phone=await page.evaluate(()=>{const t=ba;t.prepare();const m=t.sceneMirrors[0];Object.assign(t.p,m);Object.assign(t.fauna.birds[0],{x:m.x+40,y:m.y-10,hp:1,mode:'circle'});t.tick(2);return t.calls.filter(c=>c.name==='mirror')});assert.deepEqual(phone,[{name:'mirror'}]);
 assert.deepEqual(errors,[]);console.log('PASS exploration boss entry/state preservation, hop hit audio, mirror/curse/summon deduplication, all boss lethal paths, death priority, clear duck/recovery, handheld mirror');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
