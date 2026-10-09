export function installCollision(app) {
  function free(x, y, r = 11) {
    if (!app.physics.free(x, y, r)) return false;
    return ![
      [x - r, y - r],
      [x + r, y - r],
      [x - r, y + r],
      [x + r, y + r],
    ].some(([a, b]) => app.solid(a, b));
  }
  function move(o, dx, dy) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 6));
    for (let i = 0; i < n; i++) {
      if (app.free(o.x + dx / n, o.y)) o.x += dx / n;
      if (app.free(o.x, o.y + dy / n)) o.y += dy / n;
    }
  }
  function clearPath(ax, ay, bx, by) {
    const n = Math.ceil(Math.hypot(bx - ax, by - ay) / 6),
      target = app.gameState.exploration.obstacles.find((o) => o.x === bx && o.y === by);
    for (let i = 0; i <= n; i++) {
      const x = ax + ((bx - ax) * i) / Math.max(1, n),
        y = ay + ((by - ay) * i) / Math.max(1, n);
      if (
        app.solid(x, y) ||
        app.gameState.exploration.obstacles.some(
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
  Object.assign(app, { free, move, clearPath });
}
