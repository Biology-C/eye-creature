import { BALANCE as B } from "../config/balance.mjs";
import { attackIntent } from "../handheld.mjs";
import { BREACH_COST } from "../breach.mjs";
export function installInput(app) {
  function cancelAttackInput(preserveHit = false) {
    app.events.emit("chargeStopped");
    if (!preserveHit) app.events.emit("combatFeedbackCleared");
    app.gameState.breachHold = null;
    app.gameState.breachConsumed = false;
    app.gameState.attackHeld = false;
    app.gameState.chargeStart = null;
    app.gameState.comboStage = 0;
    app.gameState.comboUntil = 0;
    app.gameState.comboQueue = 0;
    app.gameState.keys.delete("attack");
  }
  function pressAttack(touch = false) {
    if (app.gameState.mode !== "playing" || app.gameState.attackHeld) return;
    app.gameState.attackHeld = true;
    if (app.gameState.player.slimeForm) {
      app.slimeAttack();
      return;
    }
    if (
      touch &&
      app.handheld &&
      !app.nearEnemy() &&
      app.wallTarget(true) &&
      app.gameState.player.energy < BREACH_COST
    )
      app.say(
        `還需要 ${BREACH_COST - app.gameState.player.energy} 橘色能量（${app.gameState.player.energy}/${BREACH_COST}）。`,
        3,
      );
    if (
      touch &&
      app.handheld &&
      attackIntent({
        melee: app.nearEnemy(),
        combo: app.gameState.comboStage && app.gameState.time <= app.gameState.comboUntil,
        wall: app.wallTarget(true),
        energy: app.gameState.player.energy,
        cost: BREACH_COST,
      }) === "breach"
    ) {
      app.gameState.breachHold = { id: app.wallTarget(true).id, start: app.gameState.time };
      app.gameState.breachConsumed = false;
      app.gameState.chargeStart = null;
      app.events.emit("chargeStopped");
      return;
    }
    if (
      app.nearEnemy() ||
      (app.gameState.comboStage && app.gameState.time <= app.gameState.comboUntil)
    ) {
      if (app.gameState.time >= app.gameState.nextAttack) app.nextCombo();
      else app.gameState.comboQueue = Math.min(B.attack.comboBuffer, app.gameState.comboQueue + 1);
    }
    // Charging is an input action, not a shot: it can start during cooldown.
    // castLight still enforces the firing cooldown when the key is released.
    else app.gameState.chargeStart = app.gameState.time;
  }
  function releaseAttack() {
    app.events.emit("chargeStopped");
    if (!app.gameState.attackHeld) return;
    app.gameState.attackHeld = false;
    if (app.gameState.breachHold || app.gameState.breachConsumed) {
      const quick = app.gameState.breachHold && !app.gameState.breachConsumed;
      app.gameState.breachHold = null;
      app.gameState.breachConsumed = false;
      if (quick && app.gameState.mode === "playing" && app.fireLight(false))
        app.gameState.nextAttack = app.gameState.time + B.attack.lightCooldown;
      return;
    }
    if (app.gameState.mode === "playing" && app.gameState.chargeStart !== null) {
      if (app.fireLight(app.gameState.time - app.gameState.chargeStart >= B.attack.chargeTime))
        app.gameState.nextAttack = app.gameState.time + B.attack.lightCooldown;
    }
    app.gameState.chargeStart = null;
  }
  function touchKey(k) {
    return k === "flap" ? "up" : app.handheld && k === "up" ? "lookUp" : k;
  }
  Object.assign(app, { cancelAttackInput, pressAttack, releaseAttack, touchKey });
}

import { bindTouchControls } from "../handheld.mjs";
export function bindInput(app) {
  app.keyMap = {
    ArrowLeft: "left",
    a: "left",
    ArrowRight: "right",
    d: "right",
    ArrowUp: "up",
    w: "up",
    ArrowDown: "down",
    s: "down",
    " ": "attack",
  };
  window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "p" && !e.repeat) {
      e.preventDefault();
      app.pause();
      return;
    }
    if (e.target.tagName === "BUTTON") return;
    if (e.key.toLowerCase() === "f" && !e.repeat) {
      e.preventDefault();
      app.lightMagic();
    }
    if (e.key === "Shift" && !e.repeat) {
      e.preventDefault();
      app.dash();
    }
    if (e.key.toLowerCase() === "q" && !e.repeat) {
      e.preventDefault();
      app.mirror();
    }
    if (e.key.toLowerCase() === "e" && !e.repeat) {
      e.preventDefault();
      app.breach();
    }
    const k = app.keyMap[e.key];
    if (k) {
      e.preventDefault();
      if (app.gameState.mode === "playing") {
        if (k === "attack" && !e.repeat) app.pressAttack();
        app.gameState.keys.add(k);
      }
    }
    if (e.key.toLowerCase() === "p" && !e.repeat) app.pause();
  });
  window.addEventListener("keyup", (e) => {
    const k = app.keyMap[e.key];
    if (k) {
      app.gameState.keys.delete(k);
      if (k === "attack") app.releaseAttack();
    }
  });
  app.gameState.touchKeys = new Map();
  app.gameState.clearTouch = bindTouchControls(app.$(".touch"), {
    playing: () => app.gameState.mode === "playing",
    down: (k) => {
      const key = app.touchKey(k);
      app.gameState.touchKeys.set(k, key);
      app.gameState.keys.add(key);
      if (k === "attack") app.pressAttack(app.handheld);
    },
    up: (k) => {
      const key = app.gameState.touchKeys.get(k);
      app.gameState.touchKeys.delete(k);
      if (![...app.gameState.touchKeys.values()].includes(key)) app.gameState.keys.delete(key);
      if (k === "attack") app.releaseAttack();
    },
    cancel: (k) => {
      const key = app.gameState.touchKeys.get(k);
      app.gameState.touchKeys.delete(k);
      if (![...app.gameState.touchKeys.values()].includes(key)) app.gameState.keys.delete(key);
      if (k === "attack") app.cancelAttackInput();
    },
  });
  if (app.handheld) {
    app.$("#dash").onclick = null;
    app.$("#dash").onpointerdown = (e) => {
      e.preventDefault();
      app.dash();
    };
    app.$(".touch").oncontextmenu = (e) => e.preventDefault();
  }
  window.addEventListener("blur", () => {
    app.gameState.musicInBackground = true;
    app.gameState.keys.clear();
    if (app.gameState.mode === "playing") app.pause();
    app.syncMusic();
  });
  window.addEventListener("focus", () => {
    app.gameState.musicInBackground = false;
    app.syncMusic();
  });
  document.addEventListener("visibilitychange", () => {
    app.gameState.musicInBackground = document.hidden;
    if (document.hidden && app.gameState.mode === "playing") app.pause();
    app.syncMusic();
  });
}
