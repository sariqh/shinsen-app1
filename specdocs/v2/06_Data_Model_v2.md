# 06_Data_Model.md
Last-Updated: 2025-09-25

---

## 1. ドキュメント目的
本ドキュメントは「三国志真戦 編成アプリ（仮）」MVPにおけるデータモデルを定義する。フロントエンド、バックエンド双方で一貫して利用可能なスキーマを明示し、DBおよびAPI設計の基盤とする。

---

## 2. モデル概要
本MVPで扱うデータは、マスター系（不変/共有）とユーザー系（可変/個別）に大別される。Firestoreのトップレベルコレクションとサブコレクションは以下。

### 2.1 トップレベルコレクション（マスター系）
- warlords/{warlordId}
  武将マスター。星数/陣営/コスト/固有戦法参照（uniqueSkillId）など、アプリ全体で参照する不変データ。
- skills/{skillId}
  戦法マスター。レアリティ/タイプ/使用回数（useLimit）/伝授可否（inheritedSkill）等を保持。
- tactics/{tacticId}
  兵法書マスター。

### 2.2 トップレベルコレクション（ユーザー系）
- users/{userId}
  表示名・メール等の基本プロフィール。

### 2.3 サブコレクション
- users/{userId}/assets/{assetId}
  資産ドキュメント。疎Mapで資産を保持する。  
  - `ownedWarlords: Map<warlordId, int>`…所持枚数（未所持はキー無し）  
  - `ownedSkills: Map<skillId, bool>`…戦法の解放フラグ（未所持はキー無し）  
  - `assetId` は通常 `default` を想定。将来シーズン分割やスナップショット用途で複数化可能。
- users/{userId}/compositions/{compositionId}
  部隊編成データ。ユーザーID、兵種（unitType）、最大3スロットの武将/戦法/兵法書割当、検索最適化のため `warlordIdsFlat` を持つ。
- users/{userId}/workspace/current
  編成作成UIのパレット使用状況を保持する。 

### 2.4 関係の要点（ERイメージ）
- users ー 1対多 ー assets  
- users ー 1対多 ー compositions  
- compositions ー 多対多 ー warlords（最大3スロット）  
- compositions ー 多対多 ー skills  
- compositions ー 多対多 ー tactics  
- warlords ー 1対1 ー skills（固有戦法: warlords.uniqueSkillId → skills/{id}）

### 2.5 ID・列挙・型ポリシー
- ID：人が扱える意味付きID（例：`w_001`, `s_002`）。数値での並び替え用に `numericId:int` を併設（必要コレクションのみ）。  
- 列挙：数値コードを採用（詳細は 3.3 列挙定義）。表示はアプリ側でマッピング。  
- タイムスタンプ：`createdAt` / `updatedAt` はサーバ時刻（`serverTimestamp()`）を基本。
- APIレイヤでは timestamp を ISO-8601（UTC）文字列にシリアライズして返却する（07 に準拠）。DB格納は Firestore の timestamp 型を用いる。

### 2.6 保存・整合・検索
- 保存方針：編集中はローカル（IndexedDB）、ナビゲーション境界でサーバ保存（詳細は 5章）。  
- 整合：編成内 `camp` は編成時点の選択を正とし、マスターの `camp` は初期値扱い。  
- 検索：ユーザーの編成一覧は `where(userId==uid) + orderBy(updatedAt desc)`、武将を含む編成検索は `warlordIdsFlat` の `array-contains` を利用。  
- 資産：疎Map（未所持はキー無し）。フル一覧表示時はマスター突き合わせで0埋めする。
- UI配置（編成パレット）：フリーエリア（同時表示1）／共存性エリア（同時表示5）は UIのレイアウト状態であり、
  composition（編成データ）そのものには保存しない。復元が必要な場合のみユーザー設定として保存する（§3.2.4, §3.2.5）。

---

## 3. エンティティ定義
### 3.1 Master_data
#### 3.1.1 warlord
warlords/{warlordId}
```jsonc
{
  "warlordId": "string",         // 例: "w_001"
  "numericId": "int",            // 例: 1
  "name": "string",              // 例: "劉備"
  "rarity": "int",               // enum (1=星5 | 2=星4 | 3=星3)
  "camp": "int",                 // enum (1=魏 | 2=呉 | 3=蜀 | 4=群)
  "cost": "int",                 // 3..7
  "uniqueSkillId": "string",     // "s_002"
  "createdAt": "timestamp",       //serverTimestamp()
  "updatedAt": "timestamp"        //serverTimestamp()
}
```

#### 3.1.2 skill
skills/{skillId}
```jsonc
{
  "skillId": "string",           // 例: "s_001"
  "numericId": "int",            // 例: 1
  "name": "string",              // 例: "義心昭烈"
  "rarity": "int",               // enum (1=S | 2=A | 3=B)
  "type": "int",                 // enum (1=指揮 | 2=アクティブ | 3=突撃 | 4=パッシブ | 5=兵種 | 6=陣法)
  "displayGroup": "int",       // enum (1=指揮 | 2=アクティブPK | 3=アクティブS | 4=アクティブA | 5=突撃 | 6=パッシブ | 7=兵種 | 8=陣法)
  "inheritedSkill": "bool",      // 例: true
  "useLimit": "int",             // 例: 1
  "createdAt": "timestamp",       //serverTimestamp()
  "updatedAt": "timestamp"        //serverTimestamp()
}
```

