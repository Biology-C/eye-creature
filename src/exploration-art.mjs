import {drawPickupIcon} from './pickup-art.mjs';
// Original procedural exploration props, intentionally quieter than combat silhouettes.
export function drawExploration(g,s,world,p,time,reduced,camera,canvas,walls=[]){
 const box=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)};
 for(const mark of world.landmarks){if(mark.type===undefined)continue;const x=mark.x,y=mark.y;
  g.save();g.globalAlpha=.65;
  if(mark.type===0){box(x-60,y-100,120,150,'#203b49');box(x-52,y-90,104,124,'#41606a');box(x-45,y-82,90,105,'#263f4a');box(x-4,y-82,6,105,'#587677');g.strokeStyle='#192d38';g.lineWidth=6;g.beginPath();g.moveTo(x+25,y-82);g.lineTo(x-8,y-36);g.lineTo(x+15,y+20);g.stroke()}
  if(mark.type===1){for(let i=0;i<5;i++){g.strokeStyle=i%2?'#355340':'#4a5940';g.lineWidth=10;g.beginPath();g.moveTo(x-60+i*28,y-95);g.bezierCurveTo(x+55,y-20,x-70,y+12,x-70+i*35,y+50);g.stroke()}}
  if(mark.type===2){for(let i=0;i<4;i++){box(x-60+i*34,y-95+(i%2)*20,22,115,'#45465a');box(x-57+i*34,y-88+(i%2)*20,15,83,'#728385');box(x-56+i*34,y-82+(i%2)*20,3,62,'#9aabb0')}}
  if(mark.type===3){box(x-65,y+20,130,13,'#474453');g.strokeStyle='#67637c';g.lineWidth=12;g.beginPath();g.arc(x,y-30,53,Math.PI,Math.PI*2);g.stroke();box(x-8,y-25,16,45,'#595467');box(x-12,y-74,73,16,'#615f73')}
  g.restore();
 }
 for(const w of s.winds){if(w.x<camera.x-canvas.width||w.x>camera.x+canvas.width||w.y>camera.y+canvas.height||w.y+w.h<camera.y)continue;
  box(w.x,w.y+w.h-10,w.w,10,'#304c52');for(let x=w.x+4;x<w.x+w.w;x+=12)box(x,w.y+w.h-9,4,8,w.active?'#99d2cc':'#52666b');
  g.save();g.strokeStyle=w.active?'#88d2cb':'#445e64';g.globalAlpha=w.active?.45:.18;g.lineWidth=2;
  for(let i=0;i<5;i++){const x=w.x+10+i*(w.w-20)/4;g.beginPath();g.moveTo(x,w.y+16);g.lineTo(x,w.y+w.h-20);g.stroke();if(w.active&&!reduced){const y=w.y+(w.h-(time*100+i*65)%w.h);box(x-2,y,3,14,'#c5f5da')}}
  for(let y=w.y+30;y<w.y+w.h;y+=96){g.beginPath();g.moveTo(w.x+w.w/2-8,y+8);g.lineTo(w.x+w.w/2,y);g.lineTo(w.x+w.w/2+8,y+8);g.stroke()}g.restore();
 }
 for(const o of s.obstacles){if(o.broken){box(o.x-o.w/2,o.y+o.h/2-4,o.w,4,'#435444');continue}g.save();g.translate(o.x,o.y);g.strokeStyle=o.stage===3?'#a7b7be':'#91a078';g.lineWidth=o.stage===2?5:3;
  for(let i=-2;i<=2;i++){g.beginPath();g.moveTo(i*9,-o.h/2);g.lineTo(i*9+(i%2?9:-9),0);g.lineTo(i*9,o.h/2);g.stroke()}if(o.stage===3){g.strokeRect(-o.w/2,-o.h/2,o.w,o.h);g.beginPath();g.moveTo(-20,-20);g.lineTo(20,20);g.moveTo(-20,20);g.lineTo(20,-20);g.stroke()}g.fillStyle='#d9dfc8';g.font='12px system-ui';g.fillText(['','Ⅰ 細根','Ⅱ 纏枝','Ⅲ 薄障礙'][o.stage],-24,-o.h/2-9);g.restore();
 }
 for(const e of s.echoes){if(e.got)continue;g.save();g.globalAlpha=reduced?.8:.7+Math.sin(time*2)*.15;drawPickupIcon(g,'echo',e.x,e.y);g.restore()}
 if(s.gaze){g.save();g.strokeStyle='#e5d8af';g.lineWidth=2;g.beginPath();g.arc(p.x,p.y,24,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,s.elapsed/.6));g.stroke();g.restore()}
 for(const o of [...s.obstacles,...walls])if(o.changedAt&&time-o.changedAt<.3&&!reduced){g.strokeStyle='#bdd7b1';g.lineWidth=2;g.strokeRect(o.x-10,o.y-10,20,20)}
}
