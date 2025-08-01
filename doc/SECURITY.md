# SECURITY.md

本ドキュメントは、リアルタイム位置共有サービス「あえるまっぷ」におけるセキュリティ方針を記述します。

---

## 1. アクセス制限・認証

* Firebase Authentication による **匿名認証**を利用。
* UIDはFirestoreルールにより厳密にアクセス制御され、本人のみが読み書き可能。
* ルームに参加していないユーザーは、該当ルームのデータにアクセスできません。

---

## 2. 位置情報の共有制御

* 明示的な「ルーム参加」操作がない限り、位置情報は共有されません。
* ルーム参加時、Firestoreの `rooms/{roomId}/members/{uid}` に記録されて初めて読み書きが許可されます。
* 位置情報は **変化時＋最大30秒おき** にアップロードされ、不要なトラフィックを抑制。

---

## 3. データ削除と保持期間

* 退出操作で、ユーザーの位置情報とメンバー情報は即時削除。
* 退出がない場合でも、**ルーム作成から3時間後に削除対象**となり、
  **GitHub Actions により3時間おきに実行される削除処理**によって順次クリーンアップされます。
* 結果として、位置情報・メンバー情報の**最大保持期間は6時間以内**。

---

## 4. APIアクセス制限

* 以下のエンドポイントには、**IP単位のレート制限**と**Bot対策**が適用されます：

| エンドポイント           | 制限内容                 |
| ----------------- | -------------------- |
| `/api/createRoom` | 同一IPから30分に5回まで       |
| `/api/joinRoom`   | 同一IPで5回連続失敗 → 一時ブロック |

* ※ reCAPTCHA v3 は現時点では未導入（将来的に導入検討）。

---

## 5. 通信の暗号化

* サービス全体で **HTTPS（SSL/TLS）** を使用し、通信経路の暗号化を実施。
* Firestore通信も含めて中間者攻撃を防止。
* ※ Firestoreに保存される**位置情報データ自体はアプリケーションレベルでの暗号化は未実施**。

---

## 6. ログ記録と保持

* APIアクセスログ（IP、UID、タイムスタンプ等）を記録し、セキュリティインシデントに備えます。
* **最大30日間保持**し、必要に応じて監査・警察等への協力も可能。

---

## 7. セキュリティ強化の将来的対応

* 想定される拡張：

  * reCAPTCHA v3 の導入（Botスコアに基づくアクセス制御）
  * WAF・CloudflareによるさらなるBot制御
  * 利用状況に応じたログの自動集計・可視化
  * サーバー側での位置情報の署名検証・暗号化対応

---

## 8. 最終更新

このセキュリティ方針は 2025年7月時点の実装仕様に基づいています。
今後の機能追加・利用状況の変化に応じて、随時見直しを行います。
