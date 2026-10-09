import { resetBoss } from "../boss.mjs";
import { resetFaunaAfterDeath } from "../fauna.mjs";
import { createCombat } from "../systems/combat.mjs";
import { createEvents } from "../core/events.mjs";
import { subscribeFeedback } from "../ui/event-feedback.mjs";
import { createState } from "../core/state.mjs";
import { createHealingFeedback, createBossPainter } from "../feedback.mjs";
import { createGuidance } from "../guidance.mjs";
import { createMessageCard } from "../message-card.mjs";
import { createCombatSounds } from "../combat-sounds.mjs";
import { createSfx } from "../sfx.mjs";
import {
  SFX_LEVELS,
  SFX_DEFAULT,
  SFX_KEY,
  MUSIC_KEY,
  readAudioLevel,
  saveAudioLevel,
} from "../audio-settings.mjs";
import { createMusic, MUSIC_VOLUME, MUSIC_LEVELS } from "../music.mjs";
import { createExploration } from "../exploration.mjs";
import { createBoss, bossGateSolid } from "../boss.mjs";
import { createMagic } from "../magic.mjs";
import { createPhysics } from "../physics.mjs";
export function setupRuntime(app) {
  app.gameState = createState({
    exploration: createExploration(app.world),
    boss: createBoss(app.world),
    magic: createMagic(),
    reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
    lastSfxVolume: SFX_DEFAULT,
  });
  app.events = createEvents();
  app.physics = createPhysics(
    app.map,
    app.T,
    app.world.platforms,
    (x, y) =>
      bossGateSolid(app.gameState.boss, x, y) ||
      app.gameState.exploration.obstacles.some(
        (o) =>
          !o.broken &&
          x > o.x - o.w / 2 &&
          x < o.x + o.w / 2 &&
          y > o.y - o.h / 2 &&
          y < o.y + o.h / 2,
      ),
  );
  app.solid = (x, y) =>
    app.map[Math.floor(y / app.T)]?.[Math.floor(x / app.T)] !== 0 ||
    bossGateSolid(app.gameState.boss, x, y);
  app.healingFeedback = createHealingFeedback();
  app.paintBoss = createBossPainter();
  app.guidance = createGuidance(app.$("#notice"), app.handheld);
  app.messageCard = createMessageCard({
    handheld: app.handheld,
    onClose: () => {
      if (app.gameState.importantMessages.length) {
        app.messageCard.show(app.gameState.importantMessages.shift());
        return;
      }
      app.gameState.mode = "playing";
      app.gameState.clearTouch();
      app.gameState.keys.clear();
      app.cancelAttackInput();
      app.gameState.last = 0;
      app.syncMusic();
      app.canvas.focus();
    },
  });
  app.combat = createCombat({
    resetBoss,
    resetFaunaAfterDeath,
    gameState: app.gameState,
    events: app.events,
    updateHud: app.updateHud,
    cancelAttackInput: app.cancelAttackInput,
    syncForm: app.syncForm,
    say: app.say,
    enemyDamageSound: app.enemyDamageSound,
  });
  app.sfx = createSfx({ volume: SFX_DEFAULT });
  app.combatSounds = createCombatSounds(app.sfx);
  app.setSfxVolume(
    readAudioLevel(SFX_KEY, SFX_LEVELS, SFX_DEFAULT, "eye-creature.sound-muted"),
    false,
  );
  app.$("#sfx-volume").onchange = () => app.setSfxVolume(Number(app.$("#sfx-volume").value) / 100);
  app.music = createMusic({
    onChange: (state) => {
      const button = app.$("#music");
      const percent = Math.round(state.volume * 100);
      button.textContent = state.error
        ? "音樂未能播放・點此重試"
        : state.muted
          ? "背景音樂：關"
          : !state.unlocked
            ? `播放標題音樂 · ${percent}％`
            : `背景音樂：${percent}％`;
      app.$("#music-volume").value = String(state.muted ? 0 : percent);
      button.setAttribute("aria-pressed", String(state.unlocked && !state.muted));
    },
  });
  subscribeFeedback(app.events, {
    gameState: app.gameState,
    sfx: app.sfx,
    cues: app.cues,
    music: app.music,
    combatSounds: app.combatSounds,
    healingFeedback: app.healingFeedback,
    paintHud: app.paintHud,
  });
  app.$("#music").onclick = () => {
    const state = app.music.snapshot();
    app.syncMusic();
    if (state.muted) {
      app.music.setMuted(false);
      app.music.unlock();
    } else if (state.error || !state.unlocked) app.music.unlock();
    else app.music.setMuted(true);
    saveAudioLevel(MUSIC_KEY, app.music.snapshot().muted ? 0 : app.music.snapshot().volume);
  };
  app.$("#music-volume").onchange = () => {
    app.syncMusic();
    app.music.setVolume(Number(app.$("#music-volume").value) / 100);
    if (!app.music.snapshot().muted) app.music.unlock();
    saveAudioLevel(MUSIC_KEY, app.music.snapshot().muted ? 0 : app.music.snapshot().volume);
  };
  for (const [name, listener] of Object.entries({
    magicHudChanged: app.paintMagicHud,
    dashHudChanged: app.paintDashHud,
    mirrorHudChanged: app.paintMirrorHud,
    actionHudChanged: app.paintActionHud,
    handheldHudChanged: app.paintHandheldHud,
    overlayHudChanged: app.paintOverlayHud,
  }))
    app.events.on(name, listener);
  app.music.setVolume(readAudioLevel(MUSIC_KEY, MUSIC_LEVELS, MUSIC_VOLUME));
}
