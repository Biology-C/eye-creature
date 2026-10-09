import { installRegionFeatures } from "../region-features.mjs";
import { createSceneMirrors } from "../handheld.mjs";
import { buildAdventure } from "../adventure.mjs";
import { createCues } from "../cues.mjs";
import { addBossArena } from "../boss.mjs";
import { addSurfaceSpikes, removeSpikeShelters } from "../traps.mjs";
import { buildMaze } from "../maze.mjs";
export function setupWorld(app) {
  app.$ = (s) => document.querySelector(s);
  app.canvas = app.$("#game");
  app.g = app.canvas.getContext("2d");
  app.handheld =
    !new URLSearchParams(location.search).has("legacy") &&
    (matchMedia("(pointer: coarse)").matches ||
      new URLSearchParams(location.search).get("handheld") === "1");
  document.documentElement.classList.toggle("handheld", app.handheld);
  app.resize();
  window.addEventListener("resize", () => {
    app.resize();
    app.gameState.cameraSnap = true;
  });
  new ResizeObserver(() => {
    app.resize();
    app.gameState.cameraSnap = true;
  }).observe(app.canvas.parentElement);
  app.legacy = new URLSearchParams(location.search).has("legacy");
  app.debugEnabled = new URLSearchParams(location.search).get("debug") === "1";
  app.world = app.legacy ? buildMaze() : buildAdventure();
  app.cues = createCues();
  app.world.mazeHeight = app.world.H;
  addSurfaceSpikes(app.world);
  removeSpikeShelters(app.world);
  installRegionFeatures(app.world);
  addBossArena(app.world);
  ({ T: app.T, W: app.W, H: app.H, map: app.map } = app.world);
  app.sceneMirrors = app.handheld ? createSceneMirrors(app.world) : [];
  app.originalMap = app.map.map((row) => row.slice());
  app.originalPlatforms = app.world.platforms.map((p) => ({ ...p }));
}
