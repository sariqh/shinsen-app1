# 03\_ui\_spec.md — 編成UI仕様（MVP）
Last-Updated: 2025-09-25

---

## 0. コンセプト
- 物理的なジグソーパズル感。大枠に対して、武将・戦法・兵法書のピースを試行錯誤で“はめる”。
- スマホ縦でも成立するタップ主導の操作性（D&Dは補助）。
- MVPでは共存性の自動検証は実装しない（パレット体験の価値検証を優先）。

---

## 1. 画面構成
### 1.1 分割
- 左右分割（PC/タブレット/スマホ横）：左=編成パレット、右=武将/戦法/兵法書パレット（タブ切替）
- 上下分割（スマホ縦）：上=編成パレット、下=武将/戦法/兵法書パレット（タブ切替）
- 各領域はズーム/パン対応（ピンチ/ダブルタップズーム、2本指ドラッグ）。リセットボタンあり。

### 1.2 パレット（3+1種）
- 武将パレット：テキストのみ（アイコン不使用）。横軸=4陣営（魏/呉/蜀/群）、縦=武将リスト。
- 戦法パレット：テキストのみ。横軸=8タイプ（指揮/アクティブPK/アクティブS/アクティブA/突撃/パッシブ/兵種/陣法）。
  - 注：アクティブ戦法の表示上の分割であり、戦法種別の辞書を変更しない。
- 兵法書パレット：テキストのみ。所有物の概念なし（マスタ版のみ）。6カテゴリで整理（カテゴリ名は辞書/マスタに追記）。
- 編成パレット：
  - フリーエリア：同時表示1編成（最大10編成まで作成可）
  - 共存性エリア：同時表示5編成（俯瞰/比較用）。将来は編成セット（最大10）を保存可能に。

### 1.3 武将/戦法/兵法書パレット切り替え
- 表示は常に1つのパレットのみ。
- 左右スワイプで武将↔戦法を切替（兵法書はスワイプ対象外、兵法書スロット選択時のみ表示）。
- 自動切替：編成パレットでスロットをアクティブ化した時、自動的に対応するパレットを表示する（武将スロット→武将パレット、戦法スロット→戦法パレット、兵法書スロット→兵法書パレット）。

---

## 2. スロット仕様（1編成あたり）
- 武将：3（`warlord[0..2]`）
- 戦法：計6 → 各武将に2つずつ（`warlord[i].skills[0..1]`）
- 兵法書：計9 → 各武将に3つずつ（`warlord[i].tactics[0..2]`）
- 属性振り：計3 → 各武将に1つ（`warlord[i].attr`）
- 装備スキル：計3 → 各武将に1つ（`warlord[i].equip_skill`）
- メモ：計3 → 各武将に1つ（`warlord[i].memo`）

> 変更点：武将以外のスロットは、各武将に紐付く構造に統一。武将をスワップすると、その武将に紐付く 戦法／兵法書／メモ類もまとめて入れ替わる。

### 2.1 JSONモデル（抜粋）
```jsonc
{
  "compositionId": "cmp_x",
  "slots": [
    {
      "warlordId": "w_1",
      "skills":   ["s_1", "s_2"],
      "tacticIds":  ["t_1", "t_2", "t_3"],
      "notes": {
        "attr": "",
        "equipSkill": "",
        "memo": ""
      }
    },
    { "warlordId": "w_2", "skills": ["s_3","s_4"], "tacticIds": ["t_4","t_5","t_6"], "notes": { "attr": "", "equipSkill": "", "memo": "" } },
    { "warlordId": "w_3", "skills": ["s_5","s_6"], "tacticIds": ["t_7","t_8","t_9"], "notes": { "attr": "", "equipSkill": "", "memo": "" } }
  ]
}
```

---

## 3. 操作フロー（スマホ優先）
1. スロットのアクティブ化：編成パレットのスロットをタップ（枠線強調）。武将スロット／その配下（戦法/兵法書/属性振りメモ/装備メモ/メモ）が対象。
2. スロットのアクティブ解除：アクティブスロットをタップ。
3. 割当：アクティブスロットがある状態で、対応するパレット項目をタップ/クリック（武将=武将パレット、戦法=戦法パレット、兵法書=兵法書パレット）。
4. 入替（編成パレット内）：
   - 武将スロット同士をタップでスワップ → 武将に紐付く戦法/兵法書/属性振り/装備スキル/メモごとまとめて入れ替える。
   - 任意武将配下のサブスロット同士は、単一スロットのみ入替。片方のスロットが空白でも入替実行（実質移動）。
