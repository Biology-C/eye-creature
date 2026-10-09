import { resetState } from "../core/state.mjs";
import { BALANCE as B } from "../config/balance.mjs";
import { createExploration } from "../exploration.mjs";
import { SAVE_KEY } from "../save.mjs";
import { MAX_HP } from "../health.mjs";
import { createPureSlimes, createBigSlimes } from "../slime.mjs";
import { createBoss } from "../boss.mjs";
import { createMagic } from "../magic.mjs";
import { createFauna } from "../fauna.mjs";
import { createCrackedWalls } from "../breach.mjs";
import { createTorches } from "../torches.mjs";
import { createRewards } from "../rewards.mjs";
import { MAX_WING } from "../physics.mjs";
export function installAdventureFlow(app) {
  function reset() {
    app.guidance.reset();
    app.gameState.noticeUntil = 0;
    app.messageCard.clear();
    app.gameState.importantMessages = [];
    app.events.emit("musicReset");
    app.gameState.clearTouch();
    app.gameState.exploration = createExploration(app.world);
    app.gameState.cameraSnap = true;
    app.gameState.nearLamp = null;
    app.cancelAttackInput();
    app.gameState.dashHits.clear();
    app.gameState.boss = createBoss(app.world);
    app.gameState.struck.clear();
    app.gameState.hitStop = 0;
    app.gameState.hurtUntil = 0;
    app.gameState.magic = createMagic();
    app.gameState.dashTrail = [];
    app.world.platforms.splice(
      0,
      app.world.platforms.length,
      ...app.originalPlatforms.map((p) => ({ ...p })),
    );
    app.map.forEach((row, y) => row.splice(0, row.length, ...app.originalMap[y]));
    app.gameState.fauna = createFauna(app.world);
    app.gameState.crackedWalls = createCrackedWalls(app.world);
    app.gameState.player = {
      ...app.world.start,
      hp: MAX_HP,
      abilities: {},
      healCharge: 0,
      dashRemaining: 0,
      dashCooldown: 0,
      energy: 0,
      face: 1,
      inv: 0,
      vy: 0,
      wing: MAX_WING,
      grounded: false,
    };
    app.gameState.rats = [
      ...app.world.rats,
      ...createPureSlimes(app.world),
      ...createBigSlimes(app.world),
    ].map((r, i) => ({
      ...r,
      spawn: r.x,
      y0: r.y,
      face: i % 2 ? -1 : 1,
      hp: r.big ? B.enemy.bigHp : r.pure ? B.enemy.slimeHp : B.enemy.ratHp,
      surface: null,
      state: "walk",
      timer: 0,
      stun: 0,
      vy: 0,
    }));
    app.gameState.lights = app.world.lights.map((l) => ({ ...l, got: false }));
    app.gameState.rewards = createRewards(app.world);
    app.gameState.torches = createTorches(app.world);
    app.gameState.pickupFlash = null;
    app.gameState.checkpoint = { ...app.world.start };
    app.gameState.activated = new Set();
    resetState(app.gameState, {
      kills: 0,
      deaths: 0,
      time: 0,
      nextAttack: 0,
      attackUntil: 0,
      slash: null,
    });
    app.gameState.seen.clear();
    app.gameState.keys.clear();
    app.gameState.slimeHits.clear();
    app.events.emit("healthFeedbackReset");
    app.updateHud();
    app.updateFormControls();
  }
  function newAdventure() {
    if (
      !app.legacy &&
      app.gameState.saveInfo.status !== "empty" &&
      !confirm("開始新冒險會覆蓋休息燈存檔。確定嗎？")
    )
      return;
    try {
      if (!app.legacy && !app.debugEnabled) localStorage.removeItem(SAVE_KEY);
    } catch {
      app.say("無法清除舊存檔；本次遊戲仍可繼續。");
    }
    app.reset();
    app.gameState.saveInfo = { status: "empty" };
    app.$("#continue").hidden = true;
    app.resume();
  }
  Object.assign(app, { reset, newAdventure });
}
