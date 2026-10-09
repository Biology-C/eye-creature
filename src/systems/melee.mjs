import { BALANCE as B } from "../config/balance.mjs";
import { learn } from "../guidance.mjs";
import { hitObstacle, syncStumps } from "../exploration.mjs";
import { inMelee } from "../hit-geometry.mjs";
import { meleeFauna } from "../fauna.mjs";
export function installMelee(app) {
  function impact(e, damage = B.enemy.contactDamage) {
    app.gameState.magic.effects.push({
      x: e.x,
      y: e.y,
      kind: "melee",
      damage,
      until: app.gameState.time + 0.24,
    });
    app.gameState.hitStop = Math.max(app.gameState.hitStop, B.attack.hitStop);
  }
  function enemyDamageSound(e, before) {
    if (!(before > 0 && e.hp < before)) return;
    app.events.emit(e.hp <= 0 ? "enemyDefeated" : "enemyHit", {
      enemy: e,
      before,
      boss: e === app.gameState.boss,
      crystalRat: app.gameState.rats.includes(e) && !e.pure && !e.big,
    });
  }
  function applyMelee() {
    const targets = [
      ...app.gameState.rats,
      ...app.gameState.exploration.obstacles,
      ...app.gameState.fauna.trees,
      ...app.gameState.fauna.birds,
      ...(app.gameState.boss.active ? [app.gameState.boss] : []),
    ].filter((e) => !app.gameState.struck.has(e) && inMelee(app.gameState.slash, e, app.clearPath));
    const hpBefore = new Map(
      targets.filter((e) => !app.gameState.exploration.obstacles.includes(e)).map((e) => [e, e.hp]),
    );
    for (const e of targets) {
      app.gameState.struck.add(e);
      if (app.gameState.exploration.obstacles.includes(e)) {
        if (hitObstacle(e, app.gameState.slash.stage)) {
          learn(app.gameState.exploration, "root");
          e.changedAt = app.gameState.time;
          app.events.emit("obstacleBroken");
        }
        continue;
      }
      app.impact(e);
      app.gameState.hitStop = Math.max(
        app.gameState.hitStop,
        B.attack.meleeHitStops[(app.gameState.slash.stage || 1) - 1],
      );
      if (e === app.gameState.boss) {
        app.combat.damageEnemy(e, B.attack.meleeDamage[(app.gameState.slash.stage || 1) - 1], {
          stun: B.attack.bossMeleeStun,
          notify: false,
          bossMessage: true,
        });
      }
    }
    const hit = meleeFauna(
      app.gameState.fauna,
      app.gameState.slash,
      app.gameState.time,
      app.clearPath,
      targets,
    );
    app.gameState.kills += hit.killed;
    syncStumps(app.world.platforms, app.gameState.fauna.trees);
    for (const r of app.gameState.rats.filter((e) => targets.includes(e))) {
      app.combat.damageEnemy(r, B.attack.meleeDamage[(app.gameState.slash.stage || 1) - 1], {
        stun: B.attack.enemyStun,
        rest: true,
        notify: false,
      });
    }
    for (const [e, hp] of hpBefore) app.enemyDamageSound(e, hp);
  }
  function attack(stage = 1) {
    if (app.gameState.player.slimeForm) {
      app.slimeAttack();
      return;
    }
    learn(app.gameState.exploration, "rat");
    app.gameState.nextAttack = app.gameState.time + B.attack.meleeCooldown;
    app.gameState.attackUntil = app.gameState.time + B.attack.meleeDuration;
    app.gameState.slash = {
      x: app.gameState.player.x,
      y: app.gameState.player.y,
      face: app.gameState.player.face,
      stage,
    };
    app.gameState.struck.clear();
    app.applyMelee();
    if (!app.gameState.player.slimeForm) app.events.emit("meleeStarted", { stage });
  }
  function nearEnemy() {
    return [
      ...app.gameState.exploration.obstacles,
      ...app.gameState.rats,
      ...app.gameState.fauna.trees,
      ...app.gameState.fauna.birds,
      ...(app.gameState.boss.active ? [app.gameState.boss] : []),
    ].some((e) => inMelee(app.gameState.player, e, app.clearPath));
  }
  function nextCombo() {
    app.gameState.comboStage =
      app.gameState.time <= app.gameState.comboUntil ? (app.gameState.comboStage % 3) + 1 : 1;
    app.gameState.comboUntil = app.gameState.time + B.attack.comboWindow;
    app.attack(app.gameState.comboStage);
  }
  function autoAttack() {
    if (app.gameState.player.slimeForm) {
      app.slimeAttack();
      return;
    }
    if (app.nearEnemy()) app.attack();
    else if (app.fireLight(false))
      app.gameState.nextAttack = app.gameState.time + B.attack.lightCooldown;
  }
  function applySlimeHit() {
    if (!app.gameState.player.slimeForm || app.gameState.player.slimeAttack <= 0) return;
    for (const e of [
      ...app.gameState.rats,
      ...(app.gameState.boss.active ? [app.gameState.boss] : []),
    ]) {
      if (
        !e.hp ||
        app.gameState.slimeHits.has(e) ||
        Math.abs(e.x - app.gameState.player.x) > (e.radiusX || 14) + 20 ||
        Math.abs(e.y - app.gameState.player.y) > (e.radiusY || 14) + 16 ||
        !app.clearPath(app.gameState.player.x, app.gameState.player.y, e.x, e.y)
      )
        continue;
      app.gameState.slimeHits.add(e);
      app.impact(e);
      app.combat.damageEnemy(e, B.attack.slimeDamage, {
        stun: B.attack.enemyStun,
        rest: e !== app.gameState.boss,
      });
    }
  }
  function hurt(source = "老鼠", damage = B.enemy.contactDamage) {
    return app.combat.damagePlayer(source, damage);
  }
  Object.assign(app, {
    impact,
    enemyDamageSound,
    applyMelee,
    attack,
    nearEnemy,
    nextCombo,
    autoAttack,
    applySlimeHit,
    hurt,
  });
}
