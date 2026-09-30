const assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const b=await chromium.launch({...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});try{
 const p=await b.newPage({viewport:{width:1280,height:720}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(process.env.BASE_URL||'http://127.0.0.1:8768/');await p.locator('#start:not([disabled])').click();
 await p.keyboard.down('ArrowLeft');await p.waitForTimeout(90);await p.keyboard.up('ArrowLeft');await p.waitForTimeout(400);
 const tapped=await p.evaluate(()=>levelSnapshot());assert.equal(tapped.player.face,-1);assert.equal(tapped.camera.face,1,'brief keypress changes hero but not camera facing');
 await p.keyboard.down('ArrowLeft');await p.waitForTimeout(450);await p.keyboard.up('ArrowLeft');assert.equal(await p.evaluate(()=>levelSnapshot().camera.face),-1);
 await p.keyboard.down('ArrowRight');await p.waitForTimeout(450);await p.keyboard.up('ArrowRight');assert.equal(await p.evaluate(()=>levelSnapshot().camera.face),1);
 for(const viewport of [{width:1280,height:720},{width:1920,height:1080}]){
  await p.setViewportSize(viewport);await p.waitForTimeout(100);
  const result=await p.evaluate(()=>{const s=levelSnapshot(),c=document.querySelector('#game');return {x:s.player.x-s.camera.x,y:s.player.y-s.camera.y,w:c.width,h:c.height}});
  assert.ok(result.x>=0&&result.x<=result.w&&result.y>=0&&result.y<=result.h);
 }
 assert.deepEqual(errors,[]);console.log('PASS desktop real keyboard: short taps, sustained reversal, viewport resize and player visibility');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
