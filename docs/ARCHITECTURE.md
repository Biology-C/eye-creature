# 探索版程式導覽

適用於 feature/first-adventure-rework 及其整理分支 refactor/maintainability。
這份文件說明目前實作；數值基準見 [現行規格](design/current-game-spec.md)，
完整文件狀態見 [索引](README.md)。原版 main 是獨立版本，不可用本文件批量改寫它。

## 入口與執行方式

根目錄 index.html 與 styles/ 下的 CSS 提供 DOM、面板與掌機布局；src/game.js 是遊戲組裝入口。
src 使用瀏覽器 ES modules，不需要打包器；npm start 透過 scripts/server.cjs 提供靜態檔案。
assets 保存素材，previews 保存美術與音效試看頁，tests 同時包含純模組與瀏覽器測試。
scripts/build-pages.cjs 將原版放根目錄、探索版放 preview/，共用 versions/ 選擇頁。

## 模組地圖

| src 檔案 | 職責 |
|---|---|
| adventure.mjs | 組裝固定主線與種子支路、保護區、初始敵人及必要資源。 |
| audio-settings.mjs | 共用音量選項與可容錯的 localStorage 設定讀寫。 |
| boss-recovery.mjs | 決定魔王危急回復能量的掉落位置、拾取與繪製。 |
| boss.mjs | 管理紅熊房、攻擊狀態、援軍門檻、鏡子、出口門與魔王繪製。 |
| breach.mjs | 選取四方向可破牆、檢查資源及保護範圍並套用地形破壞。 |
| combat-sounds.mjs | 將實際受傷結果轉為音效，處理命中去重與死亡音優先順序。 |
| hit-geometry.mjs | 提供近戰範圍、身體尺寸及牆面阻隔的共用命中判定。 |
| config/balance.mjs | 集中玩家、戰鬥、敵人、魔王、資源、陷阱與教學的可調參數及唯讀預設快照。 |
| systems/combat.mjs | 唯一角色 HP 寫入與傷害入口；處理無敵、死亡、老鼠血量形態及延後分裂，另提供回血與還原入口。 |
| core/events.mjs | 每個遊戲實例的同步 on/off/emit 匯流排；依註冊順序完成回饋，不延後事件。 |
| ui/event-feedback.mjs | 訂閱戰鬥、拾取、環境與畫面事件，驅動音效、音樂、回血視覺及 HUD。 |
| core/assets.mjs | 載入主角與敵人影格，完成後初始化新局、續玩選項與除錯入口。 |
| core/bootstrap.mjs | 建立單一遊戲實例，依序安裝函式、建立世界與服務、綁定輸入及載入素材。 |
| core/input.mjs | 將鍵盤與多指觸控轉為動作，處理按下／放開、蓄力、長按破牆與清除輸入。 |
| core/loop.mjs | 保留原 rAF 時間差、hitStop 與更新／聲音／渲染的幀順序。 |
| core/runtime.mjs | 建立 GameState、碰撞服務、事件訂閱、音訊與閱讀卡片的實例依賴。 |
| core/snapshot.mjs | 提供複製後的 levelSnapshot，供回放檢查；不暴露可寫入的遊戲實例。 |
| core/update.mjs | 依原順序協調玩家、敵人與探索更新，傳遞單次更新的暫存資料。 |
| core/world.mjs | 建立畫布與固定世界，安裝尖刺、區域裝置與魔王房並保留重設用幾何快照。 |
| systems/camera.mjs | 管理畫布大小與鏡頭前視、緩衝、延遲轉向、平滑跟隨及立即定位。 |
| systems/checkpoints.mjs | 組裝休息燈快照，處理保存、續玩選單、還原與除錯隔離。 |
| systems/collision.mjs | 提供空間、移位與視線判定的既有包裝，仍沿用原碰撞來源。 |
| systems/enemy-update.mjs | 依序更新光彈、延後分裂、敵人接觸、鏡面、魔王與陷阱。 |
| systems/exploration-update.mjs | 依序處理收集、休息燈、出口、凝視、殘響、教學與探索記錄。 |
| systems/melee.mjs | 處理近戰目標、連段、跳撞與命中效果，經統一傷害入口結算並發出結果事件。 |
| systems/player-actions.mjs | 執行破牆、鏡面、衝刺、光彈及史萊姆跳撞的既有動作。 |
| systems/player-form-flow.mjs | 同步詛咒形態、輸入取消、魔法清除與形態操作提示。 |
| systems/player-update.mjs | 更新玩家物理、氣流、長按破牆、衝刺命中與近戰位移。 |
| systems/tutorials.mjs | 檢查原有情境教學條件並交由 guidance 顯示。 |
| ui/audio.mjs | 管理音效音量偏好，將場景與蓄力同步轉為音訊事件。 |
| ui/hud.mjs | 在訂閱回呼內更新 HP、能量、按鍵、區域與攻擊資訊，保持原更新時點。 |
| ui/menu-bindings.mjs | 綁定開始、重試、暫停、主題、減少動態、提示與掌機選單。 |
| ui/panels.mjs | 呈現暫停、閱讀、回憶與一般面板，協調暫停／恢復。 |
| render/actors-pass.mjs | 依原圖層繪製樹妖、青影鳥、老鼠、紅熊、主角與戰鬥效果。 |
| render/overlay-pass.mjs | 繪製受傷遮罩、魔王 HP、小地圖、翼能、連段與蓄力資訊。 |
| render/primitives.mjs | 提供矩形、文字及掌機旅程地圖的共用繪圖工具。 |
| render/terrain-pass.mjs | 繪製地形、風道、裂牆、火炬、平台、尖刺、收藏與出口。 |
| render/world-render.mjs | 保持 terrain → actors → overlay 的繪圖次序與同一 Canvas 狀態。 |
| scenes/adventure-flow.mjs | 建立新局、清除本局狀態，保留原有覆蓋存檔確認。 |
| scenes/boss-flow.mjs | 管理進入紅熊房、攻擊阶段回呼、戰鬥完成清理與通關面板。 |
| core/state.mjs | 每局唯一 GameState；建立獨立集合並以 resetState 更新指定欄位，保留物件身分。 |
| cues.mjs | 播放發現、破牆錄音、存檔及區域裝置提示音。 |
| debug.mjs | 僅在 debug=1 載入的即時數值、FPS、無敵與測試快捷操作面板。 |
| exploration-art.mjs | 繪製凝視線索、風道、地標、環境物件與殘響。 |
| exploration.mjs | 管理凝視、風道、障礙、樹樁及殘響佇列；鏡頭舊匯出轉交 systems/camera.mjs。 |
| fauna.mjs | 更新樹妖、青影鳥、映照、增殖及龍捲風施放行為。 |
| feedback.mjs | 提供回血粒子與 HP 回饋、紅熊受擊染色與偽裝拍翼顯示。 |
| game.js | 3 行啟動入口，只呼叫 createGame；實際組裝位於 core/bootstrap.mjs。 |
| guidance.mjs | 管理一次性情境教學、關鍵破牆提示、按鍵標記與區域標題。 |
| handheld.mjs | 轉譯手機按鍵、長按破牆選擇、場景鏡面與掌機相關顯示。 |
| health.mjs | 定義生命上限並產生 HP 分格與低生命邊框效果。 |
| hero.js | 載入並繪製主角像素影格與各動作動畫。 |
| magic.mjs | 管理光彈與近戰、衝刺特效的參數、更新及碰撞。 |
| maze.mjs | 保留舊式種子迷宮產生器，供 legacy 路線回歸使用。 |
| message-card.mjs | 建立藏品與殘響大卡片，處理閱讀內容及 0.6 秒關閉保護。 |
| music.mjs | 依場景切換 BGM，管理播放、音量、暫停與通關降音量。 |
| physics.mjs | 計算玩家重力、拍翼、衝刺、平台碰撞與地面物理。 |
| pickup-art.mjs | 共用遊戲與訊息卡片的拾取物圖示繪製。 |
| player-form.mjs | 實作玩家史萊姆形態的跳躍、攀附及跳撞攻擊。 |
| rats.mjs | 更新水晶老鼠及其史萊姆形態的索敵、移動與跳躍。 |
| region-features.mjs | 定義區域橫向氣流、牆刺配置、裝飾與預告狀態。 |
| rewards.mjs | 建立及收集翼能、回血累積、破牆能量與能力藏品。 |
| save.mjs | 驗證存檔格式與關卡版本，建立快照並容錯讀寫本機儲存。 |
| sfx.mjs | 用 Web Audio 合成戰鬥音效、蓄力聲及離線 WAV 試聽輸出。 |
| slime.mjs | 處理純史萊姆、大史萊姆、死亡分裂及牆面攀附。 |
| terrain.mjs | 依區域與主題建立及快取三種像素石磚。 |
| torches.mjs | 配置火炬並以探索及視線判斷點亮狀態。 |
| tornado.mjs | 更新樹妖魔法的移動、牆面反彈與龍捲風繪製。 |
| traps.mjs | 計算尖刺週期與傷害區，以及地板、天花板、牆面陷阱配置。 |

