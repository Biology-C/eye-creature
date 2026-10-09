// Test-only compatibility scope for pre-existing injected scenarios.
// Production exposes only its read-only levelSnapshot, never these mutable getters.
function instrumentGame(source) {
  return (
    source +
    `
for (const key of Object.keys(gameState)) Object.defineProperty(window, key, {
  configurable: true, get: () => gameState[key], set: value => { gameState[key] = value; }
});
`
  );
}
module.exports = { instrumentGame };
