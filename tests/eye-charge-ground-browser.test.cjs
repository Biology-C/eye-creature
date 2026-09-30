const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{});try{
 for(const phone of [false,true]){
 const page=await browser.newPage({viewport:phone?{width:390,height:844}:{width:1280,height:900},isMobile:phone,hasTouch:phone});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/game.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('src/game.js','utf8')+`
 window.chargeTest={update,render,pause,resume,hurt,world,pressAttack,releaseAttack,get p(){return player},get b(){return boss},get shots(){return magic.shots},get charge(){return chargeStart},get time(){return time},prepare(face=1){reset();beginBoss();resume();boss.x=400;boss.timer=999;boss.stun=9999;player.x=400-face*200;player.y=world.arena.floor-11.01;player.face=face;player.inv=9999;player.grounded=true;},tick(n,fps){for(let i=0;i<n;i++)update(1/fps);render()}};
 `}));await page.addInitScript(()=>requestAnimationFrame=()=>1);
 await page.goto((process.env.BASE_URL||'http://127.0.0.1:8768/')+'?boss-preview=1');await page.click('#start');
 const cdp=phone?await page.context().newCDPSession(page):null;let touch;
 const down=async()=>{if(!phone)return page.keyboard.down('Space');const r=await page.locator('[data-key=attack]').boundingBox();touch={id:42,x:r.x+r.width/2,y:r.y+r.height/2};await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch]})};
 const up=()=>phone?cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[touch]}):page.keyboard.up('Space');
 for(const fps of [30,60,120])for(const face of [-1,1]){
  await page.evaluate(face=>chargeTest.prepare(face),face);
  await down();await page.evaluate(fps=>chargeTest.tick(Math.ceil(fps*.9),fps),fps);await up();
  assert.deepEqual(await page.evaluate(()=>chargeTest.shots.map(s=>[s.charged,s.damage])),[[true,1.5]],JSON.stringify({phone,fps,face,state:await page.evaluate(()=>({charge:chargeTest.charge,p:chargeTest.p,time:chargeTest.time}))}));
  await page.evaluate(fps=>chargeTest.tick(1,fps),fps);assert.equal(await page.evaluate(()=>chargeTest.shots.length),1,'grounded full orb must survive launch');
  // Begin the next hold during the previous shot cooldown, before it hits.
  await down();assert.equal(await page.evaluate(()=>chargeTest.charge!==null),true);
  await page.evaluate(fps=>chargeTest.tick(Math.ceil(fps*.9),fps),fps);assert.equal(await page.evaluate(()=>chargeTest.b.hp),28.5);
  await up();assert.deepEqual(await page.evaluate(()=>chargeTest.shots.map(s=>[s.charged,s.damage])),[[true,1.5]],JSON.stringify({phone,fps,face,state:await page.evaluate(()=>({charge:chargeTest.charge,p:chargeTest.p,time:chargeTest.time}))}));
  await page.evaluate(fps=>chargeTest.tick(fps,fps),fps);assert.equal(await page.evaluate(()=>chargeTest.b.hp),27);
  await page.evaluate(fps=>chargeTest.tick(fps,fps),fps);assert.equal(await page.evaluate(()=>chargeTest.b.hp),27,'each orb damages once');
 }
 // Short taps stay at 1 damage; a too-early tap must not bypass cooldown.
 await page.evaluate(()=>chargeTest.prepare());await down();await up();assert.equal(await page.evaluate(()=>chargeTest.shots[0].damage),1);await down();await up();assert.equal(await page.evaluate(()=>chargeTest.shots.length),1);
 await page.evaluate(()=>chargeTest.tick(60,60));assert.equal(await page.evaluate(()=>chargeTest.b.hp),29);
 // Charged spells still stop at the locked door instead of passing through it.
 const wall=await page.evaluate(()=>{const t=chargeTest;t.prepare();t.p.x=660;t.p.face=1;t.pressAttack();t.tick(55,60);t.releaseAttack();t.tick(30,60);return {shots:t.shots.length,hp:t.b.hp}});assert.deepEqual(wall,{shots:0,hp:30});
 // Pause and transformation cancel a held spell rather than firing it later.
 await page.evaluate(()=>chargeTest.prepare());await down();await page.evaluate(()=>{chargeTest.tick(55,60);chargeTest.pause();chargeTest.resume()});await up();assert.equal(await page.evaluate(()=>chargeTest.shots.length),0);
 await page.evaluate(()=>chargeTest.prepare());await down();await page.evaluate(()=>{chargeTest.tick(55,60);chargeTest.b.cursed=true;chargeTest.tick(1,60)});await up();assert.equal(await page.evaluate(()=>chargeTest.shots.length),0);
 assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS desktop/touch grounded full charge 1.5 damage, both directions, charge during cooldown, no double hit, normal/cooldown/wall/pause/transform rules, 30/60/120 FPS');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
