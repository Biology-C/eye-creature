const { runReplay, firstDifference } = require("./helpers/replay.cjs");
const assert = require("node:assert/strict");
assert.deepEqual(firstDifference({ hp: 5 }, { hp: 4 }), { field: "hp", expected: 5, actual: 4 });
runReplay(process.env.BASE_URL || "http://127.0.0.1:8768/").catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
