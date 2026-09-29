// Shared selection and damage geometry, including target body size.
export function inMelee(p,e,clear){
 const dx=(e.x-p.x)*p.face,rx=e.radiusX||(('node'in e)?28:20),ry=e.radiusY||(('node'in e)?35:18);
 return e.hp>0&&(p.stage===2?Math.abs(dx)-rx<=90:dx>=-18&&dx-rx<=90)&&Math.abs(e.y-p.y)<=42+ry&&clear(p.x,p.y,e.x,e.y);
}
