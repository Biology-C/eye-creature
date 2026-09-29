const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const b=await chromium.launch({...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});try{
 const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/game.js',async r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('src/game.js','utf8')+`\nwindow.h={reset,resume,update,render,pressAttack,releaseAttack,cancelAttackInput,breach,keys,sceneMirrors,world,get p(){return player},get walls(){return crackedWalls},get rats(){return rats},get fauna(){return fauna},get boss(){return boss},get mode(){return mode},get magic(){return magic},get held(){return breachHold},get charge(){return chargeStart},tick(n){for(let i=0;i<n;i++)update(1/60)},prepare(){reset();resume();player.inv=1e9;rewards.forEach(r=>r.got=true);rats.forEach(r=>r.hp=0);fauna.trees.forEach(r=>r.hp=0);fauna.birds.forEach(r=>r.hp=0)}};`}));
 await p.addInitScript(()=>window.requestAnimationFrame=()=>1);
 await p.goto(process.env.BASE_URL||'http://127.0.0.1:8768/');await p.locator('#start:not([disabled])').waitFor();await p.click('#start');
 for(const [width,height] of [[390,844],[844,390],[360,740],[740,360]]){
  await p.setViewportSize({width,height});await p.evaluate(()=>h.render());
  assert.ok(await p.evaluate(()=>document.documentElement.classList.contains('handheld')));
  const bounds=await p.evaluate(()=>({scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],viewport:[innerWidth,innerHeight],buttons:[...document.querySelectorAll('.touch button')].filter(e=>e.getBoundingClientRect().width).map(e=>{const r=e.getBoundingClientRect();return {id:e.id||e.dataset.key,x:r.x,y:r.y,w:r.width,h:r.height}})}));
  assert.deepEqual(bounds.scroll,bounds.viewport);
  for(const r of bounds.buttons){assert.ok(r.x>=0&&r.y>=0&&r.x+r.w<=width+.5&&r.y+r.h<=height+.5,JSON.stringify(r));if(!['select','handheld-start'].includes(r.id))assert.ok(r.w>=56&&r.h>=56,JSON.stringify(r));}
  for(const id of ['#mirror','#breach','#magic'])assert.equal(await p.locator(id).isVisible(),false);
  await p.screenshot({path:`tests/artifacts/phone-${width}.png`});
 }
 await p.setViewportSize({width:390,height:844});
 // Real browser touch dispatch, with three independent fingers (not synthetic click()).
 const cdp=await p.context().newCDPSession(p);const point=async(selector,id)=>{const r=await p.locator(selector).boundingBox();return {id,x:r.x+r.width/2,y:r.y+r.height/2}};
 await p.evaluate(()=>h.prepare());
 const right=await point('[data-key=right]',1),flap=await point('#flap',2),attack=await point('[data-key=attack]',3);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[right,flap,attack]});
 assert.deepEqual(await p.evaluate(()=>[h.keys.has('right'),h.keys.has('up'),h.keys.has('attack')]),[true,true,true]);
 const movement=await p.evaluate(()=>{const before={x:h.p.x,y:h.p.y};h.tick(12);return {dx:h.p.x-before.x,dy:h.p.y-before.y}});assert.ok(movement.dx>40&&movement.dy<0);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[attack]});assert.deepEqual(await p.evaluate(()=>[...h.keys].sort()),['right','up']);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal(await p.evaluate(()=>h.keys.size),0);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[right,flap]});await p.locator('#handheld-start').tap();assert.equal(await p.evaluate(()=>h.mode),'paused');assert.equal(await p.evaluate(()=>h.keys.size),0);await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await p.locator('#handheld-start').tap();assert.equal(await p.evaluate(()=>h.mode),'playing');
 await p.locator('#select').tap();assert.ok(await p.locator('#journey-map').isVisible());await p.locator('#handheld-start').tap();
 // Locked breach target, short press, hold completion, range/face interruption, no repeat spend.
 const result=await p.evaluate(()=>{function setup(){h.prepare();const w=h.walls[0];h.p.x=w.x-25;h.p.y=w.y+48;h.p.face=1;h.p.energy=60;return w}
  let w=setup();h.pressAttack(true);h.tick(20);h.releaseAttack();const short=[w.broken,h.p.energy,h.magic.shots.length];
  w=setup();h.pressAttack(true);h.tick(40);const full=[w.broken,h.p.energy];h.tick(50);h.releaseAttack();const once=h.p.energy;
  w=setup();h.pressAttack(true);h.tick(10);h.p.face=-1;h.tick(40);h.releaseAttack();const turn=[w.broken,h.p.energy];
  w=setup();h.pressAttack(true);h.tick(10);h.p.x-=120;h.tick(40);h.releaseAttack();const range=[w.broken,h.p.energy];
  w=setup();h.p.energy=29;h.pressAttack(true);const insufficient=[h.held,h.charge!==null];h.releaseAttack();
  w=setup();Object.assign(h.rats[0],{hp:2,pure:false,big:false,x:h.p.x+12,y:h.p.y});h.pressAttack(true);const enemy=[h.held,h.rats[0].hp,w.broken,h.p.energy];h.releaseAttack();
  // Desktop/keyboard entry point still selects magic; E remains separate.
  w=setup();h.pressAttack();h.tick(40);h.releaseAttack();const keyboard=[w.broken,h.p.energy];
  return {short,full,once,turn,range,insufficient,enemy,keyboard}});
 assert.deepEqual(result,{short:[false,60,1],full:[true,30],once:30,turn:[false,60],range:[false,60],insufficient:[null,true],enemy:[null,1,false,60],keyboard:[false,60]});
 const cancelled=await p.evaluate(()=>{h.prepare();const w=h.walls[0];Object.assign(h.p,{x:w.x-25,y:w.y+48,face:1,energy:30});h.pressAttack(true);h.tick(12);window.dispatchEvent(new Event('blur'));h.tick(40);return {wall:w.broken,energy:h.p.energy,held:h.held,mode:h.mode}});assert.deepEqual(cancelled,{wall:false,energy:30,held:null,mode:'paused'});
 const vertical=await p.evaluate(()=>{const out=[];for(const dir of ['down','up']){h.prepare();const w=h.walls.find(w=>w.axis==='vertical');Object.assign(h.p,{x:w.x+w.w/2,y:dir==='down'?w.y-12:w.y+w.h+12,energy:30,wing:.7});h.keys.add(dir==='down'?'down':'lookUp');if(dir==='up')h.keys.add('up');h.pressAttack(true);h.tick(40);h.releaseAttack();out.push([w.broken,h.p.energy])}return out});assert.deepEqual(vertical,[[true,0],[true,0]]);
 const mirror=await p.evaluate(()=>{h.prepare();const m=h.sceneMirrors[0];Object.assign(h.p,{x:m.x,y:m.y});Object.assign(h.fauna.birds[0],{x:m.x+45,y:m.y-20,hp:1,mode:'circle'});h.tick(1);const mode=h.fauna.birds[0].mode;h.tick(42);return {mode,hp:h.fauna.birds[0].hp,count:h.sceneMirrors.length}});assert.deepEqual(mirror,{mode:'mirror',hp:0,count:20});
 const more=await p.evaluate(()=>{
  h.prepare();h.pressAttack(true);h.tick(50);h.releaseAttack();const charged=h.magic.shots.map(s=>[s.charged,s.damage]);
  h.prepare();let w=h.walls[0];Object.assign(h.p,{x:w.x+w.w+25,y:w.y+48,face:-1,energy:30});h.pressAttack(true);h.tick(40);h.releaseAttack();const left=[w.broken,h.p.energy];
  h.prepare();w=h.walls[0];Object.assign(h.p,{x:w.x-25,y:w.y+48,face:1,energy:30});h.pressAttack(true);h.tick(10);Object.assign(h.rats[0],{hp:1,x:h.p.x+12,y:h.p.y});h.tick(35);h.releaseAttack();const interrupted=[w.broken,h.p.energy];
  h.prepare();h.boss.active=true;h.boss.cursed=true;Object.assign(h.p,{x:h.world.arena.left+104,y:h.world.arena.floor-12});h.boss.mirrors=[{id:'test',x:h.p.x,y:h.world.arena.floor-16,vy:0,landed:true}];h.tick(1);return {charged,left,interrupted,curse:h.boss.cursed};
 });assert.deepEqual(more,{charged:[[true,1.5]],left:[true,0],interrupted:[false,30],curse:false});
 assert.deepEqual(errors,[]);console.log('PASS phone portrait/landscape, multi-touch, cancellation, A breach and charge selection, map and scene mirrors');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});



