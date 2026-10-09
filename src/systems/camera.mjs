export function installCamera(app) {
  function resize() {
    if (app.handheld) {
      const r = app.canvas.parentElement.getBoundingClientRect();
      app.canvas.width = 480;
      app.canvas.height = Math.max(160, Math.round((480 * r.height) / Math.max(1, r.width)));
      app.canvas.style.aspectRatio = "auto";
      return;
    }
    const compact = app.canvas.clientWidth < 650;
    app.canvas.width = compact ? 480 : 960;
    app.canvas.height =
      innerWidth >= 900
        ? Math.max(
            240,
            Math.round(
              (960 * app.canvas.parentElement.clientHeight) / app.canvas.parentElement.clientWidth,
            ),
          )
        : compact
          ? innerHeight < 500
            ? 240
            : 360
          : 540;
    app.canvas.style.aspectRatio = `${app.canvas.width}/${app.canvas.height}`;
  }
  function followCamera(dt) {
    updateCamera(
      app.gameState.camera,
      app.gameState.player,
      app.canvas.width,
      app.canvas.height,
      { w: app.W * app.T, h: app.H * app.T },
      dt,
      app.gameState.cameraSnap,
      {
        gentleDesktop: !app.handheld,
        moveDirection:
          Number(app.gameState.keys.has("right")) - Number(app.gameState.keys.has("left")),
      },
    );
    app.gameState.cameraSnap = false;
  }
  Object.assign(app, { resize, followCamera });
}

export const DESKTOP_CAMERA = Object.freeze({
  lookAhead: 0.06,
  turnDelay: 0.25,
  response: 4,
  deadZone: 0.04,
});
export function updateCamera(c, p, width, height, bounds, dt, snap = false, options = {}) {
  if (snap || !c.initialized) {
    c.face = p.face;
    c.pending = p.face;
    c.delay = 0;
    c.x = p.x - width / 2;
    c.y = p.y - height / 2;
    c.initialized = true;
  }
  const gentle = options.gentleDesktop;
  if (gentle) {
    // A tap followed by release must never trigger a delayed camera reversal.
    const direction = options.moveDirection || 0;
    if (!direction || direction === c.face) {
      c.pending = c.face;
      c.delay = 0;
    } else {
      if (c.pending !== direction) {
        c.pending = direction;
        c.delay = 0;
      }
      c.delay += dt;
      if (c.delay + 1e-8 >= DESKTOP_CAMERA.turnDelay) c.face = direction;
    }
  } else {
    if (c.pending !== p.face) {
      c.pending = p.face;
      c.delay = 0;
    } else c.delay += dt;
    if (c.delay >= 0.2) c.face = c.pending;
  }
  let targetX = p.x - width * (0.5 - c.face * (gentle ? DESKTOP_CAMERA.lookAhead : 0.12));
  if (gentle) {
    const dx = targetX - c.x,
      buffer = width * DESKTOP_CAMERA.deadZone;
    targetX = snap ? c.x : Math.abs(dx) > buffer ? targetX - Math.sign(dx) * buffer : c.x;
  }
  const centerY = c.y + height / 2,
    margin = height * 0.075;
  const targetY =
    Math.abs(p.y - centerY) > margin ? p.y - height / 2 - Math.sign(p.y - centerY) * margin : c.y;
  const k = snap ? 1 : 1 - Math.exp(-8 * dt),
    kx = snap ? 1 : 1 - Math.exp(-(gentle ? DESKTOP_CAMERA.response : 8) * dt);
  c.x += (targetX - c.x) * kx;
  c.y += (targetY - c.y) * k;
  c.x = Math.max(
    0,
    Math.min(bounds.w - width, Math.max(p.x - width + 40, Math.min(p.x - 40, c.x))),
  );
  c.y = Math.max(
    0,
    Math.min(bounds.h - height, Math.max(p.y - height + 40, Math.min(p.y - 40, c.y))),
  );
  return c;
}
