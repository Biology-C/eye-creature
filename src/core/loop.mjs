export function installLoop(app) {
  function loop(now) {
    app.gameState.debug?.frame(now);
    const dt = Math.min(0.05, app.gameState.last ? (now - app.gameState.last) / 1000 : 0);
    app.gameState.last = now;
    if (app.gameState.mode === "playing") {
      if (app.gameState.hitStop > 0)
        app.gameState.hitStop = Math.max(0, app.gameState.hitStop - dt);
      else app.update(dt);
    }
    app.syncMusic();
    app.syncChargeSound();
    app.events.emit("combatFeedbackFlush");
    if (app.gameState.player && app.gameState.ratImage) app.render();
    requestAnimationFrame(app.loop);
  }
  Object.assign(app, { loop });
}
