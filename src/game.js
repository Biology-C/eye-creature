import {setSlimeForm,startSlimeAttack,updateSlimePlayer} from './player-form.mjs';
import {BREACH_HOLD,nearbyTouchSideWall,attackIntent,validBreachHold,bindTouchControls,createSceneMirrors,drawSceneMirrors} from './handheld.mjs';
import {MAX_HP,healthMarkup,criticalOpacity} from './health.mjs';
import {createPureSlimes,createBigSlimes,splitSlime,isSlime} from './slime.mjs';
import {drawTerrain} from './terrain.mjs';
import {drawTornadoes} from './tornado.mjs';
import {addBossArena,createBoss,enterBoss,resetBoss,updateBoss,drawBear,drawBossEffects,drawBossTelegraph,bossGateSolid,bossSummons,BOSS_ATTACK_LABELS} from './boss.mjs';
import {inMelee} from './combat.mjs';
import {createMagic,castLight,updateMagic,drawEffects,drawSlash,SLASH_STYLES} from './magic.mjs';
import {updateRat} from './rats.mjs';
import {createFauna,meleeFauna,mirrorFauna,resetFaunaAfterDeath,updateFauna} from './fauna.mjs';
import {createCrackedWalls,nearbyWall,breakWall,BREACH_COST,ordinaryWall} from './breach.mjs';
import {createTorches,discoverTorches} from './torches.mjs';
import {createRewards,collectReward} from './rewards.mjs';
import {spikeState,touchesSpikes,addSurfaceSpikes,trapSupported,drawSpikes,removeSpikeShelters} from './traps.mjs';
import {createPhysics,MAX_WING,startDash} from './physics.mjs';
import {buildMaze} from './maze.mjs';
import {loadHero} from './hero.js';
const $=s=>document.querySelector(s),canvas=$('#game'),g=canvas.getContext('2d');
const handheld=matchMedia('(pointer: coarse)').matches||new URLSearchParams(location.search).get('handheld')==='1';
document.documentElement.classList.toggle('handheld',handheld);
function resize(){if(handheld){const r=canvas.parentElement.getBoundingClientRect();canvas.width=480;canvas.height=Math.max(160,Math.round(480*r.height/Math.max(1,r.width)));canvas.style.aspectRatio='auto';return}const compact=canvas.clientWidth<650;canvas.width=compact?480:960;canvas.height=compact?(innerHeight<500?240:360):540;canvas.style.aspectRatio=`${canvas.width}/${canvas.height}`}resize();window.addEventListener('resize',resize);new ResizeObserver(()=>{if(handheld)resize()}).observe(canvas.parentElement);
const world=buildMaze();world.mazeHeight=world.H;addSurfaceSpikes(world);removeSpikeShelters(world);addBossArena(world);const {T,W,H,map}=world;
const originalMap=map.map(row=>row.slice()),originalPlatforms=world.platforms.map(p=>({...p}));
const physics=createPhysics(map,T,world.platforms,(x,y)=>bossGateSolid(boss,x,y));
const solid=physics.solid;
const keys=new Set(),seen=new Set();let drawHero,ratImage,faunaImage,faunaFrames=[],enemyFrames=[],mode='loading',time=0,last=0,camera={x:0,y:0},light=false,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let dashHits=new Set(),boss=createBoss(world),slashStyle=0,struck=new Set(),hitStop=0,hurtUntil=0,magic=createMagic(),dashTrail=[],fauna,player,rats,lights,rewards,torches,crackedWalls,pickupFlash,checkpoint,activated,kills,deaths,noticeUntil=0,attackUntil=0,nextAttack=0,slash=null;
let attackHeld=false,chargeStart=null,comboStage=0,comboUntil=0,comboQueue=0,breachHold=null,breachConsumed=false;
let clearTouch=()=>{},sceneMirrors=[],slimeHits=new Set();
function cancelAttackInput(){breachHold=null;breachConsumed=false;attackHeld=false;chargeStart=null;comboStage=0;comboUntil=0;comboQueue=0;keys.delete("attack")}
function reset(){clearTouch();cancelAttackInput();dashHits.clear();boss=createBoss(world);struck.clear();hitStop=0;hurtUntil=0;magic=createMagic();dashTrail=[];world.platforms.splice(0,world.platforms.length,...originalPlatforms.map(p=>({...p})));map.forEach((row,y)=>row.splice(0,row.length,...originalMap[y]));fauna=createFauna(world);sceneMirrors=handheld?createSceneMirrors(world,fauna.zones):[];crackedWalls=createCrackedWalls(world);player={...world.start,hp:MAX_HP,abilities:{},healCharge:0,dashRemaining:0,dashCooldown:0,energy:0,face:1,inv:0,vy:0,wing:MAX_WING,grounded:false};rats=[...world.rats,...createPureSlimes(world),...createBigSlimes(world)].map((r,i)=>({...r,spawn:r.x,y0:r.y,face:i%2?-1:1,hp:r.big?3:r.pure?1:2,surface:null,state:'walk',timer:0,stun:0,vy:0}));lights=world.lights.map(l=>({...l,got:false}));rewards=createRewards(world);torches=createTorches(world);pickupFlash=null;checkpoint={...world.start};activated=new Set();kills=0;deaths=0;time=0;nextAttack=0;attackUntil=0;slash=null;seen.clear();keys.clear();updateHud();updateFormControls()}
function phoneText(message){return !handheld?message:message.replaceAll('Space','A').replaceAll('Shift','X').replaceAll('按住 ↑ 拍翼','按住 B 拍翼').replaceAll('↑ 拍翼','B 拍翼').replaceAll('按 E 打通','長按 A 打通').replaceAll('按 Q 使用鏡面','靠近場景鏡面').replaceAll('按 Q 映出鏡像','靠近場景鏡面映出鏡像').replaceAll('用 Q 或左側鏡子破解','靠近左側鏡子破解')}
function say(message,duration=4){$('#notice').textContent=phoneText(message);noticeUntil=time+duration}
function updateHud(){$('#abilities').textContent='能力：'+(['spread','dash','breach'].filter(k=>player.abilities[k]).map(k=>({spread:'三向光彈',dash:'傷害衝刺',breach:'普通牆破壞'})[k]).join('／')||'尚未取得');$('#energy').textContent=`${handheld?'破牆':'破牆能量'} ${player.energy} / ${BREACH_COST}`;$('#hearts').innerHTML=healthMarkup(player.hp);$('#healing').textContent=`藍能回血 ${player.healCharge}% / 100%`;$('#hearts').setAttribute('aria-label',`生命 ${player.hp} / ${MAX_HP}`);$('#quest').textContent=`${handheld?'光點':'引路光點'} ${lights.filter(p=>p.got).length} / 3`;$('#relics').textContent=`藏品 ${rewards.filter(r=>r.kind==='relic'&&r.got).length} / ${rewards.filter(r=>r.kind==='relic').length}`}
function panel(title,description,label){$('#map-panel').hidden=!handheld||mode!=='paused';$('#phone-details').hidden=!handheld||mode!=='paused';if(handheld&&mode==='paused')drawJourneyMap();$('#title').textContent=title;$('#description').textContent=description;$('#start').textContent=label;$('#overlay').hidden=false;$('#restart').hidden=mode!=='paused'}
function pause(){if(mode==='playing'){mode='paused';clearTouch();keys.clear();cancelAttackInput();panel('休息一下','探索進度保留，準備好再繼續。','繼續探索')}else if(mode==='paused')resume()}
function resume(){mode='playing';$('#overlay').hidden=true;last=0;canvas.focus()}
$('#start').onclick=()=>{if(mode==='won')reset();if(new URLSearchParams(location.search).has('boss-preview')&&!boss.active){lights.forEach(l=>l.got=true);beginBoss()}resume()};$('#restart').onclick=()=>{reset();resume()};$('#pause').onclick=pause;
$('#theme').onclick=()=>{light=!light;document.body.classList.toggle('light',light);$('#theme').textContent=light?'深色':'淺色';if(mode==='playing')canvas.focus()};
function motionLabel(){$('#motion').setAttribute('aria-pressed',reduced);$('#motion').textContent=reduced?'減少動態：開':'減少動態：關'}motionLabel();$('#motion').onclick=()=>{reduced=!reduced;motionLabel();if(mode==='playing')canvas.focus()};
$('#slash-style').onclick=()=>{slashStyle=(slashStyle+1)%3;$('#slash-style').textContent='斬擊：'+SLASH_STYLES[slashStyle];if(mode==='playing')canvas.focus()};
$('#hint').onclick=()=>{if(mode!=='playing')return;canvas.focus();const remaining=lights.filter(l=>!l.got),target=remaining.length?remaining.sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0]:world.exit;const dx=target.x-player.x,dy=target.y-player.y;say(`${remaining.length?'光點':'出口'}訊號大約在${Math.abs(dy)>100?(dy<0?'北':'南'):''}${Math.abs(dx)>100?(dx<0?'西':'東'):''}方。牆後可能要繞路。`,6)};

