import { BALANCE as B } from "./config/balance.mjs";
import { isSlime, crawlSlime } from "./slime.mjs";
// Slimes have double ballistic jump height, 1.25x speed, and surface adhesion.
export function updateRat(r, player, physics, dt, time, clearPath) {
  const slime = isSlime(r),
    speed = r.big ? B.enemy.bigSpeedScale : 1;
  if (crawlSlime(r, physics, dt, time)) return;
  physics.enemy(r, dt);
  if (time < r.stun) return;
  if (r.state === "jump") {
    if (!r.grounded) {
      physics.moveEnemy(
        r,
        r.face * (slime ? B.enemy.slimeAirSpeed : B.enemy.ratAirSpeed) * speed * dt,
      );
      return;
    }
    r.state = "rest";
    r.timer = B.enemy.ratRest;
  }
  if (!r.grounded) return;
  const near =
    Math.abs(player.x - r.x) < (slime ? B.enemy.slimeSightX : B.enemy.ratSightX) &&
    Math.abs(player.y - r.y) < (slime ? B.enemy.slimeSightY : B.enemy.ratSightY) &&
    clearPath(r.x, r.y, player.x, player.y);
  if (r.state === "walk" && near) {
    r.state = "ready";
    r.timer = slime ? B.enemy.slimeReady : B.enemy.ratReady;
    r.face = player.x > r.x ? 1 : -1;
  }
  if (r.state === "ready") {
    r.timer -= dt;
    if (r.timer <= 0) {
      r.state = "jump";
      r.vy = slime ? B.enemy.slimeJump : B.enemy.ratJump;
      r.grounded = false;
    }
  } else if (r.state === "dash") {
    if (!physics.walkEnemy(r, r.face * B.enemy.ratDashSpeed * dt)) {
      r.state = "rest";
      r.timer = B.enemy.ratRest;
    }
    r.timer -= dt;
    if (r.timer <= 0) {
      r.state = "rest";
      r.timer = B.enemy.ratRest;
    }
  } else if (r.state === "rest") {
    r.timer -= dt;
    if (r.timer <= 0) r.state = "walk";
  } else {
    const walked = physics.walkEnemy(
      r,
      r.face * (slime ? B.enemy.slimeSpeed : B.enemy.ratSpeed) * speed * dt,
    );
    if (!walked || r.x <= r.a || r.x >= r.b) {
      r.x = Math.max(r.a, Math.min(r.b, r.x));
      r.face *= -1;
    }
  }
}
