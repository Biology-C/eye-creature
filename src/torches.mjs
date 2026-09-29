export function createTorches(world){
 const torches=[];
 for(let node=0;node<world.graph.length;node++){
  if(world.used&&!world.used.includes(node))continue;
  if(node%2!==0&&world.graph[node].length<3)continue;
  const p=world.tile(node),x=p.x*world.T+12,y=p.y*world.T+22;
  if(world.map[p.y]?.[p.x-1]!==1)continue;
  torches.push({id:`torch-${node}`,node,x,y,lit:false});
 }
 return torches;
}
export function discoverTorches(torches,player,clearPath){
 for(const t of torches)if(!t.lit&&Math.hypot(player.x-t.x,player.y-t.y)<=160&&clearPath(player.x,player.y,t.x,t.y))t.lit=true;
}
