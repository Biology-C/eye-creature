import { updatePlayer } from "../systems/player-update.mjs";
import { updateEnemies } from "../systems/enemy-update.mjs";
import { updateExploration } from "../systems/exploration-update.mjs";
export function installUpdate(app) {
  app.update = function update(dt) {
    if (app.gameState.mode === "reading") return;
    const frame = { dt };
    updatePlayer(app, frame);
    updateEnemies(app, frame);
    updateExploration(app, frame);
  };
}
