import { BALANCE as B } from "../config/balance.mjs";
import { gustAt, updateGustWarnings } from "../region-features.mjs";
import { updateSlimePlayer } from "../player-form.mjs";
import { BREACH_HOLD, validBreachHold } from "../handheld.mjs";
import { syncWinds, windAt } from "../exploration.mjs";
import { BREACH_COST } from "../breach.mjs";
export function updatePlayer(app, frame) {
  app.gameState.time += frame.dt;
  app.syncForm();
  frame.dashStart = { x: app.gameState.player.x, y: app.gameState.player.y };
  frame.wasDashing = app.gameState.player.dashRemaining > 0;
  frame.dx = Number(app.gameState.keys.has("right")) - Number(app.gameState.keys.has("left"));
  if (frame.dx) app.gameState.player.face = frame.dx;
  if (app.gameState.player.dashRemaining > 0)
    app.gameState.dashTrail.push({
      x: app.gameState.player.x,
      y: app.gameState.player.y,
      face: app.gameState.player.dashFace,
      until: app.gameState.time + 0.18,
    });
  syncWinds(app.gameState.exploration, app.gameState.crackedWalls);
  if (app.gameState.player.slimeForm)
    updateSlimePlayer(app.gameState.player, app.gameState.keys, frame.dt, app.physics);
  else
    app.physics.player(
      app.gameState.player,
      app.gameState.keys,
      frame.dt,
      windAt(app.gameState.exploration, app.gameState.player),
      (p, elapsed) => gustAt(app.world, p, app.gameState.time - frame.dt + elapsed),
    );
  updateGustWarnings(
    app.world,
    app.gameState.time,
    app.gameState.time - frame.dt,
    app.gameState.camera,
    app.canvas,
    (kind) => app.events.emit("gustWarning", kind),
  );
  app.applySlimeHit();
  if (app.gameState.breachHold) {
    const target = app.wallTarget(true);
    if (
      !validBreachHold(
        app.gameState.breachHold,
        target,
        app.nearEnemy(),
        app.gameState.player.energy,
        BREACH_COST,
      )
    ) {
      app.gameState.breachHold = null;
      app.gameState.breachConsumed = true;
    } else if (app.gameState.time - app.gameState.breachHold.start >= BREACH_HOLD) {
      app.performBreach(target);
      app.gameState.breachHold = null;
      app.gameState.breachConsumed = true;
    }
  }
  app.gameState.dashTrail = app.gameState.dashTrail
    .filter((t) => t.until > app.gameState.time)
    .slice(-10);
  if (frame.wasDashing && app.gameState.player.abilities.dash) {
    for (const e of [
      ...app.gameState.rats,
      ...app.gameState.fauna.birds,
      ...(app.gameState.boss.active ? [app.gameState.boss] : []),
    ]) {
      const rx = e.radiusX || 20,
        ry = e.radiusY || 18;
      if (
        !e.hp ||
        app.gameState.dashHits.has(e) ||
        e.x < Math.min(frame.dashStart.x, app.gameState.player.x) - rx - 11 ||
        e.x > Math.max(frame.dashStart.x, app.gameState.player.x) + rx + 11 ||
        Math.abs(e.y - app.gameState.player.y) > ry + 11 ||
        !app.clearPath(app.gameState.player.x, app.gameState.player.y, e.x, e.y)
      )
        continue;
      app.gameState.dashHits.add(e);
      app.impact(e);
      app.combat.damageEnemy(e, B.attack.dashDamage, {
        stun: B.attack.enemyStun,
        rest: app.gameState.rats.includes(e),
      });
    }
  }
  if (app.gameState.comboQueue && app.gameState.time >= app.gameState.nextAttack) {
    app.gameState.comboQueue--;
    app.nextCombo();
  }
  if (
    app.gameState.slash &&
    app.gameState.slash.stage === 3 &&
    app.gameState.time < app.gameState.attackUntil - B.attack.activeEnd
  ) {
    const speed = app.gameState.keys.has(app.gameState.slash.face > 0 ? "right" : "left")
      ? B.attack.crossFullSpeed
      : B.attack.crossHalfSpeed;
    const steps = Math.max(1, Math.ceil((speed * frame.dt) / 6));
    for (let i = 0; i < steps; i++) {
      app.move(app.gameState.player, (app.gameState.slash.face * speed * frame.dt) / steps, 0);
      app.gameState.slash.x = app.gameState.player.x;
      app.gameState.slash.y = app.gameState.player.y;
      app.applyMelee();
    }
  }
  if (app.gameState.slash && app.gameState.time < app.gameState.attackUntil - B.attack.activeEnd)
    app.applyMelee();
}
