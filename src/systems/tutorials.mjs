import { BALANCE as B } from "../config/balance.mjs";
import { learn, tutorial } from "../guidance.mjs";
import { windAt } from "../exploration.mjs";
export function installTutorials(app) {
  function teach(id, condition, message) {
    if (condition)
      tutorial(
        app.gameState.exploration,
        app.guidance,
        id,
        app.phoneText(message),
        app.gameState.time,
        B.guidance.duration,
      );
  }
  function runTutorials() {
    app.gameState.exploration.teaching = [];
    if (app.legacy) return;
    if (
      app.gameState.keys.has("up") &&
      !app.gameState.player.grounded &&
      !app.gameState.player.slimeForm
    )
      learn(app.gameState.exploration, "wing");
    app.teach(
      "wing",
      !app.gameState.player.grounded && app.gameState.time > 1,
      "按住 ↑ 拍翼，耗盡後滑翔；落腳可恢復翼能。",
    );
    app.teach(
      "rat",
      app.gameState.rats.some(
        (r) =>
          r.hp === 2 &&
          Math.hypot(r.x - app.gameState.player.x, r.y - app.gameState.player.y) < 170,
      ),
      "Space 連按近戰：老鼠水晶碎開後，還要再擊敗史萊姆。",
    );
    app.teach(
      "gaze",
      app.gameState.crackedWalls.some(
        (w) =>
          !w.broken &&
          Math.hypot(
            w.x + w.w / 2 - app.gameState.player.x,
            w.y + w.h / 2 - app.gameState.player.y,
          ) < 230,
      ),
      "牆後有風聲。靠近並面向它；上下方請按 ↑／↓ 觀察。",
    );
    app.teach(
      "wind",
      windAt(app.gameState.exploration, app.gameState.player),
      "順著風道上升，向左滑翔回培養室；按 ↓ 可抗風下降。",
    );
    app.teach(
      "root",
      app.gameState.exploration.obstacles.some(
        (o) =>
          !o.broken && Math.hypot(o.x - app.gameState.player.x, o.y - app.gameState.player.y) < 150,
      ),
      "連按 Space：直斬割根、迴旋清枝、第三段打破薄障礙。",
    );
    app.teach(
      "bird",
      app.gameState.fauna.birds.some(
        (b) => b.hp && Math.hypot(b.x - app.gameState.player.x, b.y - app.gameState.player.y) < 190,
      ),
      "青影鳥會增殖！按 Q 映出鏡像，牠們會攻擊自己。",
    );
    app.teach(
      "spike",
      app.world.traps.some(
        (t) => Math.hypot(t.x - app.gameState.player.x, t.y - app.gameState.player.y) < 180,
      ),
      "尖刺每三秒升降，等它收起再通過。",
    );
    app.teach(
      "charge",
      !app.gameState.crackedWalls.some((w) => w.id === "duct-intro" && !w.broken) &&
        app.gameState.rats.some(
          (r) =>
            r.hp &&
            Math.hypot(r.x - app.gameState.player.x, r.y - app.gameState.player.y) > 170 &&
            Math.hypot(r.x - app.gameState.player.x, r.y - app.gameState.player.y) < 330,
        ),
      `遠處按住 Space ${B.attack.chargeTime} 秒再放開：大型光彈。`,
    );
    app.teach(
      "dash",
      app.world.traps.some(
        (t) => Math.hypot(t.x - app.gameState.player.x, t.y - app.gameState.player.y) < 180,
      ),
      "Shift 可以快速衝刺。",
    );
  }
  Object.assign(app, { teach, runTutorials });
}
