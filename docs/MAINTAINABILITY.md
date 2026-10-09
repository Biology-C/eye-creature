# 維護整理驗收紀錄

## 2026-10-09：排版、設定與導覽

- 工作分支：refactor/maintainability，從 feature/first-adventure-rework 分出。
- 開始時已有的開場與豎井尖刺修改先在探索分支保存為 f317d90；它不屬於本次排版修改。
- 此新分支第一個 commit：c1dbffb，`style: format only (Prettier, printWidth 100)`。
  87 個檔案僅套用排版，沒有混入套件設定、文件或玩法修改。
- 後續加入 Prettier、ESLint flat config、EditorConfig、分組測試與 CI 檢查。
- 瀏覽器測試明列注入的全域名稱；既有未使用參數或測試介面用局部註解保留。
- 路線測試原本以無空白字串移除渲染，排版後無法匹配而逾時；改用容許空白的正規式，
  僅修測試加速工具，不改遊戲、路線或斷言。測試 runner 增加 unit/browser 分組。

## 實際驗證

| 項目 | 結果 |
|---|---|
| npm run test:unit | 23 個單元測試檔通過 |
| npm test | 49 個檔案全數通過（23 單元、26 瀏覽器） |
| npm run format:check | 通過 |
| npm run lint | 0 error，4 warning |
| 遊戲 JavaScript AST 比對 | 全部 src 與 f317d90 相同（忽略排版、註解、空敘述及物件 key 引號） |
| 8 張固定狀態截圖 | 桌面 1280×720／手機 390×844，各開場、裂牆、牆刺、紅熊；前後 PNG 完全相同 |

執行環境 Node 24.19.0、Playwright 1.58.2、已安裝 Chrome（BROWSER_CHANNEL=chrome）。
截圖、AST 工具及日誌在被忽略的 tests/artifacts 與本機 *.log，不作遊戲內容發布。
四個 lint 警告為三處測試覆寫 requestAnimationFrame，以及一處測試變數的既有賦值。
不為消除 warning 更改測試或玩法。

## 限制與回復

沒有改素材、傷害、速度、冷卻、地形、存檔格式或聲音參數。
人工耳聽、實機觸控與長時間手感未重新驗收；截圖一致只覆蓋上述固定狀態。
既有 game.js、sfx.mjs、boss.mjs、adventure.mjs 超過 400 行，已列入 AGENTS 的漸進拆分例外。
本輪沒有拆檔，以免把功能重構混進 format only。

回復時依需求 revert 文件與工具提交，再 revert c1dbffb 可回到未排版狀態；
保留 f317d90 即保留原先開場與尖刺修正。不 reset 使用者未提交內容，不 force push。
main 未修改；沒有推送。Pages 新門檻的啟用方式與限制見 PUBLISHING.md。
