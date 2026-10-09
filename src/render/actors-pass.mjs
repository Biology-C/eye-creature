import { BALANCE as B } from "../config/balance.mjs";
import { wingFrame } from "../feedback.mjs";
import { isSlime } from "../slime.mjs";
import { drawTornadoes } from "../tornado.mjs";
import { drawBear, drawBossEffects, drawBossTelegraph, BOSS_ATTACK_LABELS } from "../boss.mjs";
import { drawEffects, drawSlash } from "../magic.mjs";
export function drawActorsPass(app, frame) {
  frame.sprite = function sprite(index, x, y, width, height, flip = false) {
    if (!app.gameState.faunaImage) return;
    const f = app.gameState.faunaFrames[index];
    app.g.save();
    app.g.translate(Math.round(x), Math.round(y));
    if (flip) app.g.scale(-1, 1);
    app.g.drawImage(
      app.gameState.faunaImage,
      f.x,
      f.y,
      f.w,
      f.h,
      -width / 2,
      -height / 2,
      width,
      height,
    );
    app.g.restore();
  };
  for (const t of app.gameState.fauna.trees) {
    if (
      Math.abs(t.x - app.gameState.player.x) > app.canvas.width ||
      Math.abs(t.y - app.gameState.player.y) > app.canvas.height
    )
      continue;
    if (!t.hp) {
      app.rect(t.x - 15, t.y + 20, 30, 15, "#684f38");
      continue;
    }
    frame.sprite(t.state === "strike" ? 3 : 2, t.x, t.y, 64, 70);
    if (t.casting > 0) app.text("旋風蓄力", t.x - 30, t.y - 50, "#a4ed9c", 12);
    if (t.state === "ready") app.text("!", t.x - 4, t.y - 43, "#ffca7b", 22);
    if (t.state === "strike") {
      app.g.strokeStyle = "#d4ac76";
      app.g.strokeRect(t.x - 70, t.y - 25, 140, 50);
    }
  }
  for (const b of app.gameState.fauna.birds) {
    if (
      !b.hp ||
      Math.abs(b.x - app.gameState.player.x) > app.canvas.width ||
      Math.abs(b.y - app.gameState.player.y) > app.canvas.height
    )
      continue;
    frame.sprite(
      app.gameState.reduced ? 0 : Math.floor(app.gameState.time * 6) % 2,
      b.x,
      b.y,
      48,
      36,
      b.dx < 0,
    );
    if (b.mode === "ready") app.text("!", b.x - 3, b.y - 27, "#83ecec", 18);
    if (b.mode === "mirror") {
      app.g.strokeStyle = "#adeafa";
      app.g.strokeRect(b.x - 28, b.y - 26, 56, 52);
      frame.sprite(1, b.x + 16, b.y, 24, 18, true);
    }
  }
  drawTornadoes(app.g, app.gameState.fauna.tornadoes, app.gameState.time, app.gameState.reduced);
  for (const z of app.gameState.fauna.zones)
    if (
      z.seen &&
      z.elapsed > 1 &&
      app.gameState.fauna.birds.some((b) => b.hp && b.zone === z.id) &&
      Math.hypot(z.x - app.gameState.player.x, z.y - app.gameState.player.y) < 320
    )
      app.text("影子正在聚集…", z.x - 40, z.y - 40, "#88d5df", 12);
  if (app.gameState.time < app.gameState.fauna.mirrorUntil) {
    app.g.strokeStyle = "#bceefa";
    app.g.lineWidth = 3;
    app.g.strokeRect(app.gameState.player.x - 24, app.gameState.player.y - 38, 48, 76);
  }
  for (const r of app.gameState.rats) {
    if (!r.hp) continue;
    const f =
      r.state === "ready"
        ? 2
        : r.state === "dash" || r.state === "jump"
          ? 3
          : Math.floor(app.gameState.time * 7) % 2;
    app.g.save();
    app.g.translate(Math.round(r.x), Math.round(r.y));
    if (r.surface === "right") app.g.rotate(-Math.PI / 2);
    else if (r.surface === "left") app.g.rotate(Math.PI / 2);
    else if (r.surface === "ceiling") app.g.rotate(Math.PI);
    if (r.face < 0) app.g.scale(-1, 1);
    const sprite = app.gameState.enemyFrames[(isSlime(r) ? 4 : 0) + f];
    const width = r.big ? 52 : isSlime(r) ? 32 : 56,
      height = (width * sprite.h) / sprite.w;
    if (r.big) app.g.filter = "hue-rotate(175deg) saturate(0.85)";
    app.g.drawImage(
      app.gameState.ratImage,
      sprite.x,
      sprite.y,
      sprite.w,
      sprite.h,
      -width / 2,
      (r.bodyRadius || 14) - height,
      width,
      height,
    );
    app.g.filter = "none";
    if (app.gameState.time < r.stun) {
      app.g.strokeStyle = "#c7ffa1";
      app.g.strokeRect(-width / 2 - 3, 10 - height, width + 6, height + 8);
    }
    app.g.restore();
    if (r.state === "ready") app.text("!", r.x - 4, r.y - 32, "#f3bc79", 23);
  }
  if (app.gameState.drawHero && !app.gameState.reduced)
    for (const t of app.gameState.dashTrail) {
      app.g.globalAlpha = Math.max(0, (t.until - app.gameState.time) / 0.18) * 0.25;
      app.gameState.drawHero(
        app.g,
        1,
        0,
        t.face < 0,
        Math.round(t.x - (t.face < 0 ? 28 : 36)),
        Math.round(t.y - 30),
      );
    }
  app.g.globalAlpha = 1;
  if (app.gameState.player.dashRemaining > 0) {
    for (const dy of [-13, 0, 13]) {
      const len = app.gameState.reduced ? 12 : 30;
      app.rect(
        app.gameState.player.x -
          app.gameState.player.dashFace * 30 -
          (app.gameState.player.dashFace > 0 ? len : 0),
        app.gameState.player.y + dy,
        len,
        2,
        "#b4ecf1",
      );
    }
  }
  if (app.gameState.boss.active) {
    const a = app.world.arena;
    app.rect(a.exit.x - 18, a.floor - 80, 36, 80, app.gameState.boss.hp ? "#673847" : "#bce1a1");
    app.text(app.gameState.boss.hp ? "擊敗紅熊開門" : "出口", a.exit.x - 35, a.floor - 90);
    drawBossEffects(app.g, app.gameState.boss, app.gameState.time, app.gameState.reduced);
    for (const m of app.gameState.boss.mirrors)
      app.text(m.landed ? "拾取破解鏡" : "鏡子掉落", m.x - 32, m.y - 30, "#d7fff5", 12);
    if (app.gameState.boss.hp) {
      app.paintBoss(app.g, app.gameState.boss, app.gameState.time, app.gameState.reduced, (ctx) => {
        if (app.gameState.boss.cursed && app.gameState.drawHero)
          app.gameState.drawHero(
            ctx,
            1,
            wingFrame(app.gameState.time, app.gameState.reduced),
            app.gameState.boss.face < 0,
            app.gameState.boss.x - 32,
            app.gameState.boss.y - 30,
          );
        else drawBear(ctx, app.gameState.boss, app.gameState.time, app.gameState.reduced, false);
      });
      drawBossTelegraph(app.g, app.gameState.boss);
      app.text(
        app.gameState.boss.state === "ready"
          ? BOSS_ATTACK_LABELS[app.gameState.boss.attack]
          : "紅熊",
        app.gameState.boss.x - 55,
        app.gameState.boss.y - 63,
        "#ffbfae",
        14,
      );
    }
  }
  if (app.gameState.drawHero) {
    const moving =
      app.gameState.player.dashRemaining > 0 ||
      app.gameState.keys.has("left") ||
      app.gameState.keys.has("right") ||
      app.gameState.keys.has("up") ||
      app.gameState.keys.has("down");
    const attacking = app.gameState.time < app.gameState.attackUntil;
    const row = attacking ? 3 : moving ? 1 : 0;
    const f = attacking
      ? Math.min(5, Math.floor((0.3 - (app.gameState.attackUntil - app.gameState.time)) / 0.05))
      : app.gameState.player.gliding
        ? 0
        : app.gameState.reduced
          ? 0
          : Math.floor(app.gameState.time * 8) % 6;
    app.g.globalAlpha =
      app.gameState.time < app.gameState.player.inv
        ? app.gameState.reduced
          ? 0.65
          : Math.floor(app.gameState.time * 10) % 2 === 0
            ? 0.45
            : 1
        : 1;
    if (app.gameState.boss.cursed) {
      const sf =
        app.gameState.enemyFrames[
          4 +
            (app.gameState.player.slimeAttack > 0
              ? 3
              : app.gameState.player.grounded
                ? Math.floor(app.gameState.time * 7) % 2
                : 2)
        ];
      app.g.save();
      app.g.translate(Math.round(app.gameState.player.x), Math.round(app.gameState.player.y));
      if (app.gameState.player.surface === "right") app.g.rotate(-Math.PI / 2);
      else if (app.gameState.player.surface === "left") app.g.rotate(Math.PI / 2);
      else if (app.gameState.player.surface === "ceiling") app.g.rotate(Math.PI);
      if (app.gameState.player.face < 0) app.g.scale(-1, 1);
      app.g.drawImage(app.gameState.ratImage, sf.x, sf.y, sf.w, sf.h, -18, -17, 36, 28);
      app.g.restore();
      app.g.strokeStyle = "#e2ffe9";
      app.g.lineWidth = 2;
      app.g.beginPath();
      app.g.ellipse(app.gameState.player.x, app.gameState.player.y, 23, 20, 0, 0, Math.PI * 2);
      app.g.stroke();
      app.text(
        "你 · 史萊姆",
        app.gameState.player.x - 30,
        app.gameState.player.y - 30,
        "#d7fff5",
        12,
      );
    } else
      app.gameState.drawHero(
        app.g,
        row,
        f,
        app.gameState.player.face < 0,
        Math.round(app.gameState.player.x - (app.gameState.player.face < 0 ? 28 : 36)),
        Math.round(app.gameState.player.y - 30),
      );
    app.g.globalAlpha = 1;
    if (attacking && app.gameState.slash)
      drawSlash(
        app.g,
        app.gameState.slash,
        1 - (app.gameState.attackUntil - app.gameState.time) / 0.3,
        app.gameState.reduced,
        app.gameState.slashStyle,
      );
  }
  if (app.gameState.chargeStart !== null) {
    const q = Math.min(1, (app.gameState.time - app.gameState.chargeStart) / B.attack.chargeTime),
      cx = app.gameState.player.x + app.gameState.player.face * 24;
    app.g.save();
    app.g.strokeStyle = q >= 1 ? "#ffffff" : "#8edcff";
    app.g.lineWidth = 3;
    app.g.beginPath();
    app.g.arc(cx, app.gameState.player.y, 7 + q * 12, 0, Math.PI * 2);
    app.g.stroke();
    app.g.fillStyle = "#b8efff";
    app.g.beginPath();
    app.g.arc(cx, app.gameState.player.y, 3 + q * 7, 0, Math.PI * 2);
    app.g.fill();
    app.g.restore();
  }
  drawEffects(app.g, app.gameState.magic, app.gameState.time, app.gameState.reduced);
  app.healingFeedback.draw(app.g, app.gameState.player, app.gameState.time, app.gameState.reduced);
  app.g.restore();
}
