# Asset sources

- 戰鬥、蓄力、拾取及衝刺音效為 Web Audio 原創程式合成，不含音檔。`src/sfx.mjs` 與 `previews/sfx/` 取自使用者提供的 `eye-creature-sfx.patch`；既有 `src/cues.mjs` 保留發現、清除障礙及存檔提示音。
- `assets/sfx/wall-break.wav`：使用者於2026-09-30提供「拆牆音效.wav」，原檔直接複製（5秒、16kHz、單聲道）。成功破牆時取代合成提示；載入失敗時使用原提示音。此來源紀錄不宣稱音檔作者或可自由再利用授權。
- 2026-10-01追加：命中、玩家受傷、擊敗／老鼠變身、紅熊預告與引路光點音效，依使用者提供的Web Audio程式合成，無新增音檔。
- 2026-10-01再追加：鏡面、詛咒、魔王召喚、魔王倒下、玩家死亡與通關六種音效，依使用者提供的Web Audio程式合成，不含音檔。新版紅熊沿用本專案main的原創Canvas造型、投射物、重踏與掉落鏡子繪製；沒有匯入參考角色圖像。

## Exploration background music (2026-09-30)

The project owner supplied these recordings for the exploration version. Files are copied unchanged; playback gain defaults to 0.20 and is adjustable. Original titles are preserved here for attribution. No claim of authorship, exclusive ownership, or permission to reuse the underlying compositions is made by this record; these recordings are not offered as freely reusable assets under the project code license.

| File | Supplied title | Scene |
|---|---|---|
| assets/music/title.mp3 | Safe Haven NES Cover | Title / completion |
| assets/music/boss.mp3 | 紅熊魔王 - Red Bear Overlord (Alt) | Living, active red bear boss |
| assets/music/exploration.mp3 | Pure 8-Bit Chiptune Ambient Cover | Exploration / return after death / defeated boss |

Author and original source URLs were not supplied. This addition applies only to `feature/first-adventure-rework`; original-mode `main` is unchanged.

The runtime and concept images below were created with OpenAI image generation during the owner's iterative Eye Creature design sessions. They are not extracted from Hollow Knight, Contra, MapleStory or reference screenshots. User-supplied reference screenshots are not included in this repository.

| Files | Purpose / record |
|---|---|
| previews/animation/sprites.png | Approved hero animation base; previews/animation/README.md |
| assets/sprites/rats.png | Crystal rat and slime; docs/design/prompts.md |
| assets/sprites/fauna.png | Shadow birds and tree fiends; docs/design/fauna-prompts.md |
| docs/design/*-v2.png, *-v3.png | Character concept history; character-prompts.md and prompts-v3.md |
| docs/design/pixel-vs-geometric.png | Style comparison; style-comparison.md |
| docs/design/enemies/*.png | Enemy concept history; adjacent prompt records |

Wing motion adjustments, light effects, slash arcs and dash effects are rendered in project code. Original Eye Creature additions and artwork, to the extent rights are held, use the root source-available LICENSE. See THIRD_PARTY_NOTICES.md for existing MIT and third-party exceptions. This provenance note does not assert exclusive copyright over generated images.

The first red bear boss is drawn procedurally in src/boss.mjs (stitched red bear silhouette with crystal graft). The three slash candidates in src/magic.mjs are code-rendered comparison prototypes, not copied image assets.

The masonry in src/terrain.mjs is original procedural Canvas artwork inspired by the user-provided stone/brick reference (2026-09-29). No pixels from that screenshot are included. Pure/climbing slimes reuse the existing slime sprites with surface-relative orientation.

The five-segment HP display is original SVG/CSS artwork based on the user-provided pixel heart/bar reference (2026-09-29); the reference image itself is not bundled. Purple large slimes recolor and scale the existing slime sprite.

- Green tornado coils: original procedural Canvas rendering inspired by the user-provided green wind animation reference (2026-09-29); no reference pixels embedded. Combo slash ribbons and charge effects are also procedural.

- Adventure rework: original Canvas drawings for cracked tank, roots, mirror columns, observatory, wind grilles, environmental barriers and memory silhouettes. Audio cues are generated with Web Audio sine oscillators; no third-party samples added. Existing hero/monster sprites retained.


- 手機掌機介面：原創 CSS 像素邊框、十字鍵、A/B/X 按鍵與綠灰調色；依使用者核定的掌機樣張重新實作，未使用參考照片作遊戲素材。场景鏡面以原創 Canvas 幾何繪製。
