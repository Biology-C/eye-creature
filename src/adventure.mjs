// Authored spine with deterministic optional branches. Coordinates are 32px tiles.
export const LEVEL_VERSION='adventure-2';
export function buildAdventure(seed=2917){
 const T=32,cols=20,rows=16,W=163,H=131,stride=8;
 const graph=Array.from({length:cols*rows},()=>[]),used=new Set(),edges=[],main=[];
 const node=(x,y)=>y*cols+x,tile=n=>({x:2+n%cols*stride,y:2+Math.floor(n/cols)*stride});
 const position=n=>{const p=tile(n);return {x:(p.x+2.5)*T,y:(p.y+2.5)*T}};
 const link=(a,b)=>{used.add(a);used.add(b);if(!graph[a].includes(b)){graph[a].push(b);graph[b].push(a);edges.push([a,b])}};
 function path(points,record=false){let [x,y]=points[0];used.add(node(x,y));if(record)main.push(node(x,y));for(const [ex,ey]of points.slice(1)){while(x!==ex||y!==ey){const a=node(x,y);if(x!==ex)x+=Math.sign(ex-x);else y+=Math.sign(ey-y);const b=node(x,y);link(a,b);if(record&&!main.includes(b))main.push(b)}}}
 path([[1,10],[6,10],[6,6],[2,6],[2,2],[10,2],[10,6],[14,6],[14,2],[18,2],[18,10],[10,10],[10,13],[18,13]],true);
 path([[1,10],[1,8],[6,8]]); // Intro wind loop, climb requires opening the first duct.
 path([[2,6],[2,8]]); // Root low route reconnects with the intro sky bridge.
 path([[16,10],[16,12]]); // Observatory duct connects both authored walkways.
 path([[10,6],[10,8],[14,8],[14,6]]); // Longer low route under the high walkway.
 path([[18,10],[18,12],[14,12],[14,10]]);
 let rng=seed>>>0;const random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296};
 const branches=[];
 const specs=[{start:[4,6],dir:[0,-1],kind:'relic',region:1},{start:[2,3],dir:[1,0],kind:'echo',region:1},{start:[12,6],dir:[0,-1],kind:'relic',region:2},{start:[16,2],dir:[0,1],kind:'echo',region:2},{start:[18,8],dir:[-1,0],kind:'relic',region:3},{start:[12,13],dir:[0,1],kind:'echo',region:3}];
 for(const [i,s]of specs.entries()){const length=2+Math.floor(random()*2),points=[s.start];let [x,y]=s.start;for(let k=0;k<length;k++){const nx=x+s.dir[0],ny=y+s.dir[1];if(nx<1||nx>18||ny<1||ny>15||used.has(node(nx,ny)))break;points.push([nx,ny]);x=nx;y=ny}path(points);branches.push({id:'branch-'+i,kind:s.kind,region:s.region,node:node(x,y),nodes:points.map(([a,b])=>node(a,b))})}
 const map=Array.from({length:H},()=>Array(W).fill(1));
 const carve=(x,y,w,h)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)map[j][i]=0};
 for(const n of used){const p=tile(n);carve(p.x,p.y,5,5)}
 for(const [a,b]of edges){const p=tile(a),q=tile(b);carve(Math.min(p.x,q.x)+1,Math.min(p.y,q.y)+(p.y===q.y?2:1),Math.abs(p.x-q.x)+3,Math.abs(p.y-q.y)+3)}
 // The return gallery is a tall open flight space: glide west without repeated landings.
 // Its bottom stays 256px above the starting floor, outside unassisted flap reach.
 const gallery=tile(node(1,8));carve(gallery.x,gallery.y,45,13);
 const platforms=[];
 // Ledges only in vertical passages, rather than a line through every room.
 for(const [a,b]of edges)if(Math.abs(a-b)===cols){const p=tile(Math.min(a,b));const intro=(a%cols===1&&Math.floor(Math.min(a,b)/cols)>=8)||(a%cols===6&&Math.floor(Math.min(a,b)/cols)>=8);if(!intro)for(let dy=3;dy<=9;dy+=3)platforms.push({x:(p.x+1)*T,y:(p.y+dy)*T,w:3*T})}
 // Shelves make the upper route jumpable; the floor below remains a recovery route.
 for(const n of main.filter((_,i)=>i>0&&i%4===0)){const p=tile(n);platforms.push({x:(p.x+1)*T,y:(p.y+3)*T,w:2*T})}
 const gateTile=tile(node(5,10));const crackedSpec=[{id:'duct-intro',x:(gateTile.x+5)*T,y:(gateTile.y+2)*T,w:3*T,h:3*T,broken:false,discovered:false}];
 for(const [id,n]of [['duct-root',node(10,7)],['duct-observatory',node(16,11)]]){const p=tile(n);carve(p.x+1,p.y,3,8);crackedSpec.push({id,x:(p.x+1)*T,y:(p.y+5)*T,w:3*T,h:T,axis:'vertical',broken:false,discovered:false})}
 for(const w of crackedSpec)for(let y=w.y/T;y<(w.y+w.h)/T;y++)for(let x=w.x/T;x<(w.x+w.w)/T;x++)map[y][x]=1;
 const winds=[{id:'wind-intro',wall:'duct-intro',x:(tile(node(6,10)).x+1)*T,y:tile(node(6,8)).y*T,w:3*T,h:21*T}, {id:'wind-root',wall:'duct-root',x:crackedSpec[1].x,y:tile(node(10,6)).y*T,w:96,h:21*T},{id:'wind-observatory',wall:'duct-observatory',x:crackedSpec[2].x,y:tile(node(16,10)).y*T,w:96,h:21*T}];
 const lightNodes=[node(2,2),node(18,2),node(10,13)],exitNode=node(18,13),start={...position(node(1,10)),y:(tile(node(1,10)).y+5)*T-12};
 const regions=[{id:0,name:'培養室',color:'#334b5d',nodes:main.slice(0,8)},{id:1,name:'根脈庫房',color:'#3f5946',nodes:main.slice(8,27)},{id:2,name:'裂鏡走廊',color:'#49405e',nodes:main.slice(27,47)},{id:3,name:'廢棄觀測室',color:'#50566d',nodes:main.slice(47)}];
 const explicitRegion=n=>regions.find(r=>r.nodes.includes(n))?.id??branches.find(b=>b.nodes.includes(n))?.region;
 const regionIds=Array.from({length:cols*rows},(_,n)=>{const direct=explicitRegion(n);if(direct!==undefined)return direct;let nearest=main[0],distance=Infinity;for(const a of main){const d=Math.abs(n%cols-a%cols)+Math.abs(Math.floor(n/cols)-Math.floor(a/cols));if(d<distance){distance=d;nearest=a}}return explicitRegion(nearest)??0});
 const regionOf=n=>regionIds[n]??0;
 const regionAt=(x,y)=>{const n=node(Math.max(0,Math.min(19,Math.round((x/T-4.5)/8))),Math.max(0,Math.min(15,Math.round((y/T-4.5)/8))));return regionOf(n)};
 const floorPoint=n=>{const p=tile(n);return {x:(p.x+2.5)*T,y:(p.y+5)*T-14.01,a:(p.x+1)*T,b:(p.x+4)*T,node:n,region:regionOf(n)}};
 const safeNodes=[node(1,10),node(6,6),node(10,2),node(18,6),node(18,13)];
 const safes=safeNodes.map((n,i)=>({id:'lamp-'+i,...position(n),y:(tile(n).y+5)*T-12}));
 const eligible=[...new Set([...main,...used])].filter((n,i)=>i>8&&!(n%cols<=6&&Math.floor(n/cols)>=8)&&!branches.some(b=>b.node===n)&&!safeNodes.includes(n)&&!lightNodes.includes(n)&&[0,1,2,3,4].every(d=>map[tile(n).y+5]?.[tile(n).x+d]===1));
 const picked=new Set();function select(count,offset=0){const out=[];for(let k=0;k<eligible.length&&out.length<count;k++){const n=eligible[(k*7+offset)%eligible.length];if(!picked.has(n)){picked.add(n);out.push(n)}}for(const n of eligible)if(out.length<count&&!picked.has(n)){picked.add(n);out.push(n)}return out}
 const ratNodes=[node(3,10),...select(11)],pure=select(10,2),big=select(3,4),treeNodes=select(3,6);
 const rats=ratNodes.map((n,i)=>({id:'rat-'+i,...floorPoint(n)}));
 const pureSpawns=pure.map((n,i)=>({id:'slime-'+i,...floorPoint(n),pure:true})),bigSpawns=big.map((n,i)=>({id:'big-'+i,...floorPoint(n),y:floorPoint(n).y-8,pure:true,big:true,bodyRadius:22,radiusX:22,radiusY:22}));
 const faunaSpec={trees:treeNodes.map(floorPoint),birds:[...treeNodes,...main.filter((n,i)=>i>18&&i%12===0&&!treeNodes.includes(n)).slice(0,3)].map(n=>({...position(n),region:regionOf(n)}))};
 const trapNodes=eligible.filter(n=>!ratNodes.includes(n)&&!treeNodes.includes(n)).filter((_,i)=>i>0&&i%4===0).slice(0,4),traps=trapNodes.map(n=>({x:(tile(n).x+1.5)*T,y:(tile(n).y+5)*T,w:64,node:n}));
 const rewards=[];const energy=(id,x,y,amount=1)=>rewards.push({id,x,y,kind:'energy',amount,got:false,node:0});
 for(let i=0;i<30;i++)energy('intro-energy-'+i,start.x+90+i*34,(tile(node(1,10)).y+5)*T-26);
 for(const [i,n]of main.entries())if(i>7&&i%4===0){const p=floorPoint(n);energy('energy-'+n,p.x,p.y-8,5)}
 for(const [i,n]of main.entries())if(i>6&&i%5===0){const p=position(n);rewards.push({id:'wing-'+n,node:n,...p,kind:'wing',got:false})}
 const abilities=['spread','dash','breach'],names=['稜光徽章','疾風緞帶','破界劍柄'];
 branches.filter(b=>b.kind==='relic').forEach((b,i)=>rewards.push({id:'relic-'+i,node:b.node,...position(b.node),kind:'relic',ability:abilities[i],name:names[i],got:false}));
 const echoes=branches.filter(b=>b.kind==='echo').map((b,i)=>({id:'echo-'+i,...position(b.node),region:b.region,got:false,text:['我曾舉起劍，替人們守住歸途。','他們奪走身體，卻留下我的眼睛。','這一次，我要親手打開回家的路。'][i]}));
 const obstacles=branches.filter(b=>b.kind==='relic').map((b,i)=>{const p=tile(b.node);return {id:'root-'+i,x:(p.x+2.5)*T,y:(p.y+4)*T,w:48,h:64,radiusX:24,radiusY:32,hp:1,stage:i+1,kind:['root','bramble','screen'][i],broken:false}});
 const protectedRects=[{x:0,y:0,w:W*T,h:64},{x:0,y:(H-2)*T,w:W*T,h:64},{x:0,y:0,w:64,h:H*T},{x:(W-2)*T,y:0,w:64,h:H*T},...safeNodes.map(n=>({x:(tile(n).x-1)*T,y:(tile(n).y-1)*T,w:7*T,h:7*T})),{x:tile(node(1,8)).x*T-32,y:tile(node(1,8)).y*T-32,w:48*T,h:24*T}];
 return {version:LEVEL_VERSION,seed,T,W,H,map,platforms,graph,tile,position,used:[...used],main,branches,regions,regionAt,start,exit:position(exitNode),exitNode,lightNodes,lights:lightNodes.map((n,i)=>({id:'light-'+i,...position(n)})),safes,rats,pureSpawns,bigSpawns,faunaSpec,traps,crackedSpec,winds,echoes,obstacles,protectedRects,rewardSpec:rewards,optimalDistance:main.length*stride*T,landmarks:[{...start,name:'培養室',type:0},...lightNodes.map((n,i)=>({...position(n),name:regions[i+1].name,type:i+1}))]};
}