## 主迴圈的資料流

遊戲實例由 core/bootstrap.mjs 建立。app 是組裝時的依賴容器，持有世界、畫布、服務與函式；
可變的本局狀態集中在 app.gameState（包括按鍵、55 個初始欄位與集合），不能再新增模組級 let。
世界幾何由該實例的 world/map 持有；新局依原規則還原，沒有另一份全域世界。
各 install 函式只登記方法，setupWorld → setupRuntime → 綁定介面 → loadAssets 才依原順序初始化。
app 不掛在 window；正式公開的 levelSnapshot 只回傳複製資料。

```text
鍵盤／觸控 → core/input → 動作函式、GameState.keys
requestAnimationFrame → core/loop
  ├─ dt = min(0.05, 本幀與上一幀的實際秒差)
  ├─ playing 且非 hitStop → core/update
  │    ├─ player-update：時間、形態、物理、氣流、衝刺、近戰
  │    ├─ enemy-update：光彈、分裂、敵人、鏡面、魔王、陷阱
  │    └─ exploration-update：拾取、存檔、出口、凝視、提示、鏡頭
  │         └─ 實際結果 → 同步 events.emit → 音效／回血回饋／HUD
  ├─ musicChanged → chargeChanged/Stopped → combatFeedbackFlush
  ├─ render/world-render：terrain → actors → overlay
  └─ 排程下一幀
```

