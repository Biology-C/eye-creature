import { BALANCE as B } from "./config/balance.mjs";
export function createExploration(world) {
  return {
    gaze: null,
    elapsed: 0,
    obstacles: structuredClone(world.obstacles || []),
    winds: (world.winds || []).map((w) => ({ ...w, active: false })),
    echoes: structuredClone(world.echoes || []),
    tutorials: [],
    teaching: [],
    pending: [],
    echoText: null,
    echoUntil: 0,
  };
}
export function updateGaze(s, p, keys, walls, dt, solid) {
  const dir = keys.has("down") ? [0, 1] : keys.has("up") ? [0, -1] : [p.face, 0];
  const targets = walls
    .filter((w) => !w.ordinary && !w.broken && !w.discovered)
    .map((w) => {
      const x = w.x + w.w / 2,
        y = w.y + w.h / 2,
        dx = x - p.x,
        dy = y - p.y;
      return { w, x, y, dx, dy, d: Math.hypot(dx, dy) };
    })
    .filter(
      (t) =>
        t.d <= B.guidance.gazeRange &&
        t.dx * dir[0] + t.dy * dir[1] > 0 &&
        Math.abs(t.dx * dir[1] - t.dy * dir[0]) <= 70,
    )
    .sort((a, b) => a.d - b.d);
  const t = targets.find((t) => {
    const steps = Math.ceil(t.d / 4);
    for (let i = 0; i < steps; i++) {
      const x = p.x + (t.dx * i) / steps,
        y = p.y + (t.dy * i) / steps;
      if (x >= t.w.x && x <= t.w.x + t.w.w && y >= t.w.y && y <= t.w.y + t.w.h) break;
      if (solid(x, y)) return false;
    }
    return true;
  });
  if (!t) {
    s.gaze = null;
    s.elapsed = 0;
    return null;
  }
  if (s.gaze !== t.w.id) {
    s.gaze = t.w.id;
    s.elapsed = 0;
  }
  s.elapsed += dt;
  if (s.elapsed + 1e-8 >= B.guidance.gazeDuration) {
    t.w.discovered = true;
    s.gaze = null;
    s.elapsed = 0;
    return t.w;
  }
  return null;
}
export function syncWinds(s, walls) {
  for (const w of s.winds) w.active = walls.some((a) => a.id === w.wall && a.broken);
}
export function windAt(s, p) {
  return s.winds.some(
    (w) => w.active && p.x >= w.x && p.x <= w.x + w.w && p.y >= w.y && p.y <= w.y + w.h,
  );
}
export function hitObstacle(o, stage) {
  if (o.broken || stage < o.stage) return false;
  o.broken = true;
  o.hp = 0;
  return true;
}
export function collectEchoes(s, p, time, fighting) {
  for (const e of s.echoes)
    if (!e.got && Math.hypot(p.x - e.x, p.y - e.y) <= 32) {
      e.got = true;
      s.pending.push(e.id);
    }
  if (!fighting && s.pending.length && time >= s.echoUntil) {
    const id = s.pending.shift(),
      e = s.echoes.find((e) => e.id === id);
    if (!e) return null;
    s.echoText = e.text;
    s.echoUntil = time + B.guidance.echoDuration;
    return e;
  }
  return null;
}
export function syncStumps(platforms, trees) {
  for (const t of trees)
    if (!t.hp && !platforms.some((p) => p.id === "stump-" + t.id))
      platforms.push({ id: "stump-" + t.id, x: t.x - 20, y: t.y + 20, w: 40 });
}
export { updateCamera, DESKTOP_CAMERA } from "./systems/camera.mjs";
