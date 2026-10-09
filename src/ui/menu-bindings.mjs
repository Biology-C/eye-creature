import { nearestCrack } from "../guidance.mjs";
import { SLASH_STYLES } from "../magic.mjs";
export function bindMenus(app) {
  app.$("#start").onclick = () => {
    if (
      app.gameState.mode === "won" ||
      (app.gameState.mode === "intro" && app.gameState.saveInfo.status !== "empty")
    ) {
      app.newAdventure();
      return;
    }
    if (new URLSearchParams(location.search).has("boss-preview") && !app.gameState.boss.active) {
      app.gameState.lights.forEach((l) => (l.got = true));
      app.beginBoss();
    }
    app.resume();
    app.events.emit("adventureStarted");
  };
  app.$("#restart").onclick = app.newAdventure;
  app.$("#pause").onclick = app.pause;
  app.$("#sound").onclick = () => app.setSfxVolume(app.sfx.muted ? app.gameState.lastSfxVolume : 0);
  app.$("#continue").onclick = () => {
    if (
      app.gameState.saveInfo.status === "ready" &&
      app.restoreCheckpoint(app.gameState.saveInfo.data)
    )
      app.resume();
  };
  app.$("#theme").onclick = () => {
    app.gameState.light = !app.gameState.light;
    document.body.classList.toggle("light", app.gameState.light);
    app.$("#theme").textContent = app.gameState.light ? "深色" : "淺色";
    if (app.gameState.mode === "playing") app.canvas.focus();
  };
  app.motionLabel();
  app.$("#motion").onclick = () => {
    app.gameState.reduced = !app.gameState.reduced;
    app.motionLabel();
    if (app.gameState.mode === "playing") app.canvas.focus();
  };
  app.$("#slash-style").onclick = () => {
    app.gameState.slashStyle = (app.gameState.slashStyle + 1) % 3;
    app.$("#slash-style").textContent = "斬擊：" + SLASH_STYLES[app.gameState.slashStyle];
    if (app.gameState.mode === "playing") app.canvas.focus();
  };
  app.$("#hint").onclick = () => {
    if (app.gameState.mode !== "playing") return;
    app.canvas.focus();
    const wall = nearestCrack(app.gameState.player, app.gameState.crackedWalls);
    if (!app.gameState.boss.active && !app.gameState.crackedWalls.some((w) => w.broken) && wall) {
      app.guidance.say("跟著箭頭尋找裂牆。", app.gameState.time, 6, {
        target: wall,
        kind: "reminder",
      });
      return;
    }
    const remaining = app.gameState.lights.filter((l) => !l.got),
      target = remaining.length
        ? remaining.sort(
            (a, b) =>
              Math.hypot(a.x - app.gameState.player.x, a.y - app.gameState.player.y) -
              Math.hypot(b.x - app.gameState.player.x, b.y - app.gameState.player.y),
          )[0]
        : app.world.exit;
    const dx = target.x - app.gameState.player.x,
      dy = target.y - app.gameState.player.y;
    app.say(
      `${remaining.length ? "光點" : "出口"}訊號大約在${Math.abs(dy) > 100 ? (dy < 0 ? "北" : "南") : ""}${Math.abs(dx) > 100 ? (dx < 0 ? "西" : "東") : ""}方。牆後可能要繞路。`,
      6,
    );
  };
  app.$("#sense-direction").onclick = () => {
    if (app.gameState.mode === "paused") {
      app.resume();
      app.$("#hint").click();
    }
  };
  app.$("#breach").onclick = app.breach;
  app.$("#mirror").onclick = app.mirror;
  app.$("#dash").onclick = app.dash;
  app.$("#magic").onclick = app.lightMagic;
  app.$("#select").onclick = () => {
    if (app.gameState.mode === "playing") app.pause();
    else if (app.gameState.mode === "paused") app.resume();
  };
  app.$("#handheld-start").onclick = () => {
    if (app.gameState.mode === "intro" || app.gameState.mode === "won") app.$("#start").click();
    else app.pause();
  };
  if (app.handheld) {
    app.$("#description .intro-line:last-child").textContent = "十字鍵移動 · B 拍翼／滑翔";
    app.$("#pause-details details p").textContent =
      "十字鍵左右移動，上下觀察；下可穿過薄台。B 拍翼／滑翔。A：近敵連按三段斬、遠處長按蓄力後放開；靠近裂牆長按 0.65 秒破牆，消耗 30 能量。X 衝刺。靠近場景鏡面會映照青影鳥；變身後等待紅熊重踏掉落鏡子，拾取解除詛咒。SELECT 地圖、START 暫停。";
    app.$(".attack").innerHTML = "A<small>攻擊</small>";
    app.$("#dash").innerHTML = "X<small>衝刺</small>";
  }
}
