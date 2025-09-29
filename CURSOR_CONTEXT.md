# 三国志真戦 編成アプリ（仮）— Cursor 実装コンテキスト
Last-Updated: 2025-09-25

本ファイルは Cursor に「仕様の読み方」「実装順序」「用語/型」を伝えるための要約です。  
一次情報は docs/01..07（v2）を必ず参照。

---

## 1. 目的と体験（01）
- 目的: ①編成作成支援 ②資産管理（図鑑）③編成依頼効率化（将来）
- 期待体験: 「編成を考える楽しみ」「進捗可視化の喜び」「相談の効率化」
- プラットフォーム: Web（レスポンシブ）、将来PWA
- UI原則: グリッド/パレット方式（文字UI中心）、スマホ縦でタップ完結（D&Dは補助）

---

## 2. 用語（02）※コードは英語キー
- 武将 `warlord`、戦法 `skill`（指揮/アクティブ/突撃/パッシブ/兵種/陣法）、兵法書 `tactics`
- 陣営 `camp`（gi/go/shoku/gun）、兵種 `unit_type`、凸 `limit_break`
- ※ UI表記は日本語でも、**モデル/API/イベントは英語キー**で統一

---

## 3. 画面と操作（03）
- 分割: PC/横=左右、スマホ縦=上下（上:編成パレット/下:パレットタブ）
- パレット: 武将/戦法/兵法書（テキストリスト、仮想化、所有物考慮トグル）
- スロット（1編成）: 武将3、各武将に skill×2 / tactics×3 / notes(attr/equipSkill/memo)
- スワップ: 武将同士入替で配下（skill/tactics/notes）もセットで入替
- 保存: ローカル自動保存（IndexedDB）。サーバ保存は押下時（編成）/ナビゲーション境界（図鑑）
- 所有物トグル: 兵法書は常にマスタ（所有概念なし）
- アクセシビリティ: キー操作OK、44px、色依存NG

### 3.1 受け入れ基準（抜粋）
- スマホ縦でタップのみで割当/入替/クリア可能
- フリー1編成・共存性5編成の表示/切替
- 所有物トグルが即時反映（兵法書は常にマスタ）
- 戦法アクティブPK/S/Aの**表示上のグルーピング**実装（辞書の種別は不変）

---

## 4. ユーザーフロー（04）
- 初回3導線: A 図鑑作成(OCR) / **B 推奨: OCR→編成** / C すぐ編成
- OCR: 端末内で一括処理→校正→確定（assets へアップサート）。画像は保存しない
- 編成: composition_start→編集→ローカル保存→任意で first_composition_save（サーバ保存）
- エクスポート（MVP）: 図鑑の画像/CSV

---

## 5. システム/実装スタック（05）
- Front: Next.js + Tailwind + shadcn/ui + TanStack Query + Zustand + RHF + Zod + Dexie
- Backend: Firebase Functions / Firestore / Auth（Google+匿名）
- 描画: SVGベース（react-zoom-pan-pinch, dnd-kit, framer-motion）
- ローカル優先。ビューステートはローカルのみ（workspace はID配置のみ保存）

---

## 6. データモデル（06）
- Master: `warlords/{id}`, `skills/{id}`, `tactics/{id}`
- User:
  - `users/{userId}`
  - `users/{userId}/assets/current` … `ownedWarlords:Map<wId,int>`, `ownedSkills:Map<sId,bool>`
  - `users/{userId}/compositions/{compositionId}` … `unitType`, `slots[3]`, `warlordIdsFlat`
  - `users/{userId}/workspace/current` … `freeAreaCompositionIds[]`, `constraintAreaCompositionIds[]`
- 列挙: 06/3.3 の数値Enum（APIはISO-8601化）

### 6.1 composition スロット例（03/2, 06/3.2.3）
```jsonc
{
  "compositionId": "cmp_x",
  "unitType": 2,
  "slots": [
    {
      "warlordId": "w_1",
      "camp": 3,
      "skillIds": ["s_1","s_2"],
      "tacticIds": ["t_1","t_2","t_3"],
      "notes": { "attr": "", "equipSkill": "", "memo": "" }
    }
    // x3
  ]
}
```

