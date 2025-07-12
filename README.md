# aimap（あいまっぷ）

「今どこ？」をスムーズに。  
**aimap（あいまっぷ）** は、友人・恋人・家族との待ち合わせを円滑にするリアルタイム位置共有Webアプリです。  
インストール不要・匿名参加・URL共有型で、カジュアルな待ち合わせ体験をサポートします。

---

## 📁 フォルダ構成（概要）

```

aimap/
├── app/                  # React アプリ本体（フロントエンド）
│   └── src/              # 各種コンポーネント・地図UIなど
├── functions/            # Firebase Functions（API / room削除処理など）
├── docs/                 # 仕様書・設計書類
│   ├── REQUIREMENTS.md   # 要件定義書（全体の仕様）
│   ├── TERMS.md          # 利用規約
│   ├── SECURITY.md       # セキュリティポリシー
│   ├── DESIGN.md         # デザインルール（UI/色/構成）
│   ├── ROOM_LOGIC.md     # 招待〜退出までの状態遷移設計
│   ├── FIRESTORE_RULES.md# Firestoreセキュリティルール仕様
│   ├── DATA_STRUCTURES.md# Firestoreのデータ構造一覧
│   ├── DEPLOYMENT.md     # Firebase / GitHub Actionsのデプロイ＆自動処理設計
│   ├── PAGES/            # 各画面のUI仕様（ページごとに分割）、仕様が複雑な場合追加
│   └── API/              # バックエンドAPIの仕様（エンドポイントごとに分割）、必要であれば追加
├── .github/workflows/    # GitHub Actions（CI/CD、自動削除処理など）
├── firestore.rules       # Firestore セキュリティルール
├── Dockerfile            # ローカル開発用 Docker イメージ定義 
├── docker-compose.yml    # Docker 開発環境構築用
└── README.md             # このファイル

```

---

## 📚 docs/ 以下の仕様書について

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
| `PAGES/`            | `top`, `room`, `no-location`, `goodbye`など各ページの詳細仕様 |
| `API/`              | `/createRoom`, `/joinRoom`, `/exitRoom`など、APIごとの仕様ファイル |

---

## 🧪 開発環境・ビルド方法

ビルド方法

以下のコマンドでローカル開発環境を構築できます（Docker使用）：

``` bash

bash rebuild.sh

```

---

## 🚀 ライセンス

MIT License.  
詳細は [LICENSE](./LICENSE) を参照してください。
```

