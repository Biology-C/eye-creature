# 像素與幾何風格比較

[比較圖](pixel-vs-geometric.png)

使用內建 image_gen，參考已確認的 V3 西洋龍膜翼設定。這是風格概念圖，不是像素網格精準的正式 sprite sheet，也不是遊戲截圖。兩邊使用接近的姿勢、構圖與配色；生成造成的局部比例及格線差異不代表玩法差異。青綠虹膜為本輪比較用配色提案，未取代既有黑白角色規格。

| 觀察 | A 像素 | B 幾何 |
|---|---|---|
| 本圖呈現 | 階梯輪廓、較多明暗像素、復古感 | 平滑外輪廓、簡化膜面、較少細節 |
| 小尺寸注意事項 | 膜翼骨架容易合併，需要逐像素調整 | 翼骨相對清楚，仍需實測縮小後線寬 |
| 後續製作 | 需固定像素網格與各動作幀 | 可用向量／Canvas 建立關節動畫 |

兩者都能承載探索、戰鬥與找出口，不能由風格圖推論孩子偏好哪種玩法。下一輪若做試玩比較，需使用同一張地圖、相同速度、攻擊及獎勵，只切換畫面風格。

## 生成提示詞
Use case: stylized-concept. Create a polished side-by-side GAME ART STYLE COMPARISON board based on the attached approved eye creature anatomy. Two equal-width columns, EXACT SAME character, camera, pose, apparent scale and restrained palette in both. Title "EYE CREATURE / GAME STYLE STUDY". Left column title "A / PIXEL ART", right "B / GEOMETRIC". Character identity must be identical to reference: one round white eyeball, large black pupil, exactly TWO WESTERN DRAGON leathery membrane wings with articulated supports and scalloped membrane edges, ONE smooth tapered dark tail at rear underside approximately 1.5 eyeball diameters, NO feet/legs/arms, no feathers, no tentacles, no dragon head, no horns. Low hovering flight, tail never supporting weight.
Composition landscape 3:2 high resolution, warm offwhite backdrop, elegant readable short English labels, balanced whitespace.
Top half: a large hero side-three-quarter hovering pose facing right in each column, wings raised enough to clearly see dragon membranes, curved trailing tail. A genuine chunky pixel-sprite rendered on a consistent ~64x64 grid with nearest-neighbor enlarged square pixel edges, limited 8-color palette, pixel-stepped outlines, NO smooth contours, NO blur on character. B code-native-like flat geometric sprite, clean circles and filled polygon shapes, smooth crisp edges, 2-3 broad membrane panels per wing, simple angular joint and scallops, no texture, no gradients. BOTH use ivory eyeball, deep charcoal outline/pupil/tail/wing bones, muted slate-gray wing membranes, one restrained teal iris accent, same wing size. Preserve cute, mysterious tone, not horror.
Middle row label "POSE CHECK": three matching compact poses in each column: HOVER, GLIDE, TAIL SWEEP. Exactly two wings and one tail each, smooth tail sweep arc, consistent body proportions.
Bottom row label "IN THE MAZE": identical small top-down gameplay vignette in each column: a 7x5 section of simple labyrinth, player eye creature center-left at small recognizable gameplay size with side-view sprite facing right, one small orange diamond pickup and teal exit square same exact positions, clear walls and floors. A uses pixel art walls and pixel sprite; B uses flat geometric walls and geometric sprite. Same overhead maze layout, same palette, same player scale, no extra UI or invented combat mechanics. Creature floats over floor; silhouette and eye readable. Whole board is an art comparison concept, NOT implementation. Do not retain reference sheet dimensions/arrows or sketch texture. No extra logos, no captions claiming which is superior.

## 幾何簡化修正
Edit ONLY the RIGHT column B / GEOMETRIC of this comparison sheet. Keep entire LEFT pixel art column and all layout/text exactly unchanged. Right column must become genuinely FLAT GEOMETRIC GAME ART: eyeball is a flat ivory circle with dark crisp outline, teal iris flat crescent, pupil flat charcoal, tiny white highlight. Dragon membrane wings have simple polygonal gray panels with dark spars, zero gradients, zero texture, no hatching. Single long tail is a flat charcoal curved taper, no highlights or shading. Same poses, anatomy, proportions, hover height. For right maze vignette and legend tiles: use flat dark slate wall rectangles with thin clear outlines, flat ivory floor, remove ALL stone texture specks, mottling, bevels and lighting. Flat orange diamond pickup, flat teal outlined square exit, no gradients or gloss. Retain same maze layout as left; no new obstacles. Right bottom eye creature also flat vectorlike shapes. Shadows flat single gray ellipse. Goal true pixel vs clean flat geometric contrast, still same two dragon membrane wings, eye and single tail. Do not alter left column.

