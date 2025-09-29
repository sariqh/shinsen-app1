# 07_API_Spec.md
Last-Updated: 2025-09-25

---

## 1. ドキュメント目的
本ドキュメントは「三国志真戦 編成アプリ（仮）」MVPにおけるAPI仕様を定義する。フロントエンドとバックエンド間の通信を標準化することを目的とする。

---

## 2. 基本設計方針
- RESTful APIを基本とする。
- JSON形式でリクエスト／レスポンスを標準化。
- バージョニング：`/api/v1/` プレフィックスを使用。
- 日時形式ISO-8601 / UTC（例：`2025-09-17T12:34:56Z`）。
- 入力上限：notes系は最大2000文字（01準拠）。
- ステータスコード：HTTP標準に準拠（200, 201, 204, 400, 401, 403, 404, 409, 422, 500）。

---

## 3. 共通仕様
- 認証／認可：MVPでは匿名ID or セッションを利用（詳細は10_SEC_Privacy.mdで補完）。
- CORS/CSRF：Webアプリを想定し、CORS対応は必須。CSRF対策はセッショントークンで対応。
- ページング：`limit` / `cursor` を設計のみ記載（MVPでは未実装可）。
- フィルタリング／ソート：将来拡張対象。MVPでは未採用。
- エラー形式：6章参照。
- 冪等性：
  - 実装コストを抑えるため、`userId + compositionId + updatedAt`の簡易ハッシュを直近N分でデデュープ（時間窓デデュープ）。
  - 重要度の高い操作（例：課金など）が将来入る場合のみ、`Idempotency-Key` を局所採用。
- 同時更新制御：
  - 取得レスポンスに `updatedAt` を必ず含める。
  - 更新リクエストに 直前取得の `updatedAt` を必須添付（例：`If-Unmodified-Since` 相当フィールド）。
  - サーバ側はミスマッチ時に `409 Conflict` を返す。
  - クライアントは `GET` で再取得 → 差分再適用のフローに寄せる。
  - 更新リクエストボディに "expectedUpdatedAt": "<ISO-8601>" を含め、サーバ側は現行 updatedAt と一致しない場合 409 を返す。
- キャッシュ：
  - `GET /api/v1/master/*` は変更頻度が低いため、`Cache-Control: public, max-age=86400` の付与を推奨。
  - 可能であれば ETag/If-None-Match を併用する。破壊的更新時は ?v=YYYY-MM-DD のバージョンクエリで即時無効化。
---

## 4. リソースとエンドポイント
### 4.1 Master（マスタデータ）
- `GET /api/v1/master/warlords`
  - 武将マスタ取得
  - Response: warlord配列

- `GET /api/v1/master/skills`
  - 戦法マスタ取得
  - Response: skill配列

- `GET /api/v1/master/tactics`
  - 兵法書マスタ取得
  - Response: tactic配列

### 4.2 User（ユーザー登録情報）
- `GET /api/v1/users/{userId}`
  - ユーザー登録情報
  - Response: 指定したIDのusers

- `POST /api/v1/users/{userId}`
  - ユーザー登録情報の登録／更新
  - userIdはAuthから上書き/検証
  - MVPでは部分更新（PATCH）は未採用。更新は全置換（POST/PUT 相当）で運用する。
  - Request: users
  - Response: 更新後のusers

### 4.3 Asset（資産管理）
- `GET /api/v1/users/{userId}/assets`
  - ユーザー資産
  - Response: 指定したIDのassets

- `POST /api/v1/users/{userId}/assets`
  - ユーザーの資産の登録／更新
  - Request: assets
  - Response: 更新後のassets


### 4.4 composition（部隊編成）
- `GET /api/v1/users/{userId}/compositions/{compositionId}`
  - 保存済み編成を取得
  - Response: 指定したIDのcomposition

- `POST /api/v1/users/{userId}/compositions`
  - 新規編成を作成（compositionIdはサーバ側で発行）
  - Request: composition（compositionIdは含めない）
  - Response: 作成されたcomposition（compositionIdを含む）

- `PUT /api/v1/users/{userId}/compositions/{compositionId}`
  - 既存編成の更新
  - Request: composition
  - Response: 更新後のcomposition

