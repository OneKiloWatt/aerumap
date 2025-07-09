# FIRESTORE\_RULES.md

## Firestore セキュリティルール方針（あいまっぷ）

このドキュメントでは、Webアプリ「あいまっぷ」における Firestore セキュリティルールの設計方針と構文例を示す。

---

## 1. 基本ポリシー

* \*\*匿名ユーザー（Firebase Auth 匿名認証）\*\*のみアクセス可能
* **招待URLを踏んだ参加者（= メンバー登録済みUID）のみ**ルーム情報にアクセス可能
* **自分自身の位置情報しか書き込み不可**（なりすまし防止）
* **Firestoreルールのみでアクセス制御を完結**（Cloud Functions に依存しない）

---

## 2. Firestore 構造（抜粋）

```
rooms (collection)
  |- {roomId} (document)
      |- createdAt: timestamp
      |- expiresAt: timestamp

  |- members (subcollection)
      |- {uid} (document)
          |- joinedAt: timestamp

  |- locations (subcollection)
      |- {uid} (document)
          |- lat: number
          |- lng: number
          |- updatedAt: timestamp
```

詳細構造は `DATA_STRUCTURES.md` を参照。

---

## 3. セキュリティルール構文例

```ts
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ルーム情報（メタ情報のみ）
    match /rooms/{roomId} {
      allow read: if exists(/databases/$(database)/documents/rooms/$(roomId)/members/$(request.auth.uid));
      allow write: if false; // 直接編集は禁止
    }

    // メンバー登録（join時のみ使用）
    match /rooms/{roomId}/members/{uid} {
      allow read: if request.auth.uid == uid;
      allow write: if request.auth.uid == uid;
    }

    // 位置情報の共有
    match /rooms/{roomId}/locations/{uid} {
      allow read: if exists(/databases/$(database)/documents/rooms/$(roomId)/members/$(request.auth.uid));
      allow write: if request.auth.uid == uid;
    }
  }
}
```

---

## 4. 補足事項

* `roomId` の有効期限（3時間）を超えてもルール上では自動拒否はしない（クライアント側で制御）
* 不正アクセス対策は Cloud Functions 側の招待API・制限処理にて対応
* ルーム削除は GitHub Actions 経由で毎日 or 3時間おきに実行されるAPIにより削除
* Firestoreログ（セキュリティ検知など）は 30日間保持

---

## 5. 今後の拡張予定（任意）

* IP制限（日本のみ）
* reCAPTCHA v3 対応
* `allow delete` の制御強化（退出時に本人のみ削除可）
