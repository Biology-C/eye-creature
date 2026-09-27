export function buildMaze(seed=2917){
 const cols=20,rows=14,stride=8,T=32,W=cols*stride+3,H=rows*stride+3;
 let state=seed>>>0;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296};
 const graph=Array.from({length:cols*rows},()=>[]),visited=new Set([0]),stack=[0],edges=[];
 const neighbours=n=>[n%cols>0?n-1:-1,n%cols<cols-1?n+1:-1,n>=cols?n-cols:-1,n<cols*(rows-1)?n+cols:-1].filter(n=>n>=0);
 const link=(a,b)=>{graph[a].push(b);graph[b].push(a);edges.push([a,b])};
 while(stack.length){const n=stack.at(-1),options=neighbours(n).filter(v=>!visited.has(v));if(!options.length){stack.pop();continue}const next=options[Math.floor(random()*options.length)];link(n,next);visited.add(next);stack.push(next)}
 // A few loops permit a change of route without turning every junction into an open field.
 for(let k=0;k<7;k++){const a=Math.floor(random()*graph.length),options=neighbours(a).filter(b=>!graph[a].includes(b));if(options.length)link(a,options[Math.floor(random()*options.length)])}
 function distances(start){const d=Array(graph.length).fill(Infinity),q=[start];d[start]=0;for(let i=0;i<q.length;i++)for(const n of graph[q[i]])if(d[n]===Infinity){d[n]=d[q[i]]+1;q.push(n)}return d}
 const d0=distances(0),exitNode=d0.indexOf(Math.max(...d0)),selected=[0,exitNode],lightNodes=[];
 for(let k=0;k<3;k++){const all=selected.map(distances);let best=0,score=-1;for(let n=1;n<graph.length;n++){if(selected.includes(n))continue;const s=Math.min(...all.map(d=>d[n]));if(s>score){score=s;best=n}}selected.push(best);lightNodes.push(best)}
 const map=Array.from({length:H},()=>Array(W).fill(1));
 function carve(x,y,w,h){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)map[j][i]=0}
 const tile=n=>({x:2+n%cols*stride,y:2+Math.floor(n/cols)*stride});
 const position=n=>{const p=tile(n);return {x:(p.x+2.5)*T,y:(p.y+2.5)*T}};
 for(let n=0;n<graph.length;n++){const p=tile(n);carve(p.x,p.y,5,5)}
 for(const [a,b]of edges){const p=tile(a),q=tile(b);carve(Math.min(p.x,q.x)+1,Math.min(p.y,q.y)+1,Math.abs(p.x-q.x)+3,Math.abs(p.y-q.y)+3)}
 // One-way ledges break long shafts into climbable 96px sections.
 const platforms=[];for(let y=4;y<H-1;y+=3){let x=1;while(x<W-1){if(map[y][x]||map[y-1][x]){x++;continue}const start=x;while(x<W-1&&!map[y][x]&&!map[y-1][x])x++;if(x-start>=3)platforms.push({x:start*T,y:y*T,w:(x-start)*T})}}
 const safeNodes=lightNodes.slice(0,2).map(n=>graph[n][0]);
 const rats=[];for(let n=3;n<graph.length;n+=6){if([...selected,...safeNodes].includes(n))continue;const p=tile(n);rats.push({x:(p.x+2.5)*T,y:(p.y+5)*T-15,a:(p.x+1)*T,b:(p.x+4)*T})}
 // Three separated floor traps, with solid waiting ground on both sides.
 const candidates=[];for(let n=1;n<graph.length;n++){const p=tile(n);if(d0[n]<4||[...selected,...safeNodes].includes(n)||n%6===3)continue;if([0,1,2,3,4].every(dx=>map[p.y+5]?.[p.x+dx]===1))candidates.push(n)}
 candidates.sort((a,b)=>d0[a]-d0[b]);const trapNodes=[0,Math.floor(candidates.length*.45),Math.floor(candidates.length*.8)].map(i=>candidates[i]).filter(n=>n!==undefined);
 const traps=[...new Set(trapNodes)].map(n=>{const p=tile(n);return {x:(p.x+1.5)*T,y:(p.y+5)*T,w:2*T,node:n}});
 const distancesTo=lightNodes.map(distances);let best=Infinity;
 for(const a of [0,1,2])for(const b of [0,1,2])for(const c of [0,1,2])if(new Set([a,b,c]).size===3)best=Math.min(best,d0[lightNodes[a]]+distancesTo[a][lightNodes[b]]+distancesTo[b][lightNodes[c]]+distancesTo[c][exitNode]);
 return {T,W,H,map,platforms,traps,start:position(0),exit:position(exitNode),lights:lightNodes.map(position),safes:safeNodes.map(position),rats,graph,tile,position,lightNodes,exitNode,optimalDistance:best*stride*T,landmarks:[{...position(0),name:'培養室 · 起點'},...lightNodes.map((n,i)=>({...position(n),name:['根脈庫房','裂鏡走廊','廢棄觀測室'][i]}))]};
}