#### 3.1.3 tactic
tactics/{tacticId}
```jsonc
{
  "tacticId": "string",           // 例: "t_001"
  "name": "string",              // 例: "一気呵成"
  "category": "int",             // enum (1=作戦 | 2=虚実 | 3=軍形 | 4=九変 | 5=始計 | 6=用間)
  "createdAt": "timestamp",       //serverTimestamp()
  "updatedAt": "timestamp"        //serverTimestamp()
}
```

### 3.2 User_data
#### 3.2.1 user
users/{userId}
```jsonc
{
  "userId": "string",
  "displayName": "string",   // 例: "三国志好き太郎"
  "email": "string|null",    // 匿名認証時は null
  "createdAt": "timestamp",       //serverTimestamp()
  "updatedAt": "timestamp"        //serverTimestamp()
}
```

#### 3.2.2 assets
users/{userId}/assets/current //MVPでは「基本的に1ユーザー＝1つの資産情報」
```jsonc
{
  "assetId": "string",
  "ownedWarlords": { "string": "int", }, // 武将ID（warlordId）のキーと各武将所持数のマップ（未所持はキー無し）
  "ownedSkills": { "string": "bool", }, // 戦法ID（skillId）のキーと所持戦法フラグのマップ（未所持はキー無し） *このアプリでは戦法の所持数概念は存在せず、boolのみで管理する
  "createdAt": "timestamp",       //serverTimestamp()
  "updatedAt": "timestamp"        //serverTimestamp()
}
```
> 凸（limit_break）は武将所持枚数を真実源に算出。式：limit_break = min(5, max(0, copies - 1))

#### 3.2.3 composition
users/{userId}/compositions/{compositionId}
```jsonc
{
  "compositionId": "string",
  "userId": "string",            // {userId}
  "name": "string",              // 編成名（任意）
  "unitType": "int",             // enum: (1=騎兵 | 2=盾兵 | 3=弓兵 | 4=槍兵 | 5=兵器)（兵種については、"unit"表現が妥当）
  "slots": [                     // 最大3スロット（0..2）
    {
      "warlordId": "string",     // "w_###"
      "camp": "int",             // enum: (1=魏 | 2=呉 | 3=蜀 | 4=群（編成で変更可）)
      "skillIds": [ "string" ],  // 長さ <= 2 例: ["s_001", "s_002"]
      "tacticIds": [ "string" ], // 長さ <= 3 例: ["t_001", "t_002", "t_003"]
      "notes": {                 // 各<=2000文字目安
        "attr": "string",        // 例: 能力付与メモ
        "equipSkill": "string",  // 例: 装備/伝授の補足
        "memo": "string"         // 自由メモ
      }
    }
    // ... up to 3
  ],
  "warlordIdsFlat": ["string", ], // 検索用に最大3スロット分に割り当てた武将の武将ID（{warlordId}）
  "skillIdsFlat": ["string", ], // 検索用に最大3スロット分に割り当てた戦法の戦法ID（{skillId}）
  "createdAt": "timestamp",       //serverTimestamp()
  "updatedAt": "timestamp"        //serverTimestamp()
}
```

#### 3.2.4 workspace
users/{userId}/workspace/current
```jsonc
{
  "workspaceId": "string",
  "freeAreaCompositionIds": ["string"],      // {compositionId}  フリーエリアに配置中の編成  配列長 <= 10（同時表示数は、開発開始時は1、使用感みて調整）
  "constraintAreaCompositionIds": ["string"],         // {compositionId}　　配列長 <= 5（共存性エリアに配置中の編成IDs）
  "createdAt": "timestamp",       //serverTimestamp()
  "updatedAt": "timestamp"        //serverTimestamp()
}
```
> ビューステートはローカル（Dexie）

### 3.3 列挙定義
- warlords/rarity  : enum (1=星5 | 2=星4 | 3=星3)
- warlords/camp    : enum (1=魏  | 2=呉  | 3=蜀  | 4=群)   // マスターの初期値。編成側で上書き可
- skills/rarity    : enum (1=S   | 2=A   | 3=B)
- skills/type      : enum (1=指揮 | 2=アクティブ | 3=突撃 | 4=パッシブ | 5=兵種 | 6=陣法)
- tactics/category : enum (1=作戦 | 2=虚実 | 3=軍形 | 4=九変 | 5=始計 | 6=用間)
- compositions/unitType : enum (1=騎兵 | 2=盾兵 | 3=弓兵 | 4=槍兵 | 5=兵器)
- compositions/slots[].camp : enum (1=魏 | 2=呉 | 3=蜀 | 4=群)

---

## 4. 関連性（ER図イメージ）
- users ー 1対多 ー assets(サブコレクション)
- users ー 1対多 ー compositions(サブコレクション)
- users ー 1対1 ー workspace(サブコレクション)
- compositions ー 多対多 ー warlords（最大3スロット）
- compositions ー 多対多 ー skills
- compositions ー 多対多 ー tactics
- warlords ー 1対1 ー skills（固有戦法: warlords.uniqueSkillId → skills/{id}）

---

## 5. ストレージ方針
- 永続化：クラウドDB（例：Supabase, Firestore）
- ローカル保持：フロントエンドは IndexedDB / LocalStorage を利用
- 保存タイミング：ナビゲーション境界でサーバ保存、編集中はローカル保存
  - 図鑑：ナビゲーション境界でサーバ保存、編集中はローカル保存
  - 編成作成UI：編成保存ボタン押下でサーバ保存、編集中はローカル保存
  
---

## 6. 注意事項
- 本ドキュメントは 01〜05 の確定仕様と整合性を保っている。
- 将来的な拡張（例：タグ付与、編成評価スコア）については提案段階であり、本MVPでは未対応とする。

