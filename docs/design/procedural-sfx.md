# 探索改造版程式音效整合

限定 `feature/first-adventure-rework`，未套用 patch 的 main 遊戲檔案；不變更傷害、冷卻、輸入、鏡頭。指定三個新檔案由 patch 篩選匯入，再依分支調整瀏覽器測試及音訊解鎖。

本次檔案清單（既有背景音樂／鏡頭的未提交修改保留）：

- `src/sfx.mjs`：匯入合成器；加入使用者操作解鎖、錯誤防護與錄音載入。
- `src/audio-settings.mjs`：音量選項及安全讀寫偏好。
- `src/game.js`：觸發點、蓄力生命週期、共用音量控制與破牆錄音。
- `src/cues.mjs`：保留原提示旋律，加音量及使用者操作解鎖。
- `index.html`、`styles/style.css`：暫停／標題音效音量選單，沿用掌機風格。
- `assets/sfx/wall-break.wav`、`scripts/server.cjs`：使用者原始錄音與WAV內容類型。
- `previews/sfx/index.html`：合成音效试聽、匯出WAV、失焦停止蓄力。
- `tests/eye-sfx-browser.test.cjs`：改為探索版選單測試，新增觸發及故障驗證。
- `README.md`、`ASSET_SOURCES.md`、`docs/design/adventure-player-guide.md`、`docs/design/background-music.md`、本文件：來源、玩家操作、持久音量及整合紀錄。

| 事件 | 接入位置 | 防重複與生命週期 |
|---|---|---|
| 三段出招 | `attack(stage)` | 每次出招一次 `slash1/2/3`；`player.slimeForm` 不播斬擊 |
| 光彈／蓄力彈 | `fireLight(charged)`，由 `releaseAttack()` 與 `autoAttack()` 共用 | `castLight()` 成功才播；三向光彈仍只播一次 |
| 蓄力 | `loop()` → `syncChargeSound()` | 0.12秒後啟動；音效模組保證單一持續聲；以0.8秒為滿蓄力。放開／取消／死亡／暫停立即停止；非playing與形態切換由迴圈同步停止 |
| 翼能、能量與藏品 | `update()` 的 `collectReward()` 成功分支 | 藏品傳入 `{kind:'relic'}`；已拾取物不重播 |
| 衝刺 | `dash()` | `startDash()` 成功才播 |
| 破牆 WAV | `performBreach()` | `breakWall()` 成功才播提供的 `wall-break.wav`；使用sfx共用音量。未載入或播放失敗才退回原cues提示，不疊播、不等載入後補播 |
| 手機 A／X | 既有觸控呼叫路徑 | 與桌面共用，不在觸控事件額外播放 |

此探索分支的紅熊詛咒仍是既有外觀顛倒，尚未移入 main 的操作變身；新增聲音形態防護不改變此規則。

音效預設40%，背景音樂維持20%預設。`audio-settings.mjs` 用兩個探索版專用 localStorage key 保存音量；所有讀寫有try/catch，失敗只略過保存。新音效音量為0時，同時靜音sfx與cues。沿用暫停面板原有音效開關，無頂部新按鈕。舊的 `eye-creature.sound-muted=1` 在沒有探索版音量設定時沿用。音量也可在開場設定。

開始／繼續的使用者操作先解鎖音效AudioContext，並預載提供的破牆WAV；自動拾取及主迴圈不能首次建立音效context。音訊例外被隔離。試聽頁支援八種聲音的即時合成、連段、連續拾取及44.1kHz單聲道16-bit PCM WAV輸出，試聽頁的合成音效無預製音檔；破牆錄音在遊戲內使用。

驗證項目：八種離線波形為有限值、無數位削波，第三斬能量較第一斬高；實際下載八個WAV並驗證檔头。遊戲測試涵蓋每個觸發、失敗施放、三向只播一次、短按不發出蓄力聲、暫停／死亡／變形停止、手機A／X、音量重載、storage及AudioContext故障。訊號分析不能取代聆聽；刺耳程度、節奏、與背景音樂的主觀平衡及真實裝置聲音仍需人工試聽。

2026-09-30驗收：本機Chrome執行`npm test`，35個測試檔全部通過（含原有背景音樂、鏡頭、完整探索路線與手機多指回歸）。破牆WAV解碼成功、成功破牆僅啟動一次錄音、能量不足無聲且無提示音疊播；來源檔與repo檔SHA-256一致。未commit、未push、main維持b7700a9。
