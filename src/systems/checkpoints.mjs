import { setHealth, restoreActor } from "../systems/combat.mjs";
import { BALANCE as B } from "../config/balance.mjs";
import { syncWinds, syncStumps } from "../exploration.mjs";
import { readSave, writeSave } from "../save.mjs";
import { createMagic } from "../magic.mjs";
import { createFauna, resetFaunaAfterDeath } from "../fauna.mjs";
import { breakWall } from "../breach.mjs";
export function installCheckpoints(app) {
  function captureCheckpoint() {
    return {
      time: app.gameState.time,
      kills: app.gameState.kills,
      deaths: app.gameState.deaths,
      checkpoint: { ...app.gameState.checkpoint },
      player: {
        hp: app.gameState.player.hp,
        abilities: { ...app.gameState.player.abilities },
        energy: app.gameState.player.energy,
        healCharge: app.gameState.player.healCharge,
      },
      rats: structuredClone(app.gameState.rats),
      fauna: {
        trees: structuredClone(app.gameState.fauna.trees),
        birds: structuredClone(app.gameState.fauna.birds),
        zones: structuredClone(app.gameState.fauna.zones),
      },
      walls: structuredClone(app.gameState.crackedWalls),
      exploration: structuredClone(app.gameState.exploration),
      lights: structuredClone(app.gameState.lights),
      rewards: structuredClone(app.gameState.rewards),
      torches: structuredClone(app.gameState.torches),
      seen: [...app.gameState.seen],
      activated: [...app.gameState.activated],
      bossDefeated: app.gameState.boss.hp === 0,
    };
  }
  function saveCheckpoint() {
    if (app.debugEnabled) {
      app.$("#save-status").textContent = "除錯模式不保存旅程；原存檔未變更。";
      return;
    }
    if (app.legacy) return;
    const state = app.captureCheckpoint();
    let result;
    try {
      result = writeSave(localStorage, app.world.version, app.world.seed, state);
    } catch {
      result = { ok: false, message: "本次無法保存，仍可繼續遊玩" };
    }
    if (result.ok) {
      app.gameState.saveInfo = { status: "ready", data: state };
      app.$("#save-status").textContent = "已保存至休息燈；關閉後可從這裡繼續。";
      app.guidance.saved(app.gameState.time);
      app.events.emit("checkpointSaved");
    } else {
      app.say(result.message, 6);
      app.$("#save-status").textContent = result.message;
    }
  }
  function loadCheckpointMenu() {
    if (app.debugEnabled) {
      app.$("#continue").hidden = true;
      app.$("#save-status").textContent = "除錯模式不讀寫旅程存檔。";
      return;
    }
    if (app.legacy) return;
    try {
      app.gameState.saveInfo = readSave(localStorage, app.world.version, app.world.seed);
    } catch {
      app.gameState.saveInfo = { status: "invalid" };
    }
    app.$("#continue").hidden = app.gameState.saveInfo.status !== "ready";
    app.$("#save-status").textContent =
      app.gameState.saveInfo.status === "ready"
        ? "找到休息燈存檔，可繼續冒險。"
        : app.gameState.saveInfo.status === "empty"
          ? ""
          : "舊存檔不相容或無法讀取，已保留；可確認後開始新冒險。";
  }
  function restoreCheckpoint(s) {
    try {
      app.reset();
      app.gameState.time = s.time;
      app.gameState.kills = s.kills;
      app.gameState.deaths = s.deaths;
      app.gameState.checkpoint = { ...s.checkpoint };
      restoreActor(app.gameState.player, s.player, {
        x: app.gameState.checkpoint.x,
        y: app.gameState.checkpoint.y,
        inv: app.gameState.time + B.player.respawnInvulnerability,
      });
      app.gameState.rats = structuredClone(s.rats);
      for (const r of app.gameState.rats) {
        r.x = r.spawn;
        r.y = r.y0;
        r.vy = 0;
        r.stun = 0;
        r.surface = null;
        r.state = "walk";
        r.timer = 0;
      }
      app.gameState.fauna = {
        ...createFauna(app.world),
        ...structuredClone(s.fauna),
        tornadoes: [],
        mirrorUntil: 0,
        mirrorReady: app.gameState.time,
      };
      resetFaunaAfterDeath(app.gameState.fauna);
      app.gameState.crackedWalls = structuredClone(s.walls);
      for (const w of app.gameState.crackedWalls)
        if (w.broken) {
          w.broken = false;
          breakWall({ energy: 999999 }, w, app.map, app.T, app.world.platforms);
        }
      app.gameState.exploration = structuredClone(s.exploration);
      app.gameState.exploration.gaze = null;
      app.gameState.exploration.elapsed = 0;
      app.gameState.exploration.echoUntil = 0;
      syncWinds(app.gameState.exploration, app.gameState.crackedWalls);
      syncStumps(app.world.platforms, app.gameState.fauna.trees);
      app.gameState.lights = structuredClone(s.lights);
      app.gameState.rewards = structuredClone(s.rewards);
      app.gameState.torches = structuredClone(s.torches);
      app.gameState.seen.clear();
      s.seen.forEach((v) => app.gameState.seen.add(v));
      app.gameState.activated = new Set(s.activated);
      if (s.bossDefeated) setHealth(app.gameState.boss, 0);
      app.gameState.nearLamp = app.world.safes.findIndex(
        (l) => l.x === app.gameState.checkpoint.x && l.y === app.gameState.checkpoint.y,
      );
      app.gameState.cameraSnap = true;
      app.gameState.magic = createMagic();
      app.events.emit("healthFeedbackReset");
      app.updateHud();
      return true;
    } catch {
      app.reset();
      app.gameState.saveInfo = { status: "invalid" };
      app.$("#continue").hidden = true;
      app.$("#save-status").textContent = "存檔內容無法還原，原資料已保留。可確認後開始新冒險。";
      return false;
    }
  }
  Object.assign(app, { captureCheckpoint, saveCheckpoint, loadCheckpointMenu, restoreCheckpoint });
}
