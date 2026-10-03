const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{});try{
 for(const [width,height] of [[1280,720],[390,844],[844,390]]){
 const phone=width<900,p=await browser.newPage({viewport:{width,height},isMobile:phone,hasTouch:phone}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>window.requestAnimationFrame=()=>1);
 await p.route('**/src/game.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('src/game.js','utf8')+`
 window.gu={world,reset,resume,render,update,pause,say,beginBoss,captureCheckpoint,restoreCheckpoint,breach,pressAttack,releaseAttack,performBreach,hurt,saveCheckpoint,teach,guidance,get p(){return player},get walls(){return crackedWalls},get env(){return exploration},get mode(){return mode},get time(){return time},get rewards(){return rewards},get sounds(){return sfx},
 prepare(){reset();resume();learn(exploration,'wing','rat','gaze','wind','root','bird','spike','charge','dash');player.inv=1e9;rewards.forEach(r=>r.got=true);rats.forEach(r=>r.hp=0);fauna.trees.forEach(r=>r.hp=0);fauna.birds.forEach(r=>r.hp=0)},
 tick(dt=0){update(dt);render()},wait(seconds){time+=seconds;render()},pickup(kind){const r=rewards.find(r=>r.kind===kind);Object.assign(r,{got:false,x:player.x,y:player.y,amount:1});update(0);render()},near(energy=30,index=0,above=true){const w=crackedWalls[index];Object.assign(player,{x:w.axis==='vertical'?w.x+w.w/2:w.x-80,y:w.axis==='vertical'?(above?w.y-40:w.y+w.h+40):w.y+w.h/2,energy,vy:0});cameraSnap=true;this.tick()},
 region(id){const pos=world.position(world.regions[id].nodes[2]);Object.assign(player,pos);cameraSnap=true;this.tick()},
 glow(reducedFlag){const values=[];const fake=new Proxy({save(){},restore(){},strokeRect(...a){values.push(a)}},{set(o,k,v){values.push([k,v]);o[k]=v;return true}});drawCrackGuidance(fake,player,crackedWalls,time,reducedFlag);return values;}
 };
 `}));
 await p.goto((process.env.BASE_URL||'http://127.0.0.1:8768/')+(phone?'?handheld=1':''));await p.locator('#start:not([disabled])').waitFor();
 const intro=await p.locator('#description').evaluate(e=>({text:e.innerText,lines:e.getBoundingClientRect().height/parseFloat(getComputedStyle(e).lineHeight),scroll:e.scrollWidth,width:e.clientWidth}));
 assert.ok(intro.lines<=3.05,JSON.stringify(intro));assert.ok(intro.text.includes('你是勇者留下的眼睛。'));assert.ok(intro.text.includes('找回三道引路光，逃出培養所。'));assert.ok(intro.text.includes(phone?'十字鍵':'← →'));assert.ok(intro.scroll<=intro.width+1);
 await p.screenshot({path:`tests/artifacts/guidance-intro-${width}.png`});await p.click('#start');await p.evaluate(()=>{gu.prepare();gu.near()});
 assert.ok((await p.locator('#notice').innerText()).includes(phone?'長按 A 打破':'按 E 打破'));
 const bounds=await p.locator('#notice').evaluate(e=>{const r=e.getBoundingClientRect(),v=e.closest('.viewport').getBoundingClientRect();return {font:parseFloat(getComputedStyle(e).fontSize),upper:r.y+r.height/2<v.y+v.height/2,center:Math.abs(r.x+r.width/2-v.x-v.width/2)<2,overflow:document.documentElement.scrollWidth>innerWidth}});assert.ok(bounds.font>=(phone?16:18));assert.ok(bounds.upper&&bounds.center);assert.equal(bounds.overflow,false);
 assert.ok((await p.evaluate(()=>gu.glow(true))).some(v=>v[0]==='globalAlpha'&&v[1]===1));assert.ok(!(await p.evaluate(()=>gu.glow(true))).some(v=>v[0]==='shadowBlur'));assert.ok((await p.evaluate(()=>gu.glow(false))).some(v=>v[0]==='shadowBlur'));
 await p.screenshot({path:`tests/artifacts/guidance-wall-${width}.png`});
 // Staying, leaving and returning never replays the large wall tutorial.
 await p.evaluate(()=>{gu.wait(5);gu.tick()});assert.equal(await p.locator('#notice').isVisible(),false);assert.ok((await p.locator('#breach-key').innerText()).includes(phone?'長按 A':'E'));
 await p.screenshot({path:`tests/artifacts/quiet-wall-${width}.png`});
 await p.evaluate(()=>{gu.p.x-=250;gu.tick();gu.near();gu.wait(30);gu.tick()});assert.equal(await p.locator('#notice').isVisible(),false);
 await p.evaluate(()=>{gu.near(12);gu.wait(6);gu.tick()});assert.equal(await p.locator('#notice').isVisible(),false);assert.deepEqual(await p.evaluate(()=>gu.glow(false)),[]);
 // Insufficient-energy text is a response to input, not proximity. Mechanics remain unchanged.
 await p.evaluate(phone=>{const w=gu.walls[0];Object.assign(gu.p,{x:w.x-25,y:w.y+48,face:1,energy:12});if(phone){gu.pressAttack(true);gu.releaseAttack()}else gu.breach();gu.render()},phone);
 assert.ok((await p.locator('#notice').innerText()).includes('還需要 18'));assert.equal(await p.evaluate(()=>gu.p.energy),12);
 for(const above of [true,false]){await p.evaluate(above=>{gu.wait(6);gu.near(30,1,above);gu.wait(3);gu.render()},above);assert.ok((await p.locator('#breach-key').innerText()).includes(above?'↓':'↑'))}
 await p.evaluate(()=>{gu.prepare();gu.tick(61)});assert.equal(await p.locator('#guidance-arrow').isVisible(),false);assert.equal(await p.locator('#notice').isVisible(),false);
 if(phone){await p.evaluate(()=>gu.pause());await p.locator('#sense-direction').click()}else await p.locator('#hint').click();await p.evaluate(()=>gu.render());assert.equal(await p.locator('#guidance-arrow').isVisible(),true);assert.equal(await p.locator('#guidance-arrow').getAttribute('data-wall'),'duct-intro');
 await p.evaluate(()=>gu.say('手動提示',4));await p.evaluate(()=>gu.render());assert.equal(await p.locator('#notice').innerText(),'手動提示');assert.equal(await p.locator('#guidance-arrow').isVisible(),false);assert.equal(await p.locator('#notice:visible').count(),1);
 // Real pickups, damage and saves preserve their effects without repetitive prose.
 await p.evaluate(()=>{gu.prepare();gu.p.energy=0;gu.pickup('energy');gu.pickup('wing')});assert.equal(await p.locator('#notice').isVisible(),false);assert.equal(await p.evaluate(()=>gu.p.energy),1);assert.ok(await p.locator('#healing').evaluate(e=>e.classList.contains('resource-flash')));
 await p.evaluate(()=>{gu.p.energy=29;gu.pickup('energy')});assert.ok((await p.locator('#notice').innerText()).includes('可以破牆'));await p.evaluate(()=>{gu.wait(5);gu.p.energy=29;gu.pickup('energy')});assert.equal(await p.locator('#notice').isVisible(),false);
 await p.evaluate(()=>{gu.p.inv=0;gu.hurt('針刺');gu.render()});assert.equal(await p.evaluate(()=>gu.p.hp),4);assert.equal(await p.locator('#notice').isVisible(),false);
 await p.evaluate(()=>{gu.saveCheckpoint();gu.render()});assert.equal(await p.locator('#notice').isVisible(),false);assert.equal(await p.locator('#saved-icon').isVisible(),true);await p.evaluate(()=>gu.wait(2.1));assert.equal(await p.locator('#saved-icon').isVisible(),false);
 // Completion suppresses tutorials after snapshot restore, with no delayed queue.
 await p.evaluate(()=>{gu.near(30);gu.performBreach(gu.walls[0]);const saved=gu.captureCheckpoint();gu.restoreCheckpoint(saved);gu.resume();gu.wait(30);gu.near(30,1);gu.wait(3);gu.tick()});assert.equal(await p.locator('#notice').isVisible(),false);assert.ok(await p.evaluate(()=>gu.env.tutorials.includes('breach')));
 await p.evaluate(()=>{gu.prepare();gu.teach('test-one',true,'第一則');gu.render()});assert.equal(await p.locator('#notice').innerText(),'第一則');
 await p.evaluate(()=>{gu.wait(4);gu.teach('test-two',true,'第二則');gu.render()});assert.equal(await p.locator('#notice').isVisible(),false);await p.evaluate(()=>{gu.wait(14.9);gu.teach('test-two',true,'第二則');gu.render()});assert.equal(await p.locator('#notice').isVisible(),false);
 await p.evaluate(()=>{gu.wait(.1);gu.teach('test-two',false,'第二則');gu.tick()});assert.equal(await p.locator('#notice').isVisible(),false);assert.deepEqual(await p.evaluate(()=>gu.env.teaching),[]);
 await p.evaluate(()=>{gu.teach('test-three',true,'第三則');gu.render()});assert.equal(await p.locator('#notice').innerText(),'第三則');
 // One-time region titles, game remains running, and they expire after 2.5 seconds.
 for(const id of [1,2,3]){await p.evaluate(id=>{gu.prepare();gu.region(id)},id);assert.equal(await p.locator('#notice strong').innerText(),['','根脈庫房','裂鏡走廊','廢棄觀測室'][id]);assert.equal(await p.evaluate(()=>gu.mode),'playing');assert.equal(await p.locator('#notice > span:not(#guidance-arrow)').isVisible(),false);await p.evaluate(()=>gu.tick(2.6));assert.equal(await p.locator('#notice').isVisible(),false);await p.evaluate(id=>{gu.region(0);gu.region(id)},id);assert.equal(await p.locator('#notice').isVisible(),false);}
 await p.evaluate(()=>{gu.prepare();gu.beginBoss();gu.tick()});assert.equal(await p.locator('#notice strong').innerText(),'守門室');
 await p.evaluate(()=>{gu.prepare();gu.walls[0].broken=true;gu.tick(61)});assert.equal(await p.locator('#guidance-arrow').isVisible(),false);
 await p.evaluate(()=>{gu.prepare();document.body.classList.add('light');gu.near(10);gu.pause();gu.render()});assert.equal(await p.locator('#notice').isVisible(),false);await p.locator('#pause-details summary').click();assert.ok((await p.locator('#pause-details details').innerText()).includes(phone?'A':'Space'));
 assert.deepEqual(errors,[]);await p.close();
 }
 console.log('PASS quiet exploration: one-time wall E/A then badge, explicit failure/help, silent pickups/hurt/saves, first 30 energy once, 15s tutorial silence/no queue, learned snapshot, title-only regions, readable desktop/phone UI');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
