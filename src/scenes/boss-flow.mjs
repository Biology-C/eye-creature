import { setHealth } from "../systems/combat.mjs";
import { BALANCE as B } from "../config/balance.mjs";
import { learn } from "../guidance.mjs";
import { MAX_HP } from "../health.mjs";
import { enterBoss, updateBoss, bossSummons } from "../boss.mjs";
import { createMagic } from "../magic.mjs";
export function installBossFlow(app) {
  function finishBoss() {
    if (!app.gameState.boss.active || app.gameState.boss.hp > 0) return;
    app.gameState.boss.cursed = false;
    app.gameState.boss.shots = [];
    app.gameState.boss.mirrors = [];
    app.gameState.boss.recovery = null;
    app.gameState.rats = app.gameState.rats.filter((r) => !r.bossMinion);
    app.syncForm();
  }
  function beginBoss() {
    const hpBefore = app.gameState.player.hp;
    app.gameState.clearTouch();
    app.gameState.rats = app.gameState.rats.filter((r) => !r.bossMinion);
    if (!app.legacy && !app.gameState.boss.active) {
      app.gameState.checkpoint = { ...app.world.safes.at(-1) };
      setHealth(app.gameState.player, MAX_HP);
      app.gameState.activated.add(app.world.safes.length - 1);
      app.saveCheckpoint();
    }
    app.gameState.cameraSnap = true;
    app.cancelAttackInput();
    if (new URLSearchParams(location.search).has("boss-preview"))
      document.querySelector("h1 span").textContent = "紅熊試玩";
    enterBoss(app.gameState.boss, app.gameState.player, app.world.arena);
    app.syncForm();
    if (app.legacy) app.gameState.checkpoint = { ...app.world.exit };
    app.gameState.magic = createMagic();
    app.gameState.fauna.mirrorReady = app.gameState.time;
    app.gameState.attackUntil = 0;
    app.gameState.slash = null;
    app.gameState.keys.clear();
    app.updateHud();
    if (hpBefore < MAX_HP) {
      app.gameState.exploration.guidance ??= { visited: [] };
      if (!app.gameState.exploration.guidance.visited.includes("boss"))
        app.gameState.exploration.guidance.visited.push("boss");
      app.guidance.say("守門室前：生命已回滿", app.gameState.time, B.guidance.duration, {
        kind: "region",
        title: "守門室",
      });
      app.gameState.exploration.quietUntil = app.gameState.time + B.guidance.duration;
    } else
      app.say(
        `紅熊 ${app.gameState.boss.maxHp} HP：避開吐息瞄準線，跳過重踏震波。變身後等重踏掉落鏡子，再拾取恢復！`,
        8,
      );
  }
  function updateBossEncounter(dt) {
    const bossState = app.gameState.boss.state;
    let summoned = false;
    updateBoss(app.gameState.boss, app.gameState.player, dt, app.gameState.time, {
      clear: app.clearPath,
      solid: app.solid,
      hurt: app.hurt,
      summon: (kinds, i) => {
        summoned = true;
        const minions = bossSummons(
          app.gameState.boss,
          app.gameState.player,
          kinds,
          app.gameState.rats.filter((r) => r.bossMinion && r.hp > 0).length,
        );
        for (const r of minions) r.stun = app.gameState.time + B.boss.summonGrace;
        app.gameState.rats.push(...minions);
        app.say(`紅熊剩餘 ${B.boss.waves[i].ratio * 100}% 生命：召喚援軍！`, 3);
      },
      curse: () =>
        app.teach(
          "curse",
          true,
          app.handheld
            ? "變成史萊姆！B 跳躍／攀附、A 跳撞；等重踏掉落鏡子。"
            : "變成史萊姆！↑ 跳躍／攀附、Space 跳撞；等重踏掉落鏡子。",
        ),
      mirrorDrop: () => app.teach("mirror-drop", true, "重踏震落了鏡子！跳過震波，走近鏡子恢復。"),
      cured: () => {
        app.events.emit("mirrorUsed");
        learn(app.gameState.exploration, "curse", "mirror-drop");
      },
      recoveryDrop: () => app.teach("recovery", true, "大塊綠色能量出現！拾取可回復一格生命。"),
      recovered: () => {
        app.updateHud();
        app.events.emit("pickup", { kind: "relic" });
        learn(app.gameState.exploration, "recovery");
      },
    });
    if (summoned) app.events.emit("bossPhase", { phase: "summon" });
    if (
      app.gameState.boss.active &&
      app.gameState.boss.hp > 0 &&
      bossState !== "ready" &&
      app.gameState.boss.state === "ready"
    )
      app.events.emit("bossPhase", { phase: "ready" });
    app.syncForm();
  }
  function completeLevel() {
    app.gameState.mode = "won";
    app.events.emit("levelCleared");
    app.gameState.clearTouch();
    app.gameState.keys.clear();
    app.cancelAttackInput();
    app.panel(
      "第一關完成！",
      `擊敗紅熊，逃出培養所！探索 ${Math.floor(app.gameState.time / 60)} 分 ${Math.floor(app.gameState.time % 60)} 秒，擊退 ${app.gameState.kills} 隻敵人，返回 ${app.gameState.deaths} 次；藏品 ${app.gameState.rewards.filter((r) => r.kind === "relic" && r.got).length}/3。`,
      "再玩一次",
    );
  }
  Object.assign(app, { finishBoss, beginBoss, updateBossEncounter, completeLevel });
}
