// Phone-only presentation and input helpers. Desktop simulation remains shared.
export const BREACH_HOLD = .65;
// Original side doors end just above the floor. Use their full face plus a
// one-tile aiming margin so landing during a hold does not cancel the action.
export function nearbyTouchSideWall(player, walls, direction) {
  if(direction==='up'||direction==='down')return null;
  return walls.filter(w=>!w.broken&&w.axis!=='vertical'&&player.y>=w.y-32&&player.y<=w.y+w.h+32&&
    (player.face===1?player.x<=w.x&&w.x-player.x<=56:player.x>=w.x+w.w&&player.x-w.x-w.w<=56))
    .sort((a,b)=>Math.hypot(player.x-a.x-a.w/2,player.y-a.y-a.h/2)-Math.hypot(player.x-b.x-b.w/2,player.y-b.y-b.h/2))[0]||null;
}
export function attackIntent({melee, combo, wall, energy, cost}) {
  return melee || combo ? 'melee' : wall && energy >= cost ? 'breach' : 'magic';
}
export function validBreachHold(hold, target, enemyNear, energy, cost) {
  return !!hold && !!target && hold.id === target.id && !enemyNear && energy >= cost;
}

// A released finger must not release another finger holding the same action.
export function bindTouchControls(root, {down, up, cancel, playing}) {
  const pointers = new Map();
  const has = key => [...pointers.values()].some(v => v.key === key);
  function finish(id, aborted) {
    const entry = pointers.get(id); if (!entry) return;
    pointers.delete(id);
    entry.button.classList.toggle('pressed', [...pointers.values()].some(v => v.button === entry.button));
    if (!has(entry.key)) (aborted ? cancel : up)(entry.key);
  }
  for (const button of root.querySelectorAll('[data-key]')) {
    button.addEventListener('pointerdown', event => {
      event.preventDefault(); if (!playing() || pointers.has(event.pointerId)) return;
      const key = button.dataset.key, first = !has(key);
      pointers.set(event.pointerId, {key, button}); button.setPointerCapture(event.pointerId);
      button.classList.add('pressed'); if (first) down(key);
    });
    button.addEventListener('pointerup', e => {e.preventDefault(); finish(e.pointerId, false)});
    button.addEventListener('pointercancel', e => finish(e.pointerId, true));
    button.addEventListener('lostpointercapture', e => finish(e.pointerId, true));
    button.addEventListener('contextmenu', e => e.preventDefault());
  }
  return () => {for (const id of [...pointers.keys()]) finish(id, true)};
}

export function createSceneMirrors(world, zones = world.faunaSpec?.birds || []) {
  const solid = (x,y) => world.map[Math.floor(y/world.T)]?.[Math.floor(x/world.T)] !== 0;
  return zones.flatMap((zone, index) => {
    for (const offset of [-64,64,-96,96,0]) {
      const x = zone.x + offset;
      for (let y = Math.floor(zone.y/world.T)*world.T; y <= zone.y+192; y += world.T) {
        if (solid(x,y-1) || !solid(x,y+1) || solid(x-12,y-30) || solid(x+12,y-30)) continue;
        if (world.traps.some(t => Math.hypot(t.x-x,t.y-y)<110)) continue;
        return [{id:'scene-mirror-'+index, x, y:y-28, region:zone.region}];
      }
    }
    return [];
  });
}

export function drawSceneMirrors(g, mirrors, time, ready) {
  for (const m of mirrors) {
    g.fillStyle='#34454b'; g.fillRect(m.x-18,m.y-30,36,60);
    g.fillStyle=time>=ready?'#91c9c5':'#657476'; g.fillRect(m.x-13,m.y-25,26,48);
    g.fillStyle='#d6ede0'; g.fillRect(m.x-9,m.y-20,4,32);
    g.fillStyle='#64756b'; g.fillRect(m.x-23,m.y+28,46,6);
    g.font='11px system-ui';g.textAlign='center';g.fillStyle='#d6ede0';
    g.fillText(time>=ready?'靠近映照':'鏡面恢復中',m.x,m.y-38);g.textAlign='left';
  }
}
