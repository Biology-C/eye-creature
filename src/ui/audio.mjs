import { BALANCE as B } from "../config/balance.mjs";
import { SFX_LEVELS, SFX_KEY, saveAudioLevel } from "../audio-settings.mjs";
export function installAudio(app) {
  function setSfxVolume(value, persist = true) {
    if (!SFX_LEVELS.includes(value)) return;
    if (value > 0) app.gameState.lastSfxVolume = value;
    app.sfx.volume = value;
    app.sfx.muted = value === 0;
    app.cues.volume = value;
    app.cues.muted = value === 0;
    app.$("#sfx-volume").value = String(Math.round(value * 100));
    app.$("#sound").textContent = value === 0 ? "音效：關" : "音效：開";
    app.$("#sound").setAttribute("aria-pressed", String(value === 0));
    if (persist) saveAudioLevel(SFX_KEY, value);
  }
  function syncMusic() {
    app.events.emit("musicChanged");
  }
  function syncChargeSound() {
    const on =
      app.gameState.mode === "playing" &&
      app.gameState.player &&
      !app.gameState.player.slimeForm &&
      app.gameState.chargeStart !== null &&
      app.gameState.time - app.gameState.chargeStart >= B.attack.chargeSoundDelay;
    if (on)
      app.events.emit("chargeChanged", {
        elapsed: app.gameState.time - app.gameState.chargeStart,
        full: B.attack.chargeTime,
      });
    else app.events.emit("chargeStopped");
  }
  Object.assign(app, { setSfxVolume, syncMusic, syncChargeSound });
}
