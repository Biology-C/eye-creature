import {drawPickupIcon} from './pickup-art.mjs';
export function relicMessage(reward,handheld){
 const info={spread:['普通光彈一次發射三顆，向前方分散。',handheld?'A：遠處短按發射':'Space：遠處短按發射'],dash:['衝刺可傷害敵人，冷卻時間減半。',handheld?'X：衝刺':'Shift：衝刺'],breach:['破牆技能也能打破一般牆面，每次消耗30能量。',handheld?'面向牆面，長按 A；十字鍵上下可選擇地板／天花板':'E：破牆；↑／↓ 搭配 E 選擇天花板／地板']}[reward.ability];
 return {kind:'relic',title:reward.name||'取得藏品',body:'能力已解鎖，本次冒險持續有效。',effect:info?.[0]||'',controls:info?.[1]||''};
}
export function createMessageCard({handheld,onClose,clock=()=>performance.now()}){
 const layer=document.createElement('div');layer.id='message-layer';layer.hidden=true;
 layer.innerHTML='<section id="message-card" role="dialog" aria-modal="true" aria-labelledby="message-title" aria-describedby="message-body" tabindex="-1"><canvas width="120" height="120" aria-hidden="true"></canvas><div><h2 id="message-title"></h2><p id="message-body"></p><p id="message-effect"></p><p id="message-controls"></p></div><p id="message-close">稍候即可繼續…</p></section>';
 document.body.append(layer);const card=layer.firstElementChild,find=id=>layer.querySelector('#message-'+id);let openedAt=0,timer=null;
 const held=new Set(),pointers=new Set();
 function close(){if(layer.hidden||clock()-openedAt<600)return false;layer.hidden=true;clearTimeout(timer);onClose();return true}
 window.addEventListener('keydown',e=>{
  if(layer.hidden&&!held.has(e.code))return;
  e.preventDefault();e.stopImmediatePropagation();held.add(e.code);
  if(!e.repeat&&(e.code==='Space'||e.code==='Enter'))close();
 },true);
 window.addEventListener('keyup',e=>{if(!layer.hidden||held.has(e.code)){held.delete(e.code);e.preventDefault();e.stopImmediatePropagation()}},true);
 document.addEventListener('pointerdown',e=>{if(layer.hidden||!e.target.closest('[data-key="attack"]'))return;pointers.add(e.pointerId);e.preventDefault();e.stopImmediatePropagation();close()},true);
 for(const type of ['pointerup','pointercancel'])document.addEventListener(type,e=>{if(pointers.delete(e.pointerId)){e.preventDefault();e.stopImmediatePropagation()}},true);
 card.addEventListener('click',()=>close());
 return {
  get active(){return !layer.hidden},
  show(message){openedAt=clock();layer.hidden=false;find('title').textContent=message.title;find('body').textContent=message.body;
   for(const key of ['effect','controls']){find(key).hidden=!message[key];find(key).textContent=message[key]||''}
   find('close').textContent='稍候即可繼續…';clearTimeout(timer);timer=setTimeout(()=>find('close').textContent=handheld?'按 A 或點擊卡片繼續':'按 Space、Enter 或點擊卡片繼續',600);
   const g=card.querySelector('canvas').getContext('2d');g.clearRect(0,0,120,120);drawPickupIcon(g,message.kind,60,message.kind==='echo'?45:60,message.kind==='echo'?2:3);card.focus({preventScroll:true});
  },
  clear(){layer.hidden=true;clearTimeout(timer);held.clear();pointers.clear()}
 };
}
