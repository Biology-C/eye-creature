import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { parse } from "espree";
import { damageEnemy, damagePlayer } from "../src/systems/combat.mjs";
import { createState } from "../src/core/state.mjs";
const rat = { hp: 2 };
assert.equal(damageEnemy(rat, 1).transformed, true);
assert.equal(rat.hp, 1);
assert.equal(damageEnemy(rat, 3).defeated, true);
assert.equal(rat.hp, 0);
const calls = [],
  s = createState({ player: { hp: 5, inv: 10 }, time: 1 });
damagePlayer({ gameState: s }, "spikes", 1);
assert.equal(s.player.hp, 5);
s.player.inv = 0;
s.magic = { effects: [] };
damagePlayer(
  { gameState: s, events: { emit: (...e) => calls.push(e) }, updateHud: () => {} },
  "tornado",
  1,
);
assert.equal(s.player.hp, 4);
assert.deepEqual(calls, [["playerHurt", { dead: false }]]);

// Health assignments must stay in the gateway. Initial object literals are allowed;
// exploration's obstacle.hp is an environmental barrier, never an actor.
function scan(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) {
      scan(file);
      continue;
    }
    if (!/\.(mjs|js)$/.test(file) || file.endsWith(path.join("systems", "combat.mjs"))) continue;
    const ast = parse(fs.readFileSync(file, "utf8"), {
      ecmaVersion: "latest",
      sourceType: "module",
      loc: true,
    });
    function walk(node) {
      if (!node || typeof node !== "object") return;
      const target =
        node.type === "AssignmentExpression"
          ? node.left
          : node.type === "UpdateExpression"
            ? node.argument
            : null;
      if (
        target?.type === "MemberExpression" &&
        (target.property.name === "hp" || target.property.value === "hp")
      ) {
        assert.ok(
          file.endsWith("exploration.mjs") && target.object.name === "o",
          `${file}:${node.loc.start.line}: HP write bypasses combat gateway`,
        );
      }
      if (
        node.type === "CallExpression" &&
        node.callee.type === "MemberExpression" &&
        node.callee.object.name === "Object" &&
        node.callee.property.name === "assign"
      ) {
        for (const arg of node.arguments.slice(1))
          if (arg.type === "ObjectExpression")
            assert.ok(
              !arg.properties.some((p) => p.key?.name === "hp"),
              `${file}:${node.loc.start.line}: use restoreActor for health restoration`,
            );
      }
      for (const [key, value] of Object.entries(node)) {
        if (key === "loc") continue;
        if (Array.isArray(value)) value.forEach(walk);
        else if (value && typeof value === "object") walk(value);
      }
    }
    walk(ast);
  }
}
scan("src");
console.log(
  "PASS damage gateway: immunity, damage events, rat transformation/lethal charge, HP-write boundary",
);
