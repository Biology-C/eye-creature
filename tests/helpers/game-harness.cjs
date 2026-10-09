// Test-only scope for existing regression scenarios. Nothing is exported to window in production.
const imports = `import { createCombat, setHealth, restoreActor } from "./systems/combat.mjs";
import { createEvents } from "./core/events.mjs";
import { subscribeFeedback } from "./ui/event-feedback.mjs";
import { createState, resetState } from "./core/state.mjs";
import { BALANCE as B } from "./config/balance.mjs";
import {
  installRegionFeatures,
  gustAt,
  updateGustWarnings,
  drawRegionFeatures,
} from "./region-features.mjs";
import { createHealingFeedback, wingFrame, createBossPainter } from "./feedback.mjs";
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
import { createMusic, MUSIC_VOLUME, MUSIC_LEVELS } from "./music.mjs";
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
import { createPureSlimes, createBigSlimes, isSlime } from "./slime.mjs";
import { drawTerrain } from "./terrain.mjs";
import { drawTornadoes } from "./tornado.mjs";
import {
  addBossArena,
  createBoss,
  enterBoss,
  updateBoss,
  drawBear,
  drawBossEffects,
  drawBossTelegraph,
  bossGateSolid,
  bossSummons,
  BOSS_ATTACK_LABELS,
} from "./boss.mjs";
import { inMelee } from "./hit-geometry.mjs";
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
import { markBossHit } from "./feedback.mjs";`;
function instrumentGame(source) {
  return (
    imports +
    "\n" +
    source +
    `
 const gameState = app.gameState;
 const originalRender = app.render;
 app.render = () => { if (!window.fast) originalRender(); };
 for (const key of Object.keys(app)) Object.defineProperty(window,key,{configurable:true,get:()=>app[key],set:value=>{app[key]=value;}});
 for (const key of Object.keys(gameState)) Object.defineProperty(window,key,{configurable:true,get:()=>gameState[key],set:value=>{gameState[key]=value;}});
 `
  );
}
module.exports = { instrumentGame };
