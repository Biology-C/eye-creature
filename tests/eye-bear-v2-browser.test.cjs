const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{});
 try{
  for(const phone of [false,true]){
   const page=await browser.newPage({viewport:phone?{width:390,height:844}:{width:1280,height:900},hasTouch:phone,isMobile:phone});const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/game.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('src/game.js','utf8')+`
    window.v2={reset,beginBoss,update,render,pressAttack,releaseAttack,dash,breach,mirror,hurt,pause,resume,keys,world,get p(){return player},get b(){return boss},get rats(){return rats},get shots(){return magic.shots},get charge(){return chargeStart},get mode(){return mode},tick(n){for(let i=0;i<n;i++)update(.01)},prepare(){reset();beginBoss();rats.forEach(r=>r.hp=0);fauna.birds.forEach(r=>r.hp=0);fauna.trees.forEach(r=>r.hp=0);player.inv=9999;boss.timer=999;},curse(){boss.cursed=true;update(.01)}};
   `}));
   await page.addInitScript(()=>window.requestAnimationFrame=()=>1);
   await page.goto((process.env.BASE_URL||'http://127.0.0.1:8768/')+'?boss-preview=1');await page.click('#start');
   const transformed=await page.evaluate(()=>{
    const t=v2;t.prepare();t.pressAttack();t.tick(25);t.keys.add('up');t.curse();
    const cancelled=[t.p.slimeForm,t.charge,t.shots.length,t.keys.size];t.releaseAttack();t.p.energy=60;t.dash();t.mirror();t.breach();
    Object.assign(t.p,{x:t.b.x-24,y:t.b.y,face:1});t.pressAttack();t.tick(12);const hp=t.b.hp;t.tick(10);t.releaseAttack();t.render();
    return {cancelled,magic:t.shots.length,hp,after:t.b.hp,dash:t.p.dashRemaining,energy:t.p.energy,cursed:t.b.cursed};
   });
   assert.deepEqual(transformed,{cancelled:[true,null,0,0],magic:0,hp:29,after:29,dash:0,energy:60,cursed:true});
   if(phone){assert.equal(await page.locator('#flap small').textContent(),'跳躍／攀附');assert.equal(await page.locator('.attack small').textContent(),'跳撞');assert.ok(await page.locator('#dash').isDisabled())}
   const mirror=await page.evaluate(()=>{
    const t=v2;t.prepare();t.curse();Object.assign(t.p,{x:300,y:t.world.arena.floor-11.01});t.b.x=576;t.b.state='ready';t.b.attack='stomp';t.b.timer=.001;t.tick(1);const falling=t.b.mirrors.length===1&&!t.b.mirrors[0].landed;t.tick(140);t.render();return {falling,landed:t.b.mirrors[0].landed};
   });assert.deepEqual(mirror,{falling:true,landed:true});
   await page.screenshot({path:`tests/artifacts/bear-v2-slime-${phone?'phone':'desktop'}.png`});
   const cured=await page.evaluate(()=>{const t=v2,m=t.b.mirrors[0];Object.assign(t.p,{x:m.x,y:t.world.arena.floor-11.01});t.tick(1);t.keys.add('up');t.tick(5);return {form:t.p.slimeForm,cursed:t.b.cursed,mirrors:t.b.mirrors.length,flapping:t.p.flapping}});assert.deepEqual(cured,{form:false,cursed:false,mirrors:0,flapping:true});
   if(phone){assert.equal(await page.locator('#flap small').textContent(),'拍翼');assert.equal(await page.locator('#dash').isDisabled(),false)}
   const waves=await page.evaluate(()=>{
    const t=v2;t.prepare();const count=()=>t.rats.filter(r=>r.bossMinion&&r.hp).length;t.b.hp=22.5;t.tick(1);const a=count();t.tick(10);const b=count();t.b.hp=15;t.tick(1);const c=count();t.b.hp=6;t.tick(1);const d=count();
    const big=t.rats.find(r=>r.bossMinion&&r.big);big.hp=0;t.tick(1);const children=t.rats.filter(r=>r.bossMinion&&r.child).length;t.tick(1);const again=t.rats.filter(r=>r.bossMinion&&r.child).length;
    t.curse();t.p.hp=.5;t.p.inv=0;t.hurt('test');const dead={active:t.b.active,hp:t.b.hp,form:t.p.slimeForm,minions:count(),mirrors:t.b.mirrors.length,shots:t.b.shots.length};t.beginBoss();return {a,b,c,d,children,again,dead,waves:t.b.waves};
   });assert.deepEqual(waves,{a:2,b:2,c:5,d:6,children:4,again:4,dead:{active:false,hp:30,form:false,minions:0,mirrors:0,shots:0},waves:[]});
   await page.evaluate(()=>{v2.prepare();v2.b.state='ready';v2.b.attack='bolt';v2.b.aim=Math.PI;v2.b.timer=.5;v2.render()});
   await page.screenshot({path:`tests/artifacts/bear-v2-cast-${phone?'phone':'desktop'}.png`});
   await page.evaluate(()=>{v2.curse();v2.keys.add('right');v2.pressAttack();v2.pause()});assert.equal(await page.evaluate(()=>v2.mode),'paused');assert.equal(await page.evaluate(()=>v2.keys.size),0);await page.evaluate(()=>{v2.resume();v2.b.hp=0;v2.tick(1)});assert.equal(await page.evaluate(()=>v2.p.slimeForm),false);
   await page.evaluate(()=>{v2.prepare();v2.curse();v2.reset();v2.render()});
   if(phone){assert.equal(await page.locator('#flap small').textContent(),'拍翼');assert.equal(await page.locator('#dash').isDisabled(),false)}
   assert.deepEqual(errors,[]);await page.close();
  }
  console.log('PASS desktop/phone transform cancels old input, real hop attack once, no old powers, falling mirror recovery, wave counts/splitting, death/retry cleanup, pause and boss defeat');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
