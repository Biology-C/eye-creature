import { setHealth } from "./systems/combat.mjs";
import { BALANCE as B } from "./config/balance.mjs";
import { MAX_HP } from "./health.mjs";
import { drawPickupIcon } from "./pickup-art.mjs";
export const RECOVERY_COOLDOWN = B.recovery.cooldown;
// The stomp reaches 126px; leave a further 120px to the pickup center.
export function dropRecovery(b, p, time) {
  if (
    !b.active ||
    b.hp <= 0 ||
    p.hp <= 0 ||
    p.hp > B.recovery.hpThreshold ||
    b.recovery ||
    time - b.lastRecoveryAt <= RECOVERY_COOLDOWN
  )
    return false;
  const a = b.arena,
    candidates = [];
  for (let x = a.left + 14; x <= a.exit.x - 18 - 14; x += 1) {
    if (Math.abs(x - b.x) < B.boss.stompReach + B.recovery.separation) continue;
    if (b.cursed && b.mirrors.some((m) => Math.abs(x - m.x) < B.recovery.separation)) continue;
    candidates.push(x);
  }
  candidates.sort((x, y) => Math.abs(y - b.x) - Math.abs(x - b.x) || x - y);
  if (!candidates.length) return false;
  b.recovery = { x: candidates[0], y: a.floor - 17 };
  b.lastRecoveryAt = time;
  return true;
}
export function collectRecovery(b, p) {
  if (
    !b.active ||
    b.hp <= 0 ||
    !b.recovery ||
    Math.hypot(p.x - b.recovery.x, p.y - b.recovery.y) > B.recovery.pickupRange
  )
    return false;
  setHealth(p, Math.min(MAX_HP, p.hp + B.recovery.amount));
  b.recovery = null;
  return true;
}
export function drawRecovery(g, b, time, reduced) {
  const r = b.recovery;
  if (!r) return;
  const pulse = reduced ? 0.7 : 0.65 + 0.35 * Math.sin(time * 4);
  g.save();
  g.fillStyle = "#58dc89";
  g.globalAlpha = 0.12 + pulse * 0.12;
  g.beginPath();
  g.arc(r.x, r.y, 28 + pulse * 7, 0, Math.PI * 2);
  g.fill();
  g.globalAlpha = 0.4 + pulse * 0.25;
  g.strokeStyle = "#b7ffd0";
  g.lineWidth = 2;
  g.beginPath();
  g.arc(r.x, r.y, 21 + pulse * 3, 0, Math.PI * 2);
  g.stroke();
  g.globalAlpha = 1;
  drawPickupIcon(g, "wing", r.x, r.y, 1.5);
  g.restore();
}
