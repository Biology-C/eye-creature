const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const b=await chromium.launch({...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});try{
 const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>window.requestAnimationFrame=()=>1);
 await p.route('**/src/game.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('src/game.js','utf8')+`
 window.cs={attack,applyMelee,fireLight,dash,hurt,update,beginBoss,combatSounds,keys,
 get p(){return player},get rats(){return rats},get boss(){return boss},get magic(){return magic},get fauna(){return fauna},
 prepare(){reset();resume();player.inv=1e9;rats=[];fauna.trees.forEach(e=>e.hp=0);fauna.birds.forEach(e=>e.hp=0);rewards.forEach(e=>e.got=true);cs.calls=[]},
 rat(hp=2,opts={}){const r={x:player.x+30,y:player.y,spawn:player.x+30,y0:player.y,hp,face:-1,state:'rest',timer:10,stun:time+10,vy:0,...opts};rats.push(r);return r},
 orb(){lights[0].x=player.x;lights[0].y=player.y;rewards=[{kind:'energy',x:player.x,y:player.y}];update(.001);update(.001);return rewards[0].got},
 calls:[]};const old=sfx.play;sfx.play=(name,opts)=>{cs.calls.push({name,...opts});return old(name,opts)};
 `}));
 await p.goto(process.env.BASE_URL||'http://127.0.0.1:8768/');await p.locator('#start:not([disabled])').click();
 const melee=await p.evaluate(()=>{cs.prepare();const a=cs.rat(),b=cs.rat(3,{big:true,bodyRadius:20});cs.attack(1);cs.combatSounds.flush();cs.applyMelee();cs.combatSounds.flush();return {hp:[a.hp,b.hp],calls:cs.calls}});
 assert.deepEqual(melee.hp,[1,2]);assert.equal(melee.calls.filter(e=>e.name==='hit').length,1);assert.equal(melee.calls.filter(e=>e.kind==='transform').length,1);
 const shots=await p.evaluate(()=>{cs.prepare();const r=cs.rat();cs.fireLight(false);cs.update(.03);cs.combatSounds.flush();return {hp:r.hp,calls:cs.calls}});assert.equal(shots.hp,1);assert.ok(shots.calls.some(e=>e.name==='defeat'&&e.kind==='transform'));
 const dash=await p.evaluate(()=>{cs.prepare();const r=cs.rat();cs.p.abilities.dash=true;cs.dash();cs.update(.04);cs.combatSounds.flush();return {hp:r.hp,calls:cs.calls}});assert.equal(dash.hp,1);assert.ok(dash.calls.some(e=>e.name==='defeat'&&e.kind==='transform'));
 const big=await p.evaluate(()=>{cs.prepare();const r=cs.rat(1,{big:true,bodyRadius:20});cs.attack();cs.update(.001);cs.update(.001);return {children:cs.rats.filter(e=>e.child).length,defeats:cs.calls.filter(e=>e.name==='defeat')}});assert.equal(big.children,4);assert.deepEqual(big.defeats,[{name:'defeat'}]);
 const hurt=await p.evaluate(()=>{cs.prepare();cs.p.inv=0;cs.hurt('針刺');cs.hurt('龍捲風');return {hp:cs.p.hp,calls:cs.calls}});assert.equal(hurt.hp,4);assert.deepEqual(hurt.calls,[{name:'hurt'}]);
 const orb=await p.evaluate(()=>{cs.prepare();return {got:cs.orb(),calls:cs.calls}});assert.ok(orb.got);assert.deepEqual(orb.calls,[{name:'orb'}]);
 const warning=await p.evaluate(()=>{cs.prepare();cs.beginBoss();cs.p.inv=1e9;cs.boss.timer=.001;cs.update(.01);cs.update(.01);const first=cs.calls.filter(e=>e.name==='bossWarn').length;for(let i=0;i<180;i++)cs.update(1/60);return {first,total:cs.calls.filter(e=>e.name==='bossWarn').length}});assert.deepEqual(warning,{first:1,total:2});
 await p.waitForTimeout(45);
 const boss=await p.evaluate(()=>{cs.p.x=cs.boss.x-45;cs.p.y=cs.boss.y;cs.p.face=1;const before=cs.boss.hp;cs.calls=[];cs.attack();cs.combatSounds.flush();return {damage:before-cs.boss.hp,calls:cs.calls}});assert.equal(boss.damage,1);assert.ok(boss.calls.some(e=>e.name==='hit'&&e.big===true));
 assert.deepEqual(errors,[]);console.log('PASS actual melee, magic, dash, rat transform, split defeat, invulnerability, orb priority and boss telegraph sounds');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
