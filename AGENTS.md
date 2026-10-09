# Eye Creature：人與 AI 的修改約定

## 目的與閱讀順序

本專案是有翅膀的眼球探索橫向迷宮、戰鬥並親手開路的 Canvas / JavaScript 遊戲。
探索版保留凝視、風道、勇者殘響、休息燈與紅熊戰；GitHub Pages 提供靜態網站，沒有後端。

先讀 [模組導覽](docs/ARCHITECTURE.md)、[文件索引](docs/README.md)、
[現行規格](docs/design/current-game-spec.md)，再讀本次修改涉及的程式與測試。
使用者本次要求優先；历史文件不能用來推翻現行規格或擅自恢復舊數值。
發現文件與程式不一致時，先說明差異，不可順手改變遊戲行為。

## 啟動與驗證

使用 Node.js 22.13 以上的相容 LTS 版本，首次執行 `npm ci`。

```sh
npm start
npm run test:unit
npx playwright install chromium
npm run test:browser
npm run format:check
npm run lint
npm test
```

`npm start` 開啟 http://127.0.0.1:8768/；可用 PORT 環境變數換埠。
先跑 `test:unit`（僅 tests/*.test.mjs），交付前跑完整 `test`。
`test:browser` 僅跑 tests/*.test.cjs；測試自行使用臨時伺服器，不依賴使用者的試玩頁。
Linux CI 安裝瀏覽器時使用 `npx playwright install --with-deps chromium`。
若使用已安裝 Chrome，PowerShell 可先設 `$env:BROWSER_CHANNEL='chrome'`。
不要把缺瀏覽器或失敗測試記為通過。

## 程式規則

- 單檔不超過 400 行；新功能放在職責單一、能獨立測試的模組。
- 禁止把多個敘述寫在同一行；以 `npm run format` 統一排版（printWidth 100）。
- 不把玩法數值散落寫死：使用所屬模組的命名常數或既有設定，例如 boss.maxHp。
  現在的平衡數值统一放 src/config/balance.mjs；調整平衡只改此檔，不在消費端複製常數。
- 遊戲更新、碰撞與傷害仍用既有判定來源；渲染與音效不得另外扣血或改世界。
- localStorage、音訊錯誤不得中斷遊戲；AudioContext 只在使用者操作後啟動。
- 暫停、失焦、閱讀卡片時保持既有凍結及清除輸入規則。
- 不為了通過 lint 移除不熟悉的副作用、改函式參數契約或測試斷言。
- no-undef、no-unused-vars、no-redeclare 必須無 error；其餘啟用規則先以 warn 提醒。
  測試注入的全域名稱逐檔宣告；必要例外須局部註解理由，不可整個目錄關閉檢查。
- 既有大檔例外為 src/sfx.mjs、src/boss.mjs、src/adventure.mjs；不繼續堆疊新功能。
  game.js 已拆分為 3 行啟動入口；core、systems、ui、render、scenes 新模組一律 ≤400 行。
- 本局可變狀態新增到 core/state.mjs，服務透過 bootstrap 的 app 實例組裝，不新增模組全域 let。
- 玩家／敵人扣血必須經 systems/combat.mjs；回血／載入用 setHealth／restoreActor。
  一般邏輯只發 events，不直接 sfx.play；新增訂閱不能改世界或重新結算命中。
- 保留 loop 的原有可變 dt 與更新順序；固定時鐘是 golden 測試機制，不能順便換物理積分方式。
- eye-architecture 與 eye-damage-entry 是結構護欄；不得為了繞過它們把邏輯塞回 game.js。

## 分支與 commit

- Golden replay 是行為契約：一般重構不得更新 tests/golden/*.json。
  只有任務明確要求改變遊戲行為時才可執行 `npm run replay:update`，並審查每個狀態差異；
  首次建立安全網允許從尚未重構的版本錄製初始基線。測試失敗不可用重錄掩蓋。
  回放腳本與基線修改須另列在回報中，說明原始版本及理由。

- 修改前確認分支與未提交內容，保留他人或前一任務的工作。
- 不直接 push main、不 force push；發布需要使用者授權。
- 探索版從 feature/first-adventure-rework 分支工作；本整理分支是 refactor/maintainability。
- 一個任務一個 commit 群組，排版、工具設定、文件分開提交，勿混入無關修改。
- 大規模排版用獨立的「format only」commit；該 commit 不含設定或行為修改。
- 原版 main 和探索版分開維護，不能把探索版整份合併進 main。
  共用發布設定的同步流程見 [發布說明](docs/PUBLISHING.md)。
- 測試產物、node_modules、日誌、使用者提供的未要求納入之 patch 不提交。

## 完成任務的回報

1. 改了哪些檔案，分別解決什麼問題。
2. 行為是否改變；有數值或存檔格式改變須明列，未改也須說明。
3. 實際執行的檢查與結果；列出警告、失敗及未執行項目。
4. 無法用人工確認的部分（聲音、實機觸控、長時間手感等），不可把自動測試當真人驗收。
5. 分支、commit 與是否已推送；本地結果不代表線上已部署。
