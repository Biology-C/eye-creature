# 兩個版本的 GitHub Pages 發布

| 入口 | 分支 | 網址 |
|---|---|---|
| 版本選擇 | 部署時產生 | https://biology-c.github.io/eye-creature/versions/ |
| 原版 | main | https://biology-c.github.io/eye-creature/ |
| 探索改造版 | feature/first-adventure-rework | https://biology-c.github.io/eye-creature/preview/ |

新版玩法不合併進 main。main 與改造分支共用部署腳本與入口說明；遊戲原始碼各自維護。

任一分支推送後，Test 工作流程成功會觸發 main 上的 Publish both playable versions。它取出兩個分支的最新快照，再驗證兩個快照、依白名單打包靜態內容，最後一次部署整份網站。任一測試失敗則不發布，保留先前線上版本。GitHub Pages 的 Source 使用 GitHub Actions。

`versions.json` 記錄實際部署的兩個 commit，供回報與回復使用。部署不包含 node_modules、.git、測試產物或本機日誌。授權與素材來源隨兩個版本一同提供。

需要重新發布時，可在 Actions 手動執行 Publish both playable versions（選 main）。推送新版仍使用 `git push origin feature/first-adventure-rework`，原版使用 `git push origin main`。不要改回單一分支根目錄部署，否則 preview 入口會消失。

回復遊戲版本：在對應分支 revert 有問題的遊戲 commit，通過測試後會重新打包兩版；避免回復共用部署檔。若部署本身失敗，既有 Pages 部署保持可用。

探索改造版包含桌面與手機掌機介面；手機已通過瀏覽器模擬測試，實機手感與真實玩家節奏仍待試玩。localStorage 依網站來源隔離，本機存檔不會搬到 GitHub Pages；原版沒有新版休息燈存檔功能。
