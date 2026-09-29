// Swept ribbons follow a moving leading edge; the body is never copied from references.
export function slashPose(stage,progress){
 const p=Math.max(0,Math.min(1,progress)),s=Math.max(0,Math.min(1,(p-.08)/.58));
 return {sweep:1-Math.pow(1-s,2),alpha:Math.min(1,p/.07)*Math.max(0,1-Math.max(0,p-.58)/.42),stage:stage||1};
}
export function drawSweptSlash(g,slash,progress,reduced,style=0){
 const pose=slashPose(slash.stage,progress);if(pose.alpha<=0)return;
 const colors=[['#6aadb3','#bfe9d6','#fbfff2'],['#32334b','#80c9c2','#ddfff0'],['#a34a40','#edb66e','#fff0c0']][style%3];
 g.save();g.translate(slash.x,slash.y);g.scale(slash.face,1);g.globalAlpha=pose.alpha;
 // A tapered filled ribbon, not a static ring. Its leading tip advances across the sweep.
 function ribbon(cx,cy,rx,ry,start,end,width,alpha=1){
  g.save();g.globalAlpha*=alpha;const n=36;
  for(const [scale,color] of [[1,colors[0]],[.72,colors[1]],[.20,colors[2]]]){
   const points=[];
   for(let i=0;i<=n;i++){const q=i/n,a=start+(end-start)*q,taper=Math.pow(Math.sin(Math.PI*q),.65),w=width*scale*taper;points.push([cx+Math.cos(a)*(rx+w*.3),cy+Math.sin(a)*(ry+w*.3)])}
   for(let i=n;i>=0;i--){const q=i/n,a=start+(end-start)*q,taper=Math.pow(Math.sin(Math.PI*q),.65),w=width*scale*taper;points.push([cx+Math.cos(a)*(rx-w),cy+Math.sin(a)*(ry-w)])}
   g.fillStyle=color;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();
  }g.restore();
 }
 function crossing(p0,p1,p2,end){
  if(end<=0)return;
  const n=30,start=Math.max(0,end-.92);
  for(const [scale,color] of [[1,colors[0]],[.7,colors[1]],[.18,colors[2]]]){
   const sides=[[],[]];
   for(let i=0;i<=n;i++){
    const q=i/n,t=start+(end-start)*q,u=1-t,x=u*u*p0[0]+2*u*t*p1[0]+t*t*p2[0],y=u*u*p0[1]+2*u*t*p1[1]+t*t*p2[1];
    const dx=2*u*(p1[0]-p0[0])+2*t*(p2[0]-p1[0]),dy=2*u*(p1[1]-p0[1])+2*t*(p2[1]-p1[1]),len=Math.hypot(dx,dy)||1,w=13*scale*Math.pow(Math.sin(Math.PI*q),.65);
    sides[0].push([x-dy/len*w,y+dx/len*w]);sides[1].push([x+dy/len*w,y-dx/len*w]);
   }
   g.fillStyle=color;g.beginPath();[...sides[0],...sides[1].reverse()].forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();
  }
 }
 const sweep=reduced?.8:pose.sweep,stage=pose.stage;
 if(stage===1){const head=-1.7+sweep*3.2;ribbon(0,0,91,57,head-(reduced?2.8:1.1+sweep*1.35),head,20)}
 else if(stage===2){const head=-2.4+sweep*Math.PI*2.3;ribbon(0,0,98,54,head-Math.min(4.6,.3+sweep*5),head,25);if(!reduced)ribbon(0,3,90,49,head-Math.min(5.1,.7+sweep*5),head-.65,10,.35)}
 else{
  crossing([5,-54],[92,-14],[92,48],reduced?1:sweep);
  const second=reduced?1:Math.min(1,Math.max(0,(progress-.14)/.39));
  crossing([5,54],[92,14],[92,-48],second);
 }
 // Sparse streaks track the slash rather than spraying out in unrelated directions.
 if(!reduced&&progress<.7){g.strokeStyle=colors[1];g.lineWidth=1;g.globalAlpha*=.45;for(let i=0;i<3;i++){const a=-1.4+sweep*2.8+i*.2;g.beginPath();g.ellipse(0,0,104+i*3,62+i*3,0,a-.22,a);g.stroke()}}
 g.restore();
}
