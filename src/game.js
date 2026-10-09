import { createState, resetState } from "./core/state.mjs";
import { BALANCE as B } from "./config/balance.mjs";
import {
  installRegionFeatures,
  gustAt,
  updateGustWarnings,
  drawRegionFeatures,
} from "./region-features.mjs";
import { createHealingFeedback, markBossHit, wingFrame, createBossPainter } from "./feedback.mjs";
import {
  createGuidance,
  updateGuidance,
  drawCrackGuidance,
  nearestCrack,
  learn,
  tutorial,
} from "./guidance.mjs";
import { createMessageCard, relicMessage } from "./message-card.mjs";
import { drawPickupIcon } from "./pickup-art.mjs";
import { setSlimeForm, startSlimeAttack, updateSlimePlayer } from "./player-form.mjs";
import { createCombatSounds } from "./combat-sounds.mjs";
import { createSfx } from "./sfx.mjs";
import {
  SFX_LEVELS,
  SFX_DEFAULT,
  SFX_KEY,
  MUSIC_KEY,
  readAudioLevel,
  saveAudioLevel,
} from "./audio-settings.mjs";
import { createMusic, musicScene, MUSIC_VOLUME, MUSIC_LEVELS } from "./music.mjs";
import {
  BREACH_HOLD,
  attackIntent,
  validBreachHold,
  bindTouchControls,
  createSceneMirrors,
  drawSceneMirrors,
} from "./handheld.mjs";
import { buildAdventure } from "./adventure.mjs";
import {
  createExploration,
  updateGaze,
  syncWinds,
  windAt,
  hitObstacle,
  collectEchoes,
  syncStumps,
  updateCamera,
} from "./exploration.mjs";
import { readSave, writeSave, SAVE_KEY } from "./save.mjs";
import { createCues } from "./cues.mjs";
import { drawExploration } from "./exploration-art.mjs";
import { MAX_HP, healthMarkup, criticalOpacity } from "./health.mjs";
import { createPureSlimes, createBigSlimes, splitSlime, isSlime } from "./slime.mjs";
import { drawTerrain } from "./terrain.mjs";
import { drawTornadoes } from "./tornado.mjs";
import {
  addBossArena,
  createBoss,
  enterBoss,
  resetBoss,
  updateBoss,
  drawBear,
  drawBossEffects,
  drawBossTelegraph,
  bossGateSolid,
  bossSummons,
  BOSS_ATTACK_LABELS,
} from "./boss.mjs";
import { inMelee } from "./combat.mjs";
import {
  createMagic,
  castLight,
  updateMagic,
  drawEffects,
  drawSlash,
  SLASH_STYLES,
} from "./magic.mjs";
import { updateRat } from "./rats.mjs";
import {
  createFauna,
  meleeFauna,
  mirrorFauna,
  resetFaunaAfterDeath,
  updateFauna,
} from "./fauna.mjs";
import { createCrackedWalls, nearbyWall, breakWall, BREACH_COST, ordinaryWall } from "./breach.mjs";
import { createTorches, discoverTorches } from "./torches.mjs";
import { createRewards, collectReward } from "./rewards.mjs";
import {
  spikeState,
  touchesSpikes,
  addSurfaceSpikes,
  trapSupported,
  drawSpikes,
  removeSpikeShelters,
} from "./traps.mjs";
import { createPhysics, MAX_WING, startDash } from "./physics.mjs";
import { buildMaze } from "./maze.mjs";
import { loadHero } from "./hero.js";
const $ = (s) => document.querySelector(s),
  canvas = $("#game"),
  g = canvas.getContext("2d");
const handheld =
  !new URLSearchParams(location.search).has("legacy") &&
  (matchMedia("(pointer: coarse)").matches ||
    new URLSearchParams(location.search).get("handheld") === "1");
document.documentElement.classList.toggle("handheld", handheld);
function resize() {
  if (handheld) {
    const r = canvas.parentElement.getBoundingClientRect();
    canvas.width = 480;
    canvas.height = Math.max(160, Math.round((480 * r.height) / Math.max(1, r.width)));
    canvas.style.aspectRatio = "auto";
    return;
  }
  const compact = canvas.clientWidth < 650;
  canvas.width = compact ? 480 : 960;
  canvas.height =
    innerWidth >= 900
      ? Math.max(
          240,
          Math.round((960 * canvas.parentElement.clientHeight) / canvas.parentElement.clientWidth),
        )
      : compact
        ? innerHeight < 500
          ? 240
          : 360
        : 540;
  canvas.style.aspectRatio = `${canvas.width}/${canvas.height}`;
}
resize();
window.addEventListener("resize", () => {
  resize();
  gameState.cameraSnap = true;
});
new ResizeObserver(() => {
  resize();
  gameState.cameraSnap = true;
}).observe(canvas.parentElement);
const legacy = new URLSearchParams(location.search).has("legacy");
const debugEnabled = new URLSearchParams(location.search).get("debug") === "1";

const world = legacy ? buildMaze() : buildAdventure();

const cues = createCues();

world.mazeHeight = world.H;
addSurfaceSpikes(world);
removeSpikeShelters(world);
installRegionFeatures(world);
addBossArena(world);
const { T, W, H, map } = world;
const sceneMirrors = handheld ? createSceneMirrors(world) : [];
const originalMap = map.map((row) => row.slice()),
  originalPlatforms = world.platforms.map((p) => ({ ...p }));
const gameState = createState({
  exploration: createExploration(world),
  boss: createBoss(world),
  magic: createMagic(),
  reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
  lastSfxVolume: SFX_DEFAULT,
});
const physics = createPhysics(
  map,
  T,
  world.platforms,
  (x, y) =>
    bossGateSolid(gameState.boss, x, y) ||
    gameState.exploration.obstacles.some(
      (o) =>
        !o.broken &&
        x > o.x - o.w / 2 &&
        x < o.x + o.w / 2 &&
        y > o.y - o.h / 2 &&
        y < o.y + o.h / 2,
    ),
);
const solid = (x, y) =>
  map[Math.floor(y / T)]?.[Math.floor(x / T)] !== 0 || bossGateSolid(gameState.boss, x, y);

const healingFeedback = createHealingFeedback(),
  paintBoss = createBossPainter();
const guidance = createGuidance($("#notice"), handheld);

const messageCard = createMessageCard({
  handheld,
  onClose: () => {
    if (gameState.importantMessages.length) {
      messageCard.show(gameState.importantMessages.shift());
      return;
    }
    gameState.mode = "playing";
    gameState.clearTouch();
    gameState.keys.clear();
    cancelAttackInput();
    gameState.last = 0;
    syncMusic();
    canvas.focus();
  },
});
function showImportantMessages() {
  if (gameState.mode !== "playing" || !gameState.importantMessages.length) return;
  gameState.mode = "reading";
  gameState.clearTouch();
  gameState.keys.clear();
  cancelAttackInput();
  syncMusic();
  messageCard.show(gameState.importantMessages.shift());
}
const sfx = createSfx({ volume: SFX_DEFAULT });
const combatSounds = createCombatSounds(sfx);

function setSfxVolume(value, persist = true) {
  if (!SFX_LEVELS.includes(value)) return;
  if (value > 0) gameState.lastSfxVolume = value;
  sfx.volume = value;
  sfx.muted = value === 0;
  cues.volume = value;
  cues.muted = value === 0;
  $("#sfx-volume").value = String(Math.round(value * 100));
  $("#sound").textContent = value === 0 ? "音效：關" : "音效：開";
  $("#sound").setAttribute("aria-pressed", String(value === 0));
  if (persist) saveAudioLevel(SFX_KEY, value);
}
setSfxVolume(readAudioLevel(SFX_KEY, SFX_LEVELS, SFX_DEFAULT, "eye-creature.sound-muted"), false);
$("#sfx-volume").onchange = () => setSfxVolume(Number($("#sfx-volume").value) / 100);

const music = createMusic({
  onChange: (state) => {
    const button = $("#music");
    const percent = Math.round(state.volume * 100);
    button.textContent = state.error
      ? "音樂未能播放・點此重試"
      : state.muted
        ? "背景音樂：關"
        : !state.unlocked
          ? `播放標題音樂 · ${percent}％`
          : `背景音樂：${percent}％`;
    $("#music-volume").value = String(state.muted ? 0 : percent);
    button.setAttribute("aria-pressed", String(state.unlocked && !state.muted));
  },
});
function syncMusic() {
  music.setState(
    musicScene(gameState.mode, gameState.boss),
    gameState.musicInBackground ||
      document.hidden ||
      gameState.mode === "paused" ||
      gameState.mode === "reading" ||
      gameState.mode === "loading",
  );
}
$("#music").onclick = () => {
  const state = music.snapshot();
  syncMusic();
  if (state.muted) {
    music.setMuted(false);
    music.unlock();
  } else if (state.error || !state.unlocked) music.unlock();
  else music.setMuted(true);
  saveAudioLevel(MUSIC_KEY, music.snapshot().muted ? 0 : music.snapshot().volume);
};
$("#music-volume").onchange = () => {
  syncMusic();
  music.setVolume(Number($("#music-volume").value) / 100);
  if (!music.snapshot().muted) music.unlock();
  saveAudioLevel(MUSIC_KEY, music.snapshot().muted ? 0 : music.snapshot().volume);
};
music.setVolume(readAudioLevel(MUSIC_KEY, MUSIC_LEVELS, MUSIC_VOLUME));

