const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.BASE_URL||'http://127.0.0.1:8768/';
(async()=>{
  const b=await chromium.launch({...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{}),headless:true});
  try{
    const p=await b.newPage();p.on('dialog',d=>d.accept());const errors=[];p.on('pageerror',e=>errors.push(e.message));
    // Every procedural sound renders offline, audible, finite and without clipping.
    await p.goto(base+'previews/sfx/');
    const stats=await p.evaluate(()=>sfxStats());
    for(const name of ['slash1','slash2','slash3','shot','chargedShot','pickup','dash','charge','hit','hurt','defeat','bossWarn','orb','mirror','curse','bossSummon','bossDefeat','death','levelClear']){
      const s=stats[name];assert.ok(s,name);assert.equal(s.bad,0,name);
      assert.ok(s.peak>0.05&&s.peak<0.98,`${name} peak ${s.peak}`);assert.ok(s.seconds<=1.5,name);
    }
    // The heavy third slash carries more energy than the light first slash.
    assert.ok(stats.slash3.rms>stats.slash1.rms);
    // Real preview playback and downloadable PCM, not just offline signal statistics.
    await p.locator('.primary').first().click();
    for(let i=0;i<19;i++){
      await p.waitForTimeout(1100);const wait=p.waitForEvent('download');await p.getByText('下載 WAV',{exact:true}).nth(i).click();const download=await wait;
      const bytes=fs.readFileSync(await download.path());assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WAVE');assert.equal(bytes.readUInt32LE(24),44100);assert.ok(bytes.length>44);
    }
    await p.addInitScript(()=>{window.requestAnimationFrame=()=>1;window.recordedStarts=0;const originalStart=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...args){if(this.buffer?.duration===5)window.recordedStarts++;return originalStart.apply(this,args)};window.liveAudioCount=0;const Native=window.AudioContext;window.AudioContext=class extends Native{constructor(...args){super(...args);window.liveAudioCount++}}});
    await p.route('**/src/game.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('src/game.js','utf8')+`
      window.sfxTest={sfx,cues,attack,fireLight,dash,pressAttack,releaseAttack,syncChargeSound,cancelAttackInput,pause,resume,hurt,
        get p(){return player},get mode(){return mode},get shots(){return magic.shots},
        prepare(){reset();resume();player.inv=1e9;rats.forEach(e=>e.hp=0);fauna.trees.forEach(e=>e.hp=0);fauna.birds.forEach(e=>e.hp=0);rewards.forEach(e=>e.got=true);sfxTest.calls=[]},
        advance(dt){time+=dt;syncChargeSound()},leave(){mode='won';syncChargeSound()},
        pickups(){rewards=[{id:'sfx1',kind:'energy',x:player.x,y:player.y},{id:'sfx2',kind:'relic',name:'test',ability:'spread',x:player.x,y:player.y}];update(.001);update(.001)},
        breakWall(energy){player.energy=energy;const wall=crackedWalls.find(w=>!w.broken);Object.assign(player,{x:wall.x-25,y:wall.y+48,face:1});breach();return {energy:player.energy,broken:wall.broken}},cuesCalls:[],calls:[]};const originalCue=cues.play;cues.play=(name)=>{sfxTest.cuesCalls.push(name);return originalCue(name)};const originalPlay=sfx.play;sfx.play=(name,opts)=>{sfxTest.calls.push({name,...opts});return originalPlay(name,opts)};
    `}));
    await p.goto(base);await p.locator('#start:not([disabled])').waitFor();assert.equal(await p.evaluate(()=>liveAudioCount),0,'no context before interaction');
    assert.equal(await p.inputValue('#sfx-volume'),'40');assert.equal(await p.locator('header nav #sound').count(),0);
    await p.click('#start');
    const hooks=await p.evaluate(()=>{
      const h=sfxTest;h.prepare();[1,2,3].forEach(h.attack);h.p.slimeForm=true;h.attack(1);h.p.slimeForm=false;const slashes=h.calls.map(e=>e.name);
      h.prepare();h.p.abilities.spread=true;const fired=h.fireLight(false),blocked=h.fireLight(false),shots=h.shots.length;h.advance(.6);h.fireLight(true);const shotsAudio=h.calls.map(e=>e.name);
      h.prepare();h.pressAttack();h.advance(.1);const short=h.sfx.charging;h.releaseAttack();const shortCalls=h.calls.map(e=>e.name);
      h.prepare();h.pressAttack();h.advance(.13);const charge=h.sfx.charging;h.advance(.7);h.releaseAttack();const released=h.sfx.charging,chargedCalls=h.calls.map(e=>e.name);
      const stops=[];for(const action of ['pause','death','form','cancel','leave']){h.prepare();h.pressAttack();h.advance(.13);if(action==='pause')h.pause();if(action==='death'){h.p.inv=0;h.p.hp=.5;h.hurt('test',1)}if(action==='form'){h.p.slimeForm=true;h.syncChargeSound()}if(action==='cancel')h.cancelAttackInput();if(action==='leave')h.leave();stops.push(h.sfx.charging)}
      h.prepare();h.dash();h.dash();const dashes=h.calls.map(e=>e.name);
      h.prepare();h.pickups();const pickups=h.calls.filter(e=>e.name==='pickup');
      return {slashes,fired,blocked,shots,shotsAudio,short,shortCalls,charge,released,chargedCalls,stops,dashes,pickups};
    });
    assert.deepEqual(hooks,{slashes:['slash1','slash2','slash3'],fired:true,blocked:false,shots:3,shotsAudio:['shot','chargedShot'],short:false,shortCalls:['shot'],charge:true,released:false,chargedCalls:['chargedShot'],stops:[false,false,false,false,false],dashes:['dash'],pickups:[{name:'pickup'},{name:'pickup',kind:'relic'}]});
    assert.equal(await p.evaluate(()=>sfxTest.sfx.loadSample('breakWall',new URL('assets/sfx/wall-break.wav',location.href))),true);
    const walls=await p.evaluate(()=>{const h=sfxTest;h.prepare();h.cuesCalls=[];const rejected=h.breakWall(29),noSound=h.calls.length;const success=h.breakWall(30);return {rejected,noSound,success,calls:h.calls,cues:h.cuesCalls}});
    assert.deepEqual(walls,{rejected:{energy:29,broken:false},noSound:0,success:{energy:0,broken:true},calls:[{name:'breakWall'}],cues:[]});
    assert.equal(await p.evaluate(()=>recordedStarts),1,'decoded wall recording starts exactly once');
    await p.keyboard.press('p');
    for(const value of ['0','20','40','60','80','100']){await p.selectOption('#sfx-volume',value);assert.deepEqual(await p.evaluate(()=>[sfxTest.sfx.volume,sfxTest.cues.volume,sfxTest.sfx.muted,sfxTest.cues.muted]),[+value/100,+value/100,value==='0',value==='0'])}
    await p.selectOption('#sfx-volume','60');await p.selectOption('#music-volume','10');await p.reload();await p.locator('#start:not([disabled])').waitFor();
    assert.equal(await p.inputValue('#sfx-volume'),'60');assert.equal(await p.inputValue('#music-volume'),'10');assert.equal(await p.evaluate(()=>liveAudioCount),0);
    await p.click('#start');await p.keyboard.press('p');await p.click('#sound');assert.equal(await p.inputValue('#sfx-volume'),'0');await p.reload();await p.locator('#start:not([disabled])').waitFor();assert.equal(await p.inputValue('#sfx-volume'),'0');
    // Handheld A / X use the same functions; no double-triggered sound paths.
    await p.setViewportSize({width:390,height:844});await p.goto(base+'?handheld=1');await p.click('#start');await p.click('#handheld-start');await p.selectOption('#sfx-volume','40');await p.click('#start');
    await p.evaluate(()=>sfxTest.prepare());await p.locator('[data-key=attack]').dispatchEvent('pointerdown',{pointerId:1});await p.locator('[data-key=attack]').dispatchEvent('pointerup',{pointerId:1});await p.locator('#dash').dispatchEvent('pointerdown',{pointerId:2});
    assert.deepEqual(await p.evaluate(()=>sfxTest.calls.map(e=>e.name)),['shot','dash']);
    for(const size of [{width:390,height:844},{width:844,height:390}]){await p.setViewportSize(size);await p.click('#handheld-start');await p.locator('#sfx-volume').selectOption('80');assert.equal(await p.evaluate(()=>sfxTest.sfx.volume),.8);await p.click('#start')}
    // Unavailable storage and audio must not block controls or initialization.
    const blocked=await b.newPage();blocked.on('pageerror',e=>errors.push(e.message));blocked.on('dialog',d=>d.accept());
    await blocked.addInitScript(()=>{Storage.prototype.getItem=()=>{throw Error('storage disabled')};Storage.prototype.setItem=()=>{throw Error('storage disabled')};window.AudioContext=class{constructor(){throw Error('audio unavailable')}}});
    await blocked.goto(base);await blocked.click('#start');await blocked.keyboard.press('p');await blocked.selectOption('#sfx-volume','60');await blocked.selectOption('#music-volume','50');await blocked.click('#start');await blocked.keyboard.press('Space');await blocked.keyboard.press('Shift');assert.equal(await blocked.evaluate(()=>levelSnapshot().mode),'playing');await blocked.close();
    assert.deepEqual(errors,[]);
    console.log('PASS SFX signals, WAV downloads, all triggers, charge lifecycle, shared mobile controls, saved volumes, storage/audio failure');
  }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
