# DATA\_STRUCTURES.md

## Firestore データ構造定義（あいまっぷ）

このドキュメントでは、Webアプリ「あいまっぷ」で使用する Firestore のコレクション・ドキュメント構造とその役割について説明する。

---

## 1. コレクション・ドキュメント構造

```
rooms (collection)
  |- {roomId} (document)
      |- createdAt: timestamp
      |- expiresAt: timestamp

  |- members (subcollection)
      |- {uid} (document)
          |- joinedAt: timestamp
          |- nickname: string
          |- message: string

  |- locations (subcollection)
      |- {uid} (document)
          |- lat: number
          |- lng: number
          |- updatedAt: timestamp
```

---

## 2. 各要素の定義

### 🔹 rooms/{roomId}

* **createdAt**：ルーム作成時刻（サーバー時刻）
* **expiresAt**：ルームの有効期限（作成から3時間後）

### 🔹 rooms/{roomId}/members/{uid}

* **joinedAt**：参加者が初回参加した時刻
* **nickname**：ユーザーがこのルーム内で使用するニックネーム（他ルームと独立）
* **message**：自己紹介などの一言メッセージ（任意）

### 🔹 rooms/{roomId}/locations/{uid}

* **lat / lng**：位置座標（WGS84）
* **updatedAt**：最後に位置が更新された時刻

---

## 3. その他の仕様

* `uid` は Firebase Auth の匿名UID
* `roomId` は英数字ランダムな一意ID（URL共有）
* `nickname` は第三者に個人特定されない名称を推奨（UIで誘導）
* `message` はユーザーごとの軽い自己紹介や状態（任意表示）
* `locations` は最大30秒ごと or 位置変化時に更新
* `members` に存在しない `uid` はアクセス不可（Firestoreルールにより制御）
* ユーザーは複数のルームに所属可能であり、それぞれ異なるニックネーム・メッセージを持てる

---

## 4. 補足

* 退室処理では `members/{uid}` および `locations/{uid}` の削除を行う（任意）
* ルームの削除は `roomId` ごと Cloud Functions or 定期API で削除
* `expiresAt` による期限切れ判定はクライアント側で実施

---
