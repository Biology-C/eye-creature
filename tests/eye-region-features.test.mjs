import assert from "node:assert/strict";
import { buildAdventure } from "../src/adventure.mjs";
import {
  installRegionFeatures,
  gustState,
  gustAt,
  // eslint-disable-next-line no-unused-vars -- Legacy binding retained for the no-behavior-change tooling pass; review in a separate cleanup.
  stepGust,
  updateGustWarnings,
} from "../src/region-features.mjs";
import {
  addSurfaceSpikes,
  removeSpikeShelters,
  trapSupported,
  touchesSpikes,
  spikeState,
} from "../src/traps.mjs";
import { createPhysics, RUN_SPEED } from "../src/physics.mjs";
import { createFauna, updateFauna } from "../src/fauna.mjs";
for (let seed = 0; seed < 100; seed++) {
  const w = buildAdventure(seed),
    map = JSON.stringify(w.map);
  addSurfaceSpikes(w);
  removeSpikeShelters(w);
  const platforms = JSON.stringify(w.platforms);
  installRegionFeatures(w);
  assert.equal(JSON.stringify(w.map), map);
  assert.equal(JSON.stringify(w.platforms), platforms);
  const solid = (x, y) => w.map[Math.floor(y / 32)]?.[Math.floor(x / 32)] !== 0;
  for (const g of w.gusts) {
    assert.ok(g.w <= 390);
    assert.equal(w.regionAt(g.x + g.w / 2, g.y + g.h / 2), 1);
    // Continuous solid ground inside and beyond the wind band; no pit at its exit.
    for (let x = g.x - 24; x <= g.x + g.w + 24; x += 8) assert.ok(solid(x, g.y + g.h + 1));
    for (const t of w.traps) {
      const end = { x: t.x + Math.cos(t.angle || 0) * t.w, y: t.y + Math.sin(t.angle || 0) * t.w };
      for (let f = 0; f <= 1; f += 0.1) {
        const x = t.x + (end.x - t.x) * f,
          y = t.y + (end.y - t.y) * f;
        assert.ok(
          Math.hypot(Math.max(g.x - x, 0, x - g.x - g.w), Math.max(g.y - y, 0, y - g.y - g.h)) >=
            120,
        );
      }
    }
    for (const e of [
      ...w.rats,
      ...w.pureSpawns,
      ...w.bigSpawns,
      ...w.faunaSpec.trees,
      ...w.faunaSpec.birds,
    ])
      assert.ok(
        Math.hypot(
          Math.max(g.x - e.x, 0, e.x - g.x - g.w),
          Math.max(g.y - e.y, 0, e.y - g.y - g.h),
        ) >= 120,
      );
  }
  for (const t of w.traps.filter((t) => t.id?.startsWith("mirror-wall"))) {
    assert.ok(trapSupported(t, solid));
    assert.equal(w.regionAt(t.x + (t.angle > 0 ? 30 : -30), t.y), 2);
    assert.ok(
      w.platforms.some(
        (p) =>
          t.waiting.x >= p.x + 11 &&
          t.waiting.x <= p.x + p.w - 11 &&
          Math.abs(p.y - t.waiting.y - 11.01) < 0.1,
      ),
    );
    assert.ok(!solid(t.waiting.x, t.waiting.y));
    for (let time = 0; time < 6; time += 0.05)
      assert.equal(touchesSpikes(t.waiting, t, time), false);
  }
  const pair = w.traps.filter((t) => t.id?.startsWith("mirror-wall"));
  assert.equal(pair.length, 2);
  assert.equal(pair[0].node, pair[1].node);
  assert.equal(pair[1].x - pair[0].x, 96);
  for (const t of pair)
    for (let d = 1; d < t.w; d += 4) {
      const y = t.y + Math.sin(t.angle) * d,
        dir = Math.sign(t.angle);
      assert.ok(solid(t.x - dir * 2, y), "entire strip anchored in wall");
      assert.ok(!solid(t.x + dir * 2, y), "spikes face open shaft");
    }
  for (let time = 0; time < 6; time += 0.025)
    assert.ok(
      pair.filter((t) => spikeState(time + t.offset).height > 0).length <= 1,
      "alternating sides never close together",
    );
  assert.equal(w.regionProps.filter((p) => p.kind === "vines").length > 0, true);
}
// Cross the narrow shaft without damage using either side's retracted window.
for (const fps of [30, 60, 120])
  for (const phase of [0.1, 3.1]) {
    const w = buildAdventure();
    installRegionFeatures(w);
    const pair = w.traps.filter((t) => t.id?.startsWith("mirror-wall")),
      phy = createPhysics(w.map, 32, w.platforms);
    const p = {
      ...pair[0].waiting,
      x: pair[0].x + (phase < 3 ? 20 : 76),
      vy: 0,
      wing: 0.7,
      face: 1,
      grounded: true,
    };
    let crossed = false;
    for (let i = 0; i < fps * 0.65; i++) {
      phy.player(p, new Set(["up"]), 1 / fps);
      for (const t of pair) assert.equal(touchesSpikes(p, t, phase + (i + 1) / fps), false);
      if (p.y < Math.min(pair[0].y, pair[1].y - pair[1].w) - 12) crossed = true;
    }
    assert.ok(crossed, "safe flap path through either alternating window");
  }