if(handheld){
 const vitals=document.createElement('div');vitals.className='vitals';$('.hud').prepend(vitals);vitals.append($('#hearts'),$('#healing'));
 const details=$('#phone-details');details.prepend($('#relics'),$('#abilities'));
 const skill=$('.hud>span:last-child');if(skill)skill.hidden=true;
 for(const id of ['theme','motion','slash-style'])$('#phone-details .settings').append($('#'+id));
 $('.touch').outerHTML='<div class="touch"><div class="pad"><button data-key="up" class="up" aria-label="向上觀察">▲</button><button data-key="left" class="left" aria-label="向左移動">◀</button><button data-key="down" class="down" aria-label="向下觀察或下降">▼</button><button data-key="right" class="right" aria-label="向右移動">▶</button></div><div class="action-pad"><button id="dash" aria-label="X 衝刺">衝刺 Shift</button><button class="attack" data-key="attack" aria-label="A 攻擊，靠近裂牆長按破牆">攻擊</button><button id="flap" class="handheld-only" data-key="flap" aria-label="B 拍翼或滑翔">B<small>拍翼</small></button></div><button id="magic" hidden>光彈</button><button id="mirror">鏡面 Q</button><button id="breach">破牆 E</button><div class="system-pad handheld-only"><button id="select" aria-label="SELECT 已探索地圖">SELECT<small>地圖</small></button><button id="handheld-start" aria-label="START 暫停或繼續">START<small>暫停</small></button></div></div>';
 $('#description').innerHTML='找到三顆引路光點，擊敗紅熊。<br>十字鍵移動／觀察，B 拍翼與滑翔。<br>A 攻擊／蓄力，X 衝刺。<br>原版重新整理會開始新局。';
 $('#notice').textContent='十字鍵移動 · B 拍翼 · A 攻擊 · X 衝刺';
 $('.attack').innerHTML='A<small>攻擊</small>';$('#dash').innerHTML='X<small>衝刺</small>';
 $('#select').onclick=pause;$('#handheld-start').onclick=()=>{if(mode==='intro'||mode==='won')$('#start').click();else pause()};
 $('#phone-hint').onclick=()=>{resume();$('#hint').click()};
}

