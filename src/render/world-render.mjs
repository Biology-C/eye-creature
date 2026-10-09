import { drawTerrainPass } from "../render/terrain-pass.mjs";
import { drawActorsPass } from "../render/actors-pass.mjs";
import { drawOverlayPass } from "../render/overlay-pass.mjs";
export function installRender(app) {
  app.render = function render() {
    const frame = {};
    drawTerrainPass(app, frame);
    drawActorsPass(app, frame);
    drawOverlayPass(app, frame);
  };
}
