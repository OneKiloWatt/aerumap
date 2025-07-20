# FIRESTORE_RULES.md

## Firestore セキュリティルール方針（あえるまっぷ）

このドキュメントでは、Webアプリ「あえるまっぷ」における Firestore セキュリティルールの設計方針と構文例を示す。

---

## 1. 基本ポリシー

* **匿名ユーザー（Firebase Auth 匿名認証）のみ**アクセス可能
* **招待URLを踏んだ参加者（= メンバー登録済みUID）のみ**ルーム情報にアクセス可能
* **自分自身の位置情報しか書き込み不可**（なりすまし防止）
* **同じルームのメンバー同士でニックネーム参照可能**（位置情報表示用）
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
          |- nickname: string
          |- message?: string

  |- locations (subcollection)
      |- {uid} (document)
          |- lat: number
          |- lng: number
          |- updatedAt: timestamp
```

詳細構造は `DATA_STRUCTURES.md` を参照。

---

## 3. セキュリティルール構文例

```typescript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ===== ルーム情報（メタ情報） =====
    match /rooms/{roomId} {
      // 読み取り：そのルームのメンバーのみ
      allow read: if exists(/databases/$(database)/documents/rooms/$(roomId)/members/$(request.auth.uid));
      
      // 書き込み：認証済みユーザーのみ（ルーム作成用）
      allow create: if request.auth != null;
      
      // 更新・削除：禁止（Cloud Functions/GitHub Actions経由のみ）
      allow update, delete: if false;
    }

    // ===== メンバー登録・管理 =====
    match /rooms/{roomId}/members/{uid} {
      // 読み取り：本人 または 同じルームのメンバー（ニックネーム表示用）
      allow read: if request.auth.uid == uid 
                  || exists(/databases/$(database)/documents/rooms/$(roomId)/members/$(request.auth.uid));
      
      // 書き込み：本人のみ（参加登録用）
      allow create, update: if request.auth.uid == uid;
      
      // 削除：本人のみ（退出機能用）
      allow delete: if request.auth.uid == uid;
    }

    // ===== 位置情報の共有 =====
    match /rooms/{roomId}/locations/{uid} {
      // 読み取り：そのルームのメンバー全員
      allow read: if exists(/databases/$(database)/documents/rooms/$(roomId)/members/$(request.auth.uid));
      
      // 書き込み：本人のみ（なりすまし防止）
      allow create, update: if request.auth.uid == uid;
      
      // 削除：本人のみ（退出時のクリーンアップ用）
      allow delete: if request.auth.uid == uid;
    }

    // ===== レート制限管理（内部処理用） =====
    match /rateLimits/{document} {
      // Cloud Functions からのみアクセス
      allow read, write: if request.auth != null;
    }

    // ===== アクセスログ（内部処理用） =====
    match /accessLogs/{document} {
      // Cloud Functions からの書き込みのみ
      allow write: if request.auth != null;
      // 読み取りは禁止（プライバシー保護）
      allow read: if false;
    }

    // ===== その他すべて拒否 =====
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 4. セキュリティ制御詳細

### 4.1 アクセス権限階層

| コレクション | 読み取り | 書き込み | 削除 |
|-------------|---------|---------|------|
| `rooms/{roomId}` | メンバーのみ | 認証済みユーザー（作成時） | 禁止 |
| `members/{uid}` | **本人 + 同室メンバー** | 本人のみ | 本人のみ |
| `locations/{uid}` | 同室メンバー全員 | 本人のみ | 本人のみ |

### 4.2 セキュリティ強化点

* **なりすまし防止**: 位置情報は本人しか書き込み不可
* **プライバシー保護**: 他のルームのメンバー情報は参照不可
* **メンバー限定**: ルーム未参加者はいかなる情報も取得不可
* **ニックネーム共有**: 同じルームのメンバー間でのみニックネーム参照可能

---

## 5. 補足事項

* `roomId` の有効期限（3時間）を超えてもルール上では自動拒否はしない（クライアント側で制御）
* 不正アクセス対策は Cloud Functions 側の招待API・制限処理にて対応
* ルーム削除は GitHub Actions 経由で毎日 or 3時間おきに実行されるAPIにより削除
* Firestoreログ（セキュリティ検知など）は 30日間保持

---

## 6. 今後の拡張予定（任意）

* IP制限（日本のみ）
* reCAPTCHA v3 対応
* `allow delete` の制御強化（退出時に本人のみ削除可）
* 位置情報のデータ暗号化（高セキュリティ要求時）

---

## 7. 変更履歴

### v1.1 - ニックネーム共有対応
* **修正**: `members/{uid}` の読み取り権限を拡張
* **理由**: 同じルームのメンバー間でニックネーム表示を可能にするため
* **セキュリティ影響**: 同じルーム内でのみニックネーム参照可能、他ルームには影響なし
