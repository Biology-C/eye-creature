import { BALANCE as B } from "./config/balance.mjs";
import { updateTornadoes } from "./tornado.mjs";
import { inMelee } from "./combat.mjs";
export function createFauna(world) {
  if (world.faunaSpec) {
    const trees = world.faunaSpec.trees.map((t, id) => ({
      ...t,
      id,
      y: t.y - 21,
      hp: B.enemy.treeHp,
      state: "idle",
      timer: 0,
      stun: 0,
      castTimer: B.enemy.treeFirstCast,
      casting: 0,
    }));
    const zones = world.faunaSpec.birds.map((b, id) => ({ ...b, id, elapsed: 0, serial: 0 }));
    const s = {
      birdRules: world.faunaSpec.birdRules,
      trees,
      zones,
      birds: [],
      tornadoes: [],
      mirrorUntil: 0,
      mirrorReady: 0,
    };
    for (const z of zones) spawnBird(s, z);
    return s;
  }
  const candidates = [];
  const { T, map } = world;
  for (let n = 2; n < world.graph.length; n++) {
    const p = world.tile(n);
    if (
      n % 6 === 3 ||
      world.lightNodes.includes(n) ||
      world.exitNode === n ||
      world.safes.some((s) => s.x === world.position(n).x && s.y === world.position(n).y) ||
      world.traps.some((t) => t.node === n)
    )
      continue;
    if ([0, 1, 2, 3, 4].every((dx) => map[p.y + 5]?.[p.x + dx] === 1)) candidates.push(n);
  }
  const nodes = [0, 0.3, 0.6, 0.85]
    .map((f) => candidates[Math.floor(f * candidates.length)])
    .filter((n) => n !== undefined);
  const trees = nodes.map((node, id) => {
    const p = world.tile(node);
    return {
      id,
      node,
      x: (p.x + 2.5) * T,
      y: (p.y + 5) * T - 35,
      hp: B.enemy.treeHp,
      state: "idle",
      timer: 0,
      stun: 0,
      castTimer: B.enemy.treeFirstCast,
      casting: 0,
    };
  });
  const zones = trees.map((t, id) => ({ id, x: t.x, y: t.y - 55, elapsed: 0, serial: 0 }));
  for (const node of candidates.filter((n) => !nodes.includes(n))) {
    if (zones.length >= B.legacy.birds) break;
    const p = world.position(node);
    zones.push({ id: zones.length, x: p.x, y: p.y, elapsed: 0, serial: 0 });
  }
  const state = { trees, zones, birds: [], tornadoes: [], mirrorUntil: 0, mirrorReady: 0 };
  for (const z of zones) spawnBird(state, z);
  return state;
}
function spawnBird(state, z) {
  if (
    !z ||
    state.birds.filter(
      (b) =>
        b.hp &&
        (state.birdRules?.regional ? state.zones[b.zone].region === z.region : b.zone === z.id),
    ).length >= (state.birdRules?.cap ?? B.legacy.birdCap)
  )
    return false;
  state.birds.push({
    id: `${z.id}-${z.serial++}`,
    zone: z.id,
    x: z.x,
    y: z.y,
    hp: B.enemy.birdHp,
    mode: "circle",
    timer: B.enemy.birdCircleDuration,
    angle: z.serial * 1.6,
    dx: 0,
    dy: 0,
  });
  return true;
}
export function meleeFauna(s, p, time, clear, targets = null) {
  let killed = 0,
    felled = 0;
  for (const e of [...s.trees, ...s.birds]) {
    // eslint-disable-next-line no-unused-vars -- Legacy binding retained for the no-behavior-change tooling pass; review in a separate cleanup.
    const dx = (e.x - p.x) * p.face;
    if ((!targets || targets.includes(e)) && inMelee(p, e, clear)) {
      e.hp = Math.max(0, e.hp - B.attack.meleeDamage[(p.stage || 1) - 1]);
      e.stun = time + B.attack.enemyStun;
      if (!e.hp) {
        killed++;
        if ("node" in e) {
          felled++;
          const z = s.zones[e.id];
          spawnBird(s, z);
          spawnBird(s, z);
        }
      }
    }
  }
  return { killed, felled };
}
export function mirrorFauna(s, p, time, clear) {
  if (time < s.mirrorReady) return -1;
  s.mirrorReady = time + B.attack.mirrorCooldown;
  s.mirrorUntil = time + B.attack.mirrorDuration;
  let count = 0;
  for (const b of s.birds)
    if (
      b.hp &&
      Math.hypot(b.x - p.x, b.y - p.y) <= B.attack.mirrorRange &&
      clear(p.x, p.y, b.x, b.y)
    ) {
      b.mode = "mirror";
      b.timer = B.attack.mirrorDefeatDelay;
      count++;
    }
  return count;
}
export function resetFaunaAfterDeath(s) {
  s.tornadoes = [];
  for (const b of s.birds)
    if (b.hp) {
      const z = s.zones[b.zone];
      b.x = z.x;
      b.y = z.y;
      b.mode = "circle";
      b.timer = B.enemy.birdCircleDuration;
      b.stun = 0;
    }
  for (const t of s.trees) {
    t.state = "idle";
    t.timer = 0;
    t.stun = 0;
    t.castTimer = B.enemy.treeFirstCast;
    t.casting = 0;
  }
}
export function updateFauna(s, p, time, dt, { clear, free, hurt, visible, regionAt }) {
  let kills = 0;
  s.tornadoes = updateTornadoes(s.tornadoes || [], dt, { free, player: p, hurt });
  for (const t of s.trees) {
    if (!t.hp || time < t.stun) continue;
    const near = Math.hypot(t.x - p.x, t.y - p.y) < B.enemy.treeSight && clear(t.x, t.y, p.x, p.y);
    if (!near) {
      t.casting = 0;
      continue;
    }
    if (t.casting > 0) {
      t.casting -= dt;
      if (t.casting <= 0) {
        const len = Math.hypot(p.x - t.x, p.y - t.y) || 1;
        s.tornadoes.push({
          x: t.x,
          y: t.y,
          dx: (p.x - t.x) / len,
          dy: (p.y - t.y) / len,
          bounces: 0,
          life: B.enemy.tornadoLife,
        });
        t.castTimer = B.enemy.treeCastCooldown;
      }
    } else {
      t.castTimer = (t.castTimer ?? B.enemy.treeFirstCast) - dt;
      if (t.castTimer <= 0) t.casting = B.enemy.treeCastWarning;
    }
  }
  // In exploration each thematic region shares ONE timer and population cap.
  for (const z of s.zones) {
    if (
      s.birds.some(
        (b) =>
          b.hp &&
          b.zone === z.id &&
          (visible ? visible(b) : Math.hypot(p.x - b.x, p.y - b.y) < B.enemy.birdVisibleRange) &&
          clear(p.x, p.y, b.x, b.y),
      )
    )
      z.seen = true;
  }
  const leaders = s.birdRules?.regional
    ? s.zones.filter((z, i) => s.zones.findIndex((v) => v.region === z.region) === i)
    : s.zones;
  for (const z of leaders) {
    const members = s.birdRules?.regional ? s.zones.filter((v) => v.region === z.region) : [z],
      ids = new Set(members.map((v) => v.id)),
      birds = s.birds.filter((b) => b.hp && ids.has(b.zone)),
      interval = s.birdRules?.interval ?? B.legacy.birdInterval,
      cap = s.birdRules?.cap ?? B.legacy.birdCap;
    if (
      members.some((v) => v.seen) &&
      birds.length &&
      (!regionAt || regionAt(p.x, p.y) === z.region)
    ) {
      z.elapsed = Math.min(interval, z.elapsed + dt);
      if (z.elapsed >= interval - 1e-9 && birds.length < cap) {
        const origin = members.find((v) => v.seen && birds.some((b) => b.zone === v.id)) || z;
        spawnBird(s, origin);
        z.elapsed = 0;
      }
    } else if (!birds.length) z.elapsed = 0;
  }
  for (const t of s.trees) {
    if (!t.hp || time < t.stun) continue;
    const near =
      Math.hypot(t.x - p.x, t.y - p.y) < B.enemy.treeMeleeRange && clear(t.x, t.y, p.x, p.y);
    if (t.state === "idle" && near) {
      t.state = "ready";
      t.timer = B.enemy.treeReady;
    } else if (t.state !== "idle") {
      t.timer -= dt;
      if (t.timer <= 0) {
        if (t.state === "ready") {
          t.state = "strike";
          t.timer = B.enemy.treeStrike;
        } else if (t.state === "strike") {
          t.state = "rest";
          t.timer = B.enemy.treeRest;
        } else t.state = "idle";
      }
    }
    if (t.state === "strike" && near) hurt("樹妖", B.enemy.contactDamage);
  }
  for (const b of s.birds) {
    if (!b.hp) continue;
    const z = s.zones[b.zone];
    if (b.mode === "mirror") {
      b.timer -= dt;
      if (b.timer <= 0) {
        b.hp = 0;
        kills++;
      }
      continue;
    }
    if (time < (b.stun || 0)) continue;
    const near = Math.hypot(p.x - b.x, p.y - b.y) < B.enemy.birdSight && clear(b.x, b.y, p.x, p.y);
    if (b.mode === "circle" && near) {
      b.mode = "ready";
      b.timer = B.enemy.birdReady;
    }
    let tx = z.x + Math.cos(b.angle) * 38,
      ty = z.y + Math.sin(b.angle) * 22,
      speed = B.enemy.birdSpeed;
    b.angle += dt * 1.8;
    if (b.mode === "ready") {
      b.timer -= dt;
      speed = 0;
      if (b.timer <= 0) {
        b.mode = "dash";
        b.timer = B.enemy.birdDashDuration;
        const len = Math.hypot(p.x - b.x, p.y - b.y) || 1;
        b.dx = (p.x - b.x) / len;
        b.dy = (p.y - b.y) / len;
      }
    } else if (b.mode === "dash") {
      tx = b.x + b.dx * 100;
      ty = b.y + b.dy * 100;
      speed = B.enemy.birdDashSpeed;
      b.timer -= dt;
      if (b.timer <= 0) {
        b.mode = "rest";
        b.timer = B.enemy.birdRest;
      }
    } else if (b.mode === "rest") {
      b.timer -= dt;
      if (b.timer <= 0) b.mode = "circle";
    }
    const len = Math.hypot(tx - b.x, ty - b.y) || 1,
      n = Math.max(1, Math.ceil((speed * dt) / 4));
    for (let i = 0; i < n; i++) {
      const dx = (((tx - b.x) / len) * speed * dt) / n,
        dy = (((ty - b.y) / len) * speed * dt) / n;
      if (free(b.x + dx, b.y, 10)) b.x += dx;
      if (free(b.x, b.y + dy, 10)) b.y += dy;
    }
    if (Math.hypot(b.x - p.x, b.y - p.y) < 24 && clear(b.x, b.y, p.x, p.y))
      hurt("青影鳥", B.enemy.contactDamage);
  }
  return kills;
}
