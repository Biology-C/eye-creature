import { BALANCE as B } from "./config/balance.mjs";
// Presentation only: never changes wall discovery, collision, resources or combat.
export function wallDistance(p, w) {
  return Math.hypot(
    Math.max(w.x - p.x, 0, p.x - w.x - w.w),
    Math.max(w.y - p.y, 0, p.y - w.y - w.h),
  );
}
export function nearestCrack(p, walls) {
  return walls
    .filter((w) => !w.broken && !w.ordinary)
    .sort((a, b) => wallDistance(p, a) - wallDistance(p, b))[0];
}
export function breachPrompt(p, w, handheld) {
  const direction = w.axis === "vertical" ? (p.y < w.y + w.h / 2 ? "↓ " : "↑ ") : "";
  return p.energy >= B.energy.breachCost
    ? `${direction}${handheld ? "長按 A 打破" : "按 E 打破"}`
    : `${direction}收集 ${B.energy.breachCost} 橘色能量才能打破（目前 ${p.energy}/${B.energy.breachCost}）`;
}
export function createGuidance(element, handheld) {
  let until = 0,
    kind = "hint",
    target = null,
    savedUntil = 0;
  element.replaceChildren();
  const title = document.createElement("strong"),
    body = document.createElement("span"),
    arrow = document.createElement("span");
  const badge = document.createElement("span");
  badge.id = "breach-key";
  badge.hidden = true;
  badge.setAttribute("aria-label", "破牆按鍵");
  element.after(badge);
  const saved = document.createElement("span");
  saved.id = "saved-icon";
  saved.hidden = true;
  saved.setAttribute("role", "status");
  saved.setAttribute("aria-label", "已保存");
  saved.innerHTML =
    '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M3 2h15l4 4v16H2V2h1zm3 2v6h11V4H6zm0 10v6h12v-6H6z"/></svg>';
  element.after(saved);
  arrow.id = "guidance-arrow";
  arrow.textContent = "➜";
  arrow.setAttribute("aria-label", "最近裂牆方向");
  element.append(title, body, arrow);
  return {
    get until() {
      return until;
    },
    get priority() {
      return kind === "critical" || kind === "region" || kind === "reminder";
    },
    say(text, time, duration = B.guidance.duration, options = {}) {
      if (kind === "critical" && time < until && options.kind !== "critical") return false;
      until = time + duration;
      kind = options.kind || "hint";
      target = options.target || null;
      title.textContent = options.title || "";
      title.hidden = !options.title;
      body.textContent = text;
      body.hidden = !text;
      arrow.hidden = !target;
      element.dataset.kind = kind;
      element.hidden = false;
      element.style.opacity = "1";
      return true;
    },
    saved(time) {
      savedUntil = time + B.guidance.savedDuration;
    },
    reset() {
      until = 0;
      savedUntil = 0;
      saved.hidden = true;
      badge.hidden = true;
      target = null;
      element.hidden = true;
      body.textContent = "";
      arrow.hidden = true;
    },
    tick(time, mode, reduced, p, camera, canvas, walls = [], boss = {}) {
      element.style.top = boss.active
        ? ((boss.cursed ? 65 : 45) * canvas.getBoundingClientRect().height) / canvas.height +
          8 +
          "px"
        : "";
      saved.hidden = mode !== "playing" || time >= savedUntil;
      const w = nearestCrack(p, walls);
      badge.hidden =
        mode !== "playing" ||
        boss.active ||
        p.slimeForm ||
        p.energy < B.energy.breachCost ||
        !w ||
        wallDistance(p, w) > B.guidance.wallRange ||
        time < until;
      if (!badge.hidden) {
        const dir = w.axis === "vertical" ? (p.y < w.y + w.h / 2 ? "↓ " : "↑ ") : "";
        badge.textContent = dir + (handheld ? "長按 A" : "E");
        const v = canvas.parentElement,
          scaleX = v.clientWidth / canvas.width,
          scaleY = v.clientHeight / canvas.height,
          x = w.axis === "vertical" ? w.x + w.w / 2 : p.x < w.x ? w.x - 28 : w.x + w.w + 28,
          y = w.axis === "vertical" ? (p.y < w.y ? w.y - 24 : w.y + w.h + 24) : w.y + w.h / 2;
        badge.style.left =
          Math.max(40, Math.min(v.clientWidth - 40, (x - camera.x) * scaleX)) + "px";
        badge.style.top =
          Math.max(20, Math.min(v.clientHeight - 20, (y - camera.y) * scaleY)) + "px";
      }
      element.hidden = mode !== "playing" || time >= until;
      element.style.opacity =
        kind === "region" && !reduced
          ? String(Math.min(1, Math.max(0, (until - time) / 0.5)))
          : "1";
      if (target) {
        arrow.style.transform = `rotate(${Math.atan2(target.y + target.h / 2 - p.y, target.x + target.w / 2 - p.x)}rad)`;
        arrow.dataset.wall = target.id;
      }
    },
  };
}
export function learn(s, ...ids) {
  s.tutorials ??= [];
  for (const id of ids) if (!s.tutorials.includes(id)) s.tutorials.push(id);
}
export function tutorial(
  s,
  ui,
  id,
  text,
  time,
  duration = B.guidance.duration,
  { critical = false } = {},
) {
  if (s.tutorials?.includes(id) || (!critical && (time < ui.until || time < (s.quietUntil ?? 0))))
    return false;
  if (ui.say(text, time, duration, { kind: critical ? "critical" : "tutorial" }) === false)
    return false;
  learn(s, id);
  s.quietUntil = time + duration + B.guidance.quiet;
  return true;
}
export function updateGuidance(s, { world, p, walls, boss, time, handheld }, ui) {
  const state = (s.guidance ??= { visited: [] });
  state.visited ??= [];
  const region = boss.active ? "boss" : world.regionAt?.(p.x, p.y);
  if ([1, 2, 3, "boss"].includes(region) && !state.visited.includes(region)) {
    if (
      ui.say("", time, B.guidance.regionDuration, {
        title: region === "boss" ? "守門室" : world.regions[region].name,
        kind: "region",
      }) !== false
    )
      state.visited.push(region);
  }
  const wall = nearestCrack(p, walls);
  if (walls.some((w) => w.broken)) learn(s, "breach");
  if (
    !boss.active &&
    !p.slimeForm &&
    wall &&
    wallDistance(p, wall) <= B.guidance.wallRange &&
    p.energy >= B.energy.breachCost
  ) {
    const critical = wall.id === "duct-intro";
    if (
      tutorial(
        s,
        ui,
        "breach",
        (critical ? "能量已足夠，" : "") + breachPrompt(p, wall, handheld),
        time,
        B.guidance.duration,
        { critical },
      )
    )
      learn(s, "energy-ready");
  }
}
export function drawCrackGuidance(g, p, walls, time, reduced) {
  if (p.energy < B.energy.breachCost || p.slimeForm) return;
  for (const w of walls) {
    if (w.broken || w.ordinary || wallDistance(p, w) > B.guidance.wallRange) continue;
    g.save();
    g.strokeStyle = "#ffd391";
    g.lineWidth = reduced ? 3 : 3 + Math.sin(time * 4) * 0.8;
    g.globalAlpha = reduced ? 1 : 0.7 + 0.25 * Math.sin(time * 4);
    if (!reduced) {
      g.shadowColor = "#ffbd66";
      g.shadowBlur = 15;
    }
    g.strokeRect(w.x - 4, w.y - 4, w.w + 8, w.h + 8);
    g.restore();
  }
}