**保留既有可變步長**：正式遊戲原來不是 accumulator 固定步長；此次不能改成固定模擬，
否則會改動 hitStop、冷卻與物理。Golden 測試用固定 1/60 秒虛擬時鐘驅動同一個 loop。
update/render 的 frame 只是本次呼叫的局部暫存，不能跨幀保留或寫進存檔。

core/events 是同步、依註冊順序分派的實例匯流排；on 回傳取消訂閱函式，也支援 off。
訂閱不可扣血、改碰撞或重新判定命中。一般結果由 ui/event-feedback 訂閱，
逐幀 HUD 回呼由 core/runtime 註冊到 ui/hud，維持原本的呼叫位置。

| 事件 | 內容／訂閱結果 |
|---|---|
| enemyHit / enemyDefeated | enemy、before、boss、crystalRat；受擊染色、命中合併與死亡優先音效。 |
| playerHurt | dead；扣血成功後選 hurt 或 death，仍在原 inv 更新之前。 |
| hudChanged / playerHealed | 原 HUD 觀察點偵測 HP 上升，驅動綠色回血回饋；沒有新增回血判定。 |
| meleeStarted / lightFired / dashStarted | stage／charged；只有實際出招才播放。 |
| pickup / orbCollected | 保留同幀光點優先，避免重疊播放 pickup。 |
| bossPhase / playerTransformed / mirrorUsed | summon／ready、變身與成功解除／映照；維持一次性觸發。 |
| wallBroken / obstacleBroken / checkpointSaved / discovered | 原提示音與破牆錄音 fallback。 |
| chargeChanged / chargeStopped / musicChanged / levelCleared | 蓄力門檻、場景切歌及通關暫時降音量。 |
| *HudChanged | 純 UI 更新；不另跑世界模擬。 |

玩家接觸、尖刺、龍捲風及魔王傷害均經 hurt 包裝 → systems/combat.damagePlayer。
敵人扣血經 damageEnemy；老鼠形態仍由 HP 推導（isSlime），滿蓄力致死不先產生史萊姆。
大史萊姆分裂由 flushEnemyDeaths 在原本的光彈更新之後執行，不能搬到扣血當下。
近戰的敵人回饋仍在整輪結算後發出，以保留原音效順序。
回血、重試與讀檔使用 setHealth／restoreActor，與造成傷害分開；Object literal 出生 HP 合法。
eye-damage-entry.test.mjs 禁止其他模組直接寫 actor.hp；環境障礙 o.hp 是明確例外。

暫停、失焦與重要卡片閱讀會停止世界更新並清除輸入；卡片的 0.6 秒操作防誤觸使用實際經過時間。
死亡保留本局進度，重新載入則回到最近休息燈快照，兩者不是同一個重設流程。
不要保存飛行魔法、動畫與按鍵；版本不相容時保留原存檔並告知玩家。