5. クリア：各サブスロットの×ボタンで内容削除。武将スロットの×は武将と配下データを一括クリア（確認ダイアログ）。
6. PC/タブレットではD&Dも補助的に利用可（必須ではない）。
7. 「所有物考慮/マスタ版」トグル：武将・戦法パレットに適用。兵法書はマスタのみ。

---

## 4. 保存
- ローカル自動保存（IndexedDB）：編集中のドラフトを常時保持。
- サーバ保存ボタン：編成押下時にFirestoreへ確定保存（ID発行、共有可）。
- 保存APIは 07_API_Spec の POST/PUT /api/v1/users/{userId}/compositions を使用する。

---

## 5. 共存性
- MVPでは検証機能を実装しない。ユーザーの視認/直感チェックで運用（上級者前提）。
- 将来：
  - フリーエリア用の単体検証ボタン
  - 共存性エリア全体の一括検証ボタン
  - ルール種別（duplicate\_limit、usage\_limit、exclusivity など）を精査し、サイドパネルで一覧表示（モーダルは使わない）。行タップで該当スロットへジャンプ。

---

## 6. 表示/情報設計の工夫（テキストUIでの可読性）
- 階層見出し：陣営/タイプ/カテゴリの見出し行（スティッキー）。
- 表示密度：不変。名称や情報量はズーム段階で省略しない（ピンチで単純拡大/縮小する“虫眼鏡”体験）。
- 状態表現（候補案）：実運用で使い心地を見て選定。
  1. 記号型：所持=●/未所持=○、凸=★×n、アクティブ枠=太枠＋背景トーンアップ。
  2. 下線/ライン型：所持=実線下線、未所持=点線下線、凸=行末`[x4]`、アクティブ枠=左縁色バー。
  3. 括弧タグ型：`名前（所持）[凸4]` のように行内タグで表現し、アクティブ時は行背景を薄色に。

---

## 7. パフォーマンス
- すべてのリストは仮想化（react-virtuoso等）。
  - 仮想化（Virtualization）とは：数千行のリストでも、実際にDOMに描画するのは画面に見えている範囲＋少し先読み分だけに限定する最適化手法。スクロールに合わせて描画要素を入れ替えることで、メモリと描画コストを大幅に削減する。
- キー入力なしでの広域スクロール/ズームのカクつきを避けるため、requestAnimationFrameでスムーズスクロール。

---

## 8. 受け入れ基準（MVP）
- スマホ縦でタップのみで武将/戦法/兵法書の割当・入替・クリアが可能。
- フリー1編成、共存性5編成の表示・切替が可能。
- 保存ボタンでサーバ保存、保存前でもローカル復元が機能。
- パレットの「所有物考慮/マスタ版」切替が即時反映。兵法書は常にマスタ。
- 戦法のアクティブPK/S/Aの分割は表示上のグルーピングとして機能し、辞書の戦法タイプは不変。
- 武将スロット同士のスワップで、配下（skills/tactics/attr/equip_skill/memo）も一括で入れ替わること。

---

## 9. 今後の拡張（次フェーズ）
- 共存性検証：ルールは種類が多いため次フェーズで設計・実装。優先順位や順序（duplicate/usage/exclusivity など）はこの段階では固定しない。
- 共存性セット（最大10）とその共有/バージョン管理。
- 検索バー、並べ替え、クイックフィルタ（レア度、陣営、タイプ）。

---

## 10. コンポーネント設計
### 10.1 パレット共通
- `<PaletteTabs>`：武将/戦法/兵法書の切替タブ。`value:"warlord"|"skill"|"tactics"`、`onChange(value)`
- `<PaletteList>`：仮想リスト。`items:Item[]`、`onPick(itemId)`。所有物考慮や無効状態を反映。
- `<PaletteItem>`：テキスト行。`id`、`label`、`badges?`、`disabled?`。アクティブ時は強調。

