import { markBossHit } from "../feedback.mjs";
import { musicScene } from "../music.mjs";

// Subscribers own presentation; gameplay never waits for audio or rendering.
export function subscribeFeedback(
  events,
  { gameState: s, sfx, cues, music, combatSounds, healingFeedback, paintHud },
) {
  let observedHp = null;
  const subscriptions = [];
  const on = (name, handler) => subscriptions.push(events.on(name, handler));
  const damage = ({ enemy, before, boss, crystalRat }) => {
    if (boss) markBossHit(enemy, before, s.time);
    combatSounds.damaged(enemy, before, { boss, crystalRat });
  };
  on("enemyHit", damage);
  on("enemyDefeated", damage);
  on("playerHurt", ({ dead }) => sfx.play(dead ? "death" : "hurt"));
  on("meleeStarted", ({ stage }) => sfx.play("slash" + stage));
  on("lightFired", ({ charged }) => sfx.play(charged ? "chargedShot" : "shot"));
  on("dashStarted", () => sfx.play("dash"));
  on("mirrorUsed", () => sfx.play("mirror"));
  on("playerTransformed", () => sfx.play("curse"));
  on("bossPhase", ({ phase }) => sfx.play(phase === "summon" ? "bossSummon" : "bossWarn"));
  on("pickup", (opts) => sfx.play("pickup", opts));
  on("orbCollected", () => sfx.play("orb"));
  on("wallBroken", () => {
    if (!sfx.play("breakWall")) cues.play("break");
  });
  on("obstacleBroken", () => cues.play("break"));
  on("checkpointSaved", () => cues.play("save"));
  on("discovered", () => cues.play("discover"));
  on("adventureStarted", () => cues.play("start"));
  on("gustWarning", (kind) => cues.play(kind));
  on("chargeChanged", ({ elapsed, full }) => sfx.startCharge(elapsed, full));
  on("chargeStopped", () => sfx.stopCharge());
  on("combatFeedbackCleared", () => combatSounds.clear());
  on("combatFeedbackFlush", () => combatSounds.flush());
  on("musicReset", () => music.clearDuck());
  on("musicChanged", () =>
    music.setState(
      musicScene(s.mode, s.boss),
      s.musicInBackground ||
        document.hidden ||
        s.mode === "paused" ||
        s.mode === "reading" ||
        s.mode === "loading",
    ),
  );
  on("levelCleared", () => {
    const played = sfx.play("levelClear");
    if (played && !sfx.muted && sfx.volume > 0) music.duck(1500);
  });
  on("healthFeedbackReset", () => {
    observedHp = s.player.hp;
    healingFeedback.reset(observedHp);
  });
  on("playerHealed", () => healingFeedback.observe(s.player.hp, s.time));
  on("hudChanged", () => {
    if (observedHp !== null && s.player.hp > observedHp) events.emit("playerHealed");
    else healingFeedback.observe(s.player.hp, s.time);
    observedHp = s.player.hp;
    paintHud();
  });
  return () => subscriptions.forEach((unsubscribe) => unsubscribe());
}
