// Explicit baseline authoring only. Normal tests never write golden files.
const { createServer } = require("./server.cjs");
const { runReplay } = require("../tests/helpers/replay.cjs");
const fs = require("node:fs");
(async () => {
  fs.mkdirSync("tests/golden", { recursive: true });
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    await runReplay(`http://127.0.0.1:${server.address().port}/`, true);
  } finally {
    server.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
