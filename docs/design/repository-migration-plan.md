> 歷史規劃，已由 2026-09-28 的 MIGRATION.md 與根目錄 README／LICENSE 取代；其中沿用 MIT 的建議不代表現行新內容授權。

# 眼球怪獨立專案搬移計畫

狀態：規劃草案，尚未執行搬移、建立遠端或發布。2026-09-27 盤點。使用者已選擇独立專案方向，本次只規劃。

## 白話說明

把目前眼球怪遊戲完整複製到自己的資料夾，先確認它能單獨運作，再放到新的 GitHub 專案。原本 mousemaze 與舊試玩位置先保留，避免搬到一半無法玩。這次不新增關卡或改變玩法。

暫定名稱 eye-creature，本機 C:/Workspace/eye-creature。正式名稱與 GitHub 公開／私人由使用者決定。建議先完成本機版本再上傳；公開試玩網址是另外一個步驟，不因建立新專案就自動發布。

## 技術規格與盤點

- 來源 C:/Workspace/toy，origin 為 Biology-C/mousemaze。
- docs/eye-creature-v2/ 與七份 tests/eye-* 均未追蹤，Git 歷史本身不能備份這些內容。執行前記錄來源 commit、git status、明確檔案清單與 SHA-256，完整備份待搬檔案。
- hero.js 讀取 ../animation/sprites.png；第一關頁尾連到 ../animation/。搬移需要同步調整，不能只拿 level-1。
- 瀏覽器測試有 8767 舊網址與 Codex 私有 runtime fallback，需改為可設定 BASE_URL、一般 Playwright 開發相依，讓新電腦可執行。
- 純 HTML/CSS/JS 模組與 Canvas，保留現有技術，不加入框架或後端。補 package.json、lockfile、start/test 指令與必要啟動腳本，固定相依版本。
- 原 LICENSE 為 MIT，衍生程式保留既有著作權與授權文字；素材另外列來源與 image_gen 提示詞，不擅自宣稱所有圖稿同等授權。
- 不搬 .claude、個人帳號設定、_tmp_moe_*、tmp 截圖、其他遊戲 js/css/music；需要的測試產物輸出資料夾由腳本自行建立並忽略。

建議目錄：

```text
eye-creature/
  index.html                 第一關入口
  src/                       遊戲與物理、地圖、敵人模組
  styles/                    介面樣式
  assets/sprites/             主角、老鼠／史萊姆、青影鳥／樹妖
  docs/design/               角色設定、已確認規則及歷史提案
  docs/concepts/             原概念圖及生成提示詞
  previews/animation/        動作審閱頁
  tests/                     七份現有測試，移植後補路徑驗證
  scripts/                   本機啟動／測試服務
  README.md / README_EN.md
  LICENSE / ASSET_SOURCES.md / .gitignore
  package.json / package-lock.json
```

所有运行資產使用相對網址，從根目錄及 /eye-creature/ 子路徑均可載入。正式角色設定要區分現行規則與歷史草稿，不能把早期固定眼球、一般青鳥或舊破牆規則當成現況。

狀態相容：目前沒有跨重載存檔；新站從新局開始，不能承諾搬移瀏覽器中的即時進度。死亡保留／新局重置行為要與現版一致。原頁保持可用，待使用者結束當前試玩再切換。

## 分階段執行計畫（供 Codex／Claude Code 使用）

### Stage 0：備份與界線

盤點目前來源與目標是否存在，目標已存在時不覆蓋。依白名單建立備份、來源清單與雜湊，不提交整個 dirty workspace。確認 owner、repo 名稱與 visibility；未確定時仍可做本機准备，不建立遠端。
完成條件：每項檔案能追溯，無個人資料或無關暫存檔混入。回復方式：保留來源，不需刪檔還原。

### Stage 1：獨立可玩副本

按上述目錄複製遊戲、動作頁、素材與設計記錄；更正 import、image.src、CSS、文件和測試路徑。建立獨立 Git，僅在明確授權執行後操作。不複製舊 .git，首次提交註明來源 repo 與當時來源 commit；尚未提交的原型應誠實標為搬移當時快照。使用不同連接埠如 8768，避免中止舊 8767 服務。
完成條件：新資料夾單獨提供 HTTP 即可玩，不依赖 toy 或使用者 runtime 目錄。回復方式：暫停使用副本，原專案不受影響。

### Stage 2：完整測試（倒數第二階段）

安裝鎖定相依，執行七份測試。驗證新入口與模擬 GitHub Pages 子路徑均無 404、主角／敵人素材可載入、主控台無錯誤。瀏覽器走完三光點至出口，回歸滑翔、兩階段老鼠、青影鳥／樹妖／鏡面、針刺、獎勵、火炬、四方向破牆、死亡保留及新局重置；測試手機橫直向按鈕與鍵盤。
完成條件：測試記錄明確；不能把舊 repo 的通過當成新專案的通過。10–15 分鐘是玩家測試目標，不作搬移成功的虛構保證。失敗就在副本修正，不動來源。

### Stage 3：文件、GitHub 與交付

整理雙語 README（玩法、操作、啟動、測試、無存檔限制）、來源與素材清單、搬移紀錄，提交驗證完成的版本。依確認名稱／可見性建立空白 GitHub repository 並推送；同名 repo 已存在時先確認歸屬與內容，不 force push。

若使用者同時授權公開試玩，再設定 GitHub Pages 靜態部署；確認發布範圍，只輸出遊戲與必要預覽／素材，避免把整份備份或內部文件一起發布。Pages 網址以實際成功部署結果為準。公開／私人 repo 與試玩網站可见性分别確認，不假設私人 repo 等於私人網站。

新站驗收後在 mousemaze README 加來源／後繼連結，原遊戲維持。舊眼球怪目錄先保留為歷史副本與遷移指引，不自動刪除，也不持續雙邊開發。
完成條件：交付新 repo、可玩網址（若已授權且部署成功）、commit、測試結果與限制。發布失敗保留本機版本，原站照常可用；不刪遠端 repo 作為回滾。

以上各階段可直接作為 Codex 或 Claude Code 的同一份工作指令；執行時逐階段驗收，不跨過未授權的公開發布。

## 執行前待定

1. 名稱：建議暫用 eye-creature，中文標題仍可改。
2. 可見性：公開或私人；未決定前不建立遠端。
3. 是否同時發布公開試玩網址，或只完成程式上傳。

## 官方依據

GitHub Pages 適用 HTML/CSS/JavaScript 靜態網站；參考 https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages 。建立 repo 的名稱與 visibility 設定見 https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository 。2026-09-27 查閱。此為既有遊戲拆分，無須引入其他遊戲專案或更換引擎。