function cancelAttackInput(preserveHit = false) {
  sfx.stopCharge();
  if (!preserveHit) combatSounds.clear();
  gameState.breachHold = null;
  gameState.breachConsumed = false;
  gameState.attackHeld = false;
  gameState.chargeStart = null;
  gameState.comboStage = 0;
  gameState.comboUntil = 0;
  gameState.comboQueue = 0;
  gameState.keys.delete("attack");
}
function reset() {
  guidance.reset();
  gameState.noticeUntil = 0;
  messageCard.clear();
  gameState.importantMessages = [];
  music.clearDuck();
  gameState.clearTouch();
  gameState.exploration = createExploration(world);
  gameState.cameraSnap = true;
  gameState.nearLamp = null;
  cancelAttackInput();
  gameState.dashHits.clear();
  gameState.boss = createBoss(world);
  gameState.struck.clear();
  gameState.hitStop = 0;
  gameState.hurtUntil = 0;
  gameState.magic = createMagic();
  gameState.dashTrail = [];
  world.platforms.splice(0, world.platforms.length, ...originalPlatforms.map((p) => ({ ...p })));
  map.forEach((row, y) => row.splice(0, row.length, ...originalMap[y]));
  gameState.fauna = createFauna(world);
  gameState.crackedWalls = createCrackedWalls(world);
  gameState.player = {
    ...world.start,
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
  gameState.rats = [...world.rats, ...createPureSlimes(world), ...createBigSlimes(world)].map(
    (r, i) => ({
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
    }),
  );
  gameState.lights = world.lights.map((l) => ({ ...l, got: false }));
  gameState.rewards = createRewards(world);
  gameState.torches = createTorches(world);
  gameState.pickupFlash = null;
  gameState.checkpoint = { ...world.start };
  gameState.activated = new Set();
  resetState(gameState, {
    kills: 0,
    deaths: 0,
    time: 0,
    nextAttack: 0,
    attackUntil: 0,
    slash: null,
  });
  gameState.seen.clear();
  gameState.keys.clear();
  gameState.slimeHits.clear();
  healingFeedback.reset(gameState.player.hp);
  updateHud();
  updateFormControls();
}
function phoneText(message) {
  return !handheld
    ? message
    : message
        .replaceAll("Space", "A")
        .replaceAll("Shift", "X")
        .replaceAll("按住 ↑ 拍翼", "按住 B 拍翼")
        .replaceAll("↑ 拍翼", "B 拍翼")
        .replaceAll("按 E 打通", "長按 A 打通")
        .replaceAll("按 Q 使用鏡面", "靠近場景鏡面")
        .replaceAll("按 Q 映出鏡像", "靠近場景鏡面映出鏡像")
        .replaceAll("用 Q 或左側鏡子破解", "靠近左側鏡子破解");
}
function say(message, duration = B.guidance.duration) {
  guidance.say(phoneText(message), gameState.time, duration);
  gameState.noticeUntil = guidance.until;
}
function updateHud() {
  healingFeedback.observe(gameState.player.hp, gameState.time);
  $("#abilities").textContent =
    "能力：" +
    (["spread", "dash", "breach"]
      .filter((k) => gameState.player.abilities[k])
      .map((k) => ({ spread: "三向光彈", dash: "傷害衝刺", breach: "普通牆破壞" })[k])
      .join("／") || "尚未取得");
  $("#energy").textContent =
    `${handheld ? "破牆" : "破牆能量"} ${gameState.player.energy} / ${BREACH_COST}`;
  $("#hearts").innerHTML = healthMarkup(gameState.player.hp);
  $("#healing").textContent = `綠能回血 ${gameState.player.healCharge}% / 100%`;
  $("#hearts").setAttribute("aria-label", `生命 ${gameState.player.hp} / ${MAX_HP}`);
  $("#quest").textContent =
    `${handheld ? "光點" : "引路光點"} ${gameState.lights.filter((p) => p.got).length} / 3`;
  $("#relics").textContent =
    `藏品 ${gameState.rewards.filter((r) => r.kind === "relic" && r.got).length} / ${gameState.rewards.filter((r) => r.kind === "relic").length}`;
}
function panel(title, description, label) {
  $("#map-panel").hidden = !handheld || gameState.mode !== "paused";
  if (handheld && gameState.mode === "paused") drawJourneyMap();
  $("#pause-details").hidden = gameState.mode !== "paused";
  $("#continue").hidden = true;
  $("#title").textContent = title;
  $("#description").textContent = description;
  $("#start").textContent = label;
  $("#overlay").hidden = false;
  $("#restart").hidden = gameState.mode !== "paused";
}
function refreshMemories() {
  const list = $("#memories");
  list.replaceChildren();
  for (const e of gameState.exploration.echoes) {
    const li = document.createElement("li");
    li.textContent = e.got ? e.text : "尚未找到的殘響";
    list.append(li);
  }
}
function pause() {
  refreshMemories();
  if (gameState.mode === "playing") {
    gameState.mode = "paused";
    syncMusic();
    gameState.clearTouch();
    gameState.keys.clear();
    cancelAttackInput();
    $("#save-status").textContent = "重新整理會回到最近休息燈；繼續探索保留目前進度。";
    panel("休息一下", "探索進度保留，準備好再繼續。", "繼續探索");
  } else if (gameState.mode === "paused") resume();
}
function resume() {
  if (messageCard.active) return;
  sfx.unlock();
  sfx.loadSample("breakWall", new URL("../assets/sfx/wall-break.wav", import.meta.url));
  cues.unlock();
  gameState.mode = "playing";
  gameState.musicInBackground = false;
  syncMusic();
  music.unlock();
  $("#overlay").hidden = true;
  gameState.last = 0;
  canvas.focus();
}
function newAdventure() {
  if (
    !legacy &&
    gameState.saveInfo.status !== "empty" &&
    !confirm("開始新冒險會覆蓋休息燈存檔。確定嗎？")
  )
    return;
  try {
    if (!legacy && !debugEnabled) localStorage.removeItem(SAVE_KEY);
  } catch {
    say("無法清除舊存檔；本次遊戲仍可繼續。");
  }
  reset();
  gameState.saveInfo = { status: "empty" };
  $("#continue").hidden = true;
  resume();
}
$("#start").onclick = () => {
  if (
    gameState.mode === "won" ||
    (gameState.mode === "intro" && gameState.saveInfo.status !== "empty")
  ) {
    newAdventure();
    return;
  }
  if (new URLSearchParams(location.search).has("boss-preview") && !gameState.boss.active) {
    gameState.lights.forEach((l) => (l.got = true));
    beginBoss();
  }
  resume();
  cues.play("start");
};
$("#restart").onclick = newAdventure;
$("#pause").onclick = pause;
$("#sound").onclick = () => setSfxVolume(sfx.muted ? gameState.lastSfxVolume : 0);
$("#continue").onclick = () => {
  if (gameState.saveInfo.status === "ready" && restoreCheckpoint(gameState.saveInfo.data)) resume();
};
$("#theme").onclick = () => {
  gameState.light = !gameState.light;
  document.body.classList.toggle("light", gameState.light);
  $("#theme").textContent = gameState.light ? "深色" : "淺色";
  if (gameState.mode === "playing") canvas.focus();
};
function motionLabel() {
  $("#motion").setAttribute("aria-pressed", gameState.reduced);
  $("#motion").textContent = gameState.reduced ? "減少動態：開" : "減少動態：關";
}
motionLabel();
$("#motion").onclick = () => {
  gameState.reduced = !gameState.reduced;
  motionLabel();
  if (gameState.mode === "playing") canvas.focus();
};
$("#slash-style").onclick = () => {
  gameState.slashStyle = (gameState.slashStyle + 1) % 3;
  $("#slash-style").textContent = "斬擊：" + SLASH_STYLES[gameState.slashStyle];
  if (gameState.mode === "playing") canvas.focus();
};
$("#hint").onclick = () => {
  if (gameState.mode !== "playing") return;
  canvas.focus();
  const wall = nearestCrack(gameState.player, gameState.crackedWalls);
  if (!gameState.boss.active && !gameState.crackedWalls.some((w) => w.broken) && wall) {
    guidance.say("跟著箭頭尋找裂牆。", gameState.time, 6, { target: wall, kind: "reminder" });
    return;
  }
  const remaining = gameState.lights.filter((l) => !l.got),
    target = remaining.length
      ? remaining.sort(
          (a, b) =>
            Math.hypot(a.x - gameState.player.x, a.y - gameState.player.y) -
            Math.hypot(b.x - gameState.player.x, b.y - gameState.player.y),
        )[0]
      : world.exit;
  const dx = target.x - gameState.player.x,
    dy = target.y - gameState.player.y;
  say(
    `${remaining.length ? "光點" : "出口"}訊號大約在${Math.abs(dy) > 100 ? (dy < 0 ? "北" : "南") : ""}${Math.abs(dx) > 100 ? (dx < 0 ? "西" : "東") : ""}方。牆後可能要繞路。`,
    6,
  );
};
$("#sense-direction").onclick = () => {
  if (gameState.mode === "paused") {
    resume();
    $("#hint").click();
  }
};
function wallTarget(touch = false) {
  if (gameState.player.slimeForm) return null;
  const direction = gameState.keys.has("down")
    ? "down"
    : gameState.keys.has(touch ? "lookUp" : "up")
      ? "up"
      : null;
  return (
    nearbyWall(gameState.player, gameState.crackedWalls, direction) ||
    ordinaryWall(gameState.player, world, direction)
  );
}
function performBreach(wall) {
  if (!breakWall(gameState.player, wall, map, T, world.platforms)) return false;
  if (wall.ordinary) gameState.crackedWalls.push(wall);
  wall.discovered = true;
  wall.changedAt = gameState.time;
  syncWinds(gameState.exploration, gameState.crackedWalls);
  if (!sfx.play("breakWall")) cues.play("break");
  updateHud();
  learn(gameState.exploration, "breach", "gaze", "energy-ready");
  return true;
}
function breach() {
  if (gameState.mode !== "playing" || gameState.player.slimeForm) return;
  canvas.focus();
  const wall = wallTarget();
  if (!wall) {
    say("靠近裂面：左右面向它，上下按住 ↑／↓ 再按 E 或破牆。", 3);
    return;
  }
  if (!performBreach(wall))
    say(
      `還需要 ${BREACH_COST - gameState.player.energy} 橘色能量（${gameState.player.energy}/${BREACH_COST}）。`,
      3,
    );
}
$("#breach").onclick = breach;
function mirror() {
  if (gameState.mode !== "playing") return;
  if (gameState.boss.cursed) {
    say("史萊姆無法施法；等紅熊重踏後，拾取掉落的鏡子。", 4);
    return;
  }
  canvas.focus();
  const count = mirrorFauna(gameState.fauna, gameState.player, gameState.time, clearPath);
  if (count > 0) {
    learn(gameState.exploration, "bird");
    sfx.play("mirror");
  }
  if (count >= 0)
    say(
      count ? `鏡面映出 ${count} 隻青影鳥，牠們正在攻擊自己的倒影！` : "鏡面展開，附近沒有青影鳥。",
      3,
    );
}
$("#mirror").onclick = mirror;
function dash() {
  if (gameState.mode !== "playing" || gameState.player.slimeForm) return;
  canvas.focus();
  const direction = Number(gameState.keys.has("right")) - Number(gameState.keys.has("left"));
  if (direction) gameState.player.face = direction;
  if (startDash(gameState.player)) {
    learn(gameState.exploration, "dash");
    gameState.dashHits.clear();
    sfx.play("dash");
  }
}
$("#dash").onclick = dash;
function lightMagic() {
  if (gameState.mode !== "playing") return;
  if (gameState.player.slimeForm) {
    say("史萊姆形態：跳躍與跳撞，拾取鏡子後恢復魔法。", 3);
    return;
  }
  canvas.focus();
  say("目前魔法：光彈。取得其他魔法後，按 F 切換。", 3);
}
$("#magic").onclick = lightMagic;
$("#select").onclick = () => {
  if (gameState.mode === "playing") pause();
  else if (gameState.mode === "paused") resume();
};
$("#handheld-start").onclick = () => {
  if (gameState.mode === "intro" || gameState.mode === "won") $("#start").click();
  else pause();
};
if (handheld) {
  $("#description .intro-line:last-child").textContent = "十字鍵移動 · B 拍翼／滑翔";
  $("#pause-details details p").textContent =
    "十字鍵左右移動，上下觀察；下可穿過薄台。B 拍翼／滑翔。A：近敵連按三段斬、遠處長按蓄力後放開；靠近裂牆長按 0.65 秒破牆，消耗 30 能量。X 衝刺。靠近場景鏡面會映照青影鳥；變身後等待紅熊重踏掉落鏡子，拾取解除詛咒。SELECT 地圖、START 暫停。";
  $(".attack").innerHTML = "A<small>攻擊</small>";
  $("#dash").innerHTML = "X<small>衝刺</small>";
}
const keyMap = {
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
    pause();
    return;
  }
  if (e.target.tagName === "BUTTON") return;
  if (e.key.toLowerCase() === "f" && !e.repeat) {
    e.preventDefault();
    lightMagic();
  }
  if (e.key === "Shift" && !e.repeat) {
    e.preventDefault();
    dash();
  }
  if (e.key.toLowerCase() === "q" && !e.repeat) {
    e.preventDefault();
    mirror();
  }
  if (e.key.toLowerCase() === "e" && !e.repeat) {
    e.preventDefault();
    breach();
  }
  const k = keyMap[e.key];
  if (k) {
    e.preventDefault();
    if (gameState.mode === "playing") {
      if (k === "attack" && !e.repeat) pressAttack();
      gameState.keys.add(k);
    }
  }
  if (e.key.toLowerCase() === "p" && !e.repeat) pause();
});
window.addEventListener("keyup", (e) => {
  const k = keyMap[e.key];
  if (k) {
    gameState.keys.delete(k);
    if (k === "attack") releaseAttack();
  }
});
const touchKeys = new Map();
function touchKey(k) {
  return k === "flap" ? "up" : handheld && k === "up" ? "lookUp" : k;
}
gameState.clearTouch = bindTouchControls($(".touch"), {
  playing: () => gameState.mode === "playing",
  down: (k) => {
    const key = touchKey(k);
    touchKeys.set(k, key);
    gameState.keys.add(key);
    if (k === "attack") pressAttack(handheld);
  },
  up: (k) => {
    const key = touchKeys.get(k);
    touchKeys.delete(k);
    if (![...touchKeys.values()].includes(key)) gameState.keys.delete(key);
    if (k === "attack") releaseAttack();
  },
  cancel: (k) => {
    const key = touchKeys.get(k);
    touchKeys.delete(k);
    if (![...touchKeys.values()].includes(key)) gameState.keys.delete(key);
    if (k === "attack") cancelAttackInput();
  },
});
if (handheld) {
  $("#dash").onclick = null;
  $("#dash").onpointerdown = (e) => {
    e.preventDefault();
    dash();
  };
  $(".touch").oncontextmenu = (e) => e.preventDefault();
}
window.addEventListener("blur", () => {
  gameState.musicInBackground = true;
  gameState.keys.clear();
  if (gameState.mode === "playing") pause();
  syncMusic();
});
window.addEventListener("focus", () => {
  gameState.musicInBackground = false;
  syncMusic();
});
document.addEventListener("visibilitychange", () => {
  gameState.musicInBackground = document.hidden;
  if (document.hidden && gameState.mode === "playing") pause();
  syncMusic();
});
function free(x, y, r = 11) {
  if (!physics.free(x, y, r)) return false;
  return ![
    [x - r, y - r],
    [x + r, y - r],
    [x - r, y + r],
    [x + r, y + r],
  ].some(([a, b]) => solid(a, b));
}
function move(o, dx, dy) {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 6));
  for (let i = 0; i < n; i++) {
    if (free(o.x + dx / n, o.y)) o.x += dx / n;
    if (free(o.x, o.y + dy / n)) o.y += dy / n;
  }
}
function clearPath(ax, ay, bx, by) {
  const n = Math.ceil(Math.hypot(bx - ax, by - ay) / 6),
    target = gameState.exploration.obstacles.find((o) => o.x === bx && o.y === by);
  for (let i = 0; i <= n; i++) {
    const x = ax + ((bx - ax) * i) / Math.max(1, n),
      y = ay + ((by - ay) * i) / Math.max(1, n);
    if (
      solid(x, y) ||
      gameState.exploration.obstacles.some(
        (o) =>
          o !== target &&
          !o.broken &&
          x > o.x - o.w / 2 &&
          x < o.x + o.w / 2 &&
          y > o.y - o.h / 2 &&
          y < o.y + o.h / 2,
      )
    )
      return false;
  }
  return true;
}
function impact(e, damage = B.enemy.contactDamage) {
  gameState.magic.effects.push({
    x: e.x,
    y: e.y,
    kind: "melee",
    damage,
    until: gameState.time + 0.24,
  });
  gameState.hitStop = Math.max(gameState.hitStop, B.attack.hitStop);
}
function enemyDamageSound(e, before) {
  if (e === gameState.boss) markBossHit(gameState.boss, before, gameState.time);
  combatSounds.damaged(e, before, {
    boss: e === gameState.boss,
    crystalRat: gameState.rats.includes(e) && !e.pure && !e.big,
  });
}
function applyMelee() {
  const targets = [
    ...gameState.rats,
    ...gameState.exploration.obstacles,
    ...gameState.fauna.trees,
    ...gameState.fauna.birds,
    ...(gameState.boss.active ? [gameState.boss] : []),
  ].filter((e) => !gameState.struck.has(e) && inMelee(gameState.slash, e, clearPath));
  const hpBefore = new Map(
    targets.filter((e) => !gameState.exploration.obstacles.includes(e)).map((e) => [e, e.hp]),
  );
  for (const e of targets) {
    gameState.struck.add(e);
    if (gameState.exploration.obstacles.includes(e)) {
      if (hitObstacle(e, gameState.slash.stage)) {
        learn(gameState.exploration, "root");
        e.changedAt = gameState.time;
        cues.play("break");
      }
      continue;
    }
    impact(e);
    gameState.hitStop = Math.max(
      gameState.hitStop,
      B.attack.meleeHitStops[(gameState.slash.stage || 1) - 1],
    );
    if (e === gameState.boss) {
      gameState.boss.hp = Math.max(
        0,
        gameState.boss.hp - B.attack.meleeDamage[(gameState.slash.stage || 1) - 1],
      );
      gameState.boss.stun = gameState.time + B.attack.bossMeleeStun;
      if (!gameState.boss.hp) {
        gameState.kills++;
        gameState.boss.cursed = false;
        say("紅熊倒下！走向右側出口。", 5);
      }
    }
  }
  const hit = meleeFauna(gameState.fauna, gameState.slash, gameState.time, clearPath, targets);
  gameState.kills += hit.killed;
  syncStumps(world.platforms, gameState.fauna.trees);
  for (const r of gameState.rats.filter((e) => targets.includes(e))) {
    r.hp = Math.max(0, r.hp - B.attack.meleeDamage[(gameState.slash.stage || 1) - 1]);
    r.state = "rest";
    r.timer = B.attack.enemyHitRest;
    r.stun = gameState.time + B.attack.enemyStun;
    if (!r.hp) gameState.kills++;
  }
  for (const [e, hp] of hpBefore) enemyDamageSound(e, hp);
}
function attack(stage = 1) {
  if (gameState.player.slimeForm) {
    slimeAttack();
    return;
  }
  learn(gameState.exploration, "rat");
  gameState.nextAttack = gameState.time + B.attack.meleeCooldown;
  gameState.attackUntil = gameState.time + B.attack.meleeDuration;
  gameState.slash = {
    x: gameState.player.x,
    y: gameState.player.y,
    face: gameState.player.face,
    stage,
  };
  gameState.struck.clear();
  applyMelee();
  if (!gameState.player.slimeForm) sfx.play("slash" + stage);
}
function nearEnemy() {
  return [
    ...gameState.exploration.obstacles,
    ...gameState.rats,
    ...gameState.fauna.trees,
    ...gameState.fauna.birds,
    ...(gameState.boss.active ? [gameState.boss] : []),
  ].some((e) => inMelee(gameState.player, e, clearPath));
}
function nextCombo() {
  gameState.comboStage =
    gameState.time <= gameState.comboUntil ? (gameState.comboStage % 3) + 1 : 1;
  gameState.comboUntil = gameState.time + B.attack.comboWindow;
  attack(gameState.comboStage);
}
function pressAttack(touch = false) {
  if (gameState.mode !== "playing" || gameState.attackHeld) return;
  gameState.attackHeld = true;
  if (gameState.player.slimeForm) {
    slimeAttack();
    return;
  }
  if (
    touch &&
    handheld &&
    !nearEnemy() &&
    wallTarget(true) &&
    gameState.player.energy < BREACH_COST
  )
    say(
      `還需要 ${BREACH_COST - gameState.player.energy} 橘色能量（${gameState.player.energy}/${BREACH_COST}）。`,
      3,
    );
  if (
    touch &&
    handheld &&
    attackIntent({
      melee: nearEnemy(),
      combo: gameState.comboStage && gameState.time <= gameState.comboUntil,
      wall: wallTarget(true),
      energy: gameState.player.energy,
      cost: BREACH_COST,
    }) === "breach"
  ) {
    gameState.breachHold = { id: wallTarget(true).id, start: gameState.time };
    gameState.breachConsumed = false;
    gameState.chargeStart = null;
    sfx.stopCharge();
    return;
  }
  if (nearEnemy() || (gameState.comboStage && gameState.time <= gameState.comboUntil)) {
    if (gameState.time >= gameState.nextAttack) nextCombo();
    else gameState.comboQueue = Math.min(B.attack.comboBuffer, gameState.comboQueue + 1);
  }
  // Charging is an input action, not a shot: it can start during cooldown.
  // castLight still enforces the firing cooldown when the key is released.
  else gameState.chargeStart = gameState.time;
}
function fireLight(charged = false) {
  if (gameState.player.slimeForm) return false;
  const fired = castLight(gameState.magic, gameState.player, gameState.time, charged);
  if (fired) {
    if (charged) learn(gameState.exploration, "charge");
    sfx.play(charged ? "chargedShot" : "shot");
  }
  return fired;
}
function syncChargeSound() {
  const on =
    gameState.mode === "playing" &&
    gameState.player &&
    !gameState.player.slimeForm &&
    gameState.chargeStart !== null &&
    gameState.time - gameState.chargeStart >= B.attack.chargeSoundDelay;
  if (on) sfx.startCharge(gameState.time - gameState.chargeStart, B.attack.chargeTime);
  else sfx.stopCharge();
}
function releaseAttack() {
  sfx.stopCharge();
  if (!gameState.attackHeld) return;
  gameState.attackHeld = false;
  if (gameState.breachHold || gameState.breachConsumed) {
    const quick = gameState.breachHold && !gameState.breachConsumed;
    gameState.breachHold = null;
    gameState.breachConsumed = false;
    if (quick && gameState.mode === "playing" && fireLight(false))
      gameState.nextAttack = gameState.time + B.attack.lightCooldown;
    return;
  }
  if (gameState.mode === "playing" && gameState.chargeStart !== null) {
    if (fireLight(gameState.time - gameState.chargeStart >= B.attack.chargeTime))
      gameState.nextAttack = gameState.time + B.attack.lightCooldown;
  }
  gameState.chargeStart = null;
}
// eslint-disable-next-line no-unused-vars -- Invoked by the browser regression harness appended to this module.
function autoAttack() {
  if (gameState.player.slimeForm) {
    slimeAttack();
    return;
  }
  if (nearEnemy()) attack();
  else if (fireLight(false)) gameState.nextAttack = gameState.time + B.attack.lightCooldown;
}
function syncForm() {
  if (
    !setSlimeForm(
      gameState.player,
      gameState.boss.active && gameState.boss.hp > 0 && gameState.boss.cursed,
    )
  )
    return;
  gameState.clearTouch();
  gameState.keys.clear();
  cancelAttackInput(true);
  if (gameState.player.slimeForm) sfx.play("curse");
  gameState.attackUntil = 0;
  gameState.slash = null;
  gameState.magic.shots = [];
  gameState.dashTrail = [];
  gameState.slimeHits.clear();
  if (!gameState.player.slimeForm) {
    gameState.player.bodyRadius = undefined;
    gameState.player.wing = MAX_WING;
  }
  updateFormControls();
}
function updateFormControls() {
  if (handheld) {
    $("#flap").innerHTML = gameState.player.slimeForm
      ? "B<small>跳躍／攀附</small>"
      : "B<small>拍翼</small>";
    $("#flap").setAttribute(
      "aria-label",
      gameState.player.slimeForm ? "B 跳躍或攀附" : "B 拍翼或滑翔",
    );
    $("#dash").disabled = Boolean(gameState.player.slimeForm);
    $("#dash").innerHTML = gameState.player.slimeForm
      ? "X<small>變身中</small>"
      : "X<small>衝刺</small>";
  } else $("#dash").textContent = gameState.player.slimeForm ? "史萊姆無衝刺" : "衝刺 Shift";
}
function slimeAttack() {
  if (startSlimeAttack(gameState.player)) {
    gameState.slimeHits.clear();
    gameState.nextAttack = gameState.time + B.player.slimeAttackCooldown;
  }
}
function applySlimeHit() {
  if (!gameState.player.slimeForm || gameState.player.slimeAttack <= 0) return;
  for (const e of [...gameState.rats, ...(gameState.boss.active ? [gameState.boss] : [])]) {
    if (
      !e.hp ||
      gameState.slimeHits.has(e) ||
      Math.abs(e.x - gameState.player.x) > (e.radiusX || 14) + 20 ||
      Math.abs(e.y - gameState.player.y) > (e.radiusY || 14) + 16 ||
      !clearPath(gameState.player.x, gameState.player.y, e.x, e.y)
    )
      continue;
    gameState.slimeHits.add(e);
    impact(e);
    const beforeHp = e.hp;
    e.hp = Math.max(0, e.hp - B.attack.slimeDamage);
    enemyDamageSound(e, beforeHp);
    e.stun = gameState.time + B.attack.enemyStun;
    if (e !== gameState.boss) {
      e.state = "rest";
      e.timer = B.attack.enemyHitRest;
    }
    if (!e.hp) gameState.kills++;
  }
}
function finishBoss() {
  if (!gameState.boss.active || gameState.boss.hp > 0) return;
  gameState.boss.cursed = false;
  gameState.boss.shots = [];
  gameState.boss.mirrors = [];
  gameState.boss.recovery = null;
  gameState.rats = gameState.rats.filter((r) => !r.bossMinion);
  syncForm();
}
// eslint-disable-next-line no-unused-vars -- Existing damage-source call signature retained; quiet HUD no longer displays this label.
function hurt(source = "老鼠", damage = B.enemy.contactDamage) {
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
  gameState.player.hp = Math.max(0, gameState.player.hp - damage);
  if (gameState.player.hp < beforeHp) sfx.play(gameState.player.hp === 0 ? "death" : "hurt");
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
    gameState.player.hp = MAX_HP;
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
function beginBoss() {
  const hpBefore = gameState.player.hp;
  gameState.clearTouch();
  gameState.rats = gameState.rats.filter((r) => !r.bossMinion);
  if (!legacy && !gameState.boss.active) {
    gameState.checkpoint = { ...world.safes.at(-1) };
    gameState.player.hp = MAX_HP;
    gameState.activated.add(world.safes.length - 1);
    saveCheckpoint();
  }
  gameState.cameraSnap = true;
  cancelAttackInput();
  if (new URLSearchParams(location.search).has("boss-preview"))
    document.querySelector("h1 span").textContent = "紅熊試玩";
  enterBoss(gameState.boss, gameState.player, world.arena);
  syncForm();
  if (legacy) gameState.checkpoint = { ...world.exit };
  gameState.magic = createMagic();
  gameState.fauna.mirrorReady = gameState.time;
  gameState.attackUntil = 0;
  gameState.slash = null;
  gameState.keys.clear();
  updateHud();
  if (hpBefore < MAX_HP) {
    gameState.exploration.guidance ??= { visited: [] };
    if (!gameState.exploration.guidance.visited.includes("boss"))
      gameState.exploration.guidance.visited.push("boss");
    guidance.say("守門室前：生命已回滿", gameState.time, B.guidance.duration, {
      kind: "region",
      title: "守門室",
    });
    gameState.exploration.quietUntil = gameState.time + B.guidance.duration;
  } else
    say(
      `紅熊 ${gameState.boss.maxHp} HP：避開吐息瞄準線，跳過重踏震波。變身後等重踏掉落鏡子，再拾取恢復！`,
      8,
    );
}
function teach(id, condition, message) {
  if (condition)
    tutorial(
      gameState.exploration,
      guidance,
      id,
      phoneText(message),
      gameState.time,
      B.guidance.duration,
    );
}
function runTutorials() {
  gameState.exploration.teaching = [];
  if (legacy) return;
  if (gameState.keys.has("up") && !gameState.player.grounded && !gameState.player.slimeForm)
    learn(gameState.exploration, "wing");
  teach(
    "wing",
    !gameState.player.grounded && gameState.time > 1,
    "按住 ↑ 拍翼，耗盡後滑翔；落腳可恢復翼能。",
  );
  teach(
    "rat",
    gameState.rats.some(
      (r) => r.hp === 2 && Math.hypot(r.x - gameState.player.x, r.y - gameState.player.y) < 170,
    ),
    "Space 連按近戰：老鼠水晶碎開後，還要再擊敗史萊姆。",
  );
  teach(
    "gaze",
    gameState.crackedWalls.some(
      (w) =>
        !w.broken &&
        Math.hypot(w.x + w.w / 2 - gameState.player.x, w.y + w.h / 2 - gameState.player.y) < 230,
    ),
    "牆後有風聲。靠近並面向它；上下方請按 ↑／↓ 觀察。",
  );
  teach(
    "wind",
    windAt(gameState.exploration, gameState.player),
    "順著風道上升，向左滑翔回培養室；按 ↓ 可抗風下降。",
  );
  teach(
    "root",
    gameState.exploration.obstacles.some(
      (o) => !o.broken && Math.hypot(o.x - gameState.player.x, o.y - gameState.player.y) < 150,
    ),
    "連按 Space：直斬割根、迴旋清枝、第三段打破薄障礙。",
  );
  teach(
    "bird",
    gameState.fauna.birds.some(
      (b) => b.hp && Math.hypot(b.x - gameState.player.x, b.y - gameState.player.y) < 190,
    ),
    "青影鳥會增殖！按 Q 映出鏡像，牠們會攻擊自己。",
  );
  teach(
    "spike",
    world.traps.some((t) => Math.hypot(t.x - gameState.player.x, t.y - gameState.player.y) < 180),
    "尖刺每三秒升降，等它收起再通過。",
  );
  teach(
    "charge",
    !gameState.crackedWalls.some((w) => w.id === "duct-intro" && !w.broken) &&
      gameState.rats.some(
        (r) =>
          r.hp &&
          Math.hypot(r.x - gameState.player.x, r.y - gameState.player.y) > 170 &&
          Math.hypot(r.x - gameState.player.x, r.y - gameState.player.y) < 330,
      ),
    `遠處按住 Space ${B.attack.chargeTime} 秒再放開：大型光彈。`,
  );
  teach(
    "dash",
    world.traps.some((t) => Math.hypot(t.x - gameState.player.x, t.y - gameState.player.y) < 180),
    "Shift 可以快速衝刺。",
  );
}
function captureCheckpoint() {
  return {
    time: gameState.time,
    kills: gameState.kills,
    deaths: gameState.deaths,
    checkpoint: { ...gameState.checkpoint },
    player: {
      hp: gameState.player.hp,
      abilities: { ...gameState.player.abilities },
      energy: gameState.player.energy,
      healCharge: gameState.player.healCharge,
    },
    rats: structuredClone(gameState.rats),
    fauna: {
      trees: structuredClone(gameState.fauna.trees),
      birds: structuredClone(gameState.fauna.birds),
      zones: structuredClone(gameState.fauna.zones),
    },
    walls: structuredClone(gameState.crackedWalls),
    exploration: structuredClone(gameState.exploration),
    lights: structuredClone(gameState.lights),
    rewards: structuredClone(gameState.rewards),
    torches: structuredClone(gameState.torches),
    seen: [...gameState.seen],
    activated: [...gameState.activated],
    bossDefeated: gameState.boss.hp === 0,
  };
}
function saveCheckpoint() {
  if (debugEnabled) {
    $("#save-status").textContent = "除錯模式不保存旅程；原存檔未變更。";
    return;
  }
  if (legacy) return;
  const state = captureCheckpoint();
  let result;
  try {
    result = writeSave(localStorage, world.version, world.seed, state);
  } catch {
    result = { ok: false, message: "本次無法保存，仍可繼續遊玩" };
  }
  if (result.ok) {
    gameState.saveInfo = { status: "ready", data: state };
    $("#save-status").textContent = "已保存至休息燈；關閉後可從這裡繼續。";
    guidance.saved(gameState.time);
    cues.play("save");
  } else {
    say(result.message, 6);
    $("#save-status").textContent = result.message;
  }
}
function loadCheckpointMenu() {
  if (debugEnabled) {
    $("#continue").hidden = true;
    $("#save-status").textContent = "除錯模式不讀寫旅程存檔。";
    return;
  }
  if (legacy) return;
  try {
    gameState.saveInfo = readSave(localStorage, world.version, world.seed);
  } catch {
    gameState.saveInfo = { status: "invalid" };
  }
  $("#continue").hidden = gameState.saveInfo.status !== "ready";
  $("#save-status").textContent =
    gameState.saveInfo.status === "ready"
      ? "找到休息燈存檔，可繼續冒險。"
      : gameState.saveInfo.status === "empty"
        ? ""
        : "舊存檔不相容或無法讀取，已保留；可確認後開始新冒險。";
}
function restoreCheckpoint(s) {
  try {
    reset();
    gameState.time = s.time;
    gameState.kills = s.kills;
    gameState.deaths = s.deaths;
    gameState.checkpoint = { ...s.checkpoint };
    Object.assign(gameState.player, s.player, {
      x: gameState.checkpoint.x,
      y: gameState.checkpoint.y,
      inv: gameState.time + B.player.respawnInvulnerability,
    });
    gameState.rats = structuredClone(s.rats);
    for (const r of gameState.rats) {
      r.x = r.spawn;
      r.y = r.y0;
      r.vy = 0;
      r.stun = 0;
      r.surface = null;
      r.state = "walk";
      r.timer = 0;
    }
    gameState.fauna = {
      ...createFauna(world),
      ...structuredClone(s.fauna),
      tornadoes: [],
      mirrorUntil: 0,
      mirrorReady: gameState.time,
    };
    resetFaunaAfterDeath(gameState.fauna);
    gameState.crackedWalls = structuredClone(s.walls);
    for (const w of gameState.crackedWalls)
      if (w.broken) {
        w.broken = false;
        breakWall({ energy: 999999 }, w, map, T, world.platforms);
      }
    gameState.exploration = structuredClone(s.exploration);
    gameState.exploration.gaze = null;
    gameState.exploration.elapsed = 0;
    gameState.exploration.echoUntil = 0;
    syncWinds(gameState.exploration, gameState.crackedWalls);
    syncStumps(world.platforms, gameState.fauna.trees);
    gameState.lights = structuredClone(s.lights);
    gameState.rewards = structuredClone(s.rewards);
    gameState.torches = structuredClone(s.torches);
    gameState.seen.clear();
    s.seen.forEach((v) => gameState.seen.add(v));
    gameState.activated = new Set(s.activated);
    if (s.bossDefeated) gameState.boss.hp = 0;
    gameState.nearLamp = world.safes.findIndex(
      (l) => l.x === gameState.checkpoint.x && l.y === gameState.checkpoint.y,
    );
    gameState.cameraSnap = true;
    gameState.magic = createMagic();
    healingFeedback.reset(gameState.player.hp);
    updateHud();
    return true;
  } catch {
    reset();
    gameState.saveInfo = { status: "invalid" };
    $("#continue").hidden = true;
    $("#save-status").textContent = "存檔內容無法還原，原資料已保留。可確認後開始新冒險。";
    return false;
  }
}
function update(dt) {
  if (gameState.mode === "reading") return;
  gameState.time += dt;
  syncForm();
  const dashStart = { x: gameState.player.x, y: gameState.player.y },
    wasDashing = gameState.player.dashRemaining > 0;
  const dx = Number(gameState.keys.has("right")) - Number(gameState.keys.has("left"));
  if (dx) gameState.player.face = dx;
  if (gameState.player.dashRemaining > 0)
    gameState.dashTrail.push({
      x: gameState.player.x,
      y: gameState.player.y,
      face: gameState.player.dashFace,
      until: gameState.time + 0.18,
    });
  syncWinds(gameState.exploration, gameState.crackedWalls);
  if (gameState.player.slimeForm) updateSlimePlayer(gameState.player, gameState.keys, dt, physics);
  else
    physics.player(
      gameState.player,
      gameState.keys,
      dt,
      windAt(gameState.exploration, gameState.player),
      (p, elapsed) => gustAt(world, p, gameState.time - dt + elapsed),
    );
  updateGustWarnings(world, gameState.time, gameState.time - dt, gameState.camera, canvas, (kind) =>
    cues.play(kind),
  );
  applySlimeHit();
  if (gameState.breachHold) {
    const target = wallTarget(true);
    if (
      !validBreachHold(
        gameState.breachHold,
        target,
        nearEnemy(),
        gameState.player.energy,
        BREACH_COST,
      )
    ) {
      gameState.breachHold = null;
      gameState.breachConsumed = true;
    } else if (gameState.time - gameState.breachHold.start >= BREACH_HOLD) {
      performBreach(target);
      gameState.breachHold = null;
      gameState.breachConsumed = true;
    }
  }
  gameState.dashTrail = gameState.dashTrail.filter((t) => t.until > gameState.time).slice(-10);
  if (wasDashing && gameState.player.abilities.dash) {
    for (const e of [
      ...gameState.rats,
      ...gameState.fauna.birds,
      ...(gameState.boss.active ? [gameState.boss] : []),
    ]) {
      const rx = e.radiusX || 20,
        ry = e.radiusY || 18;
      if (
        !e.hp ||
        gameState.dashHits.has(e) ||
        e.x < Math.min(dashStart.x, gameState.player.x) - rx - 11 ||
        e.x > Math.max(dashStart.x, gameState.player.x) + rx + 11 ||
        Math.abs(e.y - gameState.player.y) > ry + 11 ||
        !clearPath(gameState.player.x, gameState.player.y, e.x, e.y)
      )
        continue;
      gameState.dashHits.add(e);
      impact(e);
      const beforeHp = e.hp;
      e.hp = Math.max(0, e.hp - B.attack.dashDamage);
      enemyDamageSound(e, beforeHp);
      e.stun = gameState.time + B.attack.enemyStun;
      if (gameState.rats.includes(e)) {
        e.state = "rest";
        e.timer = B.attack.enemyHitRest;
      }
      if (!e.hp) gameState.kills++;
    }
  }
  if (gameState.comboQueue && gameState.time >= gameState.nextAttack) {
    gameState.comboQueue--;
    nextCombo();
  }
  if (
    gameState.slash &&
    gameState.slash.stage === 3 &&
    gameState.time < gameState.attackUntil - B.attack.activeEnd
  ) {
    const speed = gameState.keys.has(gameState.slash.face > 0 ? "right" : "left")
      ? B.attack.crossFullSpeed
      : B.attack.crossHalfSpeed;
    const steps = Math.max(1, Math.ceil((speed * dt) / 6));
    for (let i = 0; i < steps; i++) {
      move(gameState.player, (gameState.slash.face * speed * dt) / steps, 0);
      gameState.slash.x = gameState.player.x;
      gameState.slash.y = gameState.player.y;
      applyMelee();
    }
  }
  if (gameState.slash && gameState.time < gameState.attackUntil - B.attack.activeEnd) applyMelee();
  updateMagic(gameState.magic, dt, gameState.time, {
    solid,
    targets: [
      ...gameState.exploration.obstacles
        .filter((o) => !o.broken)
        .map((o) => ({ ...o, tree: true })),
      ...gameState.rats,
      ...gameState.fauna.birds,
      ...(gameState.boss.active ? [gameState.boss] : []),
      ...gameState.fauna.trees.map((t) => ({ ...t, radiusX: 27, radiusY: 35, tree: true })),
    ],
    hit: (e, damage = B.enemy.contactDamage) => {
      if (e.tree) return; // Tree bark blocks light; only melee can fell trees.
      impact(e, damage);
      const beforeHp = e.hp;
      e.hp = Math.max(0, e.hp - damage);
      enemyDamageSound(e, beforeHp);
      e.stun = gameState.time + B.attack.enemyStun;
      if (gameState.rats.includes(e)) {
        e.state = "rest";
        e.timer = B.attack.enemyHitRest;
        if (e.hp < 2 && !e.pure && !e.big) learn(gameState.exploration, "rat");
      }
      if (!e.hp) gameState.kills++;
    },
  });
  $("#magic").textContent =
    gameState.chargeStart === null
      ? "光彈 · F 切換"
      : gameState.time - gameState.chargeStart >= B.attack.chargeTime
        ? "蓄力完成 · 放開發射"
        : `蓄力 ${Math.min(100, Math.floor(((gameState.time - gameState.chargeStart) / B.attack.chargeTime) * 100))}%`;
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
  finishBoss();
  for (const r of gameState.rats) {
    if (!r.hp) continue;
    updateRat(r, gameState.player, physics, dt, gameState.time, clearPath);
    if (
      gameState.time >= r.stun &&
      Math.abs(gameState.player.x - r.x) < (r.bodyRadius || 14) + 13 &&
      Math.abs(gameState.player.y - r.y) < (r.bodyRadius || 14) + 10
    )
      hurt(r.big ? "紫色大史萊姆" : "老鼠", r.big ? B.enemy.bigDamage : B.enemy.contactDamage);
  }
  if (handheld) {
    $("#dash").innerHTML = gameState.player.slimeForm
      ? "X<small>變身中</small>"
      : `X<small>${gameState.player.dashCooldown > 0 ? gameState.player.dashCooldown.toFixed(1) + "s" : "衝刺"}</small>`;
    $("#dash").dataset.ready = gameState.player.dashCooldown <= 0;
  } else
    $("#dash").textContent = gameState.player.slimeForm
      ? "史萊姆無衝刺"
      : gameState.player.dashCooldown > 0
        ? `衝刺 ${gameState.player.dashCooldown.toFixed(1)}s`
        : "衝刺 Shift";
  if (handheld && !gameState.player.slimeForm && gameState.time >= gameState.fauna.mirrorReady) {
    const m = sceneMirrors.find(
      (m) =>
        Math.hypot(m.x - gameState.player.x, m.y - gameState.player.y) < 40 &&
        clearPath(gameState.player.x, gameState.player.y, m.x, m.y),
    );
    if (
      m &&
      gameState.fauna.birds.some(
        (b) =>
          b.hp &&
          b.mode !== "mirror" &&
          Math.hypot(b.x - m.x, b.y - m.y) <= 180 &&
          clearPath(m.x, m.y, b.x, b.y),
      )
    ) {
      const count = mirrorFauna(gameState.fauna, m, gameState.time, clearPath);
      if (count > 0) {
        sfx.play("mirror");
        learn(gameState.exploration, "bird");
      }
    }
  }
  const birdHealth = gameState.fauna.birds.map((e) => [e, e.hp]);
  gameState.kills += updateFauna(gameState.fauna, gameState.player, gameState.time, dt, {
    clear: clearPath,
    free,
    hurt,
    regionAt: world.regionAt,
    visible: (b) => {
      const cx = gameState.camera.x,
        cy = gameState.camera.y;
      return b.x >= cx && b.x <= cx + canvas.width && b.y >= cy && b.y <= cy + canvas.height;
    },
  });
  for (const [e, hp] of birdHealth) enemyDamageSound(e, hp);
  const bossState = gameState.boss.state;
  let summoned = false;
  updateBoss(gameState.boss, gameState.player, dt, gameState.time, {
    clear: clearPath,
    solid,
    hurt,
    summon: (kinds, i) => {
      summoned = true;
      const minions = bossSummons(
        gameState.boss,
        gameState.player,
        kinds,
        gameState.rats.filter((r) => r.bossMinion && r.hp > 0).length,
      );
      for (const r of minions) r.stun = gameState.time + B.boss.summonGrace;
      gameState.rats.push(...minions);
      say(`紅熊剩餘 ${B.boss.waves[i].ratio * 100}% 生命：召喚援軍！`, 3);
    },
    curse: () =>
      teach(
        "curse",
        true,
        handheld
          ? "變成史萊姆！B 跳躍／攀附、A 跳撞；等重踏掉落鏡子。"
          : "變成史萊姆！↑ 跳躍／攀附、Space 跳撞；等重踏掉落鏡子。",
      ),
    mirrorDrop: () => teach("mirror-drop", true, "重踏震落了鏡子！跳過震波，走近鏡子恢復。"),
    cured: () => {
      sfx.play("mirror");
      learn(gameState.exploration, "curse", "mirror-drop");
    },
    recoveryDrop: () => teach("recovery", true, "大塊綠色能量出現！拾取可回復一格生命。"),
    recovered: () => {
      updateHud();
      sfx.play("pickup", { kind: "relic" });
      learn(gameState.exploration, "recovery");
    },
  });
  if (summoned) sfx.play("bossSummon");
  if (
    gameState.boss.active &&
    gameState.boss.hp > 0 &&
    bossState !== "ready" &&
    gameState.boss.state === "ready"
  )
    sfx.play("bossWarn");
  syncForm();
  $("#mirror").textContent =
    gameState.time >= gameState.fauna.mirrorReady
      ? "鏡面 Q"
      : `鏡面 ${Math.ceil(gameState.fauna.mirrorReady - gameState.time)}s`;
  for (const trap of world.traps)
    if (trapSupported(trap, solid) && touchesSpikes(gameState.player, trap, gameState.time)) {
      hurt("針刺");
      break;
    }
  const pickupSounds = [];
  for (const reward of gameState.rewards)
    if (
      !reward.got &&
      Math.hypot(gameState.player.x - reward.x, gameState.player.y - reward.y) < 26 &&
      clearPath(gameState.player.x, gameState.player.y, reward.x, reward.y) &&
      collectReward(reward, gameState.player, MAX_WING, gameState.time)
    ) {
      pickupSounds.push(reward.kind === "relic" ? { kind: "relic" } : {});
      if (reward.kind === "relic") gameState.importantMessages.push(relicMessage(reward, handheld));
      gameState.pickupFlash = {
        x: reward.x,
        y: reward.y,
        until: gameState.time + 0.7,
        kind: reward.kind,
        amount: reward.amount || 1,
        healed: reward.healed || 0,
        percent: Math.round(((reward.restored || 0) / MAX_WING) * 100),
      };
      updateHud();
    }
  let collectedOrb = false;
  for (const l of gameState.lights)
    if (!l.got && Math.hypot(gameState.player.x - l.x, gameState.player.y - l.y) < 30) {
      l.got = true;
      collectedOrb = true;
      sfx.play("orb");
      updateHud();
      say(
        gameState.lights.every((p) => p.got)
          ? "三顆光點齊了！感應出口方向，繼續前進。"
          : "找到引路光點！繼續探索上下岔路。",
      );
    }
  if (!collectedOrb) for (const opts of pickupSounds) sfx.play("pickup", opts);
  const lamp = world.safes.findIndex(
    (s) => Math.hypot(gameState.player.x - s.x, gameState.player.y - s.y) < 45,
  );
  if (lamp >= 0 && gameState.nearLamp !== lamp) {
    const first = !gameState.activated.has(lamp);
    gameState.activated.add(lamp);
    gameState.checkpoint = { ...world.safes[lamp] };
    if (first) gameState.player.hp = MAX_HP;
    updateHud();
    saveCheckpoint();
  }
  gameState.nearLamp = lamp >= 0 ? lamp : null;
  if (
    !gameState.boss.active &&
    Math.hypot(gameState.player.x - world.exit.x, gameState.player.y - world.exit.y) < 42
  ) {
    if (gameState.lights.every((p) => p.got)) beginBoss();
    else teach("exit-locked", true, "出口需要 3 顆引路光點。");
  }
  if (
    gameState.mode === "playing" &&
    gameState.boss.active &&
    !gameState.boss.hp &&
    Math.hypot(gameState.player.x - world.arena.exit.x, gameState.player.y - world.arena.exit.y) <
      42
  ) {
    gameState.mode = "won";
    const played = sfx.play("levelClear");
    if (played && !sfx.muted && sfx.volume > 0) music.duck(1500);
    gameState.clearTouch();
    gameState.keys.clear();
    cancelAttackInput();
    panel(
      "第一關完成！",
      `擊敗紅熊，逃出培養所！探索 ${Math.floor(gameState.time / 60)} 分 ${Math.floor(gameState.time % 60)} 秒，擊退 ${gameState.kills} 隻敵人，返回 ${gameState.deaths} 次；藏品 ${gameState.rewards.filter((r) => r.kind === "relic" && r.got).length}/3。`,
      "再玩一次",
    );
  }
  const gazeKeys = handheld
    ? new Set([...gameState.keys].filter((k) => k !== "up"))
    : gameState.keys;
  if (handheld && gameState.keys.has("lookUp")) gazeKeys.add("up");
  const found = updateGaze(
    gameState.exploration,
    gameState.player,
    gazeKeys,
    gameState.crackedWalls,
    dt,
    physics.solid,
  );
  if (found) {
    learn(gameState.exploration, "gaze");
    cues.play("discover");
  }
  const fighting = [
    ...gameState.rats,
    ...gameState.fauna.birds,
    ...gameState.fauna.trees,
    ...(gameState.boss.active ? [gameState.boss] : []),
  ].some(
    (e) =>
      e.hp > 0 &&
      Math.hypot(gameState.player.x - e.x, gameState.player.y - e.y) < 220 &&
      clearPath(gameState.player.x, gameState.player.y, e.x, e.y),
  );
  const echo = collectEchoes(gameState.exploration, gameState.player, gameState.time, fighting);
  if (echo) {
    cues.play("discover");
    gameState.importantMessages.push({ kind: "echo", title: "勇者殘響", body: echo.text });
  }
  updateGuidance(
    gameState.exploration,
    {
      world,
      p: gameState.player,
      walls: gameState.crackedWalls,
      boss: gameState.boss,
      time: gameState.time,
      handheld,
    },
    guidance,
  );
  runTutorials();
  const melee = nearEnemy() || (gameState.comboStage > 0 && gameState.time <= gameState.comboUntil);
  $("#attack-mode").textContent = gameState.player.slimeForm
    ? "史萊姆跳撞"
    : gameState.chargeStart !== null
      ? "蓄力光彈"
      : melee
        ? "✦ 近戰連斬"
        : "◉ 光彈";
  $("#attack-mode").dataset.melee = melee;
  $("#region").textContent = gameState.boss.active
    ? "紅熊守門室"
    : world.regions?.[world.regionAt(gameState.player.x, gameState.player.y)]?.name || "探索中";
  updateCamera(
    gameState.camera,
    gameState.player,
    canvas.width,
    canvas.height,
    { w: W * T, h: H * T },
    dt,
    gameState.cameraSnap,
    {
      gentleDesktop: !handheld,
      moveDirection: Number(gameState.keys.has("right")) - Number(gameState.keys.has("left")),
    },
  );
  gameState.cameraSnap = false;
  discoverTorches(gameState.torches, gameState.player, clearPath);
  const cx = Math.floor(gameState.player.x / T),
    cy = Math.floor(gameState.player.y / T);
  for (let y = cy - 4; y <= cy + 4; y++)
    for (let x = cx - 6; x <= cx + 6; x++) if (map[y]?.[x] === 0) gameState.seen.add(`${x},${y}`);
  if (handheld) {
    const intent = attackIntent({
      melee,
      combo: false,
      wall: wallTarget(true),
      energy: gameState.player.energy,
      cost: BREACH_COST,
    });
    $(".attack").dataset.intent = intent;
    $(".attack small").textContent = gameState.player.slimeForm
      ? "跳撞"
      : gameState.breachHold
        ? Math.floor(((gameState.time - gameState.breachHold.start) / BREACH_HOLD) * 100) + "%"
        : intent === "breach"
          ? "長按破牆"
          : gameState.chargeStart !== null
            ? gameState.time - gameState.chargeStart >= B.attack.chargeTime
              ? "滿蓄力"
              : "蓄力"
            : "攻擊";
  }
  gameState.noticeUntil = guidance.until;
  showImportantMessages();
}
function rect(x, y, w, h, c) {
  g.fillStyle = c;
  g.fillRect(Math.round(x), Math.round(y), w, h);
}
function text(t, x, y, c = "#c5d9c5", size = 13) {
  g.fillStyle = c;
  g.font = `${size}px system-ui`;
  g.fillText(t, Math.round(x), Math.round(y));
}
function render() {
  healingFeedback.paintHud($("#hearts"), gameState.time);
  guidance.tick(
    gameState.time,
    gameState.mode,
    gameState.reduced,
    gameState.player,
    gameState.camera,
    canvas,
    gameState.crackedWalls,
    gameState.boss,
  );
  for (const [id, kind] of [
    ["#energy", "energy"],
    ["#healing", "wing"],
  ]) {
    const active =
      gameState.pickupFlash?.kind === kind && gameState.time < gameState.pickupFlash.until;
    $(id).classList.toggle("resource-flash", Boolean(active));
    $(id).style.transform =
      active && !gameState.reduced
        ? `translateY(${-Math.sin(Math.min(1, (gameState.pickupFlash.until - gameState.time) / 0.7) * Math.PI) * 2}px)`
        : "none";
  }
  $("#critical-vignette").style.opacity = criticalOpacity(
    gameState.player.hp,
    gameState.time,
    gameState.reduced,
  );
  g.imageSmoothingEnabled = false;
  if (gameState.cameraSnap) {
    updateCamera(
      gameState.camera,
      gameState.player,
      canvas.width,
      canvas.height,
      { w: W * T, h: H * T },
      0,
      true,
      {
        gentleDesktop: !handheld,
        moveDirection: 0,
      },
    );
    gameState.cameraSnap = false;
  }
  g.fillStyle = gameState.light ? "#b6c5ae" : "#14292e";
  g.fillRect(0, 0, canvas.width, canvas.height);
  g.save();
  g.translate(-Math.round(gameState.camera.x), -Math.round(gameState.camera.y));
  drawTerrain(
    g,
    map,
    T,
    gameState.camera,
    canvas.width,
    canvas.height,
    gameState.light,
    world.regionAt,
  );
  drawRegionFeatures(g, world, gameState.time, gameState.reduced, gameState.camera, canvas);
  drawExploration(
    g,
    gameState.exploration,
    world,
    gameState.player,
    gameState.time,
    gameState.reduced,
    gameState.camera,
    canvas,
    gameState.crackedWalls,
  );
  if (handheld) drawSceneMirrors(g, sceneMirrors, gameState.time, gameState.fauna.mirrorReady);
  for (const w of gameState.crackedWalls) {
    if (
      w.broken ||
      (world.version && !w.discovered) ||
      w.x > gameState.camera.x + canvas.width ||
      w.x + w.w < gameState.camera.x ||
      w.y > gameState.camera.y + canvas.height ||
      w.y + w.h < gameState.camera.y
    )
      continue;
    rect(w.x, w.y, w.w, w.h, "#625047");
    g.strokeStyle = "#f0ae6b";
    g.lineWidth = 3;
    if (w.axis === "vertical") {
      for (const oy of [8, w.h - 8]) {
        g.beginPath();
        g.moveTo(w.x + 4, w.y + oy);
        g.lineTo(w.x + 25, w.y + oy + 4);
        g.lineTo(w.x + 48, w.y + oy - 3);
        g.lineTo(w.x + 70, w.y + oy + 3);
        g.lineTo(w.x + w.w - 4, w.y + oy);
        g.stroke();
      }
    } else
      for (const ox of [8, w.w - 8]) {
        g.beginPath();
        g.moveTo(w.x + ox, w.y + 4);
        g.lineTo(w.x + ox + 4, w.y + 24);
        g.lineTo(w.x + ox - 3, w.y + 42);
        g.lineTo(w.x + ox + 3, w.y + 66);
        g.lineTo(w.x + ox, w.y + w.h - 4);
        g.stroke();
      }
    text(
      w.axis === "vertical" ? `↑↓ 裂面 ${BREACH_COST}` : `裂牆 · ${BREACH_COST}`,
      w.x + 9,
      w.y + 48,
      "#ffe0b1",
      12,
    );
  }
  // Wall fixtures remain visible while unlit; only actual nearby exploration ignites them.
  drawCrackGuidance(g, gameState.player, gameState.crackedWalls, gameState.time, gameState.reduced);
  for (const t of gameState.torches) {
    if (
      t.x < gameState.camera.x - 45 ||
      t.x > gameState.camera.x + canvas.width + 45 ||
      t.y < gameState.camera.y - 45 ||
      t.y > gameState.camera.y + canvas.height + 45
    )
      continue;
    const x = t.x,
      y = t.y;
    if (t.lit) {
      g.save();
      g.globalAlpha = gameState.light ? 0.09 : 0.14;
      rect(x - 28, y - 32, 56, 60, "#ffc36b");
      g.globalAlpha = gameState.light ? 0.12 : 0.18;
      rect(x - 17, y - 23, 34, 39, "#ffc36b");
      g.restore();
    }
    rect(x - 14, y - 1, 15, 4, "#505257");
    rect(x - 15, y - 8, 4, 15, "#777575");
    rect(x - 3, y - 1, 6, 15, "#6e513b");
    rect(x - 6, y - 4, 12, 5, t.lit ? "#a17b48" : "#62646a");
    if (t.lit) {
      const flicker = gameState.reduced ? 0 : Math.floor(gameState.time * 4 + t.node) % 2;
      rect(x - 5, y - 13, 10, 9, "#ec8a40");
      rect(x - 3, y - 19 - flicker, 6, 13 + flicker, "#ffd17a");
      rect(x - 1, y - 13, 3, 8, "#fff1b0");
    } else {
      rect(x - 4, y - 9, 8, 5, "#393b42");
      rect(x - 2, y - 11, 4, 3, "#707478");
    }
  }
  for (const p of world.platforms) {
    if (
      p.y >= gameState.camera.y &&
      p.y <= gameState.camera.y + canvas.height &&
      p.x + p.w >= gameState.camera.x &&
      p.x <= gameState.camera.x + canvas.width
    ) {
      rect(p.x, p.y, p.w, 3, "#7a9f9b");
      for (let x = p.x + 4; x < p.x + p.w; x += 16) rect(x, p.y + 3, 5, 3, "#405e5e");
    }
  }
  for (const trap of world.traps) {
    if (
      Math.abs(trap.x - gameState.player.x) > canvas.width ||
      Math.abs(trap.y - gameState.player.y) > canvas.height ||
      !trapSupported(trap, solid)
    )
      continue;
    drawSpikes(g, trap, gameState.time);
  }
  for (const mark of world.landmarks) {
    text(mark.name, mark.x - 65, mark.y - 54, "#b8cdb0", 15);
    rect(mark.x - 28, mark.y + 39, 56, 4, "#8aa695");
  }
  for (const reward of gameState.rewards) {
    if (
      reward.got ||
      reward.x < gameState.camera.x - 20 ||
      reward.x > gameState.camera.x + canvas.width + 20 ||
      reward.y < gameState.camera.y - 20 ||
      reward.y > gameState.camera.y + canvas.height + 20
    )
      continue;
    const x = reward.x,
      y =
        reward.y +
        (gameState.reduced ? 0 : Math.round(Math.sin(gameState.time * 2 + reward.node) * 2));
    if (reward.kind === "wing") drawPickupIcon(g, "wing", x, y);
    else if (reward.kind === "energy") {
      rect(x - 5, y - 5, 10, 10, "#f0a660");
      rect(x - 2, y - 2, 4, 4, "#ffefc0");
    } else drawPickupIcon(g, "relic", x, y);
  }

  if (gameState.pickupFlash && gameState.time < gameState.pickupFlash.until) {
    const k = gameState.pickupFlash;
    g.strokeStyle = k.kind === "wing" ? "#9ff0b6" : "#dfc5ff";
    g.lineWidth = 2;
    const size = gameState.reduced ? 14 : 14 + (1 - (k.until - gameState.time) / 0.7) * 18;
    g.strokeRect(k.x - size, k.y - size, size * 2, size * 2);
  }
  for (const l of gameState.lights) {
    if (l.got) continue;
    const bob = gameState.reduced ? 0 : Math.round(Math.sin(gameState.time * 3) * 3);
    rect(l.x - 9, l.y - 9 + bob, 18, 18, "#6a6951");
    rect(l.x - 5, l.y - 7 + bob, 10, 14, "#ffe6a0");
    rect(l.x - 7, l.y - 3 + bob, 14, 6, "#ffe6a0");
  }
  world.safes.forEach((safe, i) => {
    rect(safe.x - 12, safe.y - 15, 24, 30, "#58615a");
    rect(safe.x - 7, safe.y - 23, 14, 17, gameState.activated.has(i) ? "#ffe3a0" : "#9ab6ba");
    text("休息燈", safe.x - 23, safe.y + 35);
  });
  const ordinaryTarget = ordinaryWall(
    gameState.player,
    world,
    gameState.keys.has("down") ? "down" : gameState.keys.has("up") ? "up" : null,
  );
  if (ordinaryTarget) {
    g.strokeStyle = gameState.player.energy >= BREACH_COST ? "#edc78f" : "#877365";
    g.lineWidth = 2;
    g.strokeRect(ordinaryTarget.x, ordinaryTarget.y, ordinaryTarget.w, ordinaryTarget.h);
    text(`破牆 ${BREACH_COST}`, ordinaryTarget.x, ordinaryTarget.y - 5, "#edc78f", 12);
  }
  const ex = world.exit.x,
    ey = world.exit.y;
  rect(ex - 20, ey - 40, 40, 80, "#41685f");
  rect(ex - 13, ey - 34, 26, 68, gameState.lights.every((l) => l.got) ? "#dbe9ac" : "#789789");
  text("紅熊守門室", ex - 36, ey - 52);
  function sprite(index, x, y, width, height, flip = false) {
    if (!gameState.faunaImage) return;
    const f = gameState.faunaFrames[index];
    g.save();
    g.translate(Math.round(x), Math.round(y));
    if (flip) g.scale(-1, 1);
    g.drawImage(gameState.faunaImage, f.x, f.y, f.w, f.h, -width / 2, -height / 2, width, height);
    g.restore();
  }
  for (const t of gameState.fauna.trees) {
    if (
      Math.abs(t.x - gameState.player.x) > canvas.width ||
      Math.abs(t.y - gameState.player.y) > canvas.height
    )
      continue;
    if (!t.hp) {
      rect(t.x - 15, t.y + 20, 30, 15, "#684f38");
      continue;
    }
    sprite(t.state === "strike" ? 3 : 2, t.x, t.y, 64, 70);
    if (t.casting > 0) text("旋風蓄力", t.x - 30, t.y - 50, "#a4ed9c", 12);
    if (t.state === "ready") text("!", t.x - 4, t.y - 43, "#ffca7b", 22);
    if (t.state === "strike") {
      g.strokeStyle = "#d4ac76";
      g.strokeRect(t.x - 70, t.y - 25, 140, 50);
    }
  }
  for (const b of gameState.fauna.birds) {
    if (
      !b.hp ||
      Math.abs(b.x - gameState.player.x) > canvas.width ||
      Math.abs(b.y - gameState.player.y) > canvas.height
    )
      continue;
    sprite(gameState.reduced ? 0 : Math.floor(gameState.time * 6) % 2, b.x, b.y, 48, 36, b.dx < 0);
    if (b.mode === "ready") text("!", b.x - 3, b.y - 27, "#83ecec", 18);
    if (b.mode === "mirror") {
      g.strokeStyle = "#adeafa";
      g.strokeRect(b.x - 28, b.y - 26, 56, 52);
      sprite(1, b.x + 16, b.y, 24, 18, true);
    }
  }
  drawTornadoes(g, gameState.fauna.tornadoes, gameState.time, gameState.reduced);
  for (const z of gameState.fauna.zones)
    if (
      z.seen &&
      z.elapsed > 1 &&
      gameState.fauna.birds.some((b) => b.hp && b.zone === z.id) &&
      Math.hypot(z.x - gameState.player.x, z.y - gameState.player.y) < 320
    )
      text("影子正在聚集…", z.x - 40, z.y - 40, "#88d5df", 12);
  if (gameState.time < gameState.fauna.mirrorUntil) {
    g.strokeStyle = "#bceefa";
    g.lineWidth = 3;
    g.strokeRect(gameState.player.x - 24, gameState.player.y - 38, 48, 76);
  }
  for (const r of gameState.rats) {
    if (!r.hp) continue;
    const f =
      r.state === "ready"
        ? 2
        : r.state === "dash" || r.state === "jump"
          ? 3
          : Math.floor(gameState.time * 7) % 2;
    g.save();
    g.translate(Math.round(r.x), Math.round(r.y));
    if (r.surface === "right") g.rotate(-Math.PI / 2);
    else if (r.surface === "left") g.rotate(Math.PI / 2);
    else if (r.surface === "ceiling") g.rotate(Math.PI);
    if (r.face < 0) g.scale(-1, 1);
    const sprite = gameState.enemyFrames[(isSlime(r) ? 4 : 0) + f];
    const width = r.big ? 52 : isSlime(r) ? 32 : 56,
      height = (width * sprite.h) / sprite.w;
    if (r.big) g.filter = "hue-rotate(175deg) saturate(0.85)";
    g.drawImage(
      gameState.ratImage,
      sprite.x,
      sprite.y,
      sprite.w,
      sprite.h,
      -width / 2,
      (r.bodyRadius || 14) - height,
      width,
      height,
    );
    g.filter = "none";
    if (gameState.time < r.stun) {
      g.strokeStyle = "#c7ffa1";
      g.strokeRect(-width / 2 - 3, 10 - height, width + 6, height + 8);
    }
    g.restore();
    if (r.state === "ready") text("!", r.x - 4, r.y - 32, "#f3bc79", 23);
  }
  if (gameState.drawHero && !gameState.reduced)
    for (const t of gameState.dashTrail) {
      g.globalAlpha = Math.max(0, (t.until - gameState.time) / 0.18) * 0.25;
      gameState.drawHero(
        g,
        1,
        0,
        t.face < 0,
        Math.round(t.x - (t.face < 0 ? 28 : 36)),
        Math.round(t.y - 30),
      );
    }
  g.globalAlpha = 1;
  if (gameState.player.dashRemaining > 0) {
    for (const dy of [-13, 0, 13]) {
      const len = gameState.reduced ? 12 : 30;
      rect(
        gameState.player.x -
          gameState.player.dashFace * 30 -
          (gameState.player.dashFace > 0 ? len : 0),
        gameState.player.y + dy,
        len,
        2,
        "#b4ecf1",
      );
    }
  }
  if (gameState.boss.active) {
    const a = world.arena;
    rect(a.exit.x - 18, a.floor - 80, 36, 80, gameState.boss.hp ? "#673847" : "#bce1a1");
    text(gameState.boss.hp ? "擊敗紅熊開門" : "出口", a.exit.x - 35, a.floor - 90);
    drawBossEffects(g, gameState.boss, gameState.time, gameState.reduced);
    for (const m of gameState.boss.mirrors)
      text(m.landed ? "拾取破解鏡" : "鏡子掉落", m.x - 32, m.y - 30, "#d7fff5", 12);
    if (gameState.boss.hp) {
      paintBoss(g, gameState.boss, gameState.time, gameState.reduced, (ctx) => {
        if (gameState.boss.cursed && gameState.drawHero)
          gameState.drawHero(
            ctx,
            1,
            wingFrame(gameState.time, gameState.reduced),
            gameState.boss.face < 0,
            gameState.boss.x - 32,
            gameState.boss.y - 30,
          );
        else drawBear(ctx, gameState.boss, gameState.time, gameState.reduced, false);
      });
      drawBossTelegraph(g, gameState.boss);
      text(
        gameState.boss.state === "ready" ? BOSS_ATTACK_LABELS[gameState.boss.attack] : "紅熊",
        gameState.boss.x - 55,
        gameState.boss.y - 63,
        "#ffbfae",
        14,
      );
    }
  }
  if (gameState.drawHero) {
    const moving =
      gameState.player.dashRemaining > 0 ||
      gameState.keys.has("left") ||
      gameState.keys.has("right") ||
      gameState.keys.has("up") ||
      gameState.keys.has("down");
    const attacking = gameState.time < gameState.attackUntil;
    const row = attacking ? 3 : moving ? 1 : 0;
    const f = attacking
      ? Math.min(5, Math.floor((0.3 - (gameState.attackUntil - gameState.time)) / 0.05))
      : gameState.player.gliding
        ? 0
        : gameState.reduced
          ? 0
          : Math.floor(gameState.time * 8) % 6;
    g.globalAlpha =
      gameState.time < gameState.player.inv
        ? gameState.reduced
          ? 0.65
          : Math.floor(gameState.time * 10) % 2 === 0
            ? 0.45
            : 1
        : 1;
    if (gameState.boss.cursed) {
      const sf =
        gameState.enemyFrames[
          4 +
            (gameState.player.slimeAttack > 0
              ? 3
              : gameState.player.grounded
                ? Math.floor(gameState.time * 7) % 2
                : 2)
        ];
      g.save();
      g.translate(Math.round(gameState.player.x), Math.round(gameState.player.y));
      if (gameState.player.surface === "right") g.rotate(-Math.PI / 2);
      else if (gameState.player.surface === "left") g.rotate(Math.PI / 2);
      else if (gameState.player.surface === "ceiling") g.rotate(Math.PI);
      if (gameState.player.face < 0) g.scale(-1, 1);
      g.drawImage(gameState.ratImage, sf.x, sf.y, sf.w, sf.h, -18, -17, 36, 28);
      g.restore();
      g.strokeStyle = "#e2ffe9";
      g.lineWidth = 2;
      g.beginPath();
      g.ellipse(gameState.player.x, gameState.player.y, 23, 20, 0, 0, Math.PI * 2);
      g.stroke();
      text("你 · 史萊姆", gameState.player.x - 30, gameState.player.y - 30, "#d7fff5", 12);
    } else
      gameState.drawHero(
        g,
        row,
        f,
        gameState.player.face < 0,
        Math.round(gameState.player.x - (gameState.player.face < 0 ? 28 : 36)),
        Math.round(gameState.player.y - 30),
      );
    g.globalAlpha = 1;
    if (attacking && gameState.slash)
      drawSlash(
        g,
        gameState.slash,
        1 - (gameState.attackUntil - gameState.time) / 0.3,
        gameState.reduced,
        gameState.slashStyle,
      );
  }
  if (gameState.chargeStart !== null) {
    const q = Math.min(1, (gameState.time - gameState.chargeStart) / B.attack.chargeTime),
      cx = gameState.player.x + gameState.player.face * 24;
    g.save();
    g.strokeStyle = q >= 1 ? "#ffffff" : "#8edcff";
    g.lineWidth = 3;
    g.beginPath();
    g.arc(cx, gameState.player.y, 7 + q * 12, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = "#b8efff";
    g.beginPath();
    g.arc(cx, gameState.player.y, 3 + q * 7, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  drawEffects(g, gameState.magic, gameState.time, gameState.reduced);
  healingFeedback.draw(g, gameState.player, gameState.time, gameState.reduced);
  g.restore();
  if (gameState.time < gameState.hurtUntil) {
    g.save();
    g.strokeStyle = "#ed9a9a";
    g.lineWidth = 5;
    g.globalAlpha = gameState.reduced ? 0.5 : (gameState.hurtUntil - gameState.time) / 0.35;
    g.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);
    g.restore();
  }
  if (gameState.boss.active) {
    rect(canvas.width / 2 - 135, 7, 270, gameState.boss.cursed ? 58 : 38, "#17242a");
    rect(canvas.width / 2 - 120, 14, 240, 8, "#482b36");
    rect(
      canvas.width / 2 - 120,
      14,
      (240 * gameState.boss.hp) / gameState.boss.maxHp,
      8,
      "#d7777c",
    );
    text(
      `紅熊 ${gameState.boss.hp} / ${gameState.boss.maxHp}`,
      canvas.width / 2 - 120,
      38,
      "#ffe1d0",
      12,
    );
    if (gameState.boss.cursed)
      text("史萊姆：拾取重踏掉落的鏡子", canvas.width / 2 - 120, 57, "#b6e7c9", 12);
  }
  // Explored-only overview; no undiscovered paths are revealed.
  if (!gameState.boss.active) {
    const scale = Math.min(canvas.width < 600 ? 0.55 : 0.8, 130 / H),
      mx = canvas.width - W * scale - 18,
      my = 14;
    rect(mx - 6, my - 6, W * scale + 12, H * scale + 24, "#0f2029");
    for (const s of gameState.seen) {
      const [x, y] = s.split(",").map(Number);
      rect(mx + x * scale, my + y * scale, Math.max(1, scale), Math.max(1, scale), "#617b70");
    }
    for (const l of gameState.lights)
      if (!l.got && gameState.seen.has(`${Math.floor(l.x / T)},${Math.floor(l.y / T)}`))
        rect(mx + (l.x / T) * scale, my + (l.y / T) * scale, 3, 3, "#ffe6a0");
    for (const r of gameState.rewards)
      if (!r.got && gameState.seen.has(`${Math.floor(r.x / T)},${Math.floor(r.y / T)}`))
        rect(
          mx + (r.x / T) * scale,
          my + (r.y / T) * scale,
          r.kind === "relic" ? 3 : 2,
          r.kind === "relic" ? "#cfadf4" : r.kind === "wing" ? "#78df99" : "#f0a660",
        );
    for (const w of gameState.crackedWalls)
      if (w.discovered) {
        g.strokeStyle = w.broken ? "#9bdcbf" : "#dca36b";
        g.strokeRect(mx + (w.x / T) * scale, my + (w.y / T) * scale, 4, 4);
      }
    for (const [i, l] of world.safes.entries())
      if (gameState.activated.has(i)) {
        rect(mx + (l.x / T) * scale, my + (l.y / T) * scale, 3, 3, "#ffe7b1");
      }
    rect(
      mx + (gameState.player.x / T) * scale,
      my + (gameState.player.y / T) * scale,
      3,
      3,
      "#9ef1db",
    );
    text("已探索", mx + 4, my + H * scale + 12, "#bad0bd", 10);
  }
  const px = gameState.player.x - gameState.camera.x,
    py = gameState.player.y - gameState.camera.y;
  if (!gameState.player.slimeForm) {
    rect(px - 20, py + 36, 40, 4, "#42524a");
    rect(px - 20, py + 36, (40 * gameState.player.wing) / MAX_WING, 4, "#b8dab5");
  }
  if (gameState.comboStage && gameState.time <= gameState.comboUntil)
    text(["", "Ⅰ 直斬", "Ⅱ 迴旋", "Ⅲ 十字"][gameState.comboStage], px - 24, py - 40, "#ffe1ac", 11);
  if (gameState.breachHold) {
    const q = Math.min(1, (gameState.time - gameState.breachHold.start) / BREACH_HOLD);
    rect(px - 26, py - 46, 52, 6, "#283c25");
    rect(px - 26, py - 46, 52 * q, 6, "#c5dd98");
    text("破牆", px - 14, py - 51, "#dbe9ba", 11);
  }
  if (gameState.chargeStart !== null)
    text(
      gameState.time - gameState.chargeStart >= B.attack.chargeTime
        ? "放開發射"
        : `蓄力 ${Math.min(100, Math.floor(((gameState.time - gameState.chargeStart) / B.attack.chargeTime) * 100))}%`,
      px - 32,
      py - 40,
      "#bdefff",
      11,
    );
  text(
    `${Math.floor(gameState.time / 60)}:${String(Math.floor(gameState.time % 60)).padStart(2, "0")}`,
    14,
    24,
    "#bed0bd",
    12,
  );
}
function drawJourneyMap() {
  const c = $("#journey-map"),
    ctx = c.getContext("2d"),
    scale = Math.min((c.width - 24) / W, (c.height - 24) / H),
    ox = (c.width - W * scale) / 2,
    oy = 8;
  ctx.fillStyle = "#adbe87";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = "#263b29";
  for (const cell of gameState.seen) {
    const [x, y] = cell.split(",").map(Number);
    ctx.fillRect(ox + x * scale, oy + y * scale, Math.max(1, scale), Math.max(1, scale));
  }
  ctx.strokeStyle = "#233522";
  for (const w of gameState.crackedWalls)
    if (w.discovered) ctx.strokeRect(ox + (w.x / T) * scale - 2, oy + (w.y / T) * scale - 2, 6, 6);
  const px = ox + (gameState.player.x / T) * scale,
    py = oy + (gameState.player.y / T) * scale;
  ctx.fillStyle = "#000";
  ctx.fillRect(px - 5, py - 1, 11, 3);
  ctx.fillRect(px - 1, py - 5, 3, 11);
}
function loop(now) {
  gameState.debug?.frame(now);
  const dt = Math.min(0.05, gameState.last ? (now - gameState.last) / 1000 : 0);
  gameState.last = now;
  if (gameState.mode === "playing") {
    if (gameState.hitStop > 0) gameState.hitStop = Math.max(0, gameState.hitStop - dt);
    else update(dt);
  }
  syncMusic();
  syncChargeSound();
  combatSounds.flush();
  if (gameState.player && gameState.ratImage) render();
  requestAnimationFrame(loop);
}
try {
  [gameState.drawHero, gameState.ratImage] = await Promise.all([
    loadHero(),
    (async () => {
      const im = new Image();
      im.src = new URL("../assets/sprites/rats.png", import.meta.url).href;
      await im.decode();
      return im;
    })(),
  ]);
  for (let row = 0; row < 2; row++)
    for (let col = 0; col < 4; col++) {
      const cw = Math.floor(gameState.ratImage.width / 4),
        ch = Math.floor(gameState.ratImage.height / 2),
        c = document.createElement("canvas");
      c.width = cw;
      c.height = ch;
      const ctx = c.getContext("2d");
      ctx.drawImage(gameState.ratImage, col * cw, row * ch, cw, ch, 0, 0, cw, ch);
      const data = ctx.getImageData(0, 0, cw, ch).data;
      let l = cw,
        t = ch,
        r = 0,
        b = 0;
      for (let y = 0; y < ch; y++)
        for (let x = 0; x < cw; x++)
          if (data[(y * cw + x) * 4 + 3] > 100) {
            l = Math.min(l, x);
            r = Math.max(r, x);
            t = Math.min(t, y);
            b = Math.max(b, y);
          }
      gameState.enemyFrames.push({
        x: col * cw + l,
        y: row * ch + t,
        w: Math.max(1, r - l + 1),
        h: Math.max(1, b - t + 1),
      });
    }
  gameState.faunaImage = new Image();
  gameState.faunaImage.src = new URL("../assets/sprites/fauna.png", import.meta.url).href;
  await gameState.faunaImage.decode();
  for (let row = 0; row < 2; row++)
    for (let col = 0; col < 2; col++) {
      const w = gameState.faunaImage.width / 2,
        h = gameState.faunaImage.height / 2,
        c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      ctx.drawImage(gameState.faunaImage, col * w, row * h, w, h, 0, 0, w, h);
      const d = ctx.getImageData(0, 0, w, h).data;
      let left = w,
        top = h,
        right = 0,
        bottom = 0;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++)
          if (d[(y * w + x) * 4 + 3] > 100) {
            left = Math.min(left, x);
            right = Math.max(right, x);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
          }
      gameState.faunaFrames.push({
        x: col * w + left,
        y: row * h + top,
        w: right - left + 1,
        h: bottom - top + 1,
      });
    }
  reset();
  gameState.mode = "intro";
  loadCheckpointMenu();
  if (debugEnabled) {
    const { createDebugPanel } = await import("./debug.mjs");
    gameState.debug = createDebugPanel({
      state: () => ({
        player: gameState.player,
        boss: gameState.boss,
        rats: gameState.rats,
        fauna: gameState.fauna,
      }),
      refresh: updateHud,
      clearInput: () => {
        gameState.clearTouch();
        gameState.keys.clear();
        cancelAttackInput();
      },
      jumpToBoss: () => {
        if (gameState.mode === "reading") return false;
        gameState.lights.forEach((light) => (light.got = true));
        beginBoss();
        resume();
        return true;
      },
    });
  }
  $("#start").disabled = false;
  $("#start").textContent = "開始新冒險";
  requestAnimationFrame(loop);
} catch (e) {
  $("#description").textContent = "素材載入失敗，請重新整理或確認本機伺服器。";
  console.error(e);
}
// Read-only snapshot for playthrough checks; game state is never exposed for mutation.
window.levelSnapshot = (includeMap = false) => ({
  mode: gameState.mode,
  healing: healingFeedback.event ? { ...healingFeedback.event } : null,
  levelVersion: world.version,
  seed: world.seed,
  exploration: structuredClone(gameState.exploration),
  camera: { ...gameState.camera },
  boss: { ...gameState.boss },
  slashStyle: gameState.slashStyle,
  magic: JSON.parse(JSON.stringify(gameState.magic)),
  fauna: JSON.parse(JSON.stringify(gameState.fauna)),
  player: { ...gameState.player },
  lights: gameState.lights.map((l) => ({ ...l })),
  rats: gameState.rats.map((r) => ({ ...r })),
  rewards: gameState.rewards.map((r) => ({ ...r })),
  torches: gameState.torches.map((t) => ({ ...t })),
  crackedWalls: gameState.crackedWalls.map((w) => ({ ...w })),
  checkpoint: { ...gameState.checkpoint },
  kills: gameState.kills,
  time: gameState.time,
  map: includeMap ? map.map((r) => r.slice()) : undefined,
  exit: { ...world.exit },
  safes: world.safes.map((s) => ({ ...s })),
  traps: world.traps.map((t) => ({ ...t, ...spikeState(gameState.time) })),
  deaths: gameState.deaths,
});
