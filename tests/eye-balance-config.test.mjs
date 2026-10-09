import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { BALANCE, DEFAULT_BALANCE } from "../src/config/balance.mjs";
import { createPhysics, RUN_SPEED } from "../src/physics.mjs";
import { updateRat } from "../src/rats.mjs";

assert.deepEqual(BALANCE, DEFAULT_BALANCE);
assert.ok(Object.isFrozen(DEFAULT_BALANCE.enemy));
assert.throws(() => {
  DEFAULT_BALANCE.boss.waves[0].ratio = 0;
}, TypeError);
// Check every literal configuration path, including otherwise unexercised branches.
function scan(folder) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) scan(file);
    else if (/\.(js|mjs)$/.test(file)) {
      const source = fs.readFileSync(file, "utf8");
      for (const match of source.matchAll(/\b(?:B|BALANCE)\.([a-zA-Z]+)\.([a-zA-Z]+\d*)/g)) {
        assert.ok(Object.hasOwn(BALANCE[match[1]] || {}, match[2]), `${file}: unknown ${match[0]}`);
      }
    }
  }
}
scan("src");
assert.equal(RUN_SPEED, 260);
assert.equal(BALANCE.attack.chargedDamage, 3);
assert.equal(BALANCE.boss.maxHp, 36);
assert.equal(
  BALANCE.energy.introSingles +
    BALANCE.energy.introReserveOffsets.length * BALANCE.energy.introReserveAmount,
  42,
);
// Live debug tuning is read during AI updates, not captured once at module import.
const moves = [];
const physics = {
  enemy() {},
  walkEnemy(r, dx) {
    moves.push(dx);
    return true;
  },
};
const rat = { x: 0, y: 0, a: -100, b: 100, face: 1, hp: 2, grounded: true, stun: 0, state: "walk" };
try {
  updateRat(rat, { x: 900, y: 0 }, physics, 0.1, 0, () => true);
  BALANCE.enemy.ratSpeed *= 2;
  updateRat(rat, { x: 900, y: 0 }, physics, 0.1, 0, () => true);
  assert.equal(moves[1], moves[0] * 2);
  const p = createPhysics(
    Array.from({ length: 10 }, () => Array(10).fill(0)),
    32,
    [],
  );
  assert.equal(typeof p.player, "function");
} finally {
  BALANCE.enemy.ratSpeed = DEFAULT_BALANCE.enemy.ratSpeed;
}
console.log("PASS balance references, immutable defaults, exact initial values and live AI tuning");
