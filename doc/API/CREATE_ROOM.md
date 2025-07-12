# CREATE\_ROOM.md（ルーム作成処理仕様書）

## 📝 概要

このAPIは、新しいルームを作成し、同時にホスト（作成者）を `members/{uid}` に登録する。
クライアントは事前に匿名ログインを完了しておき、認証トークン（IDトークン）を用いてアクセスする。

---

## 🔗 エンドポイント

| メソッド | パス                | 説明          | 制限                          |
| ---- | ----------------- | ----------- | --------------------------- |
| POST | `/api/createRoom` | 新しいルームを作成する | 同一IPから30分に5回まで（SECURITY.md） |

---

## 🔐 認証要件

* Firebase Authentication による匿名認証必須。
* クライアントは事前に匿名ログインを行い、`IDトークン`を取得して `Authorization` ヘッダーに付与する。
* サーバー側で `verifyIdToken()` によるトークン検証を行い、UID を取得する。

---

## 📅 リクエスト仕様

### リクエストヘッダー

```
Authorization: Bearer <Firebase ID Token>
Content-Type: application/json
```

### リクエストボディ

```json
{
  "nickname": "いちかわちゃん"
}
```

* `nickname`：このルーム内で使用するニックネーム（10～20文字程度を想定）
* `message` は現時点では使用しない（後日的に追加可能）

---

## 📤 レスポンス形式

```json
{
  "roomId": "abcd1234efgh",
  "url": "https://aimap.app/room/abcd1234efgh"
}
```

---

## 🛠️ サーバー側の処理フロー

1. AuthorizationヘッダーからIDトークンを抽出・検証し、`uid` を取得
2. ランダムな `roomId` を生成（既存との重複チェックあり）
3. `rooms/{roomId}` に以下を登録：

```js
{
  createdAt: serverTimestamp,
  expiresAt: createdAt + 3時間
}
```

4. `rooms/{roomId}/members/{uid}` にホスト情報を登録：

```js
{
  joinedAt: serverTimestamp,
  nickname: "いちかわちゃん"
}
```

---

## ❌ 警告・注意事項

* このAPI経由で作成されたルームのホストは、参加時に**ニックネーム入力モーダルや注意事モーダルをスキップ**してもよい（本人による作成であり、信用性確認が不要なため）

---

## 💡 備考

* `message` フィールドは現時点で使用しないが、後日拡張の余地あり
* Firestoreルールにより、`members/{uid}` に存在しないユーザーは当該ルームにアクセス不可
* UIDが異なると別ユーザー扱いになるため、**クライアントは認証セッションを維持すること**

---

## ✅ まとめ

| 項目           | 内容                                         |
| ------------ | ------------------------------------------ |
| UIDの扱い       | クライアントで匿名ログイン済みのUIDを利用                     |
| トークン認証       | IDトークンをヘッダーに付与し、サーバーで検証                    |
| nickname入力場所 | トップページで事前に入力                               |
| 警告モーダル       | ホストの場合はスキップ可                               |
| Firestore登録  | `rooms/{roomId}` および `members/{uid}` を同時登録 |

