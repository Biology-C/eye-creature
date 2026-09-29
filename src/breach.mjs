export const BREACH_COST=30;
export function createCrackedWalls(world){
 const walls=[];
 for(let a=0;a<world.graph.length-1;a++){
  const b=a+1;if(a%20===19||world.graph[a].includes(b)||a<3||[a,b].some(n=>world.lightNodes.includes(n)||n===world.exitNode))continue;
  const p=world.tile(a),x=(p.x+5)*world.T,y=(p.y+1)*world.T;
  if(walls.some(w=>Math.hypot(w.x-x,w.y-y)<900))continue;
  walls.push({id:`wall-${a}`,x,y,w:3*world.T,h:3*world.T,broken:false});if(walls.length===4)break;
 }
 // Vertical shortcuts connect adjacent rooms, never the maze boundary.
 const rowWidth=world.graph.findIndex((_,n)=>n>0&&world.tile(n).x===world.tile(0).x);
 const excluded=new Set([0,world.exitNode,...world.lightNodes,...world.traps.map(t=>t.node)]);
 for(let n=0;n<world.graph.length;n++){const p=world.position(n);if(world.safes.some(s=>s.x===p.x&&s.y===p.y)||world.rats.some(r=>Math.abs(r.x-p.x)<32&&Math.abs(r.y-p.y)<100))excluded.add(n)}
 let count=0;
 for(let a=0;a+rowWidth<world.graph.length;a++){
  const b=a+rowWidth;if(excluded.has(a)||excluded.has(b)||world.graph[a].includes(b))continue;
  const p=world.tile(a),x=(p.x+1)*world.T,y=(p.y+5)*world.T;
  if(walls.filter(w=>w.axis==='vertical').some(w=>Math.hypot(w.x-x,w.y-y)<900))continue;
  if(![0,1,2].every(dy=>[0,1,2].every(dx=>world.map[y/world.T+dy]?.[x/world.T+dx]===1)))continue;
  walls.push({id:`floor-${a}`,axis:'vertical',x,y,w:3*world.T,h:3*world.T,broken:false});if(++count===4)break;
 }
 return walls;
}
export function nearbyWall(player,walls,direction=null){
 const candidates=walls.filter(w=>{
  if(w.broken)return false;
  if(w.axis==='vertical')return Math.abs(player.x-(w.x+w.w/2))<w.w/2-10&&((direction==='down'&&player.y<=w.y&&w.y-player.y<=56)||(direction==='up'&&player.y>=w.y+w.h&&player.y-w.y-w.h<=56));
  if(direction==='up'||direction==='down')return false;
  return Math.abs(player.y-(w.y+w.h/2))<46&&((player.face===1&&player.x<=w.x&&w.x-player.x<=56)||(player.face===-1&&player.x>=w.x+w.w&&player.x-w.x-w.w<=56));
 });
 return candidates.sort((a,b)=>Math.hypot(player.x-a.x-a.w/2,player.y-a.y-a.h/2)-Math.hypot(player.x-b.x-b.w/2,player.y-b.y-b.h/2))[0];
}
export function breakWall(player,wall,map,tileSize,platforms=[]){
 if(!wall||wall.broken||player.energy<BREACH_COST)return false;
 for(let y=wall.y/tileSize;y<(wall.y+wall.h)/tileSize;y++)for(let x=wall.x/tileSize;x<(wall.x+wall.w)/tileSize;x++)map[y][x]=0;
 if(wall.axis==='vertical'){
  // Remove thin ledges that cap the opening; new one-way rests keep ascent possible.
  const kept=[];for(const p of platforms){if(p.y>=wall.y&&p.y<=wall.y+wall.h&&p.x<wall.x+wall.w&&p.x+p.w>wall.x){if(p.x<wall.x)kept.push({...p,w:wall.x-p.x});if(p.x+p.w>wall.x+wall.w)kept.push({...p,x:wall.x+wall.w,w:p.x+p.w-wall.x-wall.w})}else kept.push(p)}
  platforms.splice(0,platforms.length,...kept);
  for(const y of [wall.y,wall.y+2*tileSize,wall.y+4*tileSize,wall.y+6*tileSize])platforms.push({x:wall.x,y,w:wall.w});
 }
 player.energy-=BREACH_COST;wall.broken=true;return true;
}

export function ordinaryWall(player,world,direction){
 if(!player.abilities?.breach)return null;
 const T=world.T,dx=direction==='up'||direction==='down'?0:player.face,dy=direction==='up'?-1:direction==='down'?1:0;
 for(let d=14;d<=56;d+=4){const tx=Math.floor((player.x+dx*d)/T),ty=Math.floor((player.y+dy*d)/T);if(world.map[ty]?.[tx]!==1)continue;
 const x=tx+(dx<0?-2:dx===0?-1:0),y=ty+(dy<0?-2:dy===0?-1:0);
 if(x<2||y<2||x+3>world.W-2||y+3>world.mazeHeight-2)return null;
 return {id:`ordinary-${x}-${y}`,x:x*T,y:y*T,w:3*T,h:3*T,axis:dy?'vertical':undefined,ordinary:true,broken:false};
 }return null;
}
