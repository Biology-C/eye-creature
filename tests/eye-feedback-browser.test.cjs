const { instrumentGame } = require("./helpers/game-harness.cjs");
/* global fx:readonly */
// Page globals supplied by the game/preview or this file's injected browser harness.
const fs = require("node:fs"),
  assert = require("node:assert/strict"),
  { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch(
    process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {},
  );
  try {
    for (const phone of [false, true]) {
      const p = await browser.newPage({
          viewport: phone ? { width: 390, height: 844 } : { width: 1280, height: 720 },
          isMobile: phone,
          hasTouch: phone,
        }),
        errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      await p.addInitScript(() => (window.requestAnimationFrame = () => 1));
      await p.route("**/src/game.js", (r) =>
        r.fulfill({
          contentType: "application/javascript",
          body:
            instrumentGame(fs.readFileSync("src/game.js", "utf8")) +
            `
 window.fx={
 prepare(hp=2){reset();resume();rats.forEach(r=>r.hp=0);fauna.birds.forEach(r=>r.hp=0);fauna.trees.forEach(r=>r.hp=0);rewards.forEach(r=>r.got=true);Object.assign(player,{x:world.start.x+100,hp,inv:1e9});updateHud();healingFeedback.reset(hp)},
 get event(){return healingFeedback.event},get hp(){return player.hp},get time(){return time},
 heal(source){if(source==='boss')beginBoss();if(source==='lamp'){Object.assign(player,world.safes[0]);update(0)}if(source==='shard'){player.healCharge=60;const r=rewards.find(r=>r.kind==='wing');Object.assign(r,{got:false,x:player.x,y:player.y});update(0)}if(source==='recovery'){boss.active=true;boss.recovery={x:player.x,y:player.y};update(0)}render()},
 wait(dt){time+=dt;render()}, reduced(value){reduced=value;render()},
 tint(cursed=false){const canvas=document.createElement('canvas');canvas.width=320;canvas.height=320;const c=canvas.getContext('2d',{willReadFrequently:true}),paint=createBossPainter();const b={...boss,x:160,y:160,state:'rest',stun:99,cursed,hp:30,hitFlashAt:null};const body=ctx=>cursed?drawHero(ctx,1,2,b.face<0,b.x-32,b.y-30):drawBear(ctx,b,0,true,false);
  const pixels=t=>{c.clearRect(0,0,320,320);paint(c,b,t,true,body);return c.getImageData(0,0,320,320).data};const original=pixels(0);b.hp=29;markBossHit(b,30,0);const bright=pixels(0),half=pixels(.5),expired=pixels(1);let sameAlpha=true,restored=true,changed=0,linear=true;for(let i=0;i<original.length;i++){if(i%4===3)sameAlpha&&=original[i]===bright[i]&&original[i]===half[i];else {if(original[i-i%4+3]>0&&original[i]!==bright[i])changed++;if(original[i-i%4+3]===255)linear&&=Math.abs(half[i]-(original[i]+bright[i])/2)<=2}restored&&=original[i]===expired[i]}
  b.hp=28;markBossHit(b,29,.7);const refresh=Array.from(pixels(.7)).every((v,i)=>v===bright[i]);return {sameAlpha,restored,changed,linear,refresh,differences:Array.from(original).map((v,i)=>v===expired[i]?null:[i,v,expired[i]]).filter(Boolean).slice(0,12)};},
 frames(){const saved=drawHero,result=[];boss.cursed=true;syncForm();reduced=false;drawHero=(ctx,row,f,flip,x,y)=>{if(x===boss.x-32&&y===boss.y-30)result.push(f);saved(ctx,row,f,flip,x,y)};try{for(const t of [0,.13,.26]){time=t;render()}}finally{drawHero=saved}return result},
 particles(flag){let particles=0,label='';const fake={save(){},restore(){},fillRect(){particles++},strokeText(){},fillText(t){label=t}};healingFeedback.draw(fake,player,time,flag);return {particles,label}},
 region(i){this.prepare(5);const pos=world.position([45,94,218][i]);Object.assign(player,pos);time=3.5;cameraSnap=true;render()},
 gustPause(){this.region(0);time=6.6;const before=time,x=player.x;pause();loop(1000);loop(2000);const result={sameTime:time===before,sameX:player.x===x,phase:gustAt(world,player,time)};resume();return result},
 screenshot(){beginBoss();boss.cursed=true;syncForm();boss.hp--;enemyDamageSound(boss,boss.hp+1);render()},
 };
 `,
        }),
      );
      await p.goto(
        (process.env.BASE_URL || "http://127.0.0.1:8768/") + (phone ? "?handheld=1" : ""),
      );
      await p.locator("#start:not([disabled])").waitFor();
      for (const [source, gain] of [
        ["shard", 0.5],
        ["lamp", 3],
        ["recovery", 1],
        ["boss", 3],
      ]) {
        await p.evaluate((source) => {
          fx.prepare();
          fx.heal(source);
        }, source);
        assert.equal(await p.evaluate(() => fx.hp), 2 + gain);
        assert.equal(await p.evaluate(() => fx.event.amount), gain);
        const flash = await p
          .locator(".hp-recovery")
          .evaluateAll(
            (es) =>
              es.filter((e) => e.style.opacity === "1" && parseFloat(e.style.width) > 0).length,
          );
        assert.ok(flash > 0, source);
        if (source === "boss")
          assert.ok((await p.locator("#notice").innerText()).includes("守門室前：生命已回滿"));
        const animation = await p.evaluate(() => [fx.particles(false), fx.particles(true)]);
        assert.ok(animation[0].particles > 0);
        assert.deepEqual(animation[1], { particles: 0, label: "+" + gain });
        await p.evaluate(() => fx.wait(0.41));
        assert.ok(
          await p
            .locator(".hp-recovery")
            .evaluateAll((es) => es.every((e) => e.style.opacity === "0")),
        );
        await p.evaluate(() => fx.wait(0.2));
        assert.deepEqual(await p.evaluate(() => fx.particles(false)), { particles: 0, label: "" });
      }
      await p.evaluate(() => {
        fx.prepare(5);
        fx.heal("boss");
      });
      assert.equal(await p.evaluate(() => fx.event), null);
      assert.ok(!(await p.locator("#notice").innerText()).includes("生命已回滿"));
      assert.deepEqual(await p.evaluate(() => fx.frames()), [0, 1, 2]);
      for (const disguised of [false, true]) {
        const tint = await p.evaluate((c) => fx.tint(c), disguised);
        assert.ok(
          tint.sameAlpha && tint.restored && tint.linear && tint.refresh && tint.changed > 100,
          JSON.stringify(tint),
        );
      }
      await p.evaluate(() => {
        fx.prepare();
        fx.screenshot();
      });
      await p.screenshot({
        path: "tests/artifacts/feedback-" + (phone ? "phone" : "desktop") + ".png",
      });
      assert.deepEqual(await p.evaluate(() => fx.gustPause()), {
        sameTime: true,
        sameX: true,
        phase: 0,
      });
      if (!phone)
        for (let i = 0; i < 3; i++) {
          await p.evaluate((i) => fx.region(i), i);
          await p.screenshot({ path: "tests/artifacts/region-props-" + i + ".png" });
        }
      assert.deepEqual(errors, []);
      await p.close();
    }
    console.log(
      "PASS desktop/phone real healing events, full-HP silence, .6s particles/+N and .4s HP flash, reduced motion, animated wings, exact silhouette, linear 1s tint and re-hit reset",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
