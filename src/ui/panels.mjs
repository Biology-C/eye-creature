export function installPanels(app) {
  function showImportantMessages() {
    if (app.gameState.mode !== "playing" || !app.gameState.importantMessages.length) return;
    app.gameState.mode = "reading";
    app.gameState.clearTouch();
    app.gameState.keys.clear();
    app.cancelAttackInput();
    app.syncMusic();
    app.messageCard.show(app.gameState.importantMessages.shift());
  }
  function panel(title, description, label) {
    app.$("#map-panel").hidden = !app.handheld || app.gameState.mode !== "paused";
    if (app.handheld && app.gameState.mode === "paused") app.drawJourneyMap();
    app.$("#pause-details").hidden = app.gameState.mode !== "paused";
    app.$("#continue").hidden = true;
    app.$("#title").textContent = title;
    app.$("#description").textContent = description;
    app.$("#start").textContent = label;
    app.$("#overlay").hidden = false;
    app.$("#restart").hidden = app.gameState.mode !== "paused";
  }
  function refreshMemories() {
    const list = app.$("#memories");
    list.replaceChildren();
    for (const e of app.gameState.exploration.echoes) {
      const li = document.createElement("li");
      li.textContent = e.got ? e.text : "尚未找到的殘響";
      list.append(li);
    }
  }
  function pause() {
    app.refreshMemories();
    if (app.gameState.mode === "playing") {
      app.gameState.mode = "paused";
      app.syncMusic();
      app.gameState.clearTouch();
      app.gameState.keys.clear();
      app.cancelAttackInput();
      app.$("#save-status").textContent = "重新整理會回到最近休息燈；繼續探索保留目前進度。";
      app.panel("休息一下", "探索進度保留，準備好再繼續。", "繼續探索");
    } else if (app.gameState.mode === "paused") app.resume();
  }
  function resume() {
    if (app.messageCard.active) return;
    app.sfx.unlock();
    app.sfx.loadSample("breakWall", new URL("../../assets/sfx/wall-break.wav", import.meta.url));
    app.cues.unlock();
    app.gameState.mode = "playing";
    app.gameState.musicInBackground = false;
    app.syncMusic();
    app.music.unlock();
    app.$("#overlay").hidden = true;
    app.gameState.last = 0;
    app.canvas.focus();
  }
  function motionLabel() {
    app.$("#motion").setAttribute("aria-pressed", app.gameState.reduced);
    app.$("#motion").textContent = app.gameState.reduced ? "減少動態：開" : "減少動態：關";
  }
  Object.assign(app, { showImportantMessages, panel, refreshMemories, pause, resume, motionLabel });
}
