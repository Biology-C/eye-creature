// Shared pixel silhouettes used in the world and in important-message cards.
export function drawPickupIcon(g,kind,x=0,y=0,scale=1){
 g.save();g.translate(Math.round(x),Math.round(y));g.scale(scale,scale);
 const box=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
 if(kind==='wing'){box(-9,-7,4,12,'#70dfe2');box(-5,-3,4,12,'#b8ffff');box(-1,-7,4,12,'#70dfe2');box(3,-11,5,12,'#b8ffff')}
 else if(kind==='echo'){box(-7,-18,14,13,'#bec4e3');box(-12,-3,24,24,'#838eaf');box(-17,4,5,23,'#707d9c');box(12,4,5,23,'#707d9c');box(-10,21,7,13,'#bec4e3');box(3,21,7,13,'#bec4e3')}
 else{box(-10,-9,20,18,'#514a6d');box(-7,-6,14,12,'#c2a4e8');box(-2,-8,4,16,'#f2e1ff');box(-6,11,12,2,'#c2a4e8')}
 g.restore();
}
