# 遊戲入口拆分與驗收紀錄

日期：2026-10-10。分支：refactor/maintainability，基準提交 bb2d1f4。
範圍：GameState、同步事件、統一傷害入口、職責拆檔與導覽；不改平衡、玩法、素材或存檔格式。
所有提交均留在本機，沒有 push。使用者原有 eye-creature-sfx.patch 未修改、未納入提交。

## 五步提交

| 步驟 | 提交 | 主要檔案與內容 | game.js 行數 | 提交前驗證 |
|---|---|---|---:|---|
| 1 狀態 | e5cef1e | core/state；54 個原可變綁定集中，createState/resetState；既有白箱測試加 test-only 別名。 | 2501 | npm test 53 檔、三段 golden 全通過。 |
| 2 事件 | b4650e3 | core/events、ui/event-feedback；音效、音樂、回血與主 HUD 改為同步訂閱。 | 2505 | npm test 54 檔、三段 golden 全通過。 |
| 3 傷害 | 093032d | systems/combat；game、fauna、boss、boss-recovery、rewards、debug 改走統一傷害／非傷害 HP 入口；新增 HP 寫入護欄。 | 2428 | npm test 55 檔、三段 golden 全通過。 |
| 4 拆檔 | dfa1746 | core、systems、ui、render、scenes；game.js 只啟動；鏡頭搬移且保留舊匯出；每幀 HUD 訂閱；觸控 Map 也移入 GameState；新增結構护欄。 | 3 | npm test 56 檔、三段 golden 全通過；8 張截圖相同。 |
| 5 文件 | 本文件所屬 docs 提交 | ARCHITECTURE 全模組地圖／資料流、AGENTS 修改邊界、README 索引、REFACTORING 測試介面說明。 | 3 | npm test 56 檔、三段 golden 全通過；format:check 與 lint 通過。 |

初始 game.js 為 2278 行；第一步因明確的 gameState 存取及排版換行而增加行數，並非新增功能。
新來源模組最大 268 行，全部不超過 400 行。既有 sfx、boss、adventure 大檔沒有趁本次全面拆分。
完整檔案清單可用各提交的 git show --stat 查閱；每個來源檔案的職責均列於 ARCHITECTURE。

## 驗證證據

- 每步先跑 test:unit，再跑完整 npm test；完整測試包含原版 legacy 與探索版瀏覽器回歸。
- 三段回放 opening 480 步／17 檢查點、exploration 1020 步／35 檢查點、boss 1200 步／41 檢查點全部相同。
- tests/golden/*.json 與 tests/helpers/replay.cjs 未修改，沒有執行 replay:update。
- 桌面 1280×720、掌機 390×844 的開場、裂牆、牆刺、紅熊場景共 8 張 PNG，與既有拆分前截圖的 SHA-256 全部相同。
- 圖片位於本機 tests/artifacts/maintainability-before-* 與 maintainability-split-*，屬忽略的測試產物，不提交。
- format:check 通過；lint 為 0 error、4 個既有 warning（測試的 rAF 覆寫及未使用賦值），未藉此改測試行為。
- balance.mjs、素材、HTML、CSS、存檔版本沒有修改；音效觸發與去重仍由原瀏覽器測試檢查。
- 白箱測試只調整取得實例的方法及加速繪圖開關，不刪除既有斷言；Golden 不使用白箱橋接。

## 保留的既有狀況與未修 bug

本輪未確認新的、可重現且需另行修正的既有遊戲 bug，因此沒有順手修 bug。

有一項需要明確區分的既有技術狀況：正式遊戲採 rAF 的可變 dt（最多 0.05 秒），
並非 accumulator 固定步長。為符合「行為完全不變」，core/loop 保留此公式和 hitStop 順序。
回放使用固定 1/60 秒的測試時鐘；若未來要改正式模擬步長，應另開行為變更任務驗證。

老鼠形態仍由現有 HP 門檻推導，沒有新增形態旗標；大史萊姆死亡分裂仍在原更新階段才生成，
沒有移到命中瞬間。死亡回燈、紅熊重試、回血、存檔還原也維持原有規則。

## 人工驗收限制

沒有以耳朵重新確認混音／聽感，沒有真人長時間試玩或真實手機多指操作。
音效時序、模擬觸控、快照及固定場景截圖通過，不能代表所有可能輸入與完整遊玩路線均已涵蓋。

## 回復與後續修改

每步可用獨立提交審查；若需回復，用新的 revert 提交，不 reset 使用者工作或 force push。
回到整個拆分前可從 bb2d1f4 建立獨立檢查分支。不要把探索分支直接覆寫 main。
之後調整玩法要先明確列出預期差異，才可考慮更新 golden；一般維護不得改基準。
