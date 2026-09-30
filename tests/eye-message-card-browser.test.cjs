const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{});try{
 for(const size of [{width:1280,height:720},{width:390,height:844},{width:844,height:390}]){
 const phone=size.width<900,p=await browser.newPage({viewport:size,isMobile:phone,hasTouch:phone}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>window.requestAnimationFrame=()=>1);
 await p.route('**/src/game.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('src/game.js','utf8')+`
 window.mc={update,loop,render,pause,resume,keys,pressAttack,releaseAttack,syncChargeSound,beginBoss,sfx,world,get player(){return player},get boss(){return boss},get env(){return exploration},get mode(){return mode},get shots(){return magic.shots},get charge(){return chargeStart},get time(){return time},get attack(){return attackUntil},calls:[],
 prepare(){reset();resume();player.inv=1e9;rats.forEach(r=>r.hp=0);fauna.birds.forEach(r=>r.hp=0);fauna.trees.forEach(r=>r.hp=0);rewards.forEach(r=>r.got=true);mc.calls=[]},
 relic(ability='spread'){const r=rewards.find(r=>r.kind==='relic'&&r.ability===ability);r.got=false;r.x=player.x;r.y=player.y;update(.001);render()},
 echo(fighting){const e=exploration.echoes[0];e.x=player.x;e.y=player.y;if(fighting)Object.assign(rats[0],{x:player.x+80,y:player.y,hp:2,stun:1e9});update(.001);render()},
 clearEnemies(){rats.forEach(r=>r.hp=0)},freezeSnapshot(){return JSON.stringify({time,p:player,boss,shots:magic.shots,attackUntil,chargeStart,traps:world.traps.map(t=>spikeState(time))})}};
 const old=sfx.play;sfx.play=(name,opts)=>{mc.calls.push({name,...opts});return old(name,opts)};
 `}));
 await p.goto((process.env.BASE_URL||'http://127.0.0.1:8768/')+(phone?'?handheld=1':''));await p.click('#start');
 await p.evaluate(()=>{mc.prepare();mc.pressAttack();mc.relic()});assert.equal(await p.evaluate(()=>mc.mode),'reading');assert.equal(await p.locator('#message-card').isVisible(),true);
 const layout=await p.evaluate(()=>{const c=document.querySelector('#message-card'),b=c.getBoundingClientRect();return {font:parseFloat(getComputedStyle(document.querySelector('#message-body')).fontSize),title:parseFloat(getComputedStyle(document.querySelector('#message-title')).fontSize),ratio:b.width/innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,controls:document.querySelector('#message-controls').textContent}});
 assert.ok(layout.font>=(phone?16:18));assert.ok(layout.title>=24);assert.ok(layout.ratio>=.6&&layout.ratio<=.7);assert.equal(layout.overflow,false);assert.ok(layout.controls.includes(phone?'A':'Space'));
 await p.keyboard.press('Space');assert.equal(await p.evaluate(()=>mc.mode),'reading');assert.equal(await p.evaluate(()=>mc.shots.length),0);assert.equal(await p.evaluate(()=>mc.charge),null);
 const frozen=await p.evaluate(()=>{const before=mc.freezeSnapshot();for(let i=0;i<120;i++)mc.loop(1000+i*16);return before===mc.freezeSnapshot()});assert.equal(frozen,true);
 await p.screenshot({path:`tests/artifacts/message-card-${size.width}.png`});await p.waitForTimeout(620);
 if(phone){await p.locator('[data-key=attack]').dispatchEvent('pointerdown',{pointerId:18});await p.locator('[data-key=attack]').dispatchEvent('pointerup',{pointerId:18})}else await p.keyboard.press('Space');
 assert.equal(await p.evaluate(()=>mc.mode),'playing');assert.equal(await p.evaluate(()=>mc.shots.length),0);assert.equal(await p.evaluate(()=>mc.charge),null);assert.equal(await p.evaluate(()=>mc.attack),0);
 const advanced=await p.evaluate(()=>{const t=mc.time;mc.update(.01);return mc.time>t});assert.equal(advanced,true);
 // Echoes remain collectible in combat, but the card waits for safety.
 await p.evaluate(()=>{mc.prepare();mc.echo(true)});assert.equal(await p.locator('#message-layer').isVisible(),false);assert.equal(await p.evaluate(()=>mc.env.echoes[0].got),true);
 await p.evaluate(()=>{mc.clearEnemies();mc.update(.01)});assert.equal(await p.locator('#message-title').textContent(),'勇者殘響');await p.waitForTimeout(620);await p.keyboard.press('Enter');await p.evaluate(()=>mc.pause());assert.ok((await p.locator('#memories').textContent()).includes('我曾舉起劍'));
 await p.evaluate(()=>{mc.resume();mc.prepare();document.body.classList.add('light');document.querySelector('#motion').click();mc.relic('breach')});
 assert.equal(await p.evaluate(()=>getComputedStyle(document.querySelector('#message-card')).animationName),'none');await p.waitForTimeout(620);await p.locator('#message-card').click();assert.equal(await p.evaluate(()=>mc.mode),'playing');
 // Boss recovery pickup goes through the real game hook, heals and plays one relic cue.
 const heal=await p.evaluate(()=>{mc.prepare();mc.beginBoss();mc.boss.timer=999;mc.player.hp=2;mc.boss.recovery={x:mc.player.x,y:mc.player.y};mc.calls=[];mc.update(.01);mc.update(.01);return {hp:mc.player.hp,energy:mc.boss.recovery,calls:mc.calls.filter(c=>c.name==='pickup')}});assert.deepEqual(heal,{hp:3,energy:null,calls:[{name:'pickup',kind:'relic'}]});
 assert.deepEqual(errors,[]);await p.close();
 }
 console.log('PASS important relic/echo cards freeze world, 600ms input guard, no closing attacks, delayed combat echo and memories, light/reduced themes, desktop and phone layouts, boss heal sound');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
