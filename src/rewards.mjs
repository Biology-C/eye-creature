export const WING_REFILL=.28;
export function createRewards(world){
 const {graph,position}=world;
 function distances(start){const d=Array(graph.length).fill(Infinity),q=[start];d[start]=0;for(let i=0;i<q.length;i++)for(const n of graph[q[i]])if(d[n]===Infinity){d[n]=d[q[i]]+1;q.push(n)}return d}
 const forbidden=new Set([0,world.exitNode,...world.lightNodes,...world.traps.map(t=>t.node)]);
 for(let n=0;n<graph.length;n++)if(world.safes.some(p=>p.x===position(n).x&&p.y===position(n).y))forbidden.add(n);
 const d0=distances(0),first=d0.findIndex((d,n)=>d===5&&!forbidden.has(n)),nodes=first>=0?[first]:[];
 const coverage=[...forbidden,...nodes].map(distances);
 while(true){let best=-1,score=6;for(let n=1;n<graph.length;n++){if(forbidden.has(n)||nodes.includes(n))continue;const gap=Math.min(...coverage.map(d=>d[n]));if(gap>score){best=n;score=gap}}if(best<0)break;nodes.push(best);coverage.push(distances(best))}
 const leaves=graph.map((a,n)=>n).filter(n=>graph[n].length===1&&!forbidden.has(n)&&!nodes.includes(n)&&d0[n]>6);
 const treasures=[];const names=['稜光徽章：三向光彈','疾風緞帶：傷害衝刺／冷卻減半','破界劍柄：普通牆破壞'];
 for(let i=0;i<3&&leaves.length;i++){const ds=treasures.map(r=>distances(r.node));leaves.sort((a,b)=>(ds.length?Math.min(...ds.map(d=>d[b])):d0[b])-(ds.length?Math.min(...ds.map(d=>d[a])):d0[a]));const node=leaves.shift();treasures.push({id:`relic-${node}`,node,...position(node),kind:'relic',name:names[i],ability:['spread','dash','breach'][i],got:false})}
 const energy=[];for(let node=1;node<graph.length;node+=4){if(forbidden.has(node))continue;const p=position(node);for(let i=0;i<3;i++)energy.push({id:`energy-${node}-${i}`,node,x:p.x+(i-1)*24,y:p.y+20,kind:'energy',got:false})}
 return [...energy,...nodes.map(node=>({id:`wing-${node}`,node,...position(node),kind:'wing',got:false})),...treasures];
}
export function collectReward(reward,player,maxWing,time){
 if(reward.got)return false;
 if(reward.kind==='wing'){
  const before=player.wing;player.wing=Math.min(maxWing,player.wing+WING_REFILL);reward.restored=player.wing-before;
  // Absorption uses the shard's nominal 40%, independent of remaining flight stamina.
  const total=(player.healCharge||0)+40,cycles=Math.floor(total/100),hp=player.hp??3;
  player.healCharge=total%100;player.hp=Math.min(3,hp+cycles*.5);
  reward.healed=player.hp-hp;reward.healCycles=cycles;
 }
 if(reward.kind==='relic'&&reward.ability){player.abilities??={};player.abilities[reward.ability]=true}
 if(reward.kind==='energy')player.energy=(player.energy||0)+1;
 reward.got=true;reward.collectedAt=time;return true;
}
