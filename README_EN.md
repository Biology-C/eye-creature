# Eye Creature

## Try both versions

The original stays on `main`; the exploration rework stays on `feature/first-adventure-rework`. Game code is not merged. The preview adds gaze, wind routes, memories and checkpoint saves; desktop controls are preserved and touch devices now use a dedicated green/gray pixel handheld shell (A attack/breach, B flap, X dash).

**[Choose a version](https://biology-c.github.io/eye-creature/versions/)** · [Original maze](https://biology-c.github.io/eye-creature/) · [Exploration preview](https://biology-c.github.io/eye-creature/preview/)

[Preview source](https://github.com/Biology-C/eye-creature/tree/feature/first-adventure-rework) · [Deployment notes](docs/PUBLISHING.md)

Please include the version, play time and where you got stuck in feedback. The rest of this README describes the original game.

**[🎮 Play in your browser](https://biology-c.github.io/eye-creature/)**

[繁體中文](README.md) · [Original Mouse Maze](https://github.com/Biology-C/mousemaze)

A standalone pixel-art action maze prototype. Explore the first level, collect three guiding lights, and escape as a fallen hero's eye transformed into a biological weapon.

Extracted from the Mouse Maze experimental prototype. This repository now owns Eye Creature code, assets, issues and releases; Mouse Maze keeps its original adventure, educational and mechanism modes.

## Run

Node.js 22 or later: `npm start`, then open http://127.0.0.1:8768/ . No build or dependency installation is needed to play; use HTTP rather than opening the HTML file directly.

Move: arrows or WASD. Up flaps/glides; down drops through platforms. Space automatically chooses melee when a target is in front and close, otherwise light magic. Tap repeatedly for a three-step melee combo; at range, release a short press for a shot or hold 0.8s before releasing for charged magic. Shift dashes, Q casts mirror, E breaks marked surfaces (combine up/down for vertical surfaces), P pauses. F is reserved for future magic selection. Touch buttons are included.

Features include jumping crystal rats that transform into slime, shadow birds, melee-only tree fiends, timed spikes, exploration torches, collectibles, healing shards and destructible marked walls/floors/ceilings. Light/dark and reduced-motion settings are supported.

No save across reloads. Death preserves current-run progress; reload/restart clears it. The 10–15 minute playtime is a design target, not a guarantee. Later levels and additional magic are not implemented. The first red bear boss prototype now guards the exit (30 HP); trees have 5 HP and shadow birds are capped at six per activated zone.

## Test

```sh
npm ci
npx playwright install chromium
npm test
```

The runner starts its own temporary server and runs model checks, browser interactions, mobile layouts and damage-isolated navigation to the boss entrance plus separate boss combat and death checks. Artifacts go to ignored `tests/artifacts/`. Set `BROWSER_CHANNEL=chrome` to use installed Chrome if desired.

See [design history](docs/design/README.md), [migration notes](docs/design/MIGRATION.md) and [asset sources](ASSET_SOURCES.md). Original Eye Creature additions use the [Source-Available License](LICENSE), not an open-source license. Personal noncommercial use and private modification are permitted. Commercial use and public distribution/deployment of modified versions require prior written permission from Biology-C. Unmodified noncommercial copies must preserve attribution and license notices. Previously MIT-licensed Mouse Maze portions retain their original rights; see [scope and exceptions](THIRD_PARTY_NOTICES.md).

Relics now unlock three-way light shots, damaging dashes with half cooldown, and ordinary interior-wall breaking (30 energy; boundaries protected). Abilities persist through death, reset on a new run. Spikes also appear on ceilings and side walls. Tree fiends cast green tornadoes that reflect twice and disappear on the third collision; slimes jump, crawl on walls and traverse ceilings.

Pure slimes are now seeded random encounters (20 in the current layout). All slimes jump approximately twice as high as crystal rats, move at 1.25x their corresponding speed, and crawl on walls/ceilings. The terrain uses new original procedural beveled masonry with cracks and moss; collision geometry is unchanged.

Latest balance: 20 regular pure slimes, 20 initial birds across 20 zones, and five purple large slimes (3 HP, 0.75x slime speed, double contact damage, four children on death). A seen bird zone spawns every 1.5s up to six living birds, stopping when cleared. Spikes are 1.25x longer with overlapping platform shelters removed. Player health is now five segments; at <=1 HP a heartbeat vignette appears, or a steady border in reduced-motion mode.

### Combo and charged-light prototype

Tap attack near an enemy for slash → spin → forward cross slash (0.32s between swings, 0.85s combo window). At range, release a short press to fire; cooldown is 0.5s. Hold 0.8s and release for one larger projectile dealing 1.5 damage. The spread relic still affects normal shots. Pause, blur and death cancel charging and buffered attacks. Tornadoes now use horizontal green coils and retain two reflections.
