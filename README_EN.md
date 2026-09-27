# Eye Creature

[繁體中文](README.md) · [Original Mouse Maze](https://github.com/Biology-C/mousemaze)

A standalone pixel-art action maze prototype. Explore the first level, collect three guiding lights, and escape as a fallen hero's eye transformed into a biological weapon.

Extracted from the Mouse Maze experimental prototype. This repository now owns Eye Creature code, assets, issues and releases; Mouse Maze keeps its original adventure, educational and mechanism modes.

## Run

Node.js 22 or later: `npm start`, then open http://127.0.0.1:8768/ . No build or dependency installation is needed to play; use HTTP rather than opening the HTML file directly.

Move: arrows or WASD. Up flaps/glides; down drops through platforms. Space automatically chooses melee when a target is in front and close, otherwise light magic; hold to repeat. Shift dashes, Q casts mirror, E breaks marked surfaces (combine up/down for vertical surfaces), P pauses. F is reserved for future magic selection. Touch buttons are included.

Features include jumping crystal rats that transform into slime, shadow birds, melee-only tree fiends, timed spikes, exploration torches, collectibles, healing shards and destructible marked walls/floors/ceilings. Light/dark and reduced-motion settings are supported.

No save across reloads. Death preserves current-run progress; reload/restart clears it. The 10–15 minute playtime is a design target, not a guarantee. Later levels, the red bear boss and additional magic are not implemented.

## Test

```sh
npm ci
npx playwright install chromium
npm test
```

The runner starts its own temporary server and runs model checks, browser interactions, mobile layouts and a complete first-level playthrough. Artifacts go to ignored `tests/artifacts/`. Set `BROWSER_CHANNEL=chrome` to use installed Chrome if desired.

See [design history](docs/design/README.md), [migration notes](docs/design/MIGRATION.md) and [asset sources](ASSET_SOURCES.md). Original Eye Creature additions use the [Source-Available License](LICENSE), not an open-source license. Personal noncommercial use and private modification are permitted. Commercial use and public distribution/deployment of modified versions require prior written permission from Biology-C. Unmodified noncommercial copies must preserve attribution and license notices. Previously MIT-licensed Mouse Maze portions retain their original rights; see [scope and exceptions](THIRD_PARTY_NOTICES.md).
