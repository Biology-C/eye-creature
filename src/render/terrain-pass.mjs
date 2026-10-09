import { drawRegionFeatures } from "../region-features.mjs";
import { drawCrackGuidance } from "../guidance.mjs";
import { drawPickupIcon } from "../pickup-art.mjs";
import { drawSceneMirrors } from "../handheld.mjs";
import { updateCamera } from "../exploration.mjs";
import { drawExploration } from "../exploration-art.mjs";
import { drawTerrain } from "../terrain.mjs";
import { BREACH_COST, ordinaryWall } from "../breach.mjs";
import { trapSupported, drawSpikes } from "../traps.mjs";
export function drawTerrainPass(app, frame) {
  app.events.emit("overlayHudChanged");
  app.g.imageSmoothingEnabled = false;
  if (app.gameState.cameraSnap) {
    updateCamera(
      app.gameState.camera,
      app.gameState.player,
      app.canvas.width,
      app.canvas.height,
      { w: app.W * app.T, h: app.H * app.T },
      0,
      true,
      {
        gentleDesktop: !app.handheld,
        moveDirection: 0,
      },
    );
    app.gameState.cameraSnap = false;
  }
  app.g.fillStyle = app.gameState.light ? "#b6c5ae" : "#14292e";
  app.g.fillRect(0, 0, app.canvas.width, app.canvas.height);
  app.g.save();
  app.g.translate(-Math.round(app.gameState.camera.x), -Math.round(app.gameState.camera.y));
  drawTerrain(
    app.g,
    app.map,
    app.T,
    app.gameState.camera,
    app.canvas.width,
    app.canvas.height,
    app.gameState.light,
    app.world.regionAt,
  );
  drawRegionFeatures(
    app.g,
    app.world,
    app.gameState.time,
    app.gameState.reduced,
    app.gameState.camera,
    app.canvas,
  );
  drawExploration(
    app.g,
    app.gameState.exploration,
    app.world,
    app.gameState.player,
    app.gameState.time,
    app.gameState.reduced,
    app.gameState.camera,
    app.canvas,
    app.gameState.crackedWalls,
  );
  if (app.handheld)
    drawSceneMirrors(app.g, app.sceneMirrors, app.gameState.time, app.gameState.fauna.mirrorReady);
  for (const w of app.gameState.crackedWalls) {
    if (
      w.broken ||
      (app.world.version && !w.discovered) ||
      w.x > app.gameState.camera.x + app.canvas.width ||
      w.x + w.w < app.gameState.camera.x ||
      w.y > app.gameState.camera.y + app.canvas.height ||
      w.y + w.h < app.gameState.camera.y
    )
      continue;
    app.rect(w.x, w.y, w.w, w.h, "#625047");
    app.g.strokeStyle = "#f0ae6b";
    app.g.lineWidth = 3;
    if (w.axis === "vertical") {
      for (const oy of [8, w.h - 8]) {
        app.g.beginPath();
        app.g.moveTo(w.x + 4, w.y + oy);
        app.g.lineTo(w.x + 25, w.y + oy + 4);
        app.g.lineTo(w.x + 48, w.y + oy - 3);
        app.g.lineTo(w.x + 70, w.y + oy + 3);
        app.g.lineTo(w.x + w.w - 4, w.y + oy);
        app.g.stroke();
      }
    } else
      for (const ox of [8, w.w - 8]) {
        app.g.beginPath();
        app.g.moveTo(w.x + ox, w.y + 4);
        app.g.lineTo(w.x + ox + 4, w.y + 24);
        app.g.lineTo(w.x + ox - 3, w.y + 42);
        app.g.lineTo(w.x + ox + 3, w.y + 66);
        app.g.lineTo(w.x + ox, w.y + w.h - 4);
        app.g.stroke();
      }
    app.text(
      w.axis === "vertical" ? `↑↓ 裂面 ${BREACH_COST}` : `裂牆 · ${BREACH_COST}`,
      w.x + 9,
      w.y + 48,
      "#ffe0b1",
      12,
    );
  }
  drawCrackGuidance(
    app.g,
    app.gameState.player,
    app.gameState.crackedWalls,
    app.gameState.time,
    app.gameState.reduced,
  );
  for (const t of app.gameState.torches) {
    if (
      t.x < app.gameState.camera.x - 45 ||
      t.x > app.gameState.camera.x + app.canvas.width + 45 ||
      t.y < app.gameState.camera.y - 45 ||
      t.y > app.gameState.camera.y + app.canvas.height + 45
    )
      continue;
    const x = t.x,
      y = t.y;
    if (t.lit) {
      app.g.save();
      app.g.globalAlpha = app.gameState.light ? 0.09 : 0.14;
      app.rect(x - 28, y - 32, 56, 60, "#ffc36b");
      app.g.globalAlpha = app.gameState.light ? 0.12 : 0.18;
      app.rect(x - 17, y - 23, 34, 39, "#ffc36b");
      app.g.restore();
    }
    app.rect(x - 14, y - 1, 15, 4, "#505257");
    app.rect(x - 15, y - 8, 4, 15, "#777575");
    app.rect(x - 3, y - 1, 6, 15, "#6e513b");
    app.rect(x - 6, y - 4, 12, 5, t.lit ? "#a17b48" : "#62646a");
    if (t.lit) {
      const flicker = app.gameState.reduced ? 0 : Math.floor(app.gameState.time * 4 + t.node) % 2;
      app.rect(x - 5, y - 13, 10, 9, "#ec8a40");
      app.rect(x - 3, y - 19 - flicker, 6, 13 + flicker, "#ffd17a");
      app.rect(x - 1, y - 13, 3, 8, "#fff1b0");
    } else {
      app.rect(x - 4, y - 9, 8, 5, "#393b42");
      app.rect(x - 2, y - 11, 4, 3, "#707478");
    }
  }
  for (const p of app.world.platforms) {
    if (
      p.y >= app.gameState.camera.y &&
      p.y <= app.gameState.camera.y + app.canvas.height &&
      p.x + p.w >= app.gameState.camera.x &&
      p.x <= app.gameState.camera.x + app.canvas.width
    ) {
      app.rect(p.x, p.y, p.w, 3, "#7a9f9b");
      for (let x = p.x + 4; x < p.x + p.w; x += 16) app.rect(x, p.y + 3, 5, 3, "#405e5e");
    }
  }
  for (const trap of app.world.traps) {
    if (
      Math.abs(trap.x - app.gameState.player.x) > app.canvas.width ||
      Math.abs(trap.y - app.gameState.player.y) > app.canvas.height ||
      !trapSupported(trap, app.solid)
    )
      continue;
    drawSpikes(app.g, trap, app.gameState.time);
  }
  for (const mark of app.world.landmarks) {
    app.text(mark.name, mark.x - 65, mark.y - 54, "#b8cdb0", 15);
    app.rect(mark.x - 28, mark.y + 39, 56, 4, "#8aa695");
  }
  for (const reward of app.gameState.rewards) {
    if (
      reward.got ||
      reward.x < app.gameState.camera.x - 20 ||
      reward.x > app.gameState.camera.x + app.canvas.width + 20 ||
      reward.y < app.gameState.camera.y - 20 ||
      reward.y > app.gameState.camera.y + app.canvas.height + 20
    )
      continue;
    const x = reward.x,
      y =
        reward.y +
        (app.gameState.reduced
          ? 0
          : Math.round(Math.sin(app.gameState.time * 2 + reward.node) * 2));
    if (reward.kind === "wing") drawPickupIcon(app.g, "wing", x, y);
    else if (reward.kind === "energy") {
      app.rect(x - 5, y - 5, 10, 10, "#f0a660");
      app.rect(x - 2, y - 2, 4, 4, "#ffefc0");
    } else drawPickupIcon(app.g, "relic", x, y);
  }
  if (app.gameState.pickupFlash && app.gameState.time < app.gameState.pickupFlash.until) {
    const k = app.gameState.pickupFlash;
    app.g.strokeStyle = k.kind === "wing" ? "#9ff0b6" : "#dfc5ff";
    app.g.lineWidth = 2;
    const size = app.gameState.reduced ? 14 : 14 + (1 - (k.until - app.gameState.time) / 0.7) * 18;
    app.g.strokeRect(k.x - size, k.y - size, size * 2, size * 2);
  }
  for (const l of app.gameState.lights) {
    if (l.got) continue;
    const bob = app.gameState.reduced ? 0 : Math.round(Math.sin(app.gameState.time * 3) * 3);
    app.rect(l.x - 9, l.y - 9 + bob, 18, 18, "#6a6951");
    app.rect(l.x - 5, l.y - 7 + bob, 10, 14, "#ffe6a0");
    app.rect(l.x - 7, l.y - 3 + bob, 14, 6, "#ffe6a0");
  }
  app.world.safes.forEach((safe, i) => {
    app.rect(safe.x - 12, safe.y - 15, 24, 30, "#58615a");
    app.rect(
      safe.x - 7,
      safe.y - 23,
      14,
      17,
      app.gameState.activated.has(i) ? "#ffe3a0" : "#9ab6ba",
    );
    app.text("休息燈", safe.x - 23, safe.y + 35);
  });
  frame.ordinaryTarget = ordinaryWall(
    app.gameState.player,
    app.world,
    app.gameState.keys.has("down") ? "down" : app.gameState.keys.has("up") ? "up" : null,
  );
  if (frame.ordinaryTarget) {
    app.g.strokeStyle = app.gameState.player.energy >= BREACH_COST ? "#edc78f" : "#877365";
    app.g.lineWidth = 2;
    app.g.strokeRect(
      frame.ordinaryTarget.x,
      frame.ordinaryTarget.y,
      frame.ordinaryTarget.w,
      frame.ordinaryTarget.h,
    );
    app.text(
      `破牆 ${BREACH_COST}`,
      frame.ordinaryTarget.x,
      frame.ordinaryTarget.y - 5,
      "#edc78f",
      12,
    );
  }
  frame.ex = app.world.exit.x;
  frame.ey = app.world.exit.y;
  app.rect(frame.ex - 20, frame.ey - 40, 40, 80, "#41685f");
  app.rect(
    frame.ex - 13,
    frame.ey - 34,
    26,
    68,
    app.gameState.lights.every((l) => l.got) ? "#dbe9ac" : "#789789",
  );
  app.text("紅熊守門室", frame.ex - 36, frame.ey - 52);
}
