// Presentation only. Lifetimes use game time so pause also freezes feedback.
export function createHealingFeedback(){
 let previous=null,event=null;
 return {
  reset(hp){previous=hp;event=null},
  observe(hp,time){if(previous!==null&&hp>previous)event={from:previous,to:hp,amount:hp-previous,at:time};previous=hp;return event},
  get event(){return event},
  draw(g,p,time,reduced){
   if(!event)return;const age=time-event.at;if(age<0||age>=.6)return;
   g.save();
   if(!reduced)for(let i=0;i<10;i++){
    const progress=(age/.6+i*.07)%1,x=p.x+Math.sin(i*2.4)*23,y=p.y+14-progress*51;
    g.globalAlpha=(1-age/.6)*(.5+progress*.5);g.fillStyle=i%2?'#b1ffd0':'#49e887';
    g.fillRect(Math.round(x)-1,Math.round(y)-4,3,9);g.fillRect(Math.round(x)-4,Math.round(y)-1,9,3);
   }
   g.globalAlpha=1;g.font='bold 18px system-ui';g.textAlign='center';
   const y=p.y-44-(reduced?0:age*18);g.lineWidth=4;g.strokeStyle='#102b22';g.strokeText('+'+event.amount,p.x,y);g.fillStyle='#8affb3';g.fillText('+'+event.amount,p.x,y);g.restore();
  },
  paintHud(root,time){
   const active=event&&time>=event.at&&time<event.at+.4;
   for(const [i,cell]of [...root.querySelectorAll('.hp-cell')].entries()){
    const from=active?Math.max(0,Math.min(1,event.from-i)):0,to=active?Math.max(0,Math.min(1,event.to-i)):0;
    let flash=cell.querySelector('.hp-recovery');if(!flash){flash=document.createElement('span');flash.className='hp-recovery';flash.setAttribute('aria-hidden','true');cell.append(flash)}
    // Only the recovered part of a half/full cell lights up.
    Object.assign(flash.style,{position:'absolute',inset:'0 auto 0 '+from*100+'%',width:Math.max(0,to-from)*100+'%',background:'#8affb3',opacity:active?'1':'0',pointerEvents:'none'});
   }
  }
 };
}
export function markBossHit(b,before,time){if(b.hp<before)b.hitFlashAt=time}
export function bossFlash(b,time){return b.hitFlashAt==null?0:Math.max(0,Math.min(1,1-(time-b.hitFlashAt)))}
export function wingFrame(time,reduced){return reduced?0:Math.floor(time*8)%6}

// Composite onto the existing alpha mask: silhouette and pose never change.
export function createBossPainter(makeCanvas=()=>document.createElement('canvas')){
 let canvas;
 return (g,b,time,reduced,drawBody)=>{
  if(b.cursed){g.save();g.strokeStyle='#df8791';g.lineWidth=2;if(reduced)g.strokeRect(b.x-38,b.y-37,76,66);else{g.globalAlpha=.35;g.lineWidth=4;g.beginPath();g.ellipse(b.x,b.y-4,40,35,0,0,Math.PI*2);g.stroke()}g.restore()}
  const alpha=bossFlash(b,time);
  canvas??=makeCanvas();if(canvas.width!==320){canvas.width=320;canvas.height=320}
  const c=canvas.getContext('2d');c.clearRect(0,0,320,320);c.imageSmoothingEnabled=false;c.save();c.translate(160-b.x,160-b.y);drawBody(c);c.restore();
  if(alpha){c.save();c.globalCompositeOperation='source-atop';c.globalAlpha=alpha;c.fillStyle='#ffe0e3';c.fillRect(0,0,320,320);c.restore();}
  g.drawImage(canvas,b.x-160,b.y-160);
 };
}