### 10.2 編成パレット
- `<CompositionCanvas>`：ズーム/パンとレイアウト管理。Props: `scale:number`、`pan:{x,y}`、`onZoomChange`、`onPanChange`
- `<CompositionCard>`：編成1つ。Props: `mode:"free"|"coexist"`、`composition:Composition`、`onUpdate(composition)`
- `<WarlordColumn>`：武将1人分の縦カラム。子に配下スロットを持つ。
  - 子要素：
    - `<WarlordSlot>`（武将本体）
    - `<SkillSlots>`：`count=2`
    - `<TacticSlots>`：`count=3`
    - `<AttrField>` / `<EquipSkillField>` / `<MemoField>`：各1
- スワップ規則：`<WarlordSlot>` 同士の入替時はカラムごと（配下含む）をスワップ。

### 10.3 補助UI
- `<Toolbar>`：保存、所有物トグル、ズームリセット。`onSave`、`onToggleOwnership`。
- `<Toast>`：保存成功/失敗、エラーメッセージ。Props: `type:"success"|"error"|"warning"`、`message`。
- `<ShortcutHelp>`：?キーで開閉するショートカット一覧。
- `<SidePanel>`：将来の共存性検証結果用。

> 用語統一：兵法書は tactics を用いる（辞書準拠）。`manual(s)` は使用しない。
---

## 11. 状態・データフロー
### 11.1 ストア構成（Zustand想定）
- `useAssetsStore`
  - `warlords: Warlord[]`
  - `skills:   Skill[]`
  - `tactics:  Tactic[]`
  - `ownership: {[id:string]:{owned:boolean,copies:number}}`
  - `ownershipAware: boolean`

- `useComposerStore`
  - `drafts: { free: Composition, coexist: Composition[] }`
  - `activeSlot?: { compositionId, slotId, type }`
  - `scale: number`
  - `pan: { x:number, y:number }`

- `usePersist`
  - IndexedDB（Dexie）への自動保存/復元（スロット操作ごとに debounce 500ms）

### 11.2 イベント/アクション
- `warlord/assign(index, warlordId)`
- `warlord/swap(indexA, indexB)` ← 配下（skills/tactics/attr/equip_skill/memo）ごと入替
- `skill/assign(warlordIndex, slotIndex, skillId)`
- `skill/swap(warlordIndex, slotA, slotB)`
- `tactic/assign(warlordIndex, slotIndex, tacticId)`
- `tactic/swap(warlordIndex, slotA, slotB)`
- `attr/set(warlordIndex, text)`
- `equip_skill/set(warlordIndex, text)`
- `memo/set(warlordIndex, text)`
- `composition/save(compositionId)`
- `draft/autosave`、`draft/restore`
- `ui/zoom(scale)`、`ui/pan(x,y)`
- `ui/toggleOwnership`

### 11.3 データ永続化
- ローカル：IndexedDBにユーザー別・編成ID別で保存。
- サーバ：Firestoreに保存。レスポンスの`composition_id`で識別。保存前のドラフトはサーバに送信しない。

---

## 12. 操作仕様
### 12.1 対象UIと用語
- スロット：編成パレット内の各枠（武将/戦法/兵法書/属性/装備/メモ）。
- アクティブスロット：現在の割当先。太枠＋背景トーンアップで表示。
- パレット項目：武将/戦法/兵法書リストの1行。

### 12.2 基本操作（スマホ優先／PC同等）
- スロットのアクティブ化：編成パレットのスロットをタップ/クリック（枠線強調）。  
  アクティブにしたスロット種類に対応するパレットが自動で表示される。
- スロットのアクティブ解除：アクティブスロットを再タップ/クリック。
- 割当：アクティブスロットがある状態で、対応するパレット項目をタップ/クリック。
- 入替（スワップ）：アクティブスロットがある状態で別スロットをタップ。片方が空白でもスワップ実行。  
- クリア：スロット右上の × ボタンをタップで内容削除。武将スロットの場合は配下の戦法/兵法書/メモも含めて一括クリア。  
- ズーム/パン：ピンチ/ダブルタップで拡大縮小（MVPでは 0.75/1.0/1.25 の3段階固定）。  
  将来的に 0.5〜3.0 の連続ズームに拡張可。2本指ドラッグでパン。
- 所有物トグル：ONで未所持項目は別フォーマット表示＋選択不可。設定から仮割当許可に切替可（デフォルトは許可）。  

### 12.3 詳細ルール
- 型チェック：スロット種別と異なる項目は拒否。理由をトーストで表示。  
- 重複表示：MVPでは許容（自動検証なし）。  
- アクティブ保持：割当後もアクティブ状態とパレット表示を維持。
- キャンセル：Esc（PC）／空白タップ（モバイル）でアクティブ解除。  

