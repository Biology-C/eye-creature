const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{});try{
for(const phone of [false,true]){
 const page=await browser.newPage({viewport:phone?{width:390,height:844}:{width:1280,height:900},isMobile:phone,hasTouch:phone});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/game.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('src/game.js','utf8')+`
 window.gateTest={update,render,reset,beginBoss,keys,world,physics,get b(){return boss},get p(){return player},get mode(){return mode},clock:()=>time,motion:v=>reduced=v,prepare(){reset();beginBoss();resume();player.inv=9999;boss.timer=999;},step(dt){update(dt);g.clearRect(0,0,canvas.width,canvas.height);drawBossEffects(g,boss,time,reduced)}};
 `}));await page.addInitScript(()=>window.requestAnimationFrame=()=>1);
 await page.goto((process.env.BASE_URL||'http://127.0.0.1:8768/')+'?boss-preview=1');await page.click('#start');
 const checks=await page.evaluate(()=>{
 const t=gateTest,out=[];
 for(const fps of [30,60,120])for(const reduced of [false,true]){
  t.prepare();t.motion(reduced);t.b.cursed=true;t.step(1/fps);Object.assign(t.p,{x:650,y:t.world.arena.floor-11.01,grounded:true});
  t.b.state='ready';t.b.attack='stomp';t.b.timer=.001;t.step(1/fps);const effect=t.b.effects.length;const start=t.clock();
  t.keys.add('right');for(let i=0;i<fps*2;i++)t.step(1/fps);t.keys.clear();const blocked=t.p.x+11<t.world.arena.exit.x-18;
  const x=t.p.x;t.keys.add('left');for(let i=0;i<fps;i++)t.step(1/fps);t.keys.clear();const retreats=t.p.x<x-20;
  // Jump into the closed door, climb, then leave using the opposite direction.
  Object.assign(t.p,{x:t.world.arena.exit.x-18-11.01,y:t.world.arena.floor-45,surface:null,vy:-20,slimeAttack:0});
  t.keys.add('up');t.keys.add('right');t.step(1/fps);const attached=t.p.surface==='right';t.keys.clear();t.keys.add('left');t.step(1/fps);const detached=t.p.surface===null;t.keys.clear();
  const stillPlaying=t.mode==='playing';const progressed=t.clock()>start+2.9;
  t.b.hp=0;t.step(1/fps);const gateOpen=!t.physics.solid(t.world.arena.exit.x,t.world.arena.floor-30);
  Object.assign(t.p,{x:670,y:t.world.arena.floor-11.01,vy:0});t.keys.add('right');for(let i=0;i<fps*.5&&t.mode==='playing';i++)t.step(1/fps);t.keys.clear();
  t.render();out.push({fps,reduced,effect,blocked,retreats,attached,detached,stillPlaying,progressed,gateOpen,won:t.mode==='won'});
 }return out;
 });for(const c of checks)assert.deepEqual(c,{fps:c.fps,reduced:c.reduced,effect:1,blocked:true,retreats:true,attached:true,detached:true,stillPlaying:true,progressed:true,gateOpen:true,won:true});
 // Render boss effects on a real canvas every frame; full-scene snapshots are checked above.
 // Redrawing unrelated terrain thousands of times makes this regression exceed CI limits.
 await page.evaluate(()=>{const t=gateTest;t.prepare();t.motion(false);t.b.timer=.1;for(let i=0;i<60*35;i++)t.step(1/60)});
 assert.deepEqual(errors,[]);await page.close();
}
console.log('PASS desktop/phone every-frame stomp rendering, closed gate collision/retreat, slime wall detachment, alive boss blocks victory, defeated boss opens exit, 30/60/120 FPS and reduced motion');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});

