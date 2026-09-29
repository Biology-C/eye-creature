# Asset sources

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
