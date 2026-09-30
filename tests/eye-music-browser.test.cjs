const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  window.requestAnimationFrame=()=>1;
  const NativeAudio=window.Audio;window.musicPlayers=[];window.Audio=function(...args){const a=new NativeAudio(...args);window.musicPlayers.push(a);return a};
  const original=AudioContext.prototype.createGain;window.musicGains=[];AudioContext.prototype.createGain=function(){const gain=original.call(this);window.musicGains.push(gain);return gain};
 });
 await page.route('**/src/game.js',route=>route.fulfill({contentType:'application/javascript',body:fs.readFileSync('src/game.js','utf8')+`\nwindow.bgmTest={music,syncMusic,beginBoss,pause,resume,hurt,update,get player(){return player},get boss(){return boss},win(){mode='won';syncMusic()}};`}));
 await page.goto((process.env.BASE_URL||'http://127.0.0.1:8768/')+'eye-creature/');
 await page.locator('#start:not([disabled])').waitFor();assert.equal(await page.evaluate(()=>musicPlayers.length),0);
 await page.click('#music');
 async function playing(track){await page.waitForFunction(track=>musicPlayers[0]?.src.endsWith('/'+track+'.mp3')&&musicPlayers[0].readyState>=3&&!musicPlayers[0].paused&&musicPlayers[0].currentTime>0,track,{polling:100})}
 await playing('title');assert.equal(await page.evaluate(()=>musicGains[0].gain.value),Math.fround(.2));
 for(const level of [100,75,50,20,10,0]){
  await page.selectOption('#music-volume',String(level));
  assert.equal(await page.evaluate(()=>musicGains[0].gain.value),Math.fround(level/100));
  assert.equal(await page.evaluate(()=>musicPlayers[0].paused),level===0);
 }
 await page.click('#music');await playing('title');assert.equal(await page.locator('#music-volume').inputValue(),'10');
 await page.selectOption('#music-volume','20');
 assert.ok(await page.evaluate(()=>musicPlayers[0].duration>1));
 await page.click('#start');await playing('exploration');
 await page.evaluate(()=>{bgmTest.beginBoss();bgmTest.syncMusic()});await playing('boss');
 await page.keyboard.press('p');assert.equal(await page.evaluate(()=>musicPlayers[0].paused),true);
 await page.click('#music');assert.ok(await page.evaluate(()=>bgmTest.music.snapshot().muted));
 await page.click('#start');assert.equal(await page.evaluate(()=>musicPlayers[0].paused),true);
 await page.keyboard.press('p');await page.click('#music');await page.click('#start');await playing('boss');
 await page.evaluate(()=>{bgmTest.player.inv=0;bgmTest.player.hp=.5;bgmTest.hurt('test',1);bgmTest.syncMusic()});await playing('exploration');
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await page.evaluate(()=>musicPlayers[0].paused),true);
 await page.click('#start');await playing('exploration');
 await page.evaluate(()=>bgmTest.win());await playing('title');
 assert.equal(await page.evaluate(()=>musicPlayers.length),1,'only one streaming player');
 for(const [width,height] of [[390,844],[844,390]]){
  await page.setViewportSize({width,height});await page.goto((process.env.BASE_URL||'http://127.0.0.1:8768/')+'?handheld=1');
  await page.locator('#start:not([disabled])').waitFor();await page.locator('#music').click();await playing('title');
  await page.locator('#music-volume').selectOption('50');assert.equal(await page.evaluate(()=>musicGains[0].gain.value),.5);
  await page.click('#start');await page.click('#handheld-start');await page.locator('#music').click();
  assert.ok(await page.evaluate(()=>bgmTest.music.snapshot().muted));
 }
 assert.deepEqual(errors,[]);console.log('Actual MP3 decode/playback, scene transitions, death, background, mute and handheld controls: passed');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
