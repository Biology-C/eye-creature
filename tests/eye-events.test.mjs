import assert from "node:assert/strict";
import { createEvents } from "../src/core/events.mjs";
const bus = createEvents(),
  other = createEvents(),
  seen = [];
const first = (value) => seen.push(value);
const unsubscribe = bus.on("hit", first);
bus.on("hit", (value) => seen.push(value + 1));
other.emit("hit", 9);
bus.emit("hit", 1);
unsubscribe();
bus.emit("hit", 3);
assert.deepEqual(seen, [1, 2, 4]);
bus.off("missing", first);
let nested = false;
bus.on("nested", () => {
  nested = true;
});
bus.emit("nested");
assert.equal(nested, true, "dispatch must finish before game logic resumes");
console.log("PASS instance-local synchronous events, ordered subscribers and unsubscribe");
