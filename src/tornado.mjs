// Finite lifetime and two reflections; third collision dissipates.
export function updateTornadoes(shots,dt,{free,player,hurt}){
 return shots.filter(b=>{b.life-=dt;if(b.life<=0)return false;const n=Math.max(1,Math.ceil(150*dt/3));
 for(let i=0;i<n;i++){const dx=b.dx*150*dt/n,dy=b.dy*150*dt/n;const hitX=!free(b.x+dx,b.y,9),hitY=!free(b.x,b.y+dy,9),corner=!hitX&&!hitY&&!free(b.x+dx,b.y+dy,9);
 if(hitX||hitY||corner){if(b.bounces>=2)return false;b.bounces++;if(hitX||corner)b.dx*=-1;if(hitY||corner)b.dy*=-1}else{b.x+=dx;b.y+=dy}
 if(Math.hypot(b.x-player.x,b.y-player.y)<23){hurt('綠色龍捲風');return false}
 }return true;});
}
export function drawTornadoes(g,shots,time,reduced){for(const b of shots){g.save();g.translate(Math.round(b.x),Math.round(b.y));for(let i=0;i<4;i++){const w=6+i*4;g.strokeStyle=i%2?'#c5f7a1':'#69bb79';g.lineWidth=3;g.beginPath();g.ellipse(reduced?0:Math.sin(time*13+i)*2,12-i*8,w,3,0,0,Math.PI*2);g.stroke()}g.restore()}}
