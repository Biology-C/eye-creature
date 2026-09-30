// Observe resolved damage only. Never alter combat state or timing.
export function createCombatSounds(sfx, clock = () => performance.now()) {
  let pendingHit = null, lastHit = -Infinity, bossDefeated = false;
  return {
    damaged(enemy, before, {boss = false, crystalRat = false} = {}) {
      if (!(before > 0 && enemy.hp < before)) return;
      if (boss && enemy.hp <= 0) {pendingHit = null;bossDefeated = true;sfx.play('bossDefeat');return;}
      if (bossDefeated) return;
      pendingHit = {big: boss || !!pendingHit?.big};
      if (enemy.hp <= 0) sfx.play('defeat');
      else if (crystalRat && before > 1 && enemy.hp <= 1) sfx.play('defeat', {kind:'transform'});
    },
    flush() {
      const now = clock();
      if (pendingHit && now - lastHit >= 40) {sfx.play('hit', pendingHit);lastHit = now;}
      pendingHit = null; // Do not play a stale impact after the 40ms throttle.
      bossDefeated = false;
    },
    clear() {pendingHit = null;bossDefeated = false;},
  };
}
