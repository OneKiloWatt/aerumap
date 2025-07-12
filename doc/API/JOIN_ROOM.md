# JOIN\_ROOM.md（ルーム参加処理仕様書）

## 📝 概要

このAPIは、招待URLを踏んだユーザーが既存のルームに参加するためのもの。
匿名認証済みのユーザーが `nickname` を入力し、ルーム内の `members` に登録されることで、位置共有が有効化される。

---

## 🔗 エンドポイント

| メソッド | パス              | 説明            | 制限                                |
| ---- | --------------- | ------------- | --------------------------------- |
| POST | `/api/joinRoom` | 指定されたルームに参加する | 同一IPで5回連続失敗 → 一時ブロック（SECURITY.md） |

---

## 🔐 認証要件

* Firebase Authentication による匿名認証が必要。
* クライアントはログイン済みで、IDトークンをヘッダーに付与する。
* サーバー側で `verifyIdToken()` によりトークンを検証し、UIDを取得する。

---

## 📥 リクエスト仕様

### ヘッダー

```
Authorization: Bearer <Firebase ID Token>
Content-Type: application/json
```

### ボディ

```json
{
  "roomId": "abcd1234efgh",
  "nickname": "いちかわちゃん"
}
```

* `roomId`: 参加対象のルームID。
* `nickname`: このルームで表示されるニックネーム。

---

## 📤 レスポンス

```json
{
  "success": true,
  "roomId": "abcd1234efgh"
}
```

または、存在しないルームや重複参加などのエラー：

```json
{
  "success": false,
  "error": "Room not found"
}
```

---

## 🛠️ サーバー処理フロー

1. AuthorizationヘッダーからIDトークンを検証し、`uid` を取得
2. `roomId` が存在するかを Firestore で確認
3. すでに `members/{uid}` が存在する場合 → 参加済みとみなして早期リターン
4. 存在しない場合、以下の情報で `members/{uid}` を新規作成：

```json
{
  "joinedAt": serverTimestamp,
  "nickname": "いちかわちゃん"
}
```

---

## 🚫 注意点・セキュリティ

* `nickname` の重複は許容（UIDごとに個別に管理）
* `message` は任意のため省略（将来的に追加可能）
* 認証されていない、または `roomId` が不正な場合は 403 または 404 エラーを返す
* Firestoreルールにより、参加登録されていないUIDはそのルームのデータにアクセス不可

---

## ✅ まとめ

| 項目           | 内容                                   |
| ------------ | ------------------------------------ |
| UIDの扱い       | Firebase匿名認証のトークンをサーバーで検証して取得        |
| nickname入力場所 | ルーム参加ページで初回のみモーダル表示で入力               |
| エラー対応        | 存在しないルーム・重複登録時のガードあり                 |
| 成功時          | `members/{uid}` にnickname登録し、ルーム参加完了 |

