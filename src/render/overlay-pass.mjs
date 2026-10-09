import { BALANCE as B } from "../config/balance.mjs";
import { BREACH_HOLD } from "../handheld.mjs";
import { MAX_WING } from "../physics.mjs";
export function drawOverlayPass(app, frame) {
  if (app.gameState.time < app.gameState.hurtUntil) {
    app.g.save();
    app.g.strokeStyle = "#ed9a9a";
    app.g.lineWidth = 5;
    app.g.globalAlpha = app.gameState.reduced
      ? 0.5
      : (app.gameState.hurtUntil - app.gameState.time) / 0.35;
    app.g.strokeRect(3, 3, app.canvas.width - 6, app.canvas.height - 6);
    app.g.restore();
  }
  if (app.gameState.boss.active) {
    app.rect(app.canvas.width / 2 - 135, 7, 270, app.gameState.boss.cursed ? 58 : 38, "#17242a");
    app.rect(app.canvas.width / 2 - 120, 14, 240, 8, "#482b36");
    app.rect(
      app.canvas.width / 2 - 120,
      14,
      (240 * app.gameState.boss.hp) / app.gameState.boss.maxHp,
      8,
      "#d7777c",
    );
    app.text(
      `紅熊 ${app.gameState.boss.hp} / ${app.gameState.boss.maxHp}`,
      app.canvas.width / 2 - 120,
      38,
      "#ffe1d0",
      12,
    );
    if (app.gameState.boss.cursed)
      app.text("史萊姆：拾取重踏掉落的鏡子", app.canvas.width / 2 - 120, 57, "#b6e7c9", 12);
  }
  if (!app.gameState.boss.active) {
    const scale = Math.min(app.canvas.width < 600 ? 0.55 : 0.8, 130 / app.H),
      mx = app.canvas.width - app.W * scale - 18,
      my = 14;
    app.rect(mx - 6, my - 6, app.W * scale + 12, app.H * scale + 24, "#0f2029");
    for (const s of app.gameState.seen) {
      const [x, y] = s.split(",").map(Number);
      app.rect(mx + x * scale, my + y * scale, Math.max(1, scale), Math.max(1, scale), "#617b70");
    }
    for (const l of app.gameState.lights)
      if (!l.got && app.gameState.seen.has(`${Math.floor(l.x / app.T)},${Math.floor(l.y / app.T)}`))
        app.rect(mx + (l.x / app.T) * scale, my + (l.y / app.T) * scale, 3, 3, "#ffe6a0");
    for (const r of app.gameState.rewards)
      if (!r.got && app.gameState.seen.has(`${Math.floor(r.x / app.T)},${Math.floor(r.y / app.T)}`))
        app.rect(
          mx + (r.x / app.T) * scale,
          my + (r.y / app.T) * scale,
          r.kind === "relic" ? 3 : 2,
          r.kind === "relic" ? "#cfadf4" : r.kind === "wing" ? "#78df99" : "#f0a660",
        );
    for (const w of app.gameState.crackedWalls)
      if (w.discovered) {
        app.g.strokeStyle = w.broken ? "#9bdcbf" : "#dca36b";
        app.g.strokeRect(mx + (w.x / app.T) * scale, my + (w.y / app.T) * scale, 4, 4);
      }
    for (const [i, l] of app.world.safes.entries())
      if (app.gameState.activated.has(i)) {
        app.rect(mx + (l.x / app.T) * scale, my + (l.y / app.T) * scale, 3, 3, "#ffe7b1");
      }
    app.rect(
      mx + (app.gameState.player.x / app.T) * scale,
      my + (app.gameState.player.y / app.T) * scale,
      3,
      3,
      "#9ef1db",
    );
    app.text("已探索", mx + 4, my + app.H * scale + 12, "#bad0bd", 10);
  }
  frame.px = app.gameState.player.x - app.gameState.camera.x;
  frame.py = app.gameState.player.y - app.gameState.camera.y;
  if (!app.gameState.player.slimeForm) {
    app.rect(frame.px - 20, frame.py + 36, 40, 4, "#42524a");
    app.rect(
      frame.px - 20,
      frame.py + 36,
      (40 * app.gameState.player.wing) / MAX_WING,
      4,
      "#b8dab5",
    );
  }
  if (app.gameState.comboStage && app.gameState.time <= app.gameState.comboUntil)
    app.text(
      ["", "Ⅰ 直斬", "Ⅱ 迴旋", "Ⅲ 十字"][app.gameState.comboStage],
      frame.px - 24,
      frame.py - 40,
      "#ffe1ac",
      11,
    );
  if (app.gameState.breachHold) {
    const q = Math.min(1, (app.gameState.time - app.gameState.breachHold.start) / BREACH_HOLD);
    app.rect(frame.px - 26, frame.py - 46, 52, 6, "#283c25");
    app.rect(frame.px - 26, frame.py - 46, 52 * q, 6, "#c5dd98");
    app.text("破牆", frame.px - 14, frame.py - 51, "#dbe9ba", 11);
  }
  if (app.gameState.chargeStart !== null)
    app.text(
      app.gameState.time - app.gameState.chargeStart >= B.attack.chargeTime
        ? "放開發射"
        : `蓄力 ${Math.min(100, Math.floor(((app.gameState.time - app.gameState.chargeStart) / B.attack.chargeTime) * 100))}%`,
      frame.px - 32,
      frame.py - 40,
      "#bdefff",
      11,
    );
  app.text(
    `${Math.floor(app.gameState.time / 60)}:${String(Math.floor(app.gameState.time % 60)).padStart(2, "0")}`,
    14,
    24,
    "#bed0bd",
    12,
  );
}
