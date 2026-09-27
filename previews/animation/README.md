# 動作樣張製作

內建 image_gen 產生 6×4 動作圖，HTML Canvas 以固定格線播放，縮至 64×64、停用平滑。未修改遊戲。

## 初始提示詞
Create a production-layout pixel art animation contact sheet using ONLY the LEFT PIXEL character from reference. TRANSPARENT BACKGROUND. Output landscape aspect 3:2, exactly 6 equal columns by 4 equal rows, 24 equal square cells, no margins, no labels, no text, no gridlines, no scenery, NO ground shadows. Every sprite wholly within its own cell with generous transparent 12% padding. Frame canvas 64x64 conceptual pixel grid, enlarged nearest-neighbor square pixels. Identical eyeball diameter about 20 logical pixels in ALL frames, eyeball center EXACTLY at cell (36,29) except turn poses same center. 8-12 colors ivory eye, black pupil, muted teal iris, charcoal outline/tail, gray membranes. Same ONE eye, TWO WESTERN DRAGON membrane wings with visible spars/scalloped skin (NO feathers), ONE tapered smooth long tail 1.5 eye diameters attached rear underside, no feet or tentacles. All floating.
ROW 1: six sequential HOVER loop frames facing RIGHT, wings high / halfway down / down / halfway up / high / settling. Tiny tail balance motion, constant body center.
ROW 2: six sequential MOVE loop frames facing RIGHT, forward lean and tail streams left, wings actively flap through up and down, constant body center, NO translation across cells.
ROW 3: six sequential TURN frames: facing RIGHT, right 3/4, FRONT, left 3/4, facing LEFT, settled LEFT. Eye body same diameter, pupil visibly rotates, wings change perspective, single tail swings with inertia. Do not simply repeat right-facing frames.
ROW 4: six sequential TAIL SWEEP facing RIGHT: neutral tail hangs back, tail drawn back in windup, body rotates slightly, tail sweeps underneath toward RIGHT in broad arc, tail follows through, tail returns behind. Keep tail constant length and one physical tail, no streaks or duplicated tails. Rightward strike silhouette must differ clearly from windup. No weapon in hand or projectile.
Consistent pixel density, constant scale and anchor per cell, no borders/labels, strictly 24 full sprites on transparent canvas. This sheet will be sliced automatically into a 6x4 grid and each row animated.

## 透明背景修正
Edit ONLY the background of this exact 1536x1024 sprite sheet. Remove ALL dark gray background, haze, glow, vignette and halos. Background must be fully transparent alpha 0, not translucent. Preserve exactly all 24 pixel sprites at original positions in their 6 columns and 4 rows, preserve their colors, dimensions, eye, wings, tails and animation poses. Character pixels must be opaque (alpha255). Hard pixel edges no glow or shadow or gradient outside silhouettes. Do not rearrange, rescale, relabel or add anything. Transparent game spritesheet cutout.

## 交付限制
AI 動作幀仍有眼球位置、翼幅與尾長的不一致；此版本用於動作感受審閱，不是最終遊戲動畫。64px 指整個角色影格框，眼球約 20px。轉向使用正反播放來展示來回，甩尾按關鍵姿勢分配停留時間。透明背景的 alpha 已抽樣確認空白區為 0。原始圖稿保留，Canvas 僅負責顯示、縮放及播放，不宣稱原圖已逐像素精修。


## 移動動作修訂：固定眼球
使用者確認移動時眼球固定、只有翅膀拍動。預覽程式改用同一格眼球與尾巴底圖，雙翼以獨立裁切顯示區繞翼根旋轉，六格皆使用相同身體位置。這是 Canvas 動畫層的修正，原始 PNG 保留。場景中整個角色仍可左右移動；懸停、轉向、甩尾沿用原樣張。瀏覽器已驗證六格眼球中央 18×15 像素完全一致，且翅膀影格有變化；翼根接縫仍屬審閱稿品質。


## 移動翼修訂：蝙蝠拍翼參考
依使用者提供的「下載.jpg」分格參考，只調整移動動畫：上舉、展翼下拍、下拍末端、折翼、收翼回程、重新展開，共六格。沿用原圖的膜翼像素與色盤，以 Canvas 網格變形讓翼根帶動外翼，回程折收，不再只作整片小角度旋轉。裁切後僅保留連通翼形，避免游離碎點。
眼球與尾巴使用同一底圖，遮罩防止後方翼色透入眼球；場景整體位移不受影響。懸停、轉向、甩尾和原始 sprites.png 不變。預覽檢查六格眼球中央 18×15 像素一致、六格翼形不同；390px 手機視窗無水平溢出，無 JavaScript 錯誤。這仍是拍翼感受樣張，尚未接入遊戲。


## 移動動作修訂：自然起伏（取代固定位置規則）
依最新回饋，移動時眼球隨拍翼輕微上下。六格垂直位移為 +1、0、−1、−1、0、+1 邏輯像素（64px 框），總高低差 2px；下拍後上浮，回程逐漸落回，循環交界無跳變。翼根、眼球及尾巴共用位移，避免連接處分離。保留原膜翼拍動、像素邊緣與其他三組動作，不改原始 PNG 或遊戲。
