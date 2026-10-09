import { BALANCE, DEFAULT_BALANCE } from "./config/balance.mjs";

// Explicit whitelist: DOM input never becomes arbitrary object-property access.
const fields = [
  ["boss.maxHp", "紅熊最大 HP", 1, 500, 1],
  ["boss.damage", "紅熊傷害", 0, 10, 0.5],
  ["boss.warning", "紅熊預告秒數", 0.1, 5, 0.1],
  ["boss.speed", "紅熊移動速度", 0, 500, 5],
  ["enemy.ratHp", "老鼠 HP", 1, 50, 1],
  ["enemy.ratSpeed", "老鼠地面速度", 0, 500, 1],
  ["enemy.ratSightX", "老鼠水平索敵", 0, 1000, 10],
  ["enemy.slimeHp", "史萊姆 HP", 1, 50, 1],
  ["enemy.slimeSpeed", "史萊姆地面速度", 0, 500, 1],
  ["enemy.slimeSightX", "史萊姆水平索敵", 0, 1000, 10],
  ["enemy.bigHp", "大史萊姆 HP", 1, 100, 1],
  ["enemy.bigSpeedScale", "大史萊姆速度倍率", 0.1, 3, 0.05],
  ["enemy.treeHp", "樹妖 HP", 1, 100, 1],
  ["enemy.treeSight", "樹妖魔法索敵", 0, 1000, 10],
  ["enemy.treeCastCooldown", "樹妖施法冷卻", 0.1, 10, 0.1],
  ["enemy.birdHp", "青影鳥 HP", 1, 50, 1],
  ["enemy.birdSpeed", "青影鳥巡飛速度", 0, 500, 5],
  ["enemy.birdDashSpeed", "青影鳥衝刺速度", 0, 500, 5],
  ["enemy.birdInterval", "青影鳥增殖秒數", 0.1, 20, 0.1],
  ["enemy.birdCap", "青影鳥區域上限", 1, 30, 1],
];

function updateLivingHp(state, key, previous, value) {
  const rescale = (enemy) => {
    if (enemy.hp > 0) enemy.hp = Math.min(value, (enemy.hp / previous) * value);
  };
  if (key === "boss.maxHp") {
    rescale(state.boss);
    state.boss.maxHp = value;
  }
  if (key === "enemy.treeHp") state.fauna.trees.forEach(rescale);
  if (key === "enemy.birdHp") state.fauna.birds.forEach(rescale);
  for (const enemy of state.rats) {
    const kind = enemy.big ? "bigHp" : enemy.pure || enemy.hp <= 1 ? "slimeHp" : "ratHp";
    if (key === "enemy." + kind) rescale(enemy);
  }
  if (state.fauna.birdRules) {
    state.fauna.birdRules.interval = BALANCE.enemy.birdInterval;
    state.fauna.birdRules.cap = BALANCE.enemy.birdCap;
  }
}

export function createDebugPanel(api) {
  if (new URLSearchParams(location.search).get("debug") !== "1") return null;
  const host = document.createElement("aside");
  host.id = "debug-panel";
  // Shadow DOM prevents debug styling from changing the game or its screenshots.
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `<style>
    :host { position:fixed;right:8px;top:8px;z-index:10000;width:min(330px,calc(100vw - 16px));
      font:14px/1.4 system-ui;color:#fff;color-scheme:dark; }
    details { background:#14212ff2;border:2px solid #eecc66;padding:10px;max-height:85vh;overflow:auto; }
    summary { cursor:pointer;font-weight:bold; } p { margin:8px 0; }
    label { display:flex;justify-content:space-between;gap:8px;margin:6px 0; }
    input[type=number] { width:85px; } input,button { font:inherit; }
    button { padding:6px;margin:3px;cursor:pointer; } .note { color:#ffdb87; }
  </style><details open><summary>除錯工具 · <output id="fps">FPS —</output></summary>
    <p class="note">本頁不讀寫旅程存檔。設定只在本頁有效，重新整理恢復預設。</p>
    <p>HP 修改依比例套用存活敵人，已擊倒者不復活；速度與索敵立即生效，計時設定於下一輪使用。</p>
    <div id="fields"></div>
    <label>玩家無敵<input id="invincible" type="checkbox"></label>
    <button id="boss" type="button">跳到紅熊房</button>
    <button id="refill" type="button">補滿 HP＋至少 300 能量</button>
    <button id="defaults" type="button">還原數值與無敵設定</button>
    <p id="status" role="status"></p>
  </details>`;
  document.body.append(host);
  // Editing a field must not send E / Space / arrow keys to the game.
  for (const type of ["keydown", "keyup", "pointerdown", "pointerup"])
    host.addEventListener(type, (event) => event.stopPropagation());
  host.addEventListener("focusin", api.clearInput);
  host.addEventListener("pointerdown", api.clearInput);
  const controls = new Map();
  const status = root.querySelector("#status");
  function apply(key, value) {
    const [group, name] = key.split(".");
    const previous = BALANCE[group][name];
    BALANCE[group][name] = value;
    updateLivingHp(api.state(), key, previous, value);
    api.refresh();
  }
  for (const [key, title, min, max, step] of fields) {
    const [group, name] = key.split(".");
    const label = document.createElement("label");
    label.textContent = title;
    const input = document.createElement("input");
    input.type = "number";
    input.dataset.balance = key;
    Object.assign(input, {
      min: String(min),
      max: String(max),
      step: String(step),
      value: String(BALANCE[group][name]),
    });
    input.addEventListener("change", () => {
      const value = Number(input.value);
      if (
        !input.value ||
        !Number.isFinite(value) ||
        value < min ||
        value > max ||
        (step === 1 && !Number.isInteger(value))
      ) {
        input.value = String(BALANCE[group][name]);
        status.textContent = `請輸入 ${min}～${max} 的有效數值。`;
        return;
      }
      apply(key, value);
      status.textContent = `${title}已套用；本頁不保存旅程。`;
    });
    controls.set(key, input);
    label.append(input);
    root.querySelector("#fields").append(label);
  }
  const invincible = root.querySelector("#invincible");
  root.querySelector("#boss").onclick = () => {
    status.textContent = api.jumpToBoss()
      ? "已跳到紅熊房；離開除錯網址恢復一般遊玩。"
      : "請先關閉閱讀卡片，再跳到紅熊房。";
  };
  root.querySelector("#refill").onclick = () => {
    const { player } = api.state();
    player.hp = BALANCE.player.maxHp;
    player.energy = Math.max(300, player.energy);
    api.refresh();
    status.textContent = "生命與測試能量已補充，不寫入存檔。";
  };
  root.querySelector("#defaults").onclick = () => {
    for (const [key, input] of controls) {
      const [group, name] = key.split(".");
      apply(key, DEFAULT_BALANCE[group][name]);
      input.value = String(DEFAULT_BALANCE[group][name]);
    }
    invincible.checked = false;
    status.textContent = "已還原平衡設定；關卡與收集進度未重設，重新整理可重試。";
  };
  let start = null,
    frames = 0;
  return {
    get invincible() {
      return invincible.checked;
    },
    frame(now) {
      if (start === null) start = now;
      frames++;
      if (now - start < 500) return;
      root.querySelector("#fps").textContent = `FPS ${Math.round((frames * 1000) / (now - start))}`;
      start = now;
      frames = 0;
    },
  };
}
