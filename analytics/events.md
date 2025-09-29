
# Analytics Events — MVP (三国志真戦 編成アプリ)

Version: 1.0  
Updated: 2025-09-25T10:03:50Z

本書は **03/12.5・04/6・01/3.2** に準拠し、イベント名・必須/任意フィールド・型・制約・送信方式を定義します。  
**PII禁止**（メール等は送らない）。匿名ID/uidのみ。送信は `navigator.sendBeacon` 基本、**SW再送**で冪等化。

---

## 0. 共通仕様

### 0.1 送信方式
- 送信手段: `navigator.sendBeacon` → 失敗時は **Service Worker** がキューし、回線復帰で再送。
- エンドポイント: `/analytics/collect`（実装先は自由。Functions推奨）
- バッチ: 最大50件/リクエスト、100KB 未満。
- リトライ: 指数バックオフ（1s, 2s, 4s, … 最大 5回）。

### 0.2 共通フィールド（全イベントに自動付与）
| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `event` | string | ✔ | イベント名 |
| `ts` | string(ISO-8601) | ✔ | 送信時刻。例: `2025-09-25T12:34:56.789Z` |
| `device_id` | string | ✔ | 端末匿名ID（localStorage/IndexedDB生成） |
| `uid` | string | ✖ | ログイン時のみ（匿名Auth uid も可） |
| `app_ver` | string | ✖ | フロントのビルドバージョン |
| `trace_id` | string | ✖ | 画面遷移単位で発行すると便利 |
| `platform` | string | ✖ | `web` 固定 |
| `ua` | string | ✖ | User-Agent（必要なら） |

> PIIは送信しない。メール/表示名/画像URLは禁止。

### 0.3 エラーポリシー
- 不正スキーマ: 422 を返却し、`fields[]` に理由を列挙。再送しても保存しない。
- 冪等化: `device_id + event + ts` をキーにサーバ側で重複排除。

### 0.4 到達指標（01/3.2）
- `TTOCR_batch` / `TTC_composition` / `TTFL_app` は、イベント間の差分で計算。

---

## 1. イベント定義

### 1.1 起動・導線
#### `signup_complete`
- 必須: なし
- 任意: `provider`("google"|"anonymous")
- 例:
```json
{ "event":"signup_complete", "provider":"google" }
```

#### `choose_A` / `choose_B` / `choose_C`
- 必須: `choice`("A"|"B"|"C")
- 例:
```json
{ "event":"choose_B", "choice":"B" }
```

#### `app_open_return`
- 必須: なし

---

### 1.2 OCRフロー
#### `ocr_batch_start`
- 必須: `images`(int), `totalBytes`(int)
- 任意: `heicCount`(int)
```json
{ "event":"ocr_batch_start", "images":12, "totalBytes":7340032, "heicCount":3 }
```

#### `ocr_image_done`
- 必須: `index`(int), `durationMs`(int)
- 任意: `bytes`(int)
```json
{ "event":"ocr_image_done", "index":5, "durationMs":820 }
```

#### `ocr_image_fail`
- 必須: `index`(int), `errorCode`(string)
```json
{ "event":"ocr_image_fail", "index":2, "errorCode":"low_resolution" }
```

#### `ocr_batch_done`
- 必須: `durationMs`(int), `recognized`(int), `unresolved`(int)
```json
{ "event":"ocr_batch_done", "durationMs":15123, "recognized":18, "unresolved":2 }
```

#### `ocr_correction_edit`
- 必須: `count`(int)  // 校正で修正した件数インクリメント用
```json
{ "event":"ocr_correction_edit", "count":1 }
```

#### `assets_confirmed`
- 必須: `warlordsCount`(int), `skillsCount`(int)
- 任意: `corrections`(int)
```json
{ "event":"assets_confirmed", "warlordsCount":120, "skillsCount":46, "corrections":7 }
```

---

### 1.3 編成UI
#### `composition_start`
- 必須: `from`("A"|"B"|"C"|"return")
```json
{ "event":"composition_start", "from":"B" }
```

#### `warlord_assign`
- 必須: `compositionId`(string), `warlordIndex`(0|1|2), `warlordId`(string)
```json
{ "event":"warlord_assign", "compositionId":"cmp_abc", "warlordIndex":1, "warlordId":"w_004" }
```

