# Eye Creature

**[🎮 Choose a version](https://biology-c.github.io/eye-creature/versions/)** · [Original maze](https://biology-c.github.io/eye-creature/) · [Exploration preview](https://biology-c.github.io/eye-creature/preview/)

[繁體中文](README.md) · [Original Mouse Maze](https://github.com/Biology-C/mousemaze)

A standalone pixel-art action maze prototype. Explore the first level, collect three guiding lights, and escape as a fallen hero's eye transformed into a biological weapon.

Extracted from the Mouse Maze experimental prototype. This repository now owns Eye Creature code, assets, issues and releases; Mouse Maze keeps its original adventure, educational and mechanism modes.

## Exploration preview

The `feature/first-adventure-rework` branch adds an authored spine with six seeded branches, gaze clues, three wind ducts, combo-cleared obstacles, three memories, desktop HUD/camera improvements and browser-local checkpoint saves. Published separately at `/preview/`; the root URL keeps the original `main` game. See [deployment notes](docs/PUBLISHING.md). The preview now includes a dedicated touch-device handheld shell while preserving desktop controls. See the [validation record](docs/design/adventure-validation.md).

## Phone controls

Touch devices use a green-and-gray pixel handheld shell; the game remains full color. D-pad moves/looks, B flaps/glides, A attacks or charges magic, X dashes. Near an eligible wall with 30 energy, hold A for 0.65s to breach; turning away, leaving range, damage or a melee target cancels it. Phone mirrors are environmental props, including the existing boss-room mirror. SELECT opens the explored map; START pauses. Desktop Space/E/Q/Shift are unchanged.

Portrait, landscape and multi-touch browser emulation pass; physical iOS/Android testing remains pending. See [phone validation](docs/design/handheld.md).

## Run

Node.js 22 or later: `npm start`, then open http://127.0.0.1:8768/ . No build or dependency installation is needed to play; use HTTP rather than opening the HTML file directly.

Move: arrows or WASD. Up flaps/glides; down drops through platforms. Space automatically chooses melee when a target is in front and close, otherwise light magic. Tap repeatedly for a three-step melee combo; at range, release a short press for a shot or hold 0.8s before releasing for charged magic. Shift dashes, Q casts mirror, E breaks marked surfaces (combine up/down for vertical surfaces), P pauses. F is reserved for future magic selection. Touch buttons are included.

Features include jumping crystal rats that transform into slime, shadow birds, melee-only tree fiends, timed spikes, exploration torches, collectibles, healing shards and destructible marked walls/floors/ceilings. Light/dark and reduced-motion settings are supported.

In the exploration preview, lamps save checkpoints in the same browser. Death preserves current-run progress; reload restores the last lamp snapshot. Starting a new run asks before replacing an existing save. The previously published build has no persistence. The 10–15 minute playtime is a design target, not a guarantee. Later levels and additional magic are not implemented. The first red bear boss prototype now guards the exit (30 HP); trees have 5 HP and shadow birds are capped at six per activated zone.

## Test

```sh
npm ci
npx playwright install chromium
npm test
```

The runner starts its own temporary server and runs model checks, desktop browser interactions and damage-isolated navigation to the boss entrance plus separate boss combat and death checks. Artifacts go to ignored `tests/artifacts/`. Set `BROWSER_CHANNEL=chrome` to use installed Chrome if desired.

See [design history](docs/design/README.md), [migration notes](docs/design/MIGRATION.md) and [asset sources](ASSET_SOURCES.md). Original Eye Creature additions use the [Source-Available License](LICENSE), not an open-source license. Personal noncommercial use and private modification are permitted. Commercial use and public distribution/deployment of modified versions require prior written permission from Biology-C. Unmodified noncommercial copies must preserve attribution and license notices. Previously MIT-licensed Mouse Maze portions retain their original rights; see [scope and exceptions](THIRD_PARTY_NOTICES.md).

Relics now unlock three-way light shots, damaging dashes with half cooldown, and ordinary interior-wall breaking (30 energy; boundaries protected). Abilities persist through death, reset on a new run. Spikes also appear on ceilings and side walls. Tree fiends cast green tornadoes that reflect twice and disappear on the third collision; slimes jump, crawl on walls and traverse ceilings.

Pure slimes are now seeded random encounters (20 in the current layout). All slimes jump approximately twice as high as crystal rats, move at 1.25x their corresponding speed, and crawl on walls/ceilings. The terrain uses new original procedural beveled masonry with cracks and moss; collision geometry is unchanged.

Latest balance: 20 regular pure slimes, 20 initial birds across 20 zones, and five purple large slimes (3 HP, 0.75x slime speed, double contact damage, four children on death). A seen bird zone spawns every 1.5s up to six living birds, stopping when cleared. Spikes are 1.25x longer with overlapping platform shelters removed. Player health is now five segments; at <=1 HP a heartbeat vignette appears, or a steady border in reduced-motion mode.

### Combo and charged-light prototype

Tap attack near an enemy for slash → spin → forward cross slash (0.32s between swings, 0.85s combo window). At range, release a short press to fire; cooldown is 0.5s. Hold 0.8s and release for one larger projectile dealing 1.5 damage. The spread relic still affects normal shots. Pause, blur and death cancel charging and buffered attacks. Tornadoes now use horizontal green coils and retain two reflections.