for (const [t, active, warning] of [
  [0, true, false],
  [4.999, true, false],
  [5, false, false],
  [6.499, false, false],
  [6.5, false, true],
  [6.999, false, true],
  [7, true, false],
])
  assert.deepEqual([gustState(t).active, gustState(t).warning], [active, warning]);
const outcomes = [];
for (const fps of [30, 60, 120]) {
  const map = Array.from({ length: 8 }, (_, y) => Array(300).fill(y === 7 ? 1 : 0)),
    phy = createPhysics(map, 32, []),
    p = { x: 4000, y: 212.99, vy: 0, wing: 0.7, face: -1 };
  for (let i = 0; i < fps * 2; i++) phy.player(p, new Set(["left"]), 1 / fps, false, () => 1);
  assert.equal(p.gustDrift, 150);
  assert.ok(150 < RUN_SPEED);
  assert.ok(p.x < 4000);
  outcomes.push(p.x);
  const before = { ...p };
  phy.player(p, new Set(["left"]), 0, false, () => 1);
  assert.deepEqual([p.x, p.y, p.gustDrift], [before.x, before.y, before.gustDrift]);
  phy.player(p, new Set(), 1 / fps, false);
  assert.equal(p.gustDrift, 0);
}
assert.ok(Math.max(...outcomes) - Math.min(...outcomes) < 0.01);
const w = buildAdventure();
installRegionFeatures(w);
let warnings = 0;
const g = w.gusts[0],
  view = { width: 500, height: 300 },
  cam = { x: g.x, y: g.y };
updateGustWarnings(w, 6.5, 6.49, cam, view, () => warnings++);
updateGustWarnings(w, 6.5, 6.5, cam, view, () => warnings++);
updateGustWarnings(w, 6.9, 6.8, cam, view, () => warnings++);
assert.equal(warnings, 1);
assert.equal(gustAt(w, { x: g.x + 20, y: g.y + 20 }, 5.2), 0);
const fauna = createFauna(w),
  region = fauna.zones[0].region,
  local = () => fauna.birds.filter((b) => b.hp && fauna.zones[b.zone].region === region),
  p = { x: -9999, y: -9999 },
  env = {
    clear: () => true,
    free: () => true,
    hurt() {},
    visible: () => false,
    regionAt: () => region,
  };
fauna.zones[0].seen = true;
const n = local().length;
updateFauna(fauna, p, 2.99, 2.99, env);
assert.equal(local().length, n);
updateFauna(fauna, p, 3, 0.01, env);
assert.equal(local().length, n + 1);
const timer = fauna.zones[0].elapsed;
updateFauna(fauna, p, 10, 7, { ...env, regionAt: () => 99 });
assert.equal(fauna.zones[0].elapsed, timer);
for (let i = 0; i < 20; i++) updateFauna(fauna, p, 10 + i * 3, 3, env);
assert.equal(local().length, 4);
for (const b of local()) b.hp = 0;
updateFauna(fauna, p, 99, 20, env);
assert.equal(local().length, 0);
console.log(
  "PASS 100 seeds: safe region fixtures/no geometry changes, gust/spike separation, safe waiting; wind cycle/FPS/counterwind/pause, regional bird timer/cap/clear",
);
