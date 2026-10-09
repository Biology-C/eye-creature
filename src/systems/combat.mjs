import { BALANCE as B } from "../config/balance.mjs";
import { MAX_HP } from "../health.mjs";
import { MAX_WING } from "../physics.mjs";
import { createMagic } from "../magic.mjs";
import { splitSlime } from "../slime.mjs";
// Health writes outside damage (healing, encounter reset, restored snapshots, debug).
export function setHealth(actor, value) {
  actor.hp = value;
  return value;
}
export function restoreActor(actor, saved, overrides = {}) {
  Object.assign(actor, saved, overrides);
}
// All enemy HP reductions pass here. The existing HP threshold remains the rat form source.
export function damageEnemy(enemy, amount, options = {}) {
  const before = enemy.hp;
  setHealth(enemy, Math.max(0, before - amount));
  const result = {
    before,
    defeated: enemy.hp === 0,
    transformed: !enemy.pure && !enemy.big && before > 1 && enemy.hp > 0 && enemy.hp <= 1,
  };
  options.onDamage?.(enemy, before);
  if (options.stun !== undefined) enemy.stun = options.time + options.stun;
  if (options.rest) {
    enemy.state = "rest";
    enemy.timer = B.attack.enemyHitRest;
  }
  if (result.transformed) options.onTransform?.(enemy);
  if (result.defeated) options.onDefeat?.(enemy);
  return result;
}
export function createCombat({
  gameState,
  events,
  updateHud,
  cancelAttackInput,
  syncForm,
  say,
  enemyDamageSound,
  resetBoss,
  resetFaunaAfterDeath,
}) {
  const context = {
    gameState,
    events,
    updateHud,
    cancelAttackInput,
    syncForm,
    say,
    resetBoss,
    resetFaunaAfterDeath,
  };
  return {
    damagePlayer: (source, amount) => damagePlayer(context, source, amount),
    damageEnemy(enemy, amount, { notify = true, bossMessage = false, learnRat, ...options } = {}) {
      return damageEnemy(enemy, amount, {
        time: gameState.time,
        ...options,
        onDamage: notify ? enemyDamageSound : undefined,
        onTransform: learnRat,
        onDefeat: () => {
          gameState.kills++;
          if (bossMessage) {
            gameState.boss.cursed = false;
            say("紅熊倒下！走向右側出口。", 5);
          }
        },
      });
    },
    flushEnemyDeaths(free) {
      for (const r of [...gameState.rats]) {
        const children = splitSlime(r, free);
        for (const child of children) {
          if (r.bossMinion) child.bossMinion = true;
          child.stun = gameState.time + B.attack.enemyStun;
          gameState.struck.add(child);
          gameState.dashHits.add(child);
          for (const shot of gameState.magic.shots) shot.hitTargets?.add(child);
        }
        gameState.rats.push(...children);
      }
    },
  };
}
export function damagePlayer(
  {
    gameState,
    events,
    updateHud,
    cancelAttackInput,
    syncForm,
    say,
    resetBoss,
    resetFaunaAfterDeath,
  },
  source = "老鼠",
  damage = B.enemy.contactDamage,
) {
  void source; // Keep the existing source contract; the quiet HUD intentionally ignores it.

  if (gameState.debug?.invincible) return;
  if (gameState.time < gameState.player.inv) return;
  const beforeHp = gameState.player.hp;
  if (gameState.breachHold) {
    gameState.breachHold = null;
    gameState.breachConsumed = true;
  }
  gameState.hurtUntil = gameState.time + 0.35;
  gameState.hitStop = Math.max(gameState.hitStop, 0.07);
  gameState.magic.effects.push({
    x: gameState.player.x,
    y: gameState.player.y,
    kind: "hurt",
    damage,
    until: gameState.time + 0.24,
  });
  setHealth(gameState.player, Math.max(0, gameState.player.hp - damage));
  if (gameState.player.hp < beforeHp)
    events.emit("playerHurt", { dead: gameState.player.hp === 0 });
  gameState.player.inv = gameState.time + B.player.invulnerability;
  updateHud();
  if (gameState.player.hp <= 0) {
    gameState.clearTouch();
    gameState.deaths++;
    gameState.cameraSnap = true;
    gameState.nearLamp = null;
    cancelAttackInput();
    resetBoss(gameState.boss);
    syncForm();
    gameState.rats = gameState.rats.filter((r) => !r.bossMinion);
    gameState.magic = createMagic();
    gameState.dashTrail = [];
    resetFaunaAfterDeath(gameState.fauna);
    gameState.player.x = gameState.checkpoint.x;
    gameState.player.y = gameState.checkpoint.y;
    setHealth(gameState.player, MAX_HP);
    gameState.player.vy = 0;
    gameState.player.dashRemaining = 0;
    gameState.player.dashCooldown = 0;
    gameState.player.wing = MAX_WING;
    gameState.player.grounded = false;
    gameState.player.inv = gameState.time + B.player.respawnInvulnerability;
    gameState.attackUntil = 0;
    gameState.slash = null;
    for (const r of gameState.rats)
      if (r.hp) {
        r.x = r.spawn;
        r.y = r.y0;
        r.state = "walk";
        r.surface = null;
        r.crawlDown = false;
        r.timer = 0;
        r.stun = 0;
        r.vy = 0;
      }
    say("回到休息燈旁，生命補滿。已找到的光點保留。", 5);
    updateHud();
  }
}
