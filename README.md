# 眼球怪 Eye Creature

[English](README_EN.md) · [原作 Mouse Maze](https://github.com/Biology-C/mousemaze)

獨立的像素風動作迷宮原型。扮演被魔王軍改造成生物兵器的勇者眼球，拍翼、滑翔並穿過「殘光培養所」，找到三顆引路光點逃出出口。

這是從 Mouse Maze 實驗區拆出的獨立遊戲；之後程式、素材、議題與版本均在本 repository 維護。Mouse Maze 的原始冒險、教育與機關迷宮模式繼續留在原專案。

## 目前可玩內容

- 第一關：多岔路迷宮、探索火炬、小地圖、休息燈及針刺。
- 水晶老鼠跳撲，受傷變成史萊姆；青影鳥、樹妖與鏡面技能。
- 自動近戰／遠距光彈、衝刺、命中與受傷特效。
- 藍色翼能碎片，每累積 100% 回復半心；橘色能量 30 點可破壞指定裂牆、天花板或地板；三件支路藏品。
- 鍵盤與觸控、深淺色、減少動態。

## 開始遊玩

安裝 Node.js 22 以上，在本資料夾執行：

```sh
npm start
```

開啟 http://127.0.0.1:8768/ 。遊戲是靜態 HTML/CSS/JavaScript，不需建置；啟動伺服器不需安裝 npm 相依套件。也可用其他靜態 HTTP 伺服器，請勿直接雙擊 HTML。

| 操作 | 按鍵 |
|---|---|
| 移動 | ← →／A D |
| 拍翼；耗盡後滑翔 | ↑／W |
| 下降、穿過薄台 | ↓／S |
| 自動攻擊，近敵甩尾、遠距光彈 | Space，支援長按 |
| 衝刺 | Shift |
| 鏡面 | Q |
| 破裂面 | E；上下裂面搭配 ↑／↓ |
| 預留切換魔法 | F，目前只有光彈 |
| 暫停 | P／畫面按鈕 |

**尚無跨重載存檔。** 死亡保留本局收集與探索狀態；重新整理或重新開始會重置。本機舊分頁的進度不能搬到新網址。10–15 分鐘是設計目標，實測可能更長；紅熊、後續關卡與多種魔法仍未實作。

## 開發與測試

```sh
npm ci
npx playwright install chromium
npm test
```

測試會自行啟動臨時 HTTP 伺服器，包含模型測試、鍵盤／手機 UI 與三光點至出口的自動通關。產物位於忽略的 `tests/artifacts/`。可用 `BROWSER_CHANNEL=chrome` 環境變數改用已安裝 Chrome。正式遊戲不依賴 Playwright。

## 目錄

- `src/`：遊戲、物理、迷宮與戰鬥模組。
- `assets/sprites/`、`styles/`：敵人素材與介面。
- `previews/animation/`：已確認主角動畫及 sprite sheet。
- `docs/design/`：設計與歷史提案；歷史提案不代表目前已實作功能。
- `tests/`、`scripts/`：測試與本機伺服器。

[第一關變更紀錄](docs/design/README.md) · [角色設定](docs/design/character-README.md) · [素材來源](ASSET_SOURCES.md) · [搬移紀錄](docs/design/MIGRATION.md)

## 授權與改作

本專案公開提供原始碼，但**不是開源授權**。Eye Creature 新增原創內容採 [Source-Available License](LICENSE)：

- 可下載、遊玩、非商用個人學習及私人修改。
- 分享未修改副本須為非商用，並保留 Biology-C 著作權、LICENSE、來源連結與第三方聲明。
- **商用、公開發布或部署改作，須先取得 Biology-C 書面同意**；可透過本專案 Issues 提出申請。
- 原 Mouse Maze 已公開的 MIT 部分仍依原授權，GitHub 平台允許的檢視／fork 權利亦不被撤回。詳見 [授權範圍](THIRD_PARTY_NOTICES.md)。

素材另見 [來源紀錄](ASSET_SOURCES.md)，不主張超出實際持有的生成圖像權利。
