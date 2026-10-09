import assert from "node:assert/strict";
import { createState, resetState } from "../src/core/state.mjs";
const a = createState(),
  b = createState();
a.keys.add("left");
a.importantMessages.push("one");
assert.equal(b.keys.size, 0);
assert.deepEqual(b.importantMessages, []);
const keys = a.keys;
assert.equal(resetState(a, { time: 0, kills: 0 }), a);
assert.equal(a.keys, keys);
assert.equal(a.kills, 0);
console.log("PASS independent game states and identity-preserving run reset");
