import { setSlimeForm } from "../player-form.mjs";
import { MAX_WING } from "../physics.mjs";
export function installPlayerFormFlow(app) {
  function syncForm() {
    if (
      !setSlimeForm(
        app.gameState.player,
        app.gameState.boss.active && app.gameState.boss.hp > 0 && app.gameState.boss.cursed,
      )
    )
      return;
    app.gameState.clearTouch();
    app.gameState.keys.clear();
    app.cancelAttackInput(true);
    if (app.gameState.player.slimeForm) app.events.emit("playerTransformed");
    app.gameState.attackUntil = 0;
    app.gameState.slash = null;
    app.gameState.magic.shots = [];
    app.gameState.dashTrail = [];
    app.gameState.slimeHits.clear();
    if (!app.gameState.player.slimeForm) {
      app.gameState.player.bodyRadius = undefined;
      app.gameState.player.wing = MAX_WING;
    }
    app.updateFormControls();
  }
  Object.assign(app, { syncForm });
}