---

## 7. API（07）
- Base: `/api/v1`
- Master:
  - `GET /master/warlords|skills|tactics`（public cache + SWR 推奨）
- User:
  - `GET|POST /users/{userId}`
- Assets:
  - `GET|POST /users/{userId}/assets`（OCR確定時/ナビゲーション境界でアップサート）
- Compositions:
  - `GET /users/{userId}/compositions/{compositionId}`
  - `POST /users/{userId}/compositions`（新規発行）
  - `PUT /users/{userId}/compositions/{compositionId}`（expectedUpdatedAt 必須）
  - `DELETE /users/{userId}/compositions/{compositionId}`
- Workspace:
  - `GET|POST /users/{userId}/workspace`
- Share（MVPは参照形）:
  - `GET /users/{userId}/share`
- エラー: 07/6 準拠（422 Validation Failed など）

---

## 8. 計測/KPI（01/3.2, 03/12.5, 04/6）
- 主要: `signup_complete`, `choose_A|B|C`, `ocr_batch_start/done`, `assets_confirmed`, `composition_start`, `first_composition_save`, `export_image|csv`
- 補助: `ocr_correction_edit`, `export_menu_open`, `save_retry`, `offline_resync`, `composition_open`, `assets_open`
- 目標: TTOCR p50≤180s / p95≤600s, TTC p50≤300s / p95≤900s, TTFL p50≤600s / p95≤1800s
- 送信: `navigator.sendBeacon` + SW リトライ

---

## 9. NFR/品質（01/4.*）
- 性能: LCP < 2.5s、主要操作 p95 < 500ms、bundle ~200KB(gzip)目安。マスタは IndexedDB キャッシュ + SWR。
- セキュリティ: CSP/HSTS/XFO/XCTO/TLS、Rules による userId 隔離、監査ログは append-only。
- 可用性: 稼働率目標 99.9%、/healthz、DR RPO 1h / RTO 4h
- 画像: 保存しない。必要時のみ匿名化短期保持（01/1.2）

---

## 10. 実装順（推奨）
1) 基盤: Tailwind/shadcn、Query/Zustand、env/zod、firebase lib、Dexie  
2) マスター読取: `/master/*` repo + Query  
3) 編成パレット骨組み: `<CompositionCanvas>` / `<WarlordColumn>` / `<Slots>`  
4) スワップ/割当ロジック（03/3, 03/2）  
5) ローカル自動保存（Dexie, debounce 500ms）  
6) サーバ保存API（07/4.4）と first_composition_save  
7) 図鑑（assets）OCR確定後アップサート（01/1.2, 04/4.2）  
8) エクスポート（画像/CSV—MVP最小）  
9) 計測イベント実装（03/12.5, 04/6）  
10) アクセシビリティ調整（03/13）/ 負荷＆UX微調整

---

## 11. 参考ファイル配置（例）
```
app/
  (builder)/builder/page.tsx
  (assets)/assets/page.tsx
  (mypage)/page.tsx
src/
  schema/{warlord,skill,tactic,composition,assets,workspace}.ts
  repositories/{master,assets,compositions,workspace}.ts
  stores/{composer,assets}.ts
  lib/{firebase,env,dexie,logger,analytics}.ts
  ui/{composition/*,palette/*,common/*}
data/master/{warlords.json,skills.json,tactics.json}
scripts/seed-master.ts
docs/01_Requirements_v2.md ... 07_Api_Spec_v2.md
```

---

## 12. 注意/よくある誤り
- **用語の混線**（skill ≠ tactics）。兵法書は常にマスタ基準で所持概念なし。
- **サーバ保存タイミングの誤実装**（編成は押下時、図鑑はナビゲーション境界）。
- **武将スワップ時に配下を移し忘れ**（skill/tactics/notes を一括で）。
- **画像の恒久保存**（禁止。01に反する）。
- **Zustandへサーバ状態をコピー**（二重管理NG）。

> 疑義が出たら、該当章を **番号付きで** 参照（例: 「03/2.1 に従い …」）し、最小差分で修正。