#### `warlord_swap`
- 必須: `compositionId`(string), `indexA`(0|1|2), `indexB`(0|1|2)

#### `skill_assign` / `skill_swap`
- 必須: `compositionId`(string), `warlordIndex`(0|1|2), `slotIndex`(0|1)
- 任意: `skillId`(string)

#### `tactic_assign` / `tactic_swap`
- 必須: `compositionId`(string), `warlordIndex`(0|1|2), `slotIndex`(0|1|2)
- 任意: `tacticId`(string)

#### `attr_set` / `equip_skill_set` / `memo_set`
- 必須: `compositionId`(string), `warlordIndex`(0|1|2)

#### `save_click`
- 必須: `compositionId`(string)

#### `first_composition_save`
- 必須: `compositionId`(string), `timeMs`(int)

#### `save_success`
- 必須: `compositionId`(string), `timeMs`(int)

#### `save_fail`
- 必須: `compositionId`(string), `errorCode`(string)

#### `toggle_ownership`
- 必須: `on`(boolean)

#### `zoom_change`
- 必須: `scale`(number)   // 0.75 | 1.0 | 1.25

#### `pan_change`
- 必須: `dx`(number), `dy`(number)

#### `palette_switch`
- 必須: `from`("warlord"|"skill"|"tactics"), `to` same

#### `palette_autoswitch`
- 必須: `slotType`("warlord"|"skill"|"tactics")

#### `draft_restore`
- 必須: `compositionId`(string)

---

### 1.4 エクスポート/設定/サポート
#### `export_menu_open`
- 必須: なし

#### `export_assets`
- 必須: `type`("image"|"csv")

#### `settings_open`
- 必須: なし

#### `support_open`
- 必須: なし

#### `offline_resync`
- 必須: `retryCount`(int)

---

## 2. 送信フォーマット（JSON Lines 推奨）
```
{ "event":"signup_complete", "ts":"2025-09-25T12:00:01.001Z", "device_id":"dev_x", "uid":"u1" }
{ "event":"choose_B", "ts":"2025-09-25T12:00:08.200Z", "device_id":"dev_x", "uid":"u1", "choice":"B" }
{ "event":"ocr_batch_start", "ts":"2025-09-25T12:00:15.000Z", "device_id":"dev_x", "images":12, "totalBytes":7340032 }
```

## 3. サーバ受信の検証（擬似Zod）
- サーバ側で `event` ごとの Zod スキーマを持ち、`422` を返却。  
- 冪等キー: `device_id|event|ts`。重複は200で黙殺 or `{"deduped":true}` を返す。

## 4. KPI算出例
- `TTOCR_batch` = 時系列で `signup_complete → choose_B → ocr_batch_start → ocr_batch_done → assets_confirmed` の差分（p50/p95）。
- `TTC_composition` = `composition_start → first_composition_save`
- `TTFL_app` = `app_landing(内部) → first_composition_save`

## 5. プライバシー/セキュリティ
- PII禁止。uidは匿名AuthでもOK。
- 送信経路は HTTPS。保存は最小限の保持期間（01/4.2）。
- 監査系は別コレクション（Functions append-only）。

## 6. バージョニング
- `v` クエリ or ヘッダでスキーマ版を送信可能にしておく。破壊的変更時は新イベント名を採用。

---

## 付録：イベント早見表

| イベント | 必須主要フィールド |
|---|---|
| signup_complete | - |
| choose_A/B/C | choice |
| ocr_batch_start | images, totalBytes |
| ocr_batch_done | durationMs, recognized, unresolved |
| assets_confirmed | warlordsCount, skillsCount |
| composition_start | from |
| warlord_assign | compositionId, warlordIndex, warlordId |
| warlord_swap | compositionId, indexA, indexB |
| skill_assign/swap | compositionId, warlordIndex, slotIndex |
| tactic_assign/swap | compositionId, warlordIndex, slotIndex |
| first_composition_save | compositionId, timeMs |
| save_success/fail | compositionId, (timeMs|errorCode) |
| toggle_ownership | on |
| zoom_change | scale |
| pan_change | dx, dy |
| export_assets | type |
| offline_resync | retryCount |
| palette_switch | from, to |
| palette_autoswitch | slotType |
| draft_restore | compositionId |
