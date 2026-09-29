// Original procedural masonry inspired by stone seams, bevels and moss, not copied tiles.
const caches=new Map();
function tile(variant,light){const key=variant+':'+light;if(caches.has(key))return caches.get(key);const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d');
 const palettes=light?[['#45525a','#7b898a','#aab4ae','#586767'],['#484a50','#858387','#aaa6a0','#605e65'],['#45594d','#7c8b78','#a4b49a','#576d58']]:[['#1b2530','#394b59','#596d78','#293744'],['#26252e','#4c4853','#706573','#34313e'],['#202e29','#3d5147','#607968','#2b3d33']];
 const p=palettes[Math.floor(variant/4)%3];g.fillStyle=p[0];g.fillRect(0,0,32,32);
 const shift=variant%2?8:0;for(let row=0;row<2;row++){const y=row*16+1;for(let col=-1;col<3;col++){const x=col*24+(row?12:0)+shift+1,w=22,h=14;g.fillStyle=p[1];g.fillRect(x,y,w,h);g.fillStyle=p[2];g.fillRect(x+2,y,w-4,2);g.fillRect(x,y+2,2,h-4);g.fillStyle=p[3];g.fillRect(x+2,y+h-3,w-2,3);g.fillRect(x+w-3,y+2,3,h-2);
 if((variant+row+col)%3===0){g.fillStyle=p[0];g.fillRect(x+12,y+3,2,4);g.fillRect(x+10,y+6,3,2)}g.fillStyle=p[2];g.globalAlpha=.25;g.fillRect(x+5,y+5,3,2);g.globalAlpha=1;}}
 caches.set(key,c);return c;
}
export function drawTerrain(g,map,T,camera,width,height,light){
 for(let y=Math.max(0,Math.floor(camera.y/T));y<Math.min(map.length,Math.ceil((camera.y+height)/T));y++)for(let x=Math.max(0,Math.floor(camera.x/T));x<Math.min(map[0].length,Math.ceil((camera.x+width)/T));x++){
 const px=x*T,py=y*T,hash=((x*73856093)^(y*19349663))>>>0;
 if(map[y][x]){const region=(Math.floor(x/24)+Math.floor(y/24))%3;g.drawImage(tile(region*4+hash%4,light),px,py,T,T);
 if(map[y-1]?.[x]===0){g.fillStyle=light?'#a5b899':'#718873';g.fillRect(px,py,T,3);g.fillStyle=light?'#6f8963':'#425e49';for(let i=0;i<4;i++)if((hash>>i)&1){g.fillRect(px+i*8,py-2,7,3);g.fillRect(px+i*8+2,py+2,3,3+((hash>>(i+3))%5))}}
 if(map[y+1]?.[x]===0){g.fillStyle='#151e29';g.fillRect(px,py+T-4,T,4)}
 if(map[y]?.[x-1]===0){g.fillStyle=light?'#9ba6a1':'#586c73';g.fillRect(px,py,2,T)}
 if(map[y]?.[x+1]===0){g.fillStyle='#18222d';g.fillRect(px+T-3,py,3,T)}
 }else if(hash%11===0){g.fillStyle=light?'#8fa39a':'#20343d';g.fillRect(px+6,py+10,14,2);g.fillRect(px+20,py+10,2,9)}
 }
}
