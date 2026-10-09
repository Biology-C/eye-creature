import { spikeState } from "../traps.mjs";
export function exposeSnapshot(app) {
  window.levelSnapshot = (includeMap = false) => ({
    mode: app.gameState.mode,
    healing: app.healingFeedback.event ? { ...app.healingFeedback.event } : null,
    levelVersion: app.world.version,
    seed: app.world.seed,
    exploration: structuredClone(app.gameState.exploration),
    camera: { ...app.gameState.camera },
    boss: { ...app.gameState.boss },
    slashStyle: app.gameState.slashStyle,
    magic: JSON.parse(JSON.stringify(app.gameState.magic)),
    fauna: JSON.parse(JSON.stringify(app.gameState.fauna)),
    player: { ...app.gameState.player },
    lights: app.gameState.lights.map((l) => ({ ...l })),
    rats: app.gameState.rats.map((r) => ({ ...r })),
    rewards: app.gameState.rewards.map((r) => ({ ...r })),
    torches: app.gameState.torches.map((t) => ({ ...t })),
    crackedWalls: app.gameState.crackedWalls.map((w) => ({ ...w })),
    checkpoint: { ...app.gameState.checkpoint },
    kills: app.gameState.kills,
    time: app.gameState.time,
    map: includeMap ? app.map.map((r) => r.slice()) : undefined,
    exit: { ...app.world.exit },
    safes: app.world.safes.map((s) => ({ ...s })),
    traps: app.world.traps.map((t) => ({ ...t, ...spikeState(app.gameState.time) })),
    deaths: app.gameState.deaths,
  });
}
