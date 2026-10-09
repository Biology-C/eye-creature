// Authored fixtures use existing terrain; they never carve or alter collision.
export function installRegionFeatures(world) {
  if (!world.version) return;
  world.gusts = [
    { node: 45, direction: -1 },
    { node: 64, direction: 1 },
  ].map((v, i) => {
    const p = world.tile(v.node);
    return { ...v, id: "root-gust-" + i, x: p.x * 32 + 16, y: (p.y + 2) * 32, w: 128, h: 96 };
  });
  // Stagger two alternating strips on the narrow shaft above the waiting chamber.
  // Anchor to the actual inner faces (three-tile shaft), not the wider room walls.
  for (const [i, node] of [114, 114].entries()) {
    const p = world.tile(node),
      left = i === 0,
      x = (p.x + (left ? 1 : 4)) * 32,
      y = (p.y + (left ? -2 : -1)) * 32;
    world.traps.push({
      id: "mirror-wall-" + i,
      node,
      x,
      y,
      w: 64,
      angle: left ? Math.PI / 2 : -Math.PI / 2,
      offset: i * 3,
      waiting: { x: (p.x + 2.5) * 32, y: (p.y + 1) * 32 - 11.01 },
    });
  }
  world.regionProps = world.used.map((node) => {
    const p = world.tile(node),
      pos = world.position(node),
      region = world.regionAt(pos.x, pos.y);
    return {
      node,
      region,
      x: p.x * 32,
      y: p.y * 32,
      kind: ["vial", "vines", "mushrooms", "flowers"][region],
    };
  });
}
export function gustState(time) {
  const phase = ((time % 7) + 7) % 7;
  return { active: phase < 5, warning: phase >= 6.5, phase };
}
export function gustAt(world, p, time) {
  return gustState(time).active
    ? (world.gusts || []).find(
        (w) => p.x >= w.x && p.x <= w.x + w.w && p.y >= w.y && p.y <= w.y + w.h,
      )?.direction || 0
    : 0;
}
export function stepGust(p, direction, dt) {
  p.gustDrift = direction
    ? Math.max(-150, Math.min(150, (p.gustDrift || 0) + direction * 650 * dt))
    : 0;
  return p.gustDrift * dt;
}
export function updateGustWarnings(world, time, previous, camera, viewport, play) {
  if (!gustState(time).warning || Math.floor((previous + 0.5) / 7) === Math.floor((time + 0.5) / 7))
    return;
  if (
    (world.gusts || []).some(
      (w) =>
        w.x + w.w >= camera.x &&
        w.x <= camera.x + viewport.width &&
        w.y + w.h >= camera.y &&
        w.y <= camera.y + viewport.height,
    )
  )
    play("wind");
}
export function drawRegionFeatures(g, world, time, reduced, camera, viewport) {
  const visible = (x, y, w = 160, h = 160) =>
    x + w >= camera.x &&
    x <= camera.x + viewport.width &&
    y + h >= camera.y &&
    y <= camera.y + viewport.height;
  const box = (x, y, w, h, c) => {
    g.fillStyle = c;
    g.fillRect(Math.round(x), Math.round(y), w, h);
  };
  for (const p of world.regionProps || []) {
    if (!visible(p.x, p.y)) continue;
    g.save();
    g.globalAlpha = 0.6;
    const solid = (x, y) => world.map[Math.floor(y / 32)]?.[Math.floor(x / 32)] === 1;
    if (p.kind === "vines")
      for (let i = 0; i < 7; i++) {
        const x = p.x + 10 + i * 21;
        if (!solid(x, p.y - 2)) continue;
        const length = 24 + ((i * 17 + p.node) % 56);
        for (let j = 0; j < length; j += 4) {
          const dx = Math.round(Math.sin(j * 0.13 + i) * 3) * 2;
          box(x + dx, p.y + j, 3, 4, "#405d47");
          if (j % 12 === 0) box(x + dx + (j % 24 ? -6 : 3), p.y + j, 6, 3, "#5b7150");
        }
      }
    else
      for (let i = 0; i < 3; i++) {
        const x = p.x + 12 + i * 64,
          y = p.y + 160;
        if (!solid(x, y + 1) || solid(x, y - 8)) continue;
        if (p.kind === "mushrooms") {
          box(x, y - 13, 3, 13, "#74778b");
          box(x - 5, y - 16, 13, 4, "#695777");
          box(x - 2, y - 19, 7, 3, "#8c7898");
          box(x - 2, y - 15, 2, 2, "#9ba39c");
        } else if (p.kind === "flowers") {
          box(x, y - 17, 2, 17, "#537c7b");
          box(x - 4, y - 7, 5, 2, "#4b666c");
          for (const [dx, dy] of [
            [-5, 0],
            [5, 0],
            [0, -5],
            [0, 5],
          ])
            box(x + dx - 2, y - 18 + dy - 2, 5, 5, "#697996");
          box(x - 1, y - 20, 3, 3, "#ad9ab3");
        } else {
          box(x - 3, y - 14, 7, 14, "#426066");
          box(x - 2, y - 12, 5, 8, "#597878");
          box(x - 2, y - 16, 5, 2, "#697d79");
        }
      }
    g.restore();
  }
  const s = gustState(time);
  for (const w of world.gusts || []) {
    if (!visible(w.x, w.y, w.w, w.h)) continue;
    const x = w.direction > 0 ? w.x : w.x + w.w - 8;
    box(x, w.y + 16, 8, w.h - 32, "#3e555d");
    for (let y = w.y + 20; y < w.y + w.h - 16; y += 9)
      box(x + 2, y, 4, 3, s.warning ? "#f1edc8" : s.active ? "#bccfce" : "#647a7e");
    if (!s.active && !s.warning) continue;
    g.save();
    g.strokeStyle = s.warning ? "#e5e5c4" : "#d2e3e6";
    g.globalAlpha = s.warning ? 0.45 : 0.6;
    g.lineWidth = 2;
    if (reduced) {
      for (let y = w.y + 28; y < w.y + w.h - 16; y += 24) {
        const cx = w.x + w.w / 2;
        g.beginPath();
        g.moveTo(cx - w.direction * 23, y);
        g.lineTo(cx + w.direction * 23, y);
        g.lineTo(cx + w.direction * 16, y - 6);
        g.moveTo(cx + w.direction * 23, y);
        g.lineTo(cx + w.direction * 16, y + 6);
        g.stroke();
      }
    } else
      for (let i = 0; i < 5; i++) {
        const progress = (time * (s.active ? 90 : 20) + i * 27) % w.w,
          xx = w.x + (w.direction > 0 ? progress : w.w - progress),
          y = w.y + 15 + i * 16;
        g.beginPath();
        g.moveTo(xx, y);
        g.lineTo(Math.max(w.x, Math.min(w.x + w.w, xx - w.direction * (s.active ? 25 : 8))), y);
        g.stroke();
      }
    g.restore();
  }
}
