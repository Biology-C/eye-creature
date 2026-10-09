# 探索版程式導覽

適用於 feature/first-adventure-rework 及其整理分支 refactor/maintainability。
這份文件說明目前實作；數值基準見 [現行規格](design/current-game-spec.md)，
完整文件狀態見 [索引](README.md)。原版 main 是獨立版本，不可用本文件批量改寫它。

## 入口與執行方式

根目錄 index.html、style.css 提供 DOM、面板與掌機布局；src/game.js 是遊戲組裝入口。
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
| combat.mjs | 提供近戰範圍、身體尺寸及牆面阻隔的共用命中判定。 |
| cues.mjs | 播放發現、破牆錄音、存檔及區域裝置提示音。 |
| exploration-art.mjs | 繪製凝視線索、風道、地標、環境物件與殘響。 |
| exploration.mjs | 管理凝視、風道、障礙、樹樁、殘響佇列及探索鏡頭。 |
| fauna.mjs | 更新樹妖、青影鳥、映照、增殖及龍捲風施放行為。 |
| feedback.mjs | 提供回血粒子與 HP 回饋、紅熊受擊染色與偽裝拍翼顯示。 |
| game.js | 組裝世界與各模組，協調輸入、主迴圈、事件、HUD、暫停與存檔。 |
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

概念上的回饋鏈是「輸入 → 世界更新 → 畫面 → 聲音與 HUD 回饋」，但實際呼叫時序如下，
不要為了配合圖示而調換程式：

```text
鍵盤／觸控 → keys 與操作事件
requestAnimationFrame → loop(now)
  ├─ 計算 dt（上限 0.05 秒）
  ├─ playing 且非 hitStop → update(dt)
  │    世界時間／形態／物理／攻擊／敵人／魔王／陷阱
  │    → 拾取／休息燈／凝視／風道／殘響／教學／鏡頭
  │    → 實際事件更新 HUD、提示卡片及一次性音效
  ├─ syncMusic → syncChargeSound → combatSounds.flush
  ├─ render → Canvas 場景、角色與相關畫面資訊
  └─ 排程下一幀
```

HUD 主要由事件觸發 updateHud，音效也有事件型與每幀同步型，不是獨立的第二套遊戲模擬。
主角、敵人、破牆與收集狀態由 game.js 協調；模組回傳結果後才決定提示、儲存或音效。
同一傷害不可在繪製或音效函式中重算。

暫停、失焦與重要卡片閱讀會停止世界更新並清除輸入；卡片的 0.6 秒操作防誤觸使用實際經過時間。
死亡保留本局進度，重新載入則回到最近休息燈快照，兩者不是同一個重設流程。
不要保存飛行魔法、動畫與按鍵；版本不相容時保留原存檔並告知玩家。

## 想改 X 去哪裡

| 想改的內容 | 先看 | 一起檢查 |
|---|---|---|
| 紅熊、詛咒與門 | boss.mjs、player-form.mjs | game.js beginBoss／hurt、boss-recovery.mjs、eye-bear-v2-browser.test.cjs |
| 一般敵人與密度 | rats.mjs、slime.mjs、fauna.mjs、adventure.mjs | physics.mjs、eye-density.test.mjs、eye-slime.test.mjs |
| 能量、藏品與回血 | rewards.mjs、adventure.mjs、health.mjs | feedback.mjs、boss-recovery.mjs、eye-balance-browser.test.cjs |
| 教學提示與閱讀卡片 | guidance.mjs、message-card.mjs | game.js、style.css、eye-guidance-browser.test.cjs、eye-opening-browser.test.cjs |
| 音效與音樂 | sfx.mjs、cues.mjs、combat-sounds.mjs、music.mjs | audio-settings.mjs、previews/sfx/index.html、eye-sfx-browser.test.cjs |
| 存檔與續玩 | save.mjs、game.js 的快照與還原流程 | adventure.mjs 的版本／穩定 ID、eye-adventure.test.mjs |
| 手機介面與按鍵 | handheld.mjs、index.html、style.css | game.js 輸入事件、eye-handheld-browser.test.cjs |
| 區域裝置、尖刺與裝飾 | region-features.mjs、traps.mjs、terrain.mjs | exploration-art.mjs、eye-region-features.test.mjs |
| 開路、風道與凝視 | breach.mjs、exploration.mjs、adventure.mjs | eye-vertical-breach.test.mjs、eye-adventure-browser.test.cjs |
| 攻擊手感與光彈 | combat.mjs、magic.mjs、game.js | eye-combo.test.mjs、eye-charge-ground-browser.test.cjs |
| 鏡頭舒適度 | exploration.mjs、game.js | eye-camera-browser.test.cjs |

表中 src 與 tests 的檔名均相對於各自目錄。先找匯出函式及實際呼叫點，避免只改試聽頁或試玩入口。
`?boss-preview=1` 使用同一套魔王程式；`?legacy=1` 是此分支舊生成器的回歸路徑，不等於 main 的發布快照。

## 安全修改與工具邊界

- 指令與分支規則以根目錄 [AGENTS.md](../AGENTS.md) 為準。
- Prettier 覆蓋 src、tests、scripts 及本次工具設定；不重繪素材、不修改數值或存檔版本。
- ESLint 的測試全域宣告只描述瀏覽器注入介面；局部 unused 例外保留既有契約，不代表推薦新增死碼。
- game.js、sfx.mjs、boss.mjs、adventure.mjs 是既有超過 400 行的例外，未在純排版任務拆分。
- 本次檢查與回復記錄見 [整理驗收](MAINTAINABILITY.md)；部署限制見 [發布說明](PUBLISHING.md)。