- `DELETE /api/v1/users/{userId}/compositions/{compositionId}`
  - 編成の削除
  - Response: 成功／失敗

### 4.5 Workspace（編成UIのパレット）
- `GET /api/v1/users/{userId}/workspace`
  - 編成UIの使用状況
  - Response: 指定したユーザーIDのworkspace

- `POST /api/v1/users/{userId}/workspace`
  - 編成UIの使用状況の登録／更新(ビューステートはローカル（Dexie）)
  - Request: workspace
  - Response: 更新後のworkspace

### 4.6 Share
- `GET /api/v1/users/{userId}/share`
  - 保存済み図鑑を加工したもの（画像/CSVなど、出力物は開発中に使用感見て定義）
  - Response: 指定したユーザーIDの図鑑データ
  - Response例: { "exportTypes": ["image","csv"], "latest": { "type": "csv"|"image", "url": "string", "generatedAt": "2025-09-24T12:34:56Z" } }

---

## 5. フロー別API利用
| ユーザーフロー | 呼び出しAPI | 保存タイミング |
|---|---|---|
| 図鑑を作成 　　　| `POST /users/{userId}/assets` | OCR完了 |
| 図鑑を更新 　　　| `POST /users/{userId}/assets` | ナビゲーション境界 |
| 編成UIを開く 　　| `GET /users/{userId}/workspace`, `GET /master/warlords`, `GET /master/skills`, `GET /master/tactics` | 保存なし（参照のみ）」 |
| 編成を作成 　　　| API呼び出しなし（ローカルのみ） | ローカル保存 |
| 編成の保存と更新 | 保存 → `POST /users/{userId}/compositions`、更新 → `PUT /users/{userId}/compositions/{compositionId}` | 明示保存 |
| パレットを編集 　| API呼び出しなし（ローカルのみ） | ローカル保存 |
| パレットの保存 　| `POST /users/{userId}/workspace` | ナビゲーション境界 |
| 図鑑共有 　　　　| `GET /users/{userId}/share` | 保存なし（参照のみ）」 |

---

## 6. リクエスト/レスポンス例
### 6.1. GET /api/v1/users/{userId}/compositions/{compositionId}（レスポンス例・最小）
```jsonc
{
  "compositionId": "composition_xxxx",
  "userId": "user_7x9f",
  "name": "桃園盾",
  "unitType": 2,
  "slots": [
    {
      "warlordId": "w_001",
      "camp": 3,
      "skillIds": ["s_001", "s_002"], 
      "tacticIds": ["t_001", "t_002", "t_003"],
      "notes": {
        "attr": "xxx",
        "equipSkill": "xxx",
        "memo": "xxx"
      }
    }
    //...　x　スロット3つ分
  ],
  "warlordIdsFlat": ["w_001", "w_002", "w_003"],
  "createdAt": "2025-09-19T04:12:33Z",
  "updatedAt": "2025-09-20T04:12:33Z"
}
```

### 6.2. POST /api/v1/users/{userId}/assets（アップサートの例）
```jsonc
{
  "assetId": "asset_xxxx",
  "ownedWarlords": { "w_001": 4, "w_002": 0, ...},
  "ownedSkills": { "s_001": true, "s_002": false}, 
  "createdAt": "2025-09-20T04:00:00Z",
  "updatedAt": "2025-09-20T04:00:00Z"
}

{
  "error": {
    "code": 409,
    "message": "Conflict: newer version exists",
    "current": { "updatedAt": "2025-09-20T04:12:33Z" }
  }
}
```

### 6.3. エラー形式
```jsonc
{
  "error": {
    "code": 422,
    "message": "Validation Failed",
    "fields": [
      { "path": "slots[1].tacticIds[0]", "reason": "unknown_tactic" }
    ]
  }
}
```

---

## 7. 今後の拡張
- 認証API：ユーザーログイン・セッション管理（10_SEC_Privacy.mdにて検討）
- 分析API：08_Analytics_Spec.mdにて定義予定
- アクセシビリティAPI：09_A11y_Spec.mdにて検討予定
- キャッシュ制御：マスタ系APIに`Cache-Control`導入を提案

---

## 8. 実装チェックリスト
- [ ] 04_User_Flowsと呼び出し順を一致させる
- [ ] エラー形式・HTTPコードを統一

