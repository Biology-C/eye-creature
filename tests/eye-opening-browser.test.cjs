const fs = require("node:fs"),
  assert = require("node:assert/strict"),
  { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch(
    process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {},
  );
  try {
    for (const [width, height] of [
      [1280, 720],
      [1920, 1080],
      [390, 844],
      [844, 390],
    ]) {
      const phone = width < 900,
        p = await browser.newPage({
          viewport: { width, height },
          isMobile: phone,
          hasTouch: phone,
        }),
        errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      await p.addInitScript(() => (requestAnimationFrame = () => 1));
      await p.route("**/src/game.js", (r) =>
        r.fulfill({
          contentType: "application/javascript",
          body:
            fs.readFileSync("src/game.js", "utf8") +
            `
   window.opening={
    fresh(){reset();resume()},
    walk(){const messages=[],wall=crackedWalls[0];let minHp=player.hp,arrival=null,shown=null;for(let i=0;i<420;i++){update(1/60);render();minHp=Math.min(minHp,player.hp);const text=$('#notice').hidden?'':$('#notice').textContent;if(text&&messages.at(-1)!==text)messages.push(text);if(arrival===null&&player.energy>=30&&wall.x-player.x<=120)arrival=time;if(shown===null&&text.includes('打破'))shown=time;}return {minHp,hp:player.hp,energy:player.energy,x:player.x,wall:wall.x,arrival,shown,messages,chargeLearned:exploration.tutorials.includes('charge'),rat:rats[0].x,ratHp:rats[0].hp}},
    priority(){reset();resume();const w=crackedWalls[0];Object.assign(player,{x:w.x-80,y:w.y+48,energy:30});guidance.say('一般提示尚未結束',time,10);exploration.quietUntil=100;update(0);render();return {kind:$('#notice').dataset.kind,text:$('#notice').textContent}},
    interrupt(){say('一般提示不應覆蓋');runTutorials();render();return $('#notice').textContent},
    expire(){time+=5;update(0);render()},
    revisit(){player.x-=200;update(0);player.x=crackedWalls[0].x-80;update(0);render()},
    bossTitle(low,cursed){reset();resume();if(low)player.hp=2;beginBoss();boss.cursed=cursed;updateGuidance(exploration,{world,p:player,walls:crackedWalls,boss,time,handheld},guidance);render();const r=canvas.getBoundingClientRect();return {bottom:r.top+(boss.cursed?65:45)*r.height/canvas.height,canvasBottom:r.bottom}},
   };
  `,
        }),
      );
      await p.goto(
        (process.env.BASE_URL || "http://127.0.0.1:8768/") + (phone ? "?handheld=1" : ""),
      );
      await p.locator("#start:not([disabled])").waitFor();
      await p.click("#start");
      // Real movement, physics, collisions, pickups and AI. No invulnerability or enemy removal.
      await p.evaluate(() => opening.fresh());
      await p.keyboard.down("ArrowRight");
      const walk = await p.evaluate(() => opening.walk());
      await p.keyboard.up("ArrowRight");
      assert.equal(walk.minHp, 5);
      assert.equal(walk.hp, 5);
      assert.equal(walk.energy, 42);
      assert.ok(walk.x < walk.wall && walk.wall - walk.x < 15);
      assert.ok(walk.rat > walk.wall + 96 && walk.ratHp === 2);
      assert.ok(
        walk.arrival !== null && walk.shown >= walk.arrival && walk.shown - walk.arrival <= 1,
        JSON.stringify(walk),
      );
      assert.equal(walk.chargeLearned, false);
      assert.ok(walk.messages.every((s) => !s.includes("大型光彈")));
      assert.equal(walk.messages.filter((s) => s.includes("能量已足夠")).length, 1);
      assert.ok(walk.messages.some((s) => s.includes(phone ? "長按 A 打破" : "按 E 打破")));
      const critical = await p.evaluate(() => opening.priority());
      assert.equal(critical.kind, "critical");
      assert.ok(critical.text.includes(phone ? "長按 A 打破" : "按 E 打破"));
      assert.equal(await p.evaluate(() => opening.interrupt()), critical.text);
      await p.screenshot({ path: "tests/artifacts/opening-wall-" + width + ".png" });
      await p.evaluate(() => opening.expire());
      assert.equal(await p.locator("#notice").isVisible(), false);
      assert.equal(await p.locator("#breach-key").isVisible(), true);
      await p.evaluate(() => opening.revisit());
      assert.equal(await p.locator("#notice").isVisible(), false);
      for (const low of [false, true])
        for (const cursed of [false, true]) {
          const hud = await p.evaluate(
            ([low, cursed]) => opening.bossTitle(low, cursed),
            [low, cursed],
          );
          assert.equal(await p.locator("#notice strong").innerText(), "守門室");
          const card = await p.locator("#notice").boundingBox();
          assert.ok(card && card.y >= hud.bottom + 6, JSON.stringify({ hud, card }));
          assert.ok(card.y + card.height <= hud.canvasBottom);
          assert.equal(
            await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
            false,
          );
        }
      await p.screenshot({ path: "tests/artifacts/opening-boss-title-" + width + ".png" });
      assert.deepEqual(errors, []);
      await p.close();
    }
    console.log(
      "PASS real starting-floor walk without damage; 42 energy; immediate critical E/A bypasses hints and quiet period once; no premature charge tutorial; boss title clears normal/cursed HUD on desktop and handheld",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
