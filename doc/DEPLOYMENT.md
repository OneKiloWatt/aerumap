# DEPLOYMENT.md

## デプロイ構成

本アプリは GitHub Pages（フロントエンド）および Firebase（バックエンド）で構成されており、自動デプロイと定期処理を GitHub Actions によって管理しています。

---

## 1. フロントエンドデプロイ（GitHub Pages）

* ブランチ：`main`
* デプロイ先：`https://onekilowatt.github.io/aerumap/`
* デプロイ手段：GitHub Actions により `app/` ディレクトリをビルドしてデプロイ
* 使用ライブラリ：React, React-Leaflet

---

## 2. バックエンド設定（Firebase）

| 区分        | 技術                      | 用途                      |
| --------- | ----------------------- | ----------------------- |
| Auth      | Firebase Authentication | 匿名ログイン、UID発行            |
| DB        | Firestore               | 位置情報・ルーム・参加者の管理         |
| Storage   | なし                      | 現状未使用                   |
| Functions | Cloud Functions         | 招待アクセス処理、rate limit（予定） |

---

## 3. 自動デプロイ（GitHub Actions）

### フロントエンド（GitHub Pages）

* ワークフロー：`.github/workflows/pages-deploy.yml`
* 対象：`app/` ディレクトリ
* トリガー：`main` ブランチへのプッシュ
* ビルドコマンド：

```bash
npm ci
PUBLIC_URL=/aerumap npm run build
```

* 必要な GitHub Secrets：

| Secret名 | 内容 |
|---|---|
| `REACT_APP_API_KEY` | Firebase API Key |
| `REACT_APP_AUTH_DOMAIN` | Firebase Auth Domain |
| `REACT_APP_PROJECT_ID` | Firebase Project ID |
| `REACT_APP_APP_ID` | Firebase App ID |

### バックエンド（Firebase Functions / Firestore）

* ワークフロー：`.github/workflows/firebase-prod-deploy.yml`
* 対象：`functions`（Cloud Functions）および `firestore`（ルール・インデックス）
* トリガー：`main` ブランチへのプッシュ
* デプロイコマンド：

```bash
npm ci --prefix functions
npm run build --prefix functions
firebase deploy --only functions,firestore --project aerumap --token "$FIREBASE_TOKEN"
```

* 必要な GitHub Secrets：

| Secret名 | 内容 |
|---|---|
| `FIREBASE_TOKEN` | Firebase CI トークン（`firebase login:ci` で取得） |

---

## 4. 定期削除処理

GitHub Actions の cron によってサーバーレスで定期実行しています。

### ルームの自動削除

* ワークフロー：`.github/workflows/room-cleanup.yml`
* スクリプト：`actions/script/room-cleanup.js`
* 実行タイミング：**3時間おき**（`cron: '0 */3 * * *'`）
* 処理内容：
  * Firestore の `rooms/` を走査
  * `expiresAt` を過ぎたルーム・参加者情報・位置情報を一括削除

### メンテナンス削除（accessLogs / rateLimits）

* ワークフロー：`.github/workflows/maintenance-cleanup.yml`
* スクリプト：`actions/script/maintenance-cleanup.js`
* 実行タイミング：**1日1回、日本時間午前2時**（`cron: '0 17 * * *'`）
* 処理内容：
  * `accessLogs`：30日経過したドキュメントを削除
  * `rateLimits`：`expiresAt` を過ぎたドキュメントを削除

### 認証方法：Firebase Admin SDK

* サービスアカウント鍵を base64 エンコードして GitHub Secrets に登録
* スクリプト内で `GCP_SERVICE_ACCOUNT_KEY` を base64 デコードして使用
* Firestore のセキュリティルールはバイパス可能（管理権限）

```yaml
env:
  GCP_SERVICE_ACCOUNT_KEY: ${{ secrets.GCP_SERVICE_ACCOUNT_KEY }}
```

---

## 5. 注意事項

| 項目          | 内容                                                               |
| ----------- | ---------------------------------------------------------------- |
| 日本IP制限      | GitHub Actions からの実行は**海外IP**の可能性が高いため、セキュリティルールの対象外とする          |
| reCAPTCHA   | 現状未実装。悪用が見えてきた段階で導入予定                                            |
| Functions制限 | Cloud Functions は回数制限が厳しいため、リアルタイム通信は Firestore の onSnapshot を使用 |

---

## 6. 今後の拡張（メモ）

* Functions への署名付きアクセス制限（日本IP + Firebase認証）
* CI/CDステップの細分化（Lint/テスト分離）
* Preview環境対応（別ブランチ or Firebase Hosting）

