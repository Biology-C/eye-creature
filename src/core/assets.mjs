import { loadHero } from "../hero.js";
export async function loadAssets(app) {
  try {
    [app.gameState.drawHero, app.gameState.ratImage] = await Promise.all([
      loadHero(),
      (async () => {
        const im = new Image();
        im.src = new URL("../../assets/sprites/rats.png", import.meta.url).href;
        await im.decode();
        return im;
      })(),
    ]);
    for (let row = 0; row < 2; row++)
      for (let col = 0; col < 4; col++) {
        const cw = Math.floor(app.gameState.ratImage.width / 4),
          ch = Math.floor(app.gameState.ratImage.height / 2),
          c = document.createElement("canvas");
        c.width = cw;
        c.height = ch;
        const ctx = c.getContext("2d");
        ctx.drawImage(app.gameState.ratImage, col * cw, row * ch, cw, ch, 0, 0, cw, ch);
        const data = ctx.getImageData(0, 0, cw, ch).data;
        let l = cw,
          t = ch,
          r = 0,
          b = 0;
        for (let y = 0; y < ch; y++)
          for (let x = 0; x < cw; x++)
            if (data[(y * cw + x) * 4 + 3] > 100) {
              l = Math.min(l, x);
              r = Math.max(r, x);
              t = Math.min(t, y);
              b = Math.max(b, y);
            }
        app.gameState.enemyFrames.push({
          x: col * cw + l,
          y: row * ch + t,
          w: Math.max(1, r - l + 1),
          h: Math.max(1, b - t + 1),
        });
      }
    app.gameState.faunaImage = new Image();
    app.gameState.faunaImage.src = new URL("../../assets/sprites/fauna.png", import.meta.url).href;
    await app.gameState.faunaImage.decode();
    for (let row = 0; row < 2; row++)
      for (let col = 0; col < 2; col++) {
        const w = app.gameState.faunaImage.width / 2,
          h = app.gameState.faunaImage.height / 2,
          c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d");
        ctx.drawImage(app.gameState.faunaImage, col * w, row * h, w, h, 0, 0, w, h);
        const d = ctx.getImageData(0, 0, w, h).data;
        let left = w,
          top = h,
          right = 0,
          bottom = 0;
        for (let y = 0; y < h; y++)
          for (let x = 0; x < w; x++)
            if (d[(y * w + x) * 4 + 3] > 100) {
              left = Math.min(left, x);
              right = Math.max(right, x);
              top = Math.min(top, y);
              bottom = Math.max(bottom, y);
            }
        app.gameState.faunaFrames.push({
          x: col * w + left,
          y: row * h + top,
          w: right - left + 1,
          h: bottom - top + 1,
        });
      }
    app.reset();
    app.gameState.mode = "intro";
    app.loadCheckpointMenu();
    if (app.debugEnabled) {
      const { createDebugPanel } = await import("../debug.mjs");
      app.gameState.debug = createDebugPanel({
        state: () => ({
          player: app.gameState.player,
          boss: app.gameState.boss,
          rats: app.gameState.rats,
          fauna: app.gameState.fauna,
        }),
        refresh: app.updateHud,
        clearInput: () => {
          app.gameState.clearTouch();
          app.gameState.keys.clear();
          app.cancelAttackInput();
        },
        jumpToBoss: () => {
          if (app.gameState.mode === "reading") return false;
          app.gameState.lights.forEach((light) => (light.got = true));
          app.beginBoss();
          app.resume();
          return true;
        },
      });
    }
    app.$("#start").disabled = false;
    app.$("#start").textContent = "開始新冒險";
    requestAnimationFrame(app.loop);
  } catch (e) {
    app.$("#description").textContent = "素材載入失敗，請重新整理或確認本機伺服器。";
    console.error(e);
  }
}
