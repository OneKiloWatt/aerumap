# DEPLOYMENT.md

## デプロイ構成

本アプリは GitHub Pages（フロントエンド）および Firebase（バックエンド）で構成されており、自動デプロイと定期処理を GitHub Actions によって管理しています。

---

## 1. フロントエンドデプロイ（GitHub Pages）

* ブランチ：`main`
* デプロイ先：`https://onekilowatt.github.io/aimap/`
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

### ビルド & デプロイ（Pages）

* 対象：`app/` ディレクトリ
* コマンド例：

```bash
yarn install
yarn build
git push origin main
```

* GitHub Actions により `build` 成果物を GitHub Pages に公開

---

## 4. 定期削除処理（ルームの自動削除）

* 実行タイミング：**3時間おきに自動実行**（cron）
* スクリプト：`scripts/cleanup.js`
* 処理内容：

  * Firestore の `rooms/` を走査
  * `expiresAt` を過ぎたルーム・位置情報・参加情報を一括削除

### 認証方法：Firebase Admin SDK

* `.env` or GitHub Secrets にサービスアカウント鍵（`.json`）を登録
* `GOOGLE_APPLICATION_CREDENTIALS` に設定
* Firestore のセキュリティルールはバイパス可能（管理権限）

```yaml
env:
  GOOGLE_APPLICATION_CREDENTIALS: ${{ secrets.GCP_SERVICE_ACCOUNT_KEY }}
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