## 想改 X 去哪裡

| 想改的內容 | 先看 | 一起檢查 |
|---|---|---|
| 紅熊、詛咒與門 | boss.mjs、player-form.mjs | scenes/boss-flow.mjs、systems/combat.mjs、boss-recovery.mjs、eye-bear-v2-browser.test.cjs |
| 一般敵人與密度 | rats.mjs、slime.mjs、fauna.mjs、adventure.mjs | physics.mjs、eye-density.test.mjs、eye-slime.test.mjs |
| 能量、藏品與回血 | rewards.mjs、adventure.mjs、health.mjs | feedback.mjs、boss-recovery.mjs、eye-balance-browser.test.cjs |
| 教學提示與閱讀卡片 | guidance.mjs、message-card.mjs | systems/tutorials.mjs、ui/panels.mjs、styles/guidance.css、eye-guidance-browser.test.cjs、eye-opening-browser.test.cjs |
| 音效與音樂 | sfx.mjs、cues.mjs、combat-sounds.mjs、music.mjs | ui/event-feedback.mjs、ui/audio.mjs、audio-settings.mjs、previews/sfx/index.html、eye-sfx-browser.test.cjs |
| 存檔與續玩 | save.mjs、systems/checkpoints.mjs | adventure.mjs 的版本／穩定 ID、eye-adventure.test.mjs |
| 手機介面與按鍵 | handheld.mjs、index.html、styles/handheld.css | core/input.mjs、eye-handheld-browser.test.cjs |
| 區域裝置、尖刺與裝飾 | region-features.mjs、traps.mjs、terrain.mjs | exploration-art.mjs、eye-region-features.test.mjs |
| 開路、風道與凝視 | breach.mjs、exploration.mjs、adventure.mjs | eye-vertical-breach.test.mjs、eye-adventure-browser.test.cjs |
| 攻擊手感與光彈 | hit-geometry.mjs、magic.mjs、systems/melee.mjs、systems/player-actions.mjs | eye-combo.test.mjs、eye-charge-ground-browser.test.cjs |
| 鏡頭舒適度 | systems/camera.mjs | eye-camera-browser.test.cjs |
| 調整平衡數值 | config/balance.mjs | eye-replay.test.cjs、eye-balance-config.test.mjs；刻意改行為時才更新 golden |
| 除錯測試工具 | debug.mjs | core/assets.mjs 的隔離介面、eye-debug-browser.test.cjs |

表中 src 與 tests 的檔名均相對於各自目錄。先找匯出函式及實際呼叫點，避免只改試聽頁或試玩入口。
`?boss-preview=1` 使用同一套魔王程式；`?legacy=1` 是此分支舊生成器的回歸路徑，不等於 main 的發布快照。

## 安全修改與工具邊界

**調整平衡只改 src/config/balance.mjs**，不要在使用參數的各模組重新寫死數值。
依註解使用秒、像素與 HP；精靈畫法、碰撞取樣精度與關卡幾何仍留在各自模組，不屬於平衡表。
candidate 數量保留穩定生成順序，population 決定探索版保留數量；legacy 是舊生成器的回歸預設。
設定修改後重新載入；除錯面板的白名單欄位另支援即時變更，不儲存至旅程。

`?debug=1` 才動態載入面板；一般網址與 debug=0 不建立面板、不要求除錯模組。
debug 模式不讀寫、刪除休息燈存檔，以免臨時無敵、HP 與資源改動滲入正式進度。
回放機制與修改基線程序見 [重構安全網](REFACTORING.md)。

- 指令與分支規則以根目錄 [AGENTS.md](../AGENTS.md) 為準。
- Prettier 覆蓋 src、tests、scripts 及本次工具設定；不重繪素材、不修改數值或存檔版本。
- ESLint 的測試全域宣告只描述瀏覽器注入介面；局部 unused 例外保留既有契約，不代表推薦新增死碼。
- sfx.mjs、boss.mjs、adventure.mjs 仍是既有大檔；此次新增模組全部 ≤400 行，game.js 為 3 行。
- 拆分步驟、提交與驗證結果見 [遊戲入口重構紀錄](GAME_REFACTOR.md)。
- 本次檢查與回復記錄見 [整理驗收](MAINTAINABILITY.md)；部署限制見 [發布說明](PUBLISHING.md)。
