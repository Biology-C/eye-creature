export function installPrimitives(app) {
  function rect(x, y, w, h, c) {
    app.g.fillStyle = c;
    app.g.fillRect(Math.round(x), Math.round(y), w, h);
  }
  function text(t, x, y, c = "#c5d9c5", size = 13) {
    app.g.fillStyle = c;
    app.g.font = `${size}px system-ui`;
    app.g.fillText(t, Math.round(x), Math.round(y));
  }
  function drawJourneyMap() {
    const c = app.$("#journey-map"),
      ctx = c.getContext("2d"),
      scale = Math.min((c.width - 24) / app.W, (c.height - 24) / app.H),
      ox = (c.width - app.W * scale) / 2,
      oy = 8;
    ctx.fillStyle = "#adbe87";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#263b29";
    for (const cell of app.gameState.seen) {
      const [x, y] = cell.split(",").map(Number);
      ctx.fillRect(ox + x * scale, oy + y * scale, Math.max(1, scale), Math.max(1, scale));
    }
    ctx.strokeStyle = "#233522";
    for (const w of app.gameState.crackedWalls)
      if (w.discovered)
        ctx.strokeRect(ox + (w.x / app.T) * scale - 2, oy + (w.y / app.T) * scale - 2, 6, 6);
    const px = ox + (app.gameState.player.x / app.T) * scale,
      py = oy + (app.gameState.player.y / app.T) * scale;
    ctx.fillStyle = "#000";
    ctx.fillRect(px - 5, py - 1, 11, 3);
    ctx.fillRect(px - 1, py - 5, 3, 11);
  }
  Object.assign(app, { rect, text, drawJourneyMap });
}
