// Game-time seconds only: pause/blur also freezes the hazard cycle.
export function spikeState(time){const phase=((time%6)+6)%6;const active=phase>=3;return {phase,active,warning:phase>=2.2&&!active,height:active?Math.round(30*Math.min(1,(phase-3)/.2,(6-phase)/.2)):0,remaining:Math.ceil(active?6-phase:3-phase)}}
export function touchesSpikes(player,trap,time){const s=spikeState(time+(trap.offset||0)),a=trap.angle||0,dx=player.x-trap.x,dy=player.y-trap.y,x=dx*Math.cos(a)+dy*Math.sin(a),y=-dx*Math.sin(a)+dy*Math.cos(a);return s.height>0&&x+11>0&&x-11<trap.w&&y+11>-s.height&&y-11<0}
// Add sparse pairs: ceiling opposite floor; stagger left/right wall hazards.
export function addSurfaceSpikes(world){
 const extras=[];for(const [i,t] of world.traps.entries()){const p=world.tile(t.node),T=world.T;
 if([1,2,3].every(dx=>world.map[p.y-1]?.[p.x+dx]===1))extras.push({x:t.x+t.w,y:p.y*T,w:t.w,node:t.node,angle:Math.PI,offset:i%2?3:0});
 for(const side of [-1,1]){const yy=p.y+(side<0?1:3),xx=p.x+(side<0?0:5),wallX=side<0?p.x-1:p.x+5;
 if([0,1].every(dy=>world.map[yy+dy]?.[wallX]===1))extras.push({x:xx*T,y:(side<0?yy:yy+2)*T,w:2*T,node:t.node,angle:side<0?Math.PI/2:-Math.PI/2,offset:i%2?0:3});}
 }world.traps.push(...extras);
}
export function trapSupported(t,solid){const a=t.angle||0;return solid(t.x+Math.cos(a)*t.w/2-Math.sin(a)*2,t.y+Math.sin(a)*t.w/2+Math.cos(a)*2)}
export function drawSpikes(g,t,time){const s=spikeState(time+(t.offset||0)),color=s.active?'#f1a68b':s.warning?'#f1ce80':'#85c1b4';g.save();g.translate(t.x,t.y);g.rotate(t.angle||0);g.fillStyle='#362d30';g.fillRect(0,-3,t.w,5);g.fillStyle=color;
 for(let x=0;x<t.w;x+=16){if(s.height){g.beginPath();g.moveTo(x+1,0);g.lineTo(x+8,-s.height);g.lineTo(x+15,0);g.fill()}else g.fillRect(x+5,-4,6,3)}g.restore();
}
