import { BALANCE as B } from "../config/balance.mjs";
import { learn } from "../guidance.mjs";
import { startSlimeAttack } from "../player-form.mjs";
import { syncWinds } from "../exploration.mjs";
import { castLight } from "../magic.mjs";
import { mirrorFauna } from "../fauna.mjs";
import { nearbyWall, breakWall, BREACH_COST, ordinaryWall } from "../breach.mjs";
import { startDash } from "../physics.mjs";
export function installPlayerActions(app) {
  function wallTarget(touch = false) {
    if (app.gameState.player.slimeForm) return null;
    const direction = app.gameState.keys.has("down")
      ? "down"
      : app.gameState.keys.has(touch ? "lookUp" : "up")
        ? "up"
        : null;
    return (
      nearbyWall(app.gameState.player, app.gameState.crackedWalls, direction) ||
      ordinaryWall(app.gameState.player, app.world, direction)
    );
  }
  function performBreach(wall) {
    if (!breakWall(app.gameState.player, wall, app.map, app.T, app.world.platforms)) return false;
    if (wall.ordinary) app.gameState.crackedWalls.push(wall);
    wall.discovered = true;
    wall.changedAt = app.gameState.time;
    syncWinds(app.gameState.exploration, app.gameState.crackedWalls);
    app.events.emit("wallBroken");
    app.updateHud();
    learn(app.gameState.exploration, "breach", "gaze", "energy-ready");
    return true;
  }
  function breach() {
    if (app.gameState.mode !== "playing" || app.gameState.player.slimeForm) return;
    app.canvas.focus();
    const wall = app.wallTarget();
    if (!wall) {
      app.say("靠近裂面：左右面向它，上下按住 ↑／↓ 再按 E 或破牆。", 3);
      return;
    }
    if (!app.performBreach(wall))
      app.say(
        `還需要 ${BREACH_COST - app.gameState.player.energy} 橘色能量（${app.gameState.player.energy}/${BREACH_COST}）。`,
        3,
      );
  }
  function mirror() {
    if (app.gameState.mode !== "playing") return;
    if (app.gameState.boss.cursed) {
      app.say("史萊姆無法施法；等紅熊重踏後，拾取掉落的鏡子。", 4);
      return;
    }
    app.canvas.focus();
    const count = mirrorFauna(
      app.gameState.fauna,
      app.gameState.player,
      app.gameState.time,
      app.clearPath,
    );
    if (count > 0) {
      learn(app.gameState.exploration, "bird");
      app.events.emit("mirrorUsed");
    }
    if (count >= 0)
      app.say(
        count
          ? `鏡面映出 ${count} 隻青影鳥，牠們正在攻擊自己的倒影！`
          : "鏡面展開，附近沒有青影鳥。",
        3,
      );
  }
  function dash() {
    if (app.gameState.mode !== "playing" || app.gameState.player.slimeForm) return;
    app.canvas.focus();
    const direction =
      Number(app.gameState.keys.has("right")) - Number(app.gameState.keys.has("left"));
    if (direction) app.gameState.player.face = direction;
    if (startDash(app.gameState.player)) {
      learn(app.gameState.exploration, "dash");
      app.gameState.dashHits.clear();
      app.events.emit("dashStarted");
    }
  }
  function lightMagic() {
    if (app.gameState.mode !== "playing") return;
    if (app.gameState.player.slimeForm) {
      app.say("史萊姆形態：跳躍與跳撞，拾取鏡子後恢復魔法。", 3);
      return;
    }
    app.canvas.focus();
    app.say("目前魔法：光彈。取得其他魔法後，按 F 切換。", 3);
  }
  function fireLight(charged = false) {
    if (app.gameState.player.slimeForm) return false;
    const fired = castLight(app.gameState.magic, app.gameState.player, app.gameState.time, charged);
    if (fired) {
      if (charged) learn(app.gameState.exploration, "charge");
      app.events.emit("lightFired", { charged });
    }
    return fired;
  }
  function slimeAttack() {
    if (startSlimeAttack(app.gameState.player)) {
      app.gameState.slimeHits.clear();
      app.gameState.nextAttack = app.gameState.time + B.player.slimeAttackCooldown;
    }
  }
  Object.assign(app, {
    wallTarget,
    performBreach,
    breach,
    mirror,
    dash,
    lightMagic,
    fireLight,
    slimeAttack,
  });
}