### 12.4 エラーハンドリング
- 型不一致：「このスロットには割り当てできません（種別が異なります）」  
- 未所持：「○○はまだ所持していません」  
- 保存失敗：再試行ボタン付きトースト。ローカルドラフトは保持。  

### 12.5 操作ログ
#### 12.5.1 トラッキング対象
- `warlord_assign`（compositionId, warlordIndex, warlordId）
- `warlord_swap`（compositionId, indexA, indexB）
- `skill_assign`（compositionId, warlordIndex, slotIndex, skillId）
- `skill_swap`（compositionId, warlordIndex, slotA, slotB）
- `tactic_assign`（compositionId, warlordIndex, slotIndex, tacticId）
- `tactic_swap`（compositionId, warlordIndex, slotA, slotB）
- `attr_set` / `equip_skill_set` / `memo_set`（compositionId, warlordIndex）
- `zoom_change`（scale）
- `pan_change`（dx,dy）
- `toggle_ownership`（on|off）
- `save_click`（compositionId）
- `save_success`（compositionId, timeMs）
- `save_fail`（compositionId, errorCode）

#### 12.5.2 追加検討項目
- 起動/終了イベント：`app_open`、`app_close`
- パレット切替：`palette_switch`（from,to）
- 自動切替発火：`palette_autoswitch`（slotType）
- ドラフト復元：`draft_restore`（compositionId）
- エラー発生：`error_popup`（code,message）

#### 12.5.3 ポリシー
- 個人特定情報は含めない（匿名IDのみ）。  
- 保存やエラーイベントは計測必須。操作系イベントは利用状況分析のため。  
- 送信は `navigator.sendBeacon` または Service Worker でのリトライを前提。  

---

## 13. アクセシビリティ/キーボード（精査版）
> 方針：音声読み上げは不要。視覚のみで状態・エラーが判別でき、キーボード操作で主要機能が等価に利用できること。
### 13.1 キーボード操作（PC）
- Tab/Shift+Tab：フォーカス移動（視線順）
- 矢印キー：同グリッド内の隣接スロットへ
- Enter：スロットのアクティブ化/解除、スワップ確定
- Space/Enter：パレット項目の割当
- Delete/Backspace：スロットのクリア
- Ctrl/Cmd + (+/-/0)：ズーム/リセット
- T：所有物トグル
- 1/2/3：武将/戦法/兵法書タブ切替

### 13.2 フォーカス/ナビゲーション
- 初期フォーカス：編成パレットの先頭スロット
- フォーカス可視化：CSS `outline`（コントラスト 3:1 以上）
- 割当/入替後も元スロットにフォーカス保持
- スキップリンク：`Skip to palette` / `Skip to composer`
- ダイアログ時（将来）：フォーカストラップ＋閉じたら直前要素へ

### 13.3 視覚要件
- コントラスト：本文 4.5:1 以上、UI枠線/強調 3:1 以上
- ターゲット：最小 44×44px（×ボタン含む）
- 状態の多重表現：色だけに依存しない（太枠/下線/記号）
- 動き：アニメ 150–250ms、`prefers-reduced-motion` で抑制

### 13.4 エラー/通知
- 視覚のみで完結（色/アイコン/テキスト）
- 位置：当該スロット近傍、一覧はサイドパネル（将来）
- 保存失敗：再試行付きトースト（フォーカスを奪わない）

### 13.5 i18n/日本語タイポグラフィ
- 等幅タブラー数字（凸数/カウント）
- 行間 1.4–1.6、字間 0
- 用語は辞書準拠（例：tactics）

### 13.6 将来の互換対応（任意）
- role/aria を設計段階で付与：
  - 編成パレット：`role="grid"`、スロット：`role="gridcell"`
  - パレット：`role="listbox"`、項目：`role="option"`
  - タブ：`role="tablist"` / `role="tab"`
- `aria-live` は未使用（必要時のみ `polite` を導入）

### 13.7 チェックリスト
- [ ] 主要操作がキーボードのみで完了する
- [ ] フォーカスリングが常に見える
- [ ] 最小44×44pxを満たす
- [ ] コントラスト基準を満たす
- [ ] `prefers-reduced-motion` に対応
- [ ] エラーは色依存になっていない