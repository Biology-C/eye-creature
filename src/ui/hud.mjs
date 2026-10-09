import { BALANCE as B } from "../config/balance.mjs";
import { BREACH_HOLD, attackIntent } from "../handheld.mjs";
import { MAX_HP, healthMarkup, criticalOpacity } from "../health.mjs";
import { BREACH_COST } from "../breach.mjs";
export function installHud(app) {
  function updateHud() {
    app.events.emit("hudChanged");
  }
  function paintHud() {
    app.$("#abilities").textContent =
      "能力：" +
      (["spread", "dash", "breach"]
        .filter((k) => app.gameState.player.abilities[k])
        .map((k) => ({ spread: "三向光彈", dash: "傷害衝刺", breach: "普通牆破壞" })[k])
        .join("／") || "尚未取得");
    app.$("#energy").textContent =
      `${app.handheld ? "破牆" : "破牆能量"} ${app.gameState.player.energy} / ${BREACH_COST}`;
    app.$("#hearts").innerHTML = healthMarkup(app.gameState.player.hp);
    app.$("#healing").textContent = `綠能回血 ${app.gameState.player.healCharge}% / 100%`;
    app.$("#hearts").setAttribute("aria-label", `生命 ${app.gameState.player.hp} / ${MAX_HP}`);
    app.$("#quest").textContent =
      `${app.handheld ? "光點" : "引路光點"} ${app.gameState.lights.filter((p) => p.got).length} / 3`;
    app.$("#relics").textContent =
      `藏品 ${app.gameState.rewards.filter((r) => r.kind === "relic" && r.got).length} / ${app.gameState.rewards.filter((r) => r.kind === "relic").length}`;
  }
  function phoneText(message) {
    return !app.handheld
      ? message
      : message
          .replaceAll("Space", "A")
          .replaceAll("Shift", "X")
          .replaceAll("按住 ↑ 拍翼", "按住 B 拍翼")
          .replaceAll("↑ 拍翼", "B 拍翼")
          .replaceAll("按 E 打通", "長按 A 打通")
          .replaceAll("按 Q 使用鏡面", "靠近場景鏡面")
          .replaceAll("按 Q 映出鏡像", "靠近場景鏡面映出鏡像")
          .replaceAll("用 Q 或左側鏡子破解", "靠近左側鏡子破解");
  }
  function say(message, duration = B.guidance.duration) {
    app.guidance.say(app.phoneText(message), app.gameState.time, duration);
    app.gameState.noticeUntil = app.guidance.until;
  }
  function updateFormControls() {
    if (app.handheld) {
      app.$("#flap").innerHTML = app.gameState.player.slimeForm
        ? "B<small>跳躍／攀附</small>"
        : "B<small>拍翼</small>";
      app
        .$("#flap")
        .setAttribute(
          "aria-label",
          app.gameState.player.slimeForm ? "B 跳躍或攀附" : "B 拍翼或滑翔",
        );
      app.$("#dash").disabled = Boolean(app.gameState.player.slimeForm);
      app.$("#dash").innerHTML = app.gameState.player.slimeForm
        ? "X<small>變身中</small>"
        : "X<small>衝刺</small>";
    } else
      app.$("#dash").textContent = app.gameState.player.slimeForm ? "史萊姆無衝刺" : "衝刺 Shift";
  }
  function paintMagicHud() {
    app.$("#magic").textContent =
      app.gameState.chargeStart === null
        ? "光彈 · F 切換"
        : app.gameState.time - app.gameState.chargeStart >= B.attack.chargeTime
          ? "蓄力完成 · 放開發射"
          : `蓄力 ${Math.min(100, Math.floor(((app.gameState.time - app.gameState.chargeStart) / B.attack.chargeTime) * 100))}%`;
  }
  function paintDashHud() {
    if (app.handheld) {
      app.$("#dash").innerHTML = app.gameState.player.slimeForm
        ? "X<small>變身中</small>"
        : `X<small>${app.gameState.player.dashCooldown > 0 ? app.gameState.player.dashCooldown.toFixed(1) + "s" : "衝刺"}</small>`;
      app.$("#dash").dataset.ready = app.gameState.player.dashCooldown <= 0;
    } else
      app.$("#dash").textContent = app.gameState.player.slimeForm
        ? "史萊姆無衝刺"
        : app.gameState.player.dashCooldown > 0
          ? `衝刺 ${app.gameState.player.dashCooldown.toFixed(1)}s`
          : "衝刺 Shift";
  }
  function paintMirrorHud() {
    app.$("#mirror").textContent =
      app.gameState.time >= app.gameState.fauna.mirrorReady
        ? "鏡面 Q"
        : `鏡面 ${Math.ceil(app.gameState.fauna.mirrorReady - app.gameState.time)}s`;
  }
  function paintActionHud(melee) {
    app.$("#attack-mode").textContent = app.gameState.player.slimeForm
      ? "史萊姆跳撞"
      : app.gameState.chargeStart !== null
        ? "蓄力光彈"
        : melee
          ? "✦ 近戰連斬"
          : "◉ 光彈";
    app.$("#attack-mode").dataset.melee = melee;
    app.$("#region").textContent = app.gameState.boss.active
      ? "紅熊守門室"
      : app.world.regions?.[app.world.regionAt(app.gameState.player.x, app.gameState.player.y)]
          ?.name || "探索中";
  }
  function paintHandheldHud(melee) {
    if (app.handheld) {
      const intent = attackIntent({
        melee,
        combo: false,
        wall: app.wallTarget(true),
        energy: app.gameState.player.energy,
        cost: BREACH_COST,
      });
      app.$(".attack").dataset.intent = intent;
      app.$(".attack small").textContent = app.gameState.player.slimeForm
        ? "跳撞"
        : app.gameState.breachHold
          ? Math.floor(
              ((app.gameState.time - app.gameState.breachHold.start) / BREACH_HOLD) * 100,
            ) + "%"
          : intent === "breach"
            ? "長按破牆"
            : app.gameState.chargeStart !== null
              ? app.gameState.time - app.gameState.chargeStart >= B.attack.chargeTime
                ? "滿蓄力"
                : "蓄力"
              : "攻擊";
    }
  }
  function paintOverlayHud() {
    app.healingFeedback.paintHud(app.$("#hearts"), app.gameState.time);
    app.guidance.tick(
      app.gameState.time,
      app.gameState.mode,
      app.gameState.reduced,
      app.gameState.player,
      app.gameState.camera,
      app.canvas,
      app.gameState.crackedWalls,
      app.gameState.boss,
    );
    for (const [id, kind] of [
      ["#energy", "energy"],
      ["#healing", "wing"],
    ]) {
      const active =
        app.gameState.pickupFlash?.kind === kind &&
        app.gameState.time < app.gameState.pickupFlash.until;
      app.$(id).classList.toggle("resource-flash", Boolean(active));
      app.$(id).style.transform =
        active && !app.gameState.reduced
          ? `translateY(${-Math.sin(Math.min(1, (app.gameState.pickupFlash.until - app.gameState.time) / 0.7) * Math.PI) * 2}px)`
          : "none";
    }
    app.$("#critical-vignette").style.opacity = criticalOpacity(
      app.gameState.player.hp,
      app.gameState.time,
      app.gameState.reduced,
    );
  }
  Object.assign(app, {
    updateHud,
    paintHud,
    phoneText,
    say,
    updateFormControls,
    paintMagicHud,
    paintDashHud,
    paintMirrorHud,
    paintActionHud,
    paintHandheldHud,
    paintOverlayHud,
  });
}
