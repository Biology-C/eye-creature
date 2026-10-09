import { BALANCE as B } from "../config/balance.mjs";
import { learn } from "../guidance.mjs";
import { updateMagic } from "../magic.mjs";
import { updateRat } from "../rats.mjs";
import { mirrorFauna, updateFauna } from "../fauna.mjs";
import { touchesSpikes, trapSupported } from "../traps.mjs";
export function updateEnemies(app, frame) {
  updateMagic(app.gameState.magic, frame.dt, app.gameState.time, {
    solid: app.solid,
    targets: [
      ...app.gameState.exploration.obstacles
        .filter((o) => !o.broken)
        .map((o) => ({ ...o, tree: true })),
      ...app.gameState.rats,
      ...app.gameState.fauna.birds,
      ...(app.gameState.boss.active ? [app.gameState.boss] : []),
      ...app.gameState.fauna.trees.map((t) => ({ ...t, radiusX: 27, radiusY: 35, tree: true })),
    ],
    hit: (e, damage = B.enemy.contactDamage) => {
      if (e.tree) return; // Tree bark blocks light; only melee can fell trees.
      app.impact(e, damage);
      app.combat.damageEnemy(e, damage, {
        stun: B.attack.enemyStun,
        rest: app.gameState.rats.includes(e),
      });
      if (app.gameState.rats.includes(e) && e.hp < 2 && !e.pure && !e.big)
        learn(app.gameState.exploration, "rat");
    },
  });
  app.events.emit("magicHudChanged");
  app.combat.flushEnemyDeaths(app.free);
  app.finishBoss();
  for (const r of app.gameState.rats) {
    if (!r.hp) continue;
    updateRat(r, app.gameState.player, app.physics, frame.dt, app.gameState.time, app.clearPath);
    if (
      app.gameState.time >= r.stun &&
      Math.abs(app.gameState.player.x - r.x) < (r.bodyRadius || 14) + 13 &&
      Math.abs(app.gameState.player.y - r.y) < (r.bodyRadius || 14) + 10
    )
      app.hurt(r.big ? "紫色大史萊姆" : "老鼠", r.big ? B.enemy.bigDamage : B.enemy.contactDamage);
  }
  app.events.emit("dashHudChanged");
  if (
    app.handheld &&
    !app.gameState.player.slimeForm &&
    app.gameState.time >= app.gameState.fauna.mirrorReady
  ) {
    const m = app.sceneMirrors.find(
      (m) =>
        Math.hypot(m.x - app.gameState.player.x, m.y - app.gameState.player.y) < 40 &&
        app.clearPath(app.gameState.player.x, app.gameState.player.y, m.x, m.y),
    );
    if (
      m &&
      app.gameState.fauna.birds.some(
        (b) =>
          b.hp &&
          b.mode !== "mirror" &&
          Math.hypot(b.x - m.x, b.y - m.y) <= 180 &&
          app.clearPath(m.x, m.y, b.x, b.y),
      )
    ) {
      const count = mirrorFauna(app.gameState.fauna, m, app.gameState.time, app.clearPath);
      if (count > 0) {
        app.events.emit("mirrorUsed");
        learn(app.gameState.exploration, "bird");
      }
    }
  }
  frame.birdHealth = app.gameState.fauna.birds.map((e) => [e, e.hp]);
  app.gameState.kills += updateFauna(
    app.gameState.fauna,
    app.gameState.player,
    app.gameState.time,
    frame.dt,
    {
      clear: app.clearPath,
      free: app.free,
      hurt: app.hurt,
      regionAt: app.world.regionAt,
      visible: (b) => {
        const cx = app.gameState.camera.x,
          cy = app.gameState.camera.y;
        return (
          b.x >= cx && b.x <= cx + app.canvas.width && b.y >= cy && b.y <= cy + app.canvas.height
        );
      },
    },
  );
  for (const [e, hp] of frame.birdHealth) app.enemyDamageSound(e, hp);
  app.updateBossEncounter(frame.dt);
  app.events.emit("mirrorHudChanged");
  for (const trap of app.world.traps)
    if (
      trapSupported(trap, app.solid) &&
      touchesSpikes(app.gameState.player, trap, app.gameState.time)
    ) {
      app.hurt("針刺");
      break;
    }
}