function wallTarget(touch=false){if(player.slimeForm)return null;const direction=keys.has('down')?'down':keys.has(touch?'lookUp':'up')?'up':null;return nearbyWall(player,crackedWalls,direction)||(touch&&nearbyTouchSideWall(player,crackedWalls,direction))||ordinaryWall(player,world,direction)}
function performBreach(wall){if(!breakWall(player,wall,map,T,world.platforms))return false;if(wall.ordinary)crackedWalls.push(wall);wall.discovered=true;updateHud();say('消耗 30 點能量，牆面破開！捷徑已打通。',4);return true}
function breach(){if(mode!=='playing'||player.slimeForm)return;canvas.focus();const wall=wallTarget();if(!wall){say('靠近裂面：左右面向它，上下按住 ↑／↓ 再按 E 或破牆。',3);return}if(!performBreach(wall))say(`還差 ${BREACH_COST-player.energy} 點破牆能量。`,3)}
$('#breach').onclick=breach;
function mirror(){if(mode!=='playing')return;if(boss.cursed){say('史萊姆無法施法；等紅熊重踏後，拾取掉落的鏡子。',4);return}canvas.focus();const count=mirrorFauna(fauna,player,time,clearPath);if(count>=0)say(count?`鏡面映出 ${count} 隻青影鳥，牠們正在攻擊自己的倒影！`:'鏡面展開，附近沒有青影鳥。',3)}
$('#mirror').onclick=mirror;
function dash(){if(mode!=='playing'||player.slimeForm)return;canvas.focus();const direction=Number(keys.has('right'))-Number(keys.has('left'));if(direction)player.face=direction;if(startDash(player))dashHits.clear()}
$('#dash').onclick=dash;
function lightMagic(){if(mode!=='playing')return;if(player.slimeForm){say('史萊姆形態：跳躍與跳撞，拾取鏡子後恢復魔法。',3);return}canvas.focus();say('目前魔法：光彈。取得其他魔法後，按 F 切換。',3)}
$('#magic').onclick=lightMagic;
const keyMap={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'up',w:'up',ArrowDown:'down',s:'down',' ':'attack'};
window.addEventListener('keydown',e=>{if(e.target.tagName==='BUTTON')return;if(e.key.toLowerCase()==='f'&&!e.repeat){e.preventDefault();lightMagic()}if(e.key==='Shift'&&!e.repeat){e.preventDefault();dash()}if(e.key.toLowerCase()==='q'&&!e.repeat){e.preventDefault();mirror()}if(e.key.toLowerCase()==='e'&&!e.repeat){e.preventDefault();breach()}const k=keyMap[e.key];if(k){e.preventDefault();if(mode==='playing'){if(k==='attack'&&!e.repeat)pressAttack();keys.add(k)}}if(e.key.toLowerCase()==='p'&&!e.repeat)pause()});
window.addEventListener('keyup',e=>{const k=keyMap[e.key];if(k){keys.delete(k);if(k==='attack')releaseAttack()}});
const touchKeys=new Map();
function touchKey(k){return k==='flap'?'up':handheld&&k==='up'?'lookUp':k}
clearTouch=bindTouchControls($('.touch'),{playing:()=>mode==='playing',down:k=>{const key=touchKey(k);touchKeys.set(k,key);keys.add(key);if(k==='attack')pressAttack(handheld)},up:k=>{const key=touchKeys.get(k);touchKeys.delete(k);if(![...touchKeys.values()].includes(key))keys.delete(key);if(k==='attack')releaseAttack()},cancel:k=>{const key=touchKeys.get(k);touchKeys.delete(k);if(![...touchKeys.values()].includes(key))keys.delete(key);if(k==='attack')cancelAttackInput()}});
if(handheld){$('#dash').onclick=null;$('#dash').onpointerdown=e=>{e.preventDefault();dash()};$('.touch').oncontextmenu=e=>e.preventDefault()}
window.addEventListener('blur',()=>{keys.clear();if(mode==='playing')pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')pause()});
function free(x,y,r=11){return ![[x-r,y-r],[x+r,y-r],[x-r,y+r],[x+r,y+r]].some(([a,b])=>solid(a,b))}
function move(o,dx,dy){const n=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/6));for(let i=0;i<n;i++){if(free(o.x+dx/n,o.y))o.x+=dx/n;if(free(o.x,o.y+dy/n))o.y+=dy/n}}
function clearPath(ax,ay,bx,by){const n=Math.ceil(Math.hypot(bx-ax,by-ay)/6);for(let i=0;i<=n;i++)if(solid(ax+(bx-ax)*i/Math.max(1,n),ay+(by-ay)*i/Math.max(1,n)))return false;return true}
function impact(e,damage=1){magic.effects.push({x:e.x,y:e.y,kind:'melee',damage,until:time+.24});hitStop=Math.max(hitStop,.045)}
function applyMelee(){
 const targets=[...rats,...fauna.trees,...fauna.birds,...(boss.active?[boss]:[])].filter(e=>!struck.has(e)&&inMelee(slash,e,clearPath));
 for(const e of targets){struck.add(e);impact(e);hitStop=Math.max(hitStop,slash.stage===3?.08:slash.stage===2?.06:.045);if(e===boss){boss.hp=Math.max(0,boss.hp-1);boss.stun=time+.15;if(!boss.hp){kills++;boss.cursed=false;say('紅熊倒下！走向右側出口。',5)}}}
 const hit=meleeFauna(fauna,slash,time,clearPath,targets);
 kills+=hit.killed;if(hit.felled)say('樹妖倒下，驚出了青影鳥！按 Q 使用鏡面。',4);
 for(const r of rats.filter(e=>targets.includes(e))){r.hp=Math.max(0,r.hp-1);r.state='rest';r.timer=.7;r.stun=time+.6;if(r.hp===1&&!r.pure&&!r.big)say('水晶碎開，老鼠變成綠色史萊姆！',2);if(!r.hp)kills++}
}
function attack(stage=1){if(player.slimeForm){slimeAttack();return}nextAttack=time+.32;attackUntil=time+.30;slash={x:player.x,y:player.y,face:player.face,stage};struck.clear();applyMelee()}
function nearEnemy(){return [...rats,...fauna.trees,...fauna.birds,...(boss.active?[boss]:[])].some(e=>inMelee(player,e,clearPath))}
function nextCombo(){comboStage=time<=comboUntil?comboStage%3+1:1;comboUntil=time+.85;attack(comboStage)}
function pressAttack(touch=false){if(mode!=='playing'||attackHeld)return;attackHeld=true;if(player.slimeForm){slimeAttack();return}
 if(touch&&handheld&&attackIntent({melee:nearEnemy(),combo:comboStage&&time<=comboUntil,wall:wallTarget(true),energy:player.energy,cost:BREACH_COST})==='breach'){breachHold={id:wallTarget(true).id,start:time};breachConsumed=false;chargeStart=null;return}
 if(nearEnemy()||(comboStage&&time<=comboUntil)){if(time>=nextAttack)nextCombo();else comboQueue=Math.min(2,comboQueue+1)}
 // Charging is an input action, not a shot: it can start during cooldown.
 // castLight still enforces the firing cooldown when the key is released.
 else chargeStart=time;
}
function releaseAttack(){if(!attackHeld)return;attackHeld=false;if(breachHold||breachConsumed){const quick=breachHold&&!breachConsumed;breachHold=null;breachConsumed=false;if(quick&&mode==='playing'&&castLight(magic,player,time,false))nextAttack=time+.5;return}if(mode==='playing'&&chargeStart!==null){if(castLight(magic,player,time,time-chargeStart>=.8))nextAttack=time+.5}chargeStart=null}
function autoAttack(){if(player.slimeForm){slimeAttack();return}if(nearEnemy())attack();else if(castLight(magic,player,time))nextAttack=time+.5}
function syncForm(){
 if(!setSlimeForm(player,boss.active&&boss.hp>0&&boss.cursed))return;
 clearTouch();keys.clear();cancelAttackInput();attackUntil=0;slash=null;magic.shots=[];dashTrail=[];slimeHits.clear();
 if(!player.slimeForm){player.bodyRadius=undefined;player.wing=MAX_WING}
 updateFormControls();
}
function updateFormControls(){
 if(handheld){$('#flap').innerHTML=player.slimeForm?'B<small>跳躍／攀附</small>':'B<small>拍翼</small>';$('#flap').setAttribute('aria-label',player.slimeForm?'B 跳躍或攀附':'B 拍翼或滑翔');$('#dash').disabled=Boolean(player.slimeForm);$('#dash').innerHTML=player.slimeForm?'X<small>變身中</small>':'X<small>衝刺</small>'}else $('#dash').textContent=player.slimeForm?'史萊姆無衝刺':'衝刺 Shift'
}
function slimeAttack(){if(startSlimeAttack(player)){slimeHits.clear();nextAttack=time+.55}}
function applySlimeHit(){
 if(!player.slimeForm||player.slimeAttack<=0)return;
 for(const e of [...rats,...(boss.active?[boss]:[])]){
  if(!e.hp||slimeHits.has(e)||Math.abs(e.x-player.x)>(e.radiusX||14)+20||Math.abs(e.y-player.y)>(e.radiusY||14)+16||!clearPath(player.x,player.y,e.x,e.y))continue;
  slimeHits.add(e);impact(e);e.hp=Math.max(0,e.hp-1);e.stun=time+.6;if(e!==boss){e.state='rest';e.timer=.7}if(!e.hp)kills++;
 }
}
function finishBoss(){
 if(!boss.active||boss.hp>0)return;
 boss.cursed=false;boss.shots=[];boss.mirrors=[];rats=rats.filter(r=>!r.bossMinion);syncForm();
}
function hurt(source='老鼠',damage=1){if(time<player.inv)return;if(breachHold){breachHold=null;breachConsumed=true}hurtUntil=time+.35;hitStop=Math.max(hitStop,.07);magic.effects.push({x:player.x,y:player.y,kind:'hurt',damage,until:time+.24});player.hp=Math.max(0,player.hp-damage);player.inv=time+1.5;updateHud();if(player.hp<=0){clearTouch();deaths++;cancelAttackInput();resetBoss(boss);syncForm();rats=rats.filter(r=>!r.bossMinion);magic=createMagic();dashTrail=[];resetFaunaAfterDeath(fauna);player.x=checkpoint.x;player.y=checkpoint.y;player.hp=MAX_HP;player.vy=0;player.dashRemaining=0;player.dashCooldown=0;player.wing=MAX_WING;player.grounded=false;player.inv=time+2;attackUntil=0;slash=null;for(const r of rats)if(r.hp){r.x=r.spawn;r.y=r.y0;r.state='walk';r.surface=null;r.crawlDown=false;r.timer=0;r.stun=0;r.vy=0}say('回到休息燈旁，生命補滿。已找到的光點保留。',5);updateHud()}else say(source==='針刺'?'碰到針刺了！看地面倒數，收起後再通過。':'被敵人碰到了！暫時不會再受傷。',2)}
function beginBoss(){clearTouch();cancelAttackInput();rats=rats.filter(r=>!r.bossMinion);if(new URLSearchParams(location.search).has('boss-preview'))document.querySelector('h1 span').textContent='紅熊試玩';enterBoss(boss,player,world.arena);syncForm();checkpoint={...world.exit};magic=createMagic();fauna.mirrorReady=time;attackUntil=0;slash=null;keys.clear();updateHud();say('紅熊 30 HP：避開吐息瞄準線，跳過重踏震波。變身後等重踏掉落鏡子，再拾取恢復！',8)}
function update(dt){time+=dt;syncForm();const dashStart={x:player.x,y:player.y},wasDashing=player.dashRemaining>0;const dx=Number(keys.has('right'))-Number(keys.has('left'));if(dx)player.face=dx;if(player.dashRemaining>0)dashTrail.push({x:player.x,y:player.y,face:player.dashFace,until:time+.18});
if(player.slimeForm)updateSlimePlayer(player,keys,dt,physics);else physics.player(player,keys,dt);applySlimeHit();
if(breachHold){const target=wallTarget(true);if(!validBreachHold(breachHold,target,nearEnemy(),player.energy,BREACH_COST)){breachHold=null;breachConsumed=true;say('破牆取消；能量保留。',1.5)}else if(time-breachHold.start>=BREACH_HOLD){performBreach(target);breachHold=null;breachConsumed=true}}dashTrail=dashTrail.filter(t=>t.until>time).slice(-10);
if(wasDashing&&player.abilities.dash){for(const e of [...rats,...fauna.birds,...(boss.active?[boss]:[])]){const rx=e.radiusX||20,ry=e.radiusY||18;if(!e.hp||dashHits.has(e)||e.x<Math.min(dashStart.x,player.x)-rx-11||e.x>Math.max(dashStart.x,player.x)+rx+11||Math.abs(e.y-player.y)>ry+11||!clearPath(player.x,player.y,e.x,e.y))continue;dashHits.add(e);impact(e);e.hp=Math.max(0,e.hp-1);e.stun=time+.6;if(rats.includes(e)){e.state='rest';e.timer=.7}if(!e.hp)kills++}}
if(comboQueue&&time>=nextAttack){comboQueue--;nextCombo()}
if(slash&&slash.stage===3&&time<attackUntil-.10){const steps=Math.max(1,Math.ceil(360*dt/6));for(let i=0;i<steps;i++){move(player,slash.face*360*dt/steps,0);slash.x=player.x;slash.y=player.y;applyMelee()}}
if(slash&&time<attackUntil-.10)applyMelee();
updateMagic(magic,dt,time,{solid,targets:[...rats,...fauna.birds,...(boss.active?[boss]:[]),...fauna.trees.map(t=>({...t,radiusX:27,radiusY:35,tree:true}))],hit:(e,damage=1)=>{
 if(e.tree)return; // Tree bark blocks light; only melee can fell trees.
 impact(e,damage);e.hp=Math.max(0,e.hp-damage);e.stun=time+.6;
 if(rats.includes(e)){e.state='rest';e.timer=.7;if(e.hp>0&&e.hp<=1&&!e.pure&&!e.big)say('光彈擊碎水晶，老鼠變成綠色史萊姆！',2)}
 if(!e.hp)kills++;
}});
$('#magic').textContent=chargeStart===null?'光彈 · F 切換':time-chargeStart>=.8?'蓄力完成 · 放開發射':`蓄力 ${Math.min(100,Math.floor((time-chargeStart)/.8*100))}%`;
for(const r of [...rats]){const children=splitSlime(r,free);for(const child of children){if(r.bossMinion){child.bossMinion=true;child.id=`${r.id}-child-${rats.length}`;}child.stun=time+.6;struck.add(child);dashHits.add(child);for(const shot of magic.shots)shot.hitTargets?.add(child)}rats.push(...children)}
finishBoss();for(const r of rats){if(!r.hp)continue;updateRat(r,player,physics,dt,time,clearPath);
if(time>=r.stun&&Math.abs(player.x-r.x)<(r.bodyRadius||14)+13&&Math.abs(player.y-r.y)<(r.bodyRadius||14)+10)hurt(r.big?'紫色大史萊姆':'老鼠',r.big?2:1);}
if(handheld){$('#dash').innerHTML=player.slimeForm?'X<small>變身中</small>':`X<small>${player.dashCooldown>0?player.dashCooldown.toFixed(1)+'s':'衝刺'}</small>`;$('#dash').dataset.ready=player.dashCooldown<=0}else $('#dash').textContent=player.slimeForm?'史萊姆無衝刺':player.dashCooldown>0?`衝刺 ${player.dashCooldown.toFixed(1)}s`:'衝刺 Shift';

if(handheld&&time>=fauna.mirrorReady){const m=sceneMirrors.find(m=>Math.hypot(m.x-player.x,m.y-player.y)<40&&clearPath(player.x,player.y,m.x,m.y));if(m&&fauna.birds.some(b=>b.hp&&b.mode!=='mirror'&&Math.hypot(b.x-m.x,b.y-m.y)<=180&&clearPath(m.x,m.y,b.x,b.y))){const count=mirrorFauna(fauna,m,time,clearPath);if(count>0)say(`場景鏡面映出了 ${count} 隻青影鳥！`,3)}}
kills+=updateFauna(fauna,player,time,dt,{clear:clearPath,free,hurt,visible:b=>{const cx=Math.max(0,Math.min(W*T-canvas.width,player.x-canvas.width*.38)),cy=Math.max(0,Math.min(H*T-canvas.height,player.y-canvas.height*.52));return b.x>=cx&&b.x<=cx+canvas.width&&b.y>=cy&&b.y<=cy+canvas.height}});updateBoss(boss,player,dt,time,{
 clear:clearPath,solid,hurt,
 summon:(kinds,i)=>{const minions=bossSummons(boss,player,kinds,rats.filter(r=>r.bossMinion&&r.hp>0).length);for(const r of minions)r.stun=time+1;rats.push(...minions);say(`紅熊剩餘 ${[75,50,20][i]}% 生命：召喚援軍！`,3)},
 curse:()=>say(handheld?'變成史萊姆！B 跳躍／攀附、A 跳撞；等重踏掉落鏡子。':'變成史萊姆！↑ 跳躍／攀附、Space 跳撞；等重踏掉落鏡子。',6),
 mirrorDrop:()=>say('重踏震落了鏡子！跳過震波，走近鏡子恢復。',4),
 cured:()=>say('鏡子映出真正的你，飛行與魔法恢復！',4)
});syncForm();$('#mirror').textContent=time>=fauna.mirrorReady?'鏡面 Q':`鏡面 ${Math.ceil(fauna.mirrorReady-time)}s`;
for(const trap of world.traps)if(trapSupported(trap,solid)&&touchesSpikes(player,trap,time)){hurt('針刺');break}
for(const reward of rewards)if(!reward.got&&Math.hypot(player.x-reward.x,player.y-reward.y)<26&&clearPath(player.x,player.y,reward.x,reward.y)&&collectReward(reward,player,MAX_WING,time)){
 pickupFlash={x:reward.x,y:reward.y,until:time+.7,kind:reward.kind,healed:reward.healed||0,percent:Math.round((reward.restored||0)/MAX_WING*100)};updateHud();say(reward.kind==='energy'?`破牆能量 +1（${player.energy}/${BREACH_COST}）${player.energy>=BREACH_COST?'，可以打破裂牆！':''}`:reward.kind==='wing'?`藍能 +40%・翼能 +${Math.round(reward.restored/MAX_WING*100)}%${reward.healed?'・回復半顆心！':reward.healCycles?'・生命已滿':''}（回血進度 ${player.healCharge}%）`:`找到藏品：${reward.name}。能力已解鎖，本次冒險持續有效。`,reward.kind==='wing'?2:4);
}
for(const l of lights)if(!l.got&&Math.hypot(player.x-l.x,player.y-l.y)<30){l.got=true;updateHud();say(lights.every(p=>p.got)?'三顆光點齊了！感應出口方向，繼續前進。':'找到引路光點！繼續探索上下岔路。')}
for(let i=0;i<world.safes.length;i++){const safe=world.safes[i];if(!activated.has(i)&&Math.hypot(player.x-safe.x,player.y-safe.y)<45){activated.add(i);checkpoint={...safe};player.hp=MAX_HP;updateHud();say('休息燈已點亮，生命補滿。之後會從這裡返回。')}}
if(!boss.active&&Math.hypot(player.x-world.exit.x,player.y-world.exit.y)<42){if(lights.every(p=>p.got))beginBoss();else say('出口需要 3 顆引路光點。',2)}
if(boss.active&&!boss.hp&&Math.hypot(player.x-world.arena.exit.x,player.y-world.arena.exit.y)<42){mode='won';clearTouch();cancelAttackInput();keys.clear();panel('第一關完成！',`擊敗紅熊，逃出培養所！探索 ${Math.floor(time/60)} 分 ${Math.floor(time%60)} 秒，擊退 ${kills} 隻敵人，返回 ${deaths} 次；藏品 ${rewards.filter(r=>r.kind==='relic'&&r.got).length}/3。`,'再玩一次')}
discoverTorches(torches,player,clearPath);
const cx=Math.floor(player.x/T),cy=Math.floor(player.y/T);for(let y=cy-4;y<=cy+4;y++)for(let x=cx-6;x<=cx+6;x++)if(map[y]?.[x]===0)seen.add(`${x},${y}`);
if(handheld){const intent=attackIntent({melee:nearEnemy()||(comboStage>0&&time<=comboUntil),combo:false,wall:wallTarget(true),energy:player.energy,cost:BREACH_COST});$('.attack').dataset.intent=intent;$('.attack small').textContent=player.slimeForm?'跳撞':breachHold?Math.floor((time-breachHold.start)/BREACH_HOLD*100)+'%':intent==='breach'?'長按破牆':chargeStart!==null?(time-chargeStart>=.8?'滿蓄力':'蓄力'):'攻擊';if(breachHold)$('#notice').textContent=`破牆蓄力 ${Math.min(100,Math.floor((time-breachHold.start)/BREACH_HOLD*100))}% · 放開可取消`;else if(time>noticeUntil)$('#notice').textContent=player.slimeForm?'史萊姆 · B 跳躍／攀附 · A 跳撞 · 找掉落的鏡子':intent==='breach'?'靠近裂牆 · 長按 A 破牆（30 能量）':'十字鍵移動／觀察 · B 拍翼 · A 攻擊 · X 衝刺'}
else if(time>noticeUntil){$('#notice').textContent=player.slimeForm?'← → 移動 · ↑ 跳躍／攀附 · ↓ 放開攀附 · Space 跳撞 · 拾取鏡子恢復':'← → 移動 · ↑ 拍翼／滑翔 · ↓ 降落穿過薄台 · Space 連按接招／長按蓄力 · Shift 衝刺 · F 切換魔法 · E 破牆 · Q 鏡面'}
}
function rect(x,y,w,h,c){g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)}
function text(t,x,y,c='#c5d9c5',size=13){g.fillStyle=c;g.font=`${size}px system-ui`;g.fillText(t,Math.round(x),Math.round(y))}
function render(){$('#critical-vignette').style.opacity=criticalOpacity(player.hp,time,reduced);g.imageSmoothingEnabled=false;camera.x=Math.max(0,Math.min(W*T-canvas.width,player.x-canvas.width*.38));camera.y=Math.max(0,Math.min(H*T-canvas.height,player.y-canvas.height*.52));g.fillStyle=light?'#b6c5ae':'#14292e';g.fillRect(0,0,canvas.width,canvas.height);g.save();g.translate(-Math.round(camera.x),-Math.round(camera.y));
drawTerrain(g,map,T,camera,canvas.width,canvas.height,light);if(handheld)drawSceneMirrors(g,sceneMirrors,time,fauna.mirrorReady);
for(const w of crackedWalls){if(w.broken||w.x>camera.x+canvas.width||w.x+w.w<camera.x||w.y>camera.y+canvas.height||w.y+w.h<camera.y)continue;rect(w.x,w.y,w.w,w.h,'#625047');g.strokeStyle='#f0ae6b';g.lineWidth=3;if(w.axis==='vertical'){for(const oy of [8,w.h-8]){g.beginPath();g.moveTo(w.x+4,w.y+oy);g.lineTo(w.x+25,w.y+oy+4);g.lineTo(w.x+48,w.y+oy-3);g.lineTo(w.x+70,w.y+oy+3);g.lineTo(w.x+w.w-4,w.y+oy);g.stroke()}}else for(const ox of [8,w.w-8]){g.beginPath();g.moveTo(w.x+ox,w.y+4);g.lineTo(w.x+ox+4,w.y+24);g.lineTo(w.x+ox-3,w.y+42);g.lineTo(w.x+ox+3,w.y+66);g.lineTo(w.x+ox,w.y+w.h-4);g.stroke()}text(w.axis==='vertical'?'↑↓ 裂面 30':'裂牆 · 30',w.x+9,w.y+48,'#ffe0b1',12)}
// Wall fixtures remain visible while unlit; only actual nearby exploration ignites them.
for(const t of torches){if(t.x<camera.x-45||t.x>camera.x+canvas.width+45||t.y<camera.y-45||t.y>camera.y+canvas.height+45)continue;
 const x=t.x,y=t.y;
 if(t.lit){g.save();g.globalAlpha=light?.09:.14;rect(x-28,y-32,56,60,'#ffc36b');g.globalAlpha=light?.12:.18;rect(x-17,y-23,34,39,'#ffc36b');g.restore()}
 rect(x-14,y-1,15,4,'#505257');rect(x-15,y-8,4,15,'#777575');rect(x-3,y-1,6,15,'#6e513b');rect(x-6,y-4,12,5,t.lit?'#a17b48':'#62646a');
 if(t.lit){const flicker=reduced?0:Math.floor(time*4+t.node)%2;rect(x-5,y-13,10,9,'#ec8a40');rect(x-3,y-19-flicker,6,13+flicker,'#ffd17a');rect(x-1,y-13,3,8,'#fff1b0')}
 else{rect(x-4,y-9,8,5,'#393b42');rect(x-2,y-11,4,3,'#707478')}
}
for(const p of world.platforms){if(p.y>=camera.y&&p.y<=camera.y+canvas.height&&p.x+p.w>=camera.x&&p.x<=camera.x+canvas.width){rect(p.x,p.y,p.w,3,'#7a9f9b');for(let x=p.x+4;x<p.x+p.w;x+=16)rect(x,p.y+3,5,3,'#405e5e')}}
for(const trap of world.traps){if(Math.abs(trap.x-player.x)>canvas.width||Math.abs(trap.y-player.y)>canvas.height||!trapSupported(trap,solid))continue;drawSpikes(g,trap,time)}
for(const mark of world.landmarks){text(mark.name,mark.x-65,mark.y-54,'#b8cdb0',15);rect(mark.x-28,mark.y+39,56,4,'#8aa695')}
for(const reward of rewards){if(reward.got||reward.x<camera.x-20||reward.x>camera.x+canvas.width+20||reward.y<camera.y-20||reward.y>camera.y+canvas.height+20)continue;
 const x=reward.x,y=reward.y+(reduced?0:Math.round(Math.sin(time*2+reward.node)*2));
 if(reward.kind==='wing'){rect(x-9,y-7,4,12,'#70dfe2');rect(x-5,y-3,4,12,'#b8ffff');rect(x-1,y-7,4,12,'#70dfe2');rect(x+3,y-11,5,12,'#b8ffff')}
 else if(reward.kind==='energy'){rect(x-5,y-5,10,10,'#f0a660');rect(x-2,y-2,4,4,'#ffefc0')}
 else{rect(x-10,y-9,20,18,'#514a6d');rect(x-7,y-6,14,12,'#c2a4e8');rect(x-2,y-8,4,16,'#f2e1ff');rect(x-6,y+11,12,2,'#c2a4e8')}
}
if(pickupFlash&&time<pickupFlash.until){const k=pickupFlash;g.strokeStyle=k.kind==='wing'?'#a5f4ee':'#dfc5ff';g.lineWidth=2;const size=reduced?14:14+(1-(k.until-time)/.7)*18;g.strokeRect(k.x-size,k.y-size,size*2,size*2);text(k.kind==='energy'?'能量 +1':k.kind==='wing'?(k.healed?'♥ +½':'藍能 +40%'):'藏品 +1',k.x-20,k.y-24,g.strokeStyle,12)}
for(const l of lights){if(l.got)continue;const bob=reduced?0:Math.round(Math.sin(time*3)*3);rect(l.x-9,l.y-9+bob,18,18,'#6a6951');rect(l.x-5,l.y-7+bob,10,14,'#ffe6a0');rect(l.x-7,l.y-3+bob,14,6,'#ffe6a0')}
world.safes.forEach((safe,i)=>{rect(safe.x-12,safe.y-15,24,30,'#58615a');rect(safe.x-7,safe.y-23,14,17,activated.has(i)?'#ffe3a0':'#9ab6ba');text('休息燈',safe.x-23,safe.y+35)});
const ordinaryTarget=ordinaryWall(player,world,keys.has('down')?'down':keys.has(handheld?'lookUp':'up')?'up':null);if(ordinaryTarget){g.strokeStyle=player.energy>=30?'#edc78f':'#877365';g.lineWidth=2;g.strokeRect(ordinaryTarget.x,ordinaryTarget.y,ordinaryTarget.w,ordinaryTarget.h);text('破牆 30',ordinaryTarget.x,ordinaryTarget.y-5,'#edc78f',12)}
const ex=world.exit.x,ey=world.exit.y;rect(ex-20,ey-40,40,80,'#41685f');rect(ex-13,ey-34,26,68,lights.every(l=>l.got)?'#dbe9ac':'#789789');text('紅熊守門室',ex-36,ey-52);
function sprite(index,x,y,width,height,flip=false){if(!faunaImage)return;const f=faunaFrames[index];g.save();g.translate(Math.round(x),Math.round(y));if(flip)g.scale(-1,1);g.drawImage(faunaImage,f.x,f.y,f.w,f.h,-width/2,-height/2,width,height);g.restore()}
for(const t of fauna.trees){if(Math.abs(t.x-player.x)>canvas.width||Math.abs(t.y-player.y)>canvas.height)continue;if(!t.hp){rect(t.x-15,t.y+20,30,15,'#684f38');continue}sprite(t.state==='strike'?3:2,t.x,t.y,64,70);if(t.casting>0)text('旋風蓄力',t.x-30,t.y-50,'#a4ed9c',12);if(t.state==='ready')text('!',t.x-4,t.y-43,'#ffca7b',22);if(t.state==='strike'){g.strokeStyle='#d4ac76';g.strokeRect(t.x-70,t.y-25,140,50)} }
for(const b of fauna.birds){if(!b.hp||Math.abs(b.x-player.x)>canvas.width||Math.abs(b.y-player.y)>canvas.height)continue;sprite(reduced?0:Math.floor(time*6)%2,b.x,b.y,48,36,b.dx<0);if(b.mode==='ready')text('!',b.x-3,b.y-27,'#83ecec',18);if(b.mode==='mirror'){g.strokeStyle='#adeafa';g.strokeRect(b.x-28,b.y-26,56,52);sprite(1,b.x+16,b.y,24,18,true)}}
drawTornadoes(g,fauna.tornadoes,time,reduced);
for(const z of fauna.zones)if(z.seen&&z.elapsed>1&&fauna.birds.some(b=>b.hp&&b.zone===z.id)&&Math.hypot(z.x-player.x,z.y-player.y)<320)text('影子正在聚集…',z.x-40,z.y-40,'#88d5df',12);
if(time<fauna.mirrorUntil){g.strokeStyle='#bceefa';g.lineWidth=3;g.strokeRect(player.x-24,player.y-38,48,76)}
for(const r of rats){if(!r.hp)continue;const f=r.state==='ready'?2:(r.state==='dash'||r.state==='jump')?3:Math.floor(time*7)%2;g.save();g.translate(Math.round(r.x),Math.round(r.y));if(r.surface==='right')g.rotate(-Math.PI/2);else if(r.surface==='left')g.rotate(Math.PI/2);else if(r.surface==='ceiling')g.rotate(Math.PI);if(r.face<0)g.scale(-1,1);const sprite=enemyFrames[(isSlime(r)?4:0)+f];const width=r.big?52:isSlime(r)?32:56,height=width*sprite.h/sprite.w;if(r.big)g.filter='hue-rotate(175deg) saturate(0.85)';g.drawImage(ratImage,sprite.x,sprite.y,sprite.w,sprite.h,-width/2,(r.bodyRadius||14)-height,width,height);g.filter='none';if(time<r.stun){g.strokeStyle='#c7ffa1';g.strokeRect(-width/2-3,10-height,width+6,height+8);}g.restore();if(r.state==='ready')text('!',r.x-4,r.y-32,'#f3bc79',23)}
if(drawHero&&!reduced)for(const t of dashTrail){g.globalAlpha=Math.max(0,(t.until-time)/.18)*.25;drawHero(g,1,0,t.face<0,Math.round(t.x-(t.face<0?28:36)),Math.round(t.y-30))}g.globalAlpha=1;
if(player.dashRemaining>0){for(const dy of [-13,0,13]){const len=reduced?12:30;rect(player.x-player.dashFace*30-(player.dashFace>0?len:0),player.y+dy,len,2,'#b4ecf1')}}
if(boss.active){const a=world.arena;rect(a.exit.x-18,a.floor-80,36,80,boss.hp?'#673847':'#bce1a1');text(boss.hp?'擊敗紅熊開門':'出口',a.exit.x-35,a.floor-90);drawBossEffects(g,boss,time,reduced);for(const m of boss.mirrors)text(m.landed?'拾取破解鏡':'鏡子掉落',m.x-32,m.y-30,'#d7fff5',12);if(boss.hp){if(boss.cursed&&drawHero){drawHero(g,1,0,boss.face<0,boss.x-32,boss.y-30);drawBossTelegraph(g,boss);}else drawBear(g,boss,time,reduced);text(boss.state==='ready'?BOSS_ATTACK_LABELS[boss.attack]:'紅熊',boss.x-55,boss.y-63,'#ffbfae',14)}}
if(drawHero){const moving=player.dashRemaining>0||keys.has('left')||keys.has('right')||keys.has('up')||keys.has('down');const attacking=time<attackUntil;const row=attacking?3:moving?1:0;const f=attacking?Math.min(5,Math.floor((.30-(attackUntil-time))/.05)):player.gliding?0:reduced?0:Math.floor(time*8)%6;g.globalAlpha=time<player.inv?(reduced?.65:Math.floor(time*10)%2===0?.45:1):1;if(boss.cursed){const sf=enemyFrames[4+(player.slimeAttack>0?3:player.grounded?Math.floor(time*7)%2:2)];g.save();g.translate(Math.round(player.x),Math.round(player.y));if(player.surface==='right')g.rotate(-Math.PI/2);else if(player.surface==='left')g.rotate(Math.PI/2);else if(player.surface==='ceiling')g.rotate(Math.PI);if(player.face<0)g.scale(-1,1);g.drawImage(ratImage,sf.x,sf.y,sf.w,sf.h,-18,-17,36,28);g.restore();g.strokeStyle='#e2ffe9';g.lineWidth=2;g.beginPath();g.ellipse(player.x,player.y,23,20,0,0,Math.PI*2);g.stroke();text('你 · 史萊姆',player.x-30,player.y-30,'#d7fff5',12)}else drawHero(g,row,f,player.face<0,Math.round(player.x-(player.face<0?28:36)),Math.round(player.y-30));g.globalAlpha=1;
if(attacking&&slash)drawSlash(g,slash,1-(attackUntil-time)/.30,reduced,slashStyle)}
if(chargeStart!==null){const q=Math.min(1,(time-chargeStart)/.8),cx=player.x+player.face*24;g.save();g.strokeStyle=q>=1?'#ffffff':'#8edcff';g.lineWidth=3;g.beginPath();g.arc(cx,player.y,7+q*12,0,Math.PI*2);g.stroke();g.fillStyle='#b8efff';g.beginPath();g.arc(cx,player.y,3+q*7,0,Math.PI*2);g.fill();g.restore();rect(player.x-24,player.y-43,48,4,'#283f50');rect(player.x-24,player.y-43,48*q,4,'#b8efff');text(q>=1?'滿蓄力 · 1.5':`${Math.floor(q*100)}%`,player.x-28,player.y-49,'#dfffff',11)}
 drawEffects(g,magic,time,reduced);
g.restore();
if(time<hurtUntil){g.save();g.strokeStyle='#ed9a9a';g.lineWidth=5;g.globalAlpha=reduced?.5:(hurtUntil-time)/.35;g.strokeRect(3,3,canvas.width-6,canvas.height-6);g.restore()}
if(boss.active){rect(canvas.width/2-135,7,270,boss.cursed?58:38,'#17242a');rect(canvas.width/2-120,14,240,8,'#482b36');rect(canvas.width/2-120,14,240*boss.hp/30,8,'#d7777c');text(`紅熊 ${boss.hp} / 30`,canvas.width/2-120,38,'#ffe1d0',12);if(boss.cursed)text('史萊姆：拾取重踏掉落的鏡子',canvas.width/2-120,57,'#b6e7c9',12)}
// Explored-only overview; the isolated boss arena uses its own HUD.
if(!boss.active){
const scale=canvas.width<600?.75:1,mx=canvas.width-W*scale-18,my=14;
rect(mx-6,my-6,W*scale+12,H*scale+24,'#0f2029');for(const s of seen){const [x,y]=s.split(',').map(Number);rect(mx+x*scale,my+y*scale,Math.max(1,scale),Math.max(1,scale),'#617b70')}
for(const l of lights)if(!l.got&&seen.has(`${Math.floor(l.x/T)},${Math.floor(l.y/T)}`))rect(mx+l.x/T*scale,my+l.y/T*scale,3,3,'#ffe6a0');
for(const r of rewards)if(!r.got&&seen.has(`${Math.floor(r.x/T)},${Math.floor(r.y/T)}`))rect(mx+r.x/T*scale,my+r.y/T*scale,r.kind==='relic'?3:2,r.kind==='relic'?'#cfadf4':'#78dfe5');
rect(mx+player.x/T*scale,my+player.y/T*scale,3,3,'#9ef1db');text('已探索',mx+4,my+H*scale+12,'#bad0bd',10);}
rect(14,34,72,5,'#42524a');rect(14,34,Math.round(72*player.wing/MAX_WING),5,'#b8dab5');text(player.slimeForm?(player.surface?'攀附':player.grounded?'史萊姆':'跳躍'):player.gliding?'滑翔':player.flapping?'拍翼':player.grounded?'休息回氣':'下落',14,56,'#b8dab5',11);
if(breachHold){const px=player.x-camera.x,py=player.y-camera.y,q=Math.min(1,(time-breachHold.start)/BREACH_HOLD);rect(px-26,py-46,52,6,'#283c25');rect(px-26,py-46,52*q,6,'#c5dd98');text('破牆',px-14,py-51,'#dbe9ba',11)}
text(`${Math.floor(time/60)}:${String(Math.floor(time%60)).padStart(2,'0')}`,14,24,'#bed0bd',12);

}
function drawJourneyMap(){const c=$('#journey-map'),ctx=c.getContext('2d'),scale=Math.min((c.width-24)/W,(c.height-24)/H),ox=(c.width-W*scale)/2,oy=8;ctx.fillStyle='#adbe87';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#263b29';for(const cell of seen){const [x,y]=cell.split(',').map(Number);ctx.fillRect(ox+x*scale,oy+y*scale,Math.max(1,scale),Math.max(1,scale))}ctx.strokeStyle='#233522';for(const w of crackedWalls)if(w.discovered)ctx.strokeRect(ox+w.x/T*scale-2,oy+w.y/T*scale-2,6,6);const px=ox+player.x/T*scale,py=oy+player.y/T*scale;ctx.fillStyle='#000';ctx.fillRect(px-5,py-1,11,3);ctx.fillRect(px-1,py-5,3,11)}
function loop(now){const dt=Math.min(.05,last?(now-last)/1000:0);last=now;if(mode==='playing'){if(hitStop>0)hitStop=Math.max(0,hitStop-dt);else update(dt);}if(player&&ratImage)render();requestAnimationFrame(loop)}
try{[drawHero,ratImage]=await Promise.all([loadHero(),(async()=>{const im=new Image();im.src=new URL('../assets/sprites/rats.png',import.meta.url).href;await im.decode();return im})()]);for(let row=0;row<2;row++)for(let col=0;col<4;col++){const cw=Math.floor(ratImage.width/4),ch=Math.floor(ratImage.height/2),c=document.createElement('canvas');c.width=cw;c.height=ch;const ctx=c.getContext('2d');ctx.drawImage(ratImage,col*cw,row*ch,cw,ch,0,0,cw,ch);const data=ctx.getImageData(0,0,cw,ch).data;let l=cw,t=ch,r=0,b=0;for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(data[(y*cw+x)*4+3]>100){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}enemyFrames.push({x:col*cw+l,y:row*ch+t,w:Math.max(1,r-l+1),h:Math.max(1,b-t+1)})}faunaImage=new Image();faunaImage.src=new URL('../assets/sprites/fauna.png',import.meta.url).href;await faunaImage.decode();for(let row=0;row<2;row++)for(let col=0;col<2;col++){const w=faunaImage.width/2,h=faunaImage.height/2,c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.drawImage(faunaImage,col*w,row*h,w,h,0,0,w,h);const d=ctx.getImageData(0,0,w,h).data;let left=w,top=h,right=0,bottom=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>100){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}faunaFrames.push({x:col*w+left,y:row*h+top,w:right-left+1,h:bottom-top+1})}reset();mode='intro';$('#start').disabled=false;$('#start').textContent='開始探索';requestAnimationFrame(loop)}catch(e){$('#description').textContent='素材載入失敗，請重新整理或確認本機伺服器。';console.error(e)}
// Read-only snapshot for playthrough checks; game state is never exposed for mutation.
window.levelSnapshot=(includeMap=false)=>({mode,boss:{...boss},slashStyle,magic:JSON.parse(JSON.stringify(magic)),fauna:JSON.parse(JSON.stringify(fauna)),player:{...player},lights:lights.map(l=>({...l})),rats:rats.map(r=>({...r})),rewards:rewards.map(r=>({...r})),torches:torches.map(t=>({...t})),crackedWalls:crackedWalls.map(w=>({...w})),checkpoint:{...checkpoint},kills,time,map:includeMap?map.map(r=>r.slice()):undefined,exit:{...world.exit},safes:world.safes.map(s=>({...s})),traps:world.traps.map(t=>({...t,...spikeState(time)})),deaths});
