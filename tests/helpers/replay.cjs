const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const keys = {
  left: "ArrowLeft",
  right: "ArrowRight",
  up: "ArrowUp",
  down: "ArrowDown",
  attack: " ",
  breach: "e",
  dash: "Shift",
  mirror: "q",
};
const tap = (step, action) => [
  { step, action, down: true },
  { step: step + 1, action, down: false },
];
const opening = [
  { step: 0, action: "right", down: true },
  { step: 420, action: "right", down: false },
  ...tap(420, "breach"),
];
const scenarios = [
  { name: "opening", steps: 480, events: opening },
  {
    name: "exploration",
    steps: 1020,
    events: [
      ...opening,
      { step: 430, action: "right", down: true },
      { step: 600, action: "right", down: false },
      ...[650, 674, 698, 750, 790, 830, 870, 910, 950].flatMap((s) => tap(s, "attack")),
    ],
  },
  {
    name: "boss",
    query: "?boss-preview=1",
    steps: 1200,
    events: [
      { step: 0, action: "right", down: true },
      { step: 55, action: "right", down: false },
      ...[70, 150, 230, 310, 390, 470, 550, 630, 710, 790, 870, 950, 1030, 1110].flatMap((step) => [
        { step, action: "attack", down: true },
        { step: step + 55, action: "attack", down: false },
      ]),
      ...tap(200, "dash"),
      ...tap(720, "mirror"),
    ],
  },
];

function firstDifference(expected, actual, field = "") {
  if (Object.is(expected, actual)) return null;
  if (expected && actual && typeof expected === "object" && typeof actual === "object") {
    for (const key of new Set([...Object.keys(expected), ...Object.keys(actual)])) {
      const diff = firstDifference(expected[key], actual[key], field ? `${field}.${key}` : key);
      if (diff) return diff;
    }
    return null;
  }
  return { field, expected, actual };
}

async function runReplay(baseURL, update = false) {
  const browser = await chromium.launch(
    process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {},
  );
  try {
    for (const scenario of scenarios) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.addInitScript(() => {
        let now = 0,
          next = null,
          seed = 7;
        window.requestAnimationFrame = (fn) => {
          next = fn;
          return 1;
        };
        window.cancelAnimationFrame = () => {
          next = null;
        };
        Object.defineProperty(performance, "now", { value: () => now });
        Date.now = () => 1700000000000 + now;
        Math.random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
        localStorage.clear();
        localStorage.setItem("eye-creature.exploration.music-volume", "0");
        localStorage.setItem("eye-creature.exploration.sfx-volume", "0");
        window.replayStep = () => {
          now += 1000 / 60;
          const fn = next;
          next = null;
          fn?.(now);
        };
      });
      await page.goto(baseURL + (scenario.query || ""));
      await page.locator("#start:not([disabled])").waitFor();
      await page.locator("#start").click();
      const actual = await page.evaluate(
        ({ scenario, keys }) => {
          const samples = [];
          const sample = (step) => {
            const s = window.levelSnapshot();
            samples.push({
              step,
              x: Math.round(s.player.x),
              y: Math.round(s.player.y),
              hp: s.player.hp,
              energy: s.player.energy,
              lights: s.lights.filter((l) => l.got).length,
              kills: s.kills,
              enemies: [...s.rats, ...s.fauna.trees, ...s.fauna.birds].filter((e) => e.hp > 0)
                .length,
              bossHp: s.boss.hp,
              time: Number(s.time.toFixed(6)),
              mode: s.mode,
              broken: s.crackedWalls.filter((w) => w.broken).map((w) => w.id),
              pickups: s.rewards.filter((r) => r.got).length,
              deaths: s.deaths,
              bossState: s.boss.state,
              cursed: s.boss.cursed,
              enemiesState: [...s.rats, ...s.fauna.trees, ...s.fauna.birds].map((e) => [
                e.id,
                Math.round(e.x),
                Math.round(e.y),
                e.hp,
                e.state || e.mode,
              ]),
            });
          };
          sample(0);
          for (let step = 0; step < scenario.steps; step++) {
            for (const event of scenario.events.filter((e) => e.step === step))
              document.querySelector("#game").dispatchEvent(
                new KeyboardEvent(event.down ? "keydown" : "keyup", {
                  key: keys[event.action],
                  bubbles: true,
                  cancelable: true,
                }),
              );
            window.replayStep();
            if ((step + 1) % 30 === 0) sample(step + 1);
          }
          return { schema: 1, seed: window.levelSnapshot().seed, dt: 1 / 60, scenario, samples };
        },
        { scenario, keys },
      );
      if (errors.length) throw new Error(errors.join("\n"));
      const file = path.join(__dirname, "../golden", scenario.name + ".json");
      if (update) fs.writeFileSync(file, JSON.stringify(actual, null, 2) + "\n");
      else {
        const expected = JSON.parse(fs.readFileSync(file, "utf8"));
        const diff = firstDifference(expected, actual);
        if (diff) {
          const sampleIndex = /^samples\.(\d+)/.exec(diff.field)?.[1];
          const step = sampleIndex === undefined ? "metadata" : actual.samples[sampleIndex]?.step;
          throw new Error(
            `${scenario.name}: first mismatch at step ${step}, field ${diff.field}: expected ${JSON.stringify(diff.expected)}, actual ${JSON.stringify(diff.actual)}`,
          );
        }
      }
      console.log(
        `${update ? "RECORDED" : "PASS"} replay ${scenario.name}: ${scenario.steps} steps, ${actual.samples.length} checkpoints`,
      );
      await page.close();
    }
  } finally {
    await browser.close();
  }
}
module.exports = { runReplay, firstDifference };
