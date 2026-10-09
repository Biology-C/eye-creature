const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch(
    process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {},
  );
  const base = process.env.BASE_URL || "http://127.0.0.1:8768/";
  try {
    for (const suffix of ["", "?debug=0", "?debug=1"]) {
      const page = await browser.newPage();
      const errors = [],
        debugRequests = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("request", (r) => {
        if (r.url().endsWith("/debug.mjs")) debugRequests.push(r.url());
      });
      await page.addInitScript(() => {
        window.requestAnimationFrame = () => 1;
        if (!sessionStorage.getItem("debug-test-initialized")) {
          localStorage.clear();
          sessionStorage.setItem("debug-test-initialized", "1");
        }
        localStorage.setItem("eye-creature.exploration.sfx-volume", "0");
        localStorage.setItem("eye-creature.exploration.music-volume", "0");
      });
      await page.route("**/src/game.js", (route) =>
        route.fulfill({
          contentType: "application/javascript",
          body:
            fs.readFileSync("src/game.js", "utf8") +
            `
window.debugChecks={
  harm(){time+=3;hurt()}, save(){saveCheckpoint()}, fresh(){newAdventure()},
  advance(){for(let i=0;i<61;i++)loop(1000+i*1000/60)},
  seedSave(){localStorage.setItem(SAVE_KEY,'original-save-do-not-overwrite')},
  saved(){return localStorage.getItem(SAVE_KEY)},
  state(){return {hp:player.hp,energy:player.energy,boss:{hp:boss.hp,maxHp:boss.maxHp,active:boss.active},rat:rats[0].hp,speed:B.enemy.ratSpeed,invincible:debug?.invincible,keys:[...keys],cap:fauna.birdRules.cap}},
};`,
        }),
      );
      await page.goto(base + suffix);
      await page.locator("#start:not([disabled])").waitFor();
      if (suffix !== "?debug=1") {
        assert.equal(await page.locator("#debug-panel").count(), 0);
        assert.equal(debugRequests.length, 0);
        await page.close();
        continue;
      }
      const panel = page.locator("#debug-panel");
      assert.equal(await panel.count(), 1);
      await page.evaluate(() => window.debugChecks.seedSave());
      await page.locator("#start").click();
      const value = (key) => panel.locator(`[data-balance="${key}"]`);
      await value("boss.maxHp").fill("72");
      await value("boss.maxHp").dispatchEvent("change");
      assert.equal((await page.evaluate(() => window.debugChecks.state())).boss.maxHp, 72);
      await value("enemy.ratSpeed").fill("68");
      await value("enemy.ratSpeed").dispatchEvent("change");
      assert.equal((await page.evaluate(() => window.debugChecks.state())).speed, 68);
      await value("enemy.ratHp").fill("4");
      await value("enemy.ratHp").dispatchEvent("change");
      assert.equal((await page.evaluate(() => window.debugChecks.state())).rat, 4);
      await value("enemy.birdCap").fill("8");
      await value("enemy.birdCap").dispatchEvent("change");
      assert.equal((await page.evaluate(() => window.debugChecks.state())).cap, 8);
      await value("boss.maxHp").fill("0");
      await value("boss.maxHp").dispatchEvent("change");
      assert.equal((await page.evaluate(() => window.debugChecks.state())).boss.maxHp, 72);
      await panel.locator("#invincible").check();
      await page.evaluate(() => window.debugChecks.harm());
      assert.equal((await page.evaluate(() => window.debugChecks.state())).hp, 5);
      await panel.locator("#invincible").uncheck();
      await page.evaluate(() => window.debugChecks.harm());
      assert.equal((await page.evaluate(() => window.debugChecks.state())).hp, 4);
      await panel.locator("#refill").click();
      const filled = await page.evaluate(() => window.debugChecks.state());
      assert.equal(filled.hp, 5);
      assert.equal(filled.energy, 300);
      await panel.locator("#boss").click();
      assert.equal((await page.evaluate(() => window.debugChecks.state())).boss.active, true);
      await page.evaluate(() => window.debugChecks.save());
      await page.evaluate(() => window.debugChecks.fresh());
      assert.equal(
        await page.evaluate(() => window.debugChecks.saved()),
        "original-save-do-not-overwrite",
      );
      await page.evaluate(() => window.debugChecks.advance());
      assert.match(await panel.locator("#fps").innerText(), /FPS \d+/);
      await panel.locator("#defaults").click();
      const defaults = await page.evaluate(() => window.debugChecks.state());
      assert.equal(defaults.boss.maxHp, 36);
      assert.equal(defaults.speed, 34);
      assert.equal(defaults.invincible, false);
      await page.reload();
      await page.locator("#start:not([disabled])").waitFor();
      assert.equal((await page.evaluate(() => window.debugChecks.state())).boss.maxHp, 36);
      assert.equal(
        await page.evaluate(() => window.debugChecks.saved()),
        "original-save-do-not-overwrite",
      );
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log(
      "PASS debug opt-in only, live HP/speed/cap, invalid input, invulnerability, boss warp, refill, FPS, reset and save isolation",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
