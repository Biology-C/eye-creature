// Reuse the approved preview renderer without modifying its source.
export async function loadHero(){
const buffers=Array.from({length:24},()=>{const c=document.createElement('canvas');c.width=c.height=64;return c});
const movingFrames=Array.from({length:6},()=>{const c=document.createElement('canvas');c.width=c.height=64;return c});
function wingPath(side){const p=new Path2D();const points=side===0?[[0,0],[34,0],[34,20],[28,23],[26,28],[26,34],[0,34]]:[[35,0],[64,0],[64,35],[51,35],[50,29],[48,24],[43,21],[35,21]];points.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();return p}
function buildMovement(){
 const base=buffers[6],body=document.createElement('canvas');body.width=body.height=64;const g=body.getContext('2d');g.drawImage(base,0,0);
 const wings=[0,1].map(side=>{const c=document.createElement('canvas');c.width=c.height=64;const w=c.getContext('2d');w.save();w.clip(wingPath(side));w.drawImage(base,0,0);w.restore();g.save();g.clip(wingPath(side));g.clearRect(0,0,64,64);g.restore();
 // Keep the connected wing silhouette, excluding isolated pixels from the crop boundary.
 const data=w.getImageData(0,0,64,64),seen=new Set();let largest=[];
 for(let start=0;start<4096;start++){
  if(seen.has(start)||data.data[start*4+3]<128)continue;
  const group=[start];seen.add(start);
  for(let q=0;q<group.length;q++){
   const n=group[q],x=n%64,y=Math.floor(n/64);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const nx=x+dx,ny=y+dy,k=ny*64+nx;
    if(nx<0||nx>=64||ny<0||ny>=64||seen.has(k)||data.data[k*4+3]<128)continue;
    seen.add(k);group.push(k);
   }
  }
  if(group.length>largest.length)largest=group;
 }
 const keep=new Set(largest);
 for(let i=0;i<4096;i++)if(!keep.has(i))data.data[i*4+3]=0;
 w.putImageData(data,0,0);return c});
 // Clear the inter-wing gap above the eye, where a clipped wing edge can linger.
 g.clearRect(0,0,64,20);
 const bodyPixels=g.getImageData(0,0,64,64),bodyMask=document.createElement('canvas');
 bodyMask.width=bodyMask.height=64;
 const maskPixels=new ImageData(new Uint8ClampedArray(bodyPixels.data),64,64);
 for(let i=3;i<maskPixels.data.length;i+=4)if(maskPixels.data[i])maskPixels.data[i]=255;
 bodyMask.getContext('2d').putImageData(maskPixels,0,0);
 // Downstroke opens the membrane; recovery folds the outer wing at the wrist.
 // Deform the original wing pixels, retaining their palette and nearest-neighbour edges.
 const poses=[[-.10,1,0],[-.72,1,.08],[-1.48,1,.12],[-1.32,.72,.48],[-.70,.48,.75],[-.20,.72,.38]];
 function articulatedWing(source,side,pose){
  const pixels=source.getContext('2d').getImageData(0,0,64,64);
  const result=new ImageData(64,64),root=side?[46,24]:[28,24],sign=side?-1:1;
  const [angle,spread,fold]=pose,ca=Math.cos(angle*sign),sa=Math.sin(angle*sign);
  function vertex(x,y){
   let dx=x-root[0],dy=y-root[1];
   // The wrist is above the root. Only the outer membrane folds on recovery.
   const outer=Math.max(0,(-dx*sign-5)/20);
   dx=dx*(1-(1-spread)*Math.min(1,outer));dy+=fold*outer*13;
   return [root[0]+dx*ca-dy*sa,root[1]+dx*sa+dy*ca,x,y];
  }
  function triangle(a,b,c){
   const den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
   if(Math.abs(den)<.001)return;
   const left=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),right=Math.min(63,Math.ceil(Math.max(a[0],b[0],c[0])));
   const top=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),bottom=Math.min(63,Math.ceil(Math.max(a[1],b[1],c[1])));
   for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
    const u=((b[1]-c[1])*(x+.5-c[0])+(c[0]-b[0])*(y+.5-c[1]))/den;
    const v=((c[1]-a[1])*(x+.5-c[0])+(a[0]-c[0])*(y+.5-c[1]))/den,w=1-u-v;
    if(u<-.0001||v<-.0001||w<-.0001)continue;
    const sx=Math.min(63,Math.max(0,Math.floor(u*a[2]+v*b[2]+w*c[2]))),sy=Math.min(63,Math.max(0,Math.floor(u*a[3]+v*b[3]+w*c[3])));
    const from=(sy*64+sx)*4,to=(y*64+x)*4;
    result.data.set(pixels.data.subarray(from,from+4),to);
   }
  }
  for(let y=0;y<64;y+=4)for(let x=0;x<64;x+=4){
   const a=vertex(x,y),b=vertex(x+4,y),c=vertex(x+4,y+4),d=vertex(x,y+4);
   triangle(a,b,c);triangle(a,c,d);
  }
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
  canvas.getContext('2d').putImageData(result,0,0);return canvas;
 }
 // Lift follows the downstroke; the recovery settles gently. Integer pixels keep crisp edges.
 const bobY=[1,0,-1,-1,0,1];
 movingFrames.forEach((c,f)=>{
  const out=c.getContext('2d');out.clearRect(0,0,64,64);out.imageSmoothingEnabled=false;
  out.save();out.translate(0,bobY[f]);
  for(const side of [1,0])out.drawImage(articulatedWing(wings[side],side,poses[f]),0,0);
  // Eye, tail and wing roots share the same vertical offset, without stretching.
  out.globalCompositeOperation='destination-out';out.drawImage(bodyMask,0,0);
  out.globalCompositeOperation='source-over';out.drawImage(body,0,0);out.restore();
 });
}
function draw(c,row,f,flip=false,px=0,py=0){c.imageSmoothingEnabled=false;c.save();c.translate(px+(flip?64:0),py);if(flip)c.scale(-1,1);c.drawImage(row===1?movingFrames[f]:buffers[row*6+f],0,0);c.restore()}

const image=new Image();image.src=new URL('../previews/animation/sprites.png',import.meta.url).href;await image.decode();
for(let row=0;row<4;row++)for(let col=0;col<6;col++){const g=buffers[row*6+col].getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(image,col*image.width/6,row*image.height/4,image.width/6,image.height/4,0,0,64,64)}
buildMovement();return draw;
}
