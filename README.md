# aerumap（あえるまっぷ）

「今どこ？」をスムーズに。  
**aerumap（あえるまっぷ）** は、友人・恋人・家族との待ち合わせを円滑にするリアルタイム位置共有Webアプリです。  
インストール不要・匿名参加・URL共有型で、カジュアルな待ち合わせ体験をサポートします。

**🔗 公開URL**: https://onekilowatt.github.io/aerumap/

---

## 📁 フォルダ構成（概要）

```
aerumap/
├── app/                  # React アプリ本体（フロントエンド）
│   ├── src/              # 各種コンポーネント・地図UIなど
│   ├── public/           # 静的ファイル（HTML、画像、robots.txt等）
│   └── package.json      # 依存関係・ビルド設定
├── firebase/             # Firebase Functions（API / room削除処理など）
│   ├── functions/        # Cloud Functions ソースコード
│   ├── firestore.rules   # Firestore セキュリティルール
│   └── firebase.json     # Firebase 設定
├── doc/                  # 仕様書・設計書類
│   ├── REQUIREMENTS.md   # 要件定義書（全体の仕様）
│   ├── TERMS.md          # 利用規約
│   ├── SECURITY.md       # セキュリティポリシー
│   ├── DESIGN.md         # デザインルール（UI/色/構成）
│   ├── ROOM_LOGIC.md     # 招待〜退出までの状態遷移設計
│   ├── FIRESTORE_RULES.md# Firestoreセキュリティルール仕様
│   ├── DATA_STRUCTURES.md# Firestoreのデータ構造一覧
│   ├── DEPLOYMENT.md     # Firebase / GitHub Actionsのデプロイ＆自動処理設計
│   ├── PAGES/            # 各画面のUI仕様（ページごとに分割）
│   └── API/              # バックエンドAPIの仕様（エンドポイントごとに分割）
├── actions/              # GitHub Actions用スクリプト
│   └── script/           # 定期削除処理などのスクリプト
├── .github/workflows/    # GitHub Actions（CI/CD、自動削除処理など）
├── docker/               # Docker 関連ファイル
├── docker-compose.yml    # Docker 開発環境構築用
└── README.md             # このファイル
```

---

## 📚 doc/ 以下の仕様書について

| ファイル / フォルダ | 内容 |
|---------------------|------|
| `REQUIREMENTS.md`   | アプリ全体の要件・機能一覧・使用技術スタック |
| `TERMS.md`          | 利用規約（位置情報・プライバシー・年齢制限など） |
| `SECURITY.md`       | セキュリティ要件・IP制限・reCAPTCHA・データ保持方針 |
| `DESIGN.md`         | UIルール・配色・フォント・モバイル対応ガイドライン |
| `ROOM_LOGIC.md`     | ルームのライフサイクル設計（招待〜退出〜削除） |
| `FIRESTORE_RULES.md`| Firestore セキュリティルールの方針と構文 |
| `DATA_STRUCTURES.md`| Firestoreコレクション/ドキュメントの構造定義 |
| `DEPLOYMENT.md`     | Firebase Hosting / GitHub Actions / 定期削除などのデプロイ構成・CI設計 |
| `PAGES/`            | `ROOM.md`など各ページの詳細仕様（複雑なUIがある画面のみ） |
| `API/`              | `CREATE_ROOM.md`, `JOIN_ROOM.md`など、APIごとの仕様ファイル |

---

## 🧪 開発環境・ビルド方法

### 前提条件
- Docker & Docker Compose
- Firebase CLI （デプロイ時）

### 環境変数の設定
ビルド前に環境変数ファイルを設定してください：

```bash
# app/ ディレクトリで実行
cp .env .env.local
```

`.env.local` ファイルでFirebase設定を確認・編集してください。

### Docker開発環境の構築

```bash
# リポジトリをクローン
git clone https://github.com/OneKiloWatt/aerumap.git
cd aerumap

# Docker環境でビルド・起動
bash rebuild.sh
```

---

## 🚀 デプロイ

### GitHub Pages（自動デプロイ）
- `main` ブランチへのプッシュで自動デプロイ
- GitHub Actions により `app/build/` をGitHub Pagesに公開

### Firebase Functions
```bash
cd firebase
firebase deploy --only functions
```

---

## 🔧 開発のポイント

### ドキュメント駆動開発
このプロジェクトは**ドキュメント駆動開発**で構築されています：

1. **doc/** 以下の仕様書を先に作成
2. 仕様書に基づいてコード実装
3. 変更時は仕様書を更新してからコード修正

詳細は [Qiita記事](https://qiita.com/OneKiloWatt/items/647614a6ae6c09e5a3e2) をご覧ください。

### 技術スタック
- **フロントエンド**: React + React-Leaflet
- **バックエンド**: Firebase (Auth/Firestore/Functions)
- **ホスティング**: GitHub Pages
- **地図**: OpenStreetMap
- **CI/CD**: GitHub Actions

---

## 📄 ライセンス

Apache-2.0 
詳細は [LICENSE](./LICENSE) を参照してください。

---

## 🤝 コントリビューション

1. [Issues](https://github.com/OneKiloWatt/aerumap/issues) で課題報告・提案
2. Pull Request での改善提案歓迎
3. まずは `doc/` の仕様書をご確認ください

---

## 📞 お問い合わせ

- **GitHub Issues**: https://github.com/OneKiloWatt/aerumap/issues
- プライバシー・セキュリティに関するご質問も上記から受け付けております
