// Finite lifetime and two reflections; third collision dissipates.
export function updateTornadoes(shots,dt,{free,player,hurt}){
 return shots.filter(b=>{b.life-=dt;if(b.life<=0)return false;const n=Math.max(1,Math.ceil(150*dt/3));
 for(let i=0;i<n;i++){const dx=b.dx*150*dt/n,dy=b.dy*150*dt/n;const hitX=!free(b.x+dx,b.y,9),hitY=!free(b.x,b.y+dy,9),corner=!hitX&&!hitY&&!free(b.x+dx,b.y+dy,9);
 if(hitX||hitY||corner){if(b.bounces>=2)return false;b.bounces++;if(hitX||corner)b.dx*=-1;if(hitY||corner)b.dy*=-1}else{b.x+=dx;b.y+=dy}
 if(Math.hypot(b.x-player.x,b.y-player.y)<23){hurt('綠色龍捲風');return false}
 }return true;});
}
export function drawTornadoes(g,shots,time,reduced){for(const b of shots){
 g.save();g.translate(Math.round(b.x),Math.round(b.y));g.rotate(Math.atan2(b.dy,b.dx));const phase=reduced?0:time*15;
 for(let layer=0;layer<2;layer++){g.lineWidth=layer?1.4:4;for(let i=0;i<11;i++){const x=-22+i*4.4,r=6+11*Math.sqrt(Math.max(.1,1-(x/27)**2));g.strokeStyle=layer?(i%3===0?'#e0ff9e':'#7fff46'):'#187c2d';g.beginPath();g.ellipse(x,Math.sin(phase+i*.9)*1.6,3+Math.sin(phase+i)*1.2,r,Math.sin(phase+i*.7)*.18,0,Math.PI*2);g.stroke()}}g.restore();}}
