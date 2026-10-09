import { setHealth } from "../systems/combat.mjs";
import { updateGuidance, learn } from "../guidance.mjs";
import { relicMessage } from "../message-card.mjs";
import { updateGaze, collectEchoes } from "../exploration.mjs";
import { MAX_HP } from "../health.mjs";
import { discoverTorches } from "../torches.mjs";
import { collectReward } from "../rewards.mjs";
import { MAX_WING } from "../physics.mjs";
export function updateExploration(app, frame) {
  frame.pickupSounds = [];
  for (const reward of app.gameState.rewards)
    if (
      !reward.got &&
      Math.hypot(app.gameState.player.x - reward.x, app.gameState.player.y - reward.y) < 26 &&
      app.clearPath(app.gameState.player.x, app.gameState.player.y, reward.x, reward.y) &&
      collectReward(reward, app.gameState.player, MAX_WING, app.gameState.time)
    ) {
      frame.pickupSounds.push(reward.kind === "relic" ? { kind: "relic" } : {});
      if (reward.kind === "relic")
        app.gameState.importantMessages.push(relicMessage(reward, app.handheld));
      app.gameState.pickupFlash = {
        x: reward.x,
        y: reward.y,
        until: app.gameState.time + 0.7,
        kind: reward.kind,
        amount: reward.amount || 1,
        healed: reward.healed || 0,
        percent: Math.round(((reward.restored || 0) / MAX_WING) * 100),
      };
      app.updateHud();
    }
  frame.collectedOrb = false;
  for (const l of app.gameState.lights)
    if (!l.got && Math.hypot(app.gameState.player.x - l.x, app.gameState.player.y - l.y) < 30) {
      l.got = true;
      frame.collectedOrb = true;
      app.events.emit("orbCollected");
      app.updateHud();
      app.say(
        app.gameState.lights.every((p) => p.got)
          ? "三顆光點齊了！感應出口方向，繼續前進。"
          : "找到引路光點！繼續探索上下岔路。",
      );
    }
  if (!frame.collectedOrb) for (const opts of frame.pickupSounds) app.events.emit("pickup", opts);
  frame.lamp = app.world.safes.findIndex(
    (s) => Math.hypot(app.gameState.player.x - s.x, app.gameState.player.y - s.y) < 45,
  );
  if (frame.lamp >= 0 && app.gameState.nearLamp !== frame.lamp) {
    const first = !app.gameState.activated.has(frame.lamp);
    app.gameState.activated.add(frame.lamp);
    app.gameState.checkpoint = { ...app.world.safes[frame.lamp] };
    if (first) setHealth(app.gameState.player, MAX_HP);
    app.updateHud();
    app.saveCheckpoint();
  }
  app.gameState.nearLamp = frame.lamp >= 0 ? frame.lamp : null;
  if (
    !app.gameState.boss.active &&
    Math.hypot(
      app.gameState.player.x - app.world.exit.x,
      app.gameState.player.y - app.world.exit.y,
    ) < 42
  ) {
    if (app.gameState.lights.every((p) => p.got)) app.beginBoss();
    else app.teach("exit-locked", true, "出口需要 3 顆引路光點。");
  }
  if (
    app.gameState.mode === "playing" &&
    app.gameState.boss.active &&
    !app.gameState.boss.hp &&
    Math.hypot(
      app.gameState.player.x - app.world.arena.exit.x,
      app.gameState.player.y - app.world.arena.exit.y,
    ) < 42
  ) {
    app.completeLevel();
  }
  frame.gazeKeys = app.handheld
    ? new Set([...app.gameState.keys].filter((k) => k !== "up"))
    : app.gameState.keys;
  if (app.handheld && app.gameState.keys.has("lookUp")) frame.gazeKeys.add("up");
  frame.found = updateGaze(
    app.gameState.exploration,
    app.gameState.player,
    frame.gazeKeys,
    app.gameState.crackedWalls,
    frame.dt,
    app.physics.solid,
  );
  if (frame.found) {
    learn(app.gameState.exploration, "gaze");
    app.events.emit("discovered");
  }
  frame.fighting = [
    ...app.gameState.rats,
    ...app.gameState.fauna.birds,
    ...app.gameState.fauna.trees,
    ...(app.gameState.boss.active ? [app.gameState.boss] : []),
  ].some(
    (e) =>
      e.hp > 0 &&
      Math.hypot(app.gameState.player.x - e.x, app.gameState.player.y - e.y) < 220 &&
      app.clearPath(app.gameState.player.x, app.gameState.player.y, e.x, e.y),
  );
  frame.echo = collectEchoes(
    app.gameState.exploration,
    app.gameState.player,
    app.gameState.time,
    frame.fighting,
  );
  if (frame.echo) {
    app.events.emit("discovered");
    app.gameState.importantMessages.push({
      kind: "echo",
      title: "勇者殘響",
      body: frame.echo.text,
    });
  }
  updateGuidance(
    app.gameState.exploration,
    {
      world: app.world,
      p: app.gameState.player,
      walls: app.gameState.crackedWalls,
      boss: app.gameState.boss,
      time: app.gameState.time,
      handheld: app.handheld,
    },
    app.guidance,
  );
  app.runTutorials();
  frame.melee =
    app.nearEnemy() ||
    (app.gameState.comboStage > 0 && app.gameState.time <= app.gameState.comboUntil);
  app.events.emit("actionHudChanged", frame.melee);
  app.followCamera(frame.dt);
  discoverTorches(app.gameState.torches, app.gameState.player, app.clearPath);
  frame.cx = Math.floor(app.gameState.player.x / app.T);
  frame.cy = Math.floor(app.gameState.player.y / app.T);
  for (let y = frame.cy - 4; y <= frame.cy + 4; y++)
    for (let x = frame.cx - 6; x <= frame.cx + 6; x++)
      if (app.map[y]?.[x] === 0) app.gameState.seen.add(`${x},${y}`);
  app.events.emit("handheldHudChanged", frame.melee);
  app.gameState.noticeUntil = app.guidance.until;
  app.showImportantMessages();
}
