// src/components/PrivacyPageContent.tsx
import React from 'react';
import './PrivacyPageContent.css';

export default function PrivacyPageContent() {
  return (
    <main className="privacy-main">
      <div className="privacy-container">
        {/* ヘッダーセクション */}
        <div className="privacy-header">
          <h1 className="privacy-title">
            プライバシーポリシー
          </h1>
          <p className="privacy-description">
            あえるまっぷ（以下「本サービス」）における個人情報の取扱いについて説明いたします。
          </p>
          <p className="privacy-updated">
            最終更新日：2025年7月28日
          </p>
        </div>

        {/* コンテンツ */}
        <div className="privacy-content">
          
          {/* 1. 取得する情報 */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">
              1. 取得する情報
            </h2>
            
            <div className="privacy-subsection">
              <h3 className="privacy-subsection-title">
                🔍 自動的に取得する情報
              </h3>
              <ul className="privacy-list">
                <li><strong>位置情報</strong>：緯度・経度（GPS、Wi-Fi、携帯電話基地局等から取得）</li>
                <li><strong>IPアドレス</strong>：アクセス元の特定とセキュリティ目的</li>
                <li><strong>ユーザーエージェント</strong>：ブラウザ・端末情報</li>
                <li><strong>Firebase匿名UID</strong>：ユーザー識別用の匿名ID</li>
                <li><strong>アクセスログ</strong>：API利用状況、タイムスタンプ</li>
              </ul>
            </div>

            <div className="privacy-subsection">
              <h3 className="privacy-subsection-title">
                ✏️ ユーザーが入力する情報
              </h3>
              <ul className="privacy-list">
                <li><strong>ニックネーム</strong>：ルーム内で表示される名前</li>
                <li><strong>メッセージ</strong>：自己紹介等の任意入力テキスト</li>
              </ul>
            </div>

            <div className="privacy-subsection">
              <h3 className="privacy-subsection-title">
                ❌ 取得しない情報
              </h3>
              <ul className="privacy-list">
                <li>実名、電話番号、メールアドレス</li>
                <li>端末内の連絡先やその他アプリのデータ</li>
                <li>写真・動画等のメディアファイル</li>
                <li>加速度センサやジャイロスコープなど、端末のハードウェアセンサ情報</li>
              </ul>
              <p>本サービスは匿名性を前提としており、実名登録は不要・非推奨です。</p>
            </div>
          </section>

          {/* 2. 情報の利用目的 */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">
              2. 情報の利用目的
            </h2>
            <ul className="privacy-list">
              <li><strong>位置情報共有サービスの提供</strong>：ルーム参加者同士での位置情報リアルタイム表示</li>
              <li><strong>セキュリティ確保</strong>：不正利用の防止</li>
              <li><strong>サービス改善</strong>：利用状況の分析（統計的処理のみ）</li>
              <li><strong>法的要請への対応</strong>：警察等からの協力要請時（必要に応じて）</li>
            </ul>
          </section>

          {/* 3. 情報の保存場所と期間 */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">
              3. 情報の保存場所と期間
            </h2>
            
            <div className="privacy-subsection">
              <h3 className="privacy-subsection-title">
                📍 保存場所
              </h3>
              <p>
                本サービスは <strong>Google Firebase</strong>を利用しており、ユーザーの情報は以下に保存されます：
              </p>
              <ul className="privacy-list">
                <li><strong>日本国外（主に米国）のGoogleデータセンター</strong></li>
                <li>本サービス利用により、<strong>国外へのデータ移転に同意いただいたものとみなします</strong></li>
              </ul>
            </div>

            <div className="privacy-subsection">
              <h3 className="privacy-subsection-title">
                ⏰ 保存期間
              </h3>
              <table className="privacy-table">
                <thead>
                  <tr>
                    <th>データ種別</th>
                    <th>保存期間</th>
                    <th>削除タイミング</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>位置情報・ニックネーム</strong></td>
                    <td>最大6時間</td>
                    <td>退出時に即時削除 または ルーム作成から3-6時間後に自動削除</td>
                  </tr>
                  <tr>
                    <td><strong>アクセスログ</strong></td>
                    <td>最大30日間</td>
                    <td>30日経過後に自動削除</td>
                  </tr>
                  <tr>
                    <td><strong>Firebase匿名UID</strong></td>
                    <td>ブラウザ使用中および保存設定が維持されている間</td>
                    <td>ブラウザのストレージ削除や設定変更により再発行されることがあります</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 4. 第三者への情報提供 */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">
              4. 第三者への情報提供
            </h2>
            
            <div className="privacy-subsection">
              <h3 className="privacy-subsection-title">
                🤝 情報を共有する場合
              </h3>
              <ul className="privacy-list">
                <li><strong>ルーム参加者間</strong>：位置情報・ニックネーム・メッセージ</li>
                <li><strong>Google（Firebase提供者）</strong>：サービス運営のためのデータ処理</li>
                <li><strong>法的要請</strong>：警察・裁判所等からの正当な要請がある場合</li>
              </ul>
            </div>

            <div className="privacy-subsection">
              <h3 className="privacy-subsection-title">
                🚫 情報を共有しない場合
              </h3>
              <ul className="privacy-list">
                <li>商業目的での第三者への売却・提供</li>
                <li>広告配信のためのデータ利用</li>
                <li>上記以外での無断での第三者提供</li>
              </ul>
            </div>
          </section>

          {/* 5. セキュリティ対策 */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">
              5. セキュリティ対策
            </h2>
            <ul className="privacy-list">
              <li><strong>通信暗号化</strong>：すべての通信にHTTPS（SSL/TLS）を使用</li>
              <li><strong>アクセス制御</strong>：Firestore Security Rulesによる厳格な権限管理</li>
              <li><strong>レート制限</strong>：API乱用防止のための接続回数制限</li>
            </ul>
            <div className="privacy-warning">
              <p>
                ⚠️ 注意：位置情報そのものは暗号化されずにFirestoreに保存されます
              </p>
            </div>
          </section>

          {/* 6. ユーザーの権利 */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">
              6. ユーザーの権利
            </h2>
            
            <div className="privacy-subsection">
              <h3 className="privacy-subsection-title">
                ✅ 可能な操作
              </h3>
              <ul className="privacy-list">
                <li><strong>削除権</strong>：ルーム退出により即座に位置情報・ニックネームを削除</li>
                <li><strong>利用停止</strong>：いつでもサービス利用を停止可能</li>
                <li><strong>情報確認</strong>：参加中ルームでの自身の情報は画面上で確認可能</li>
                <li><strong>ローカルデータの削除</strong>：ブラウザのローカルストレージを手動で削除することで、Firebase UID等もクリアされます</li>
              </ul>
            </div>

            <div className="privacy-subsection">
              <h3 className="privacy-subsection-title">
                ❌ 制限事項
              </h3>
              <ul className="privacy-list">
                <li><strong>過去のアクセスログ</strong>：セキュリティ上の理由により個別開示は行いません</li>
                <li><strong>他者の情報</strong>：プライバシー保護のため他の参加者の情報は確認できません</li>
              </ul>
            </div>
          </section>

          {/* 7. 年齢制限 */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">
              7. 年齢制限
            </h2>
            <div className="privacy-age-restriction">
              <p>
                <strong>13歳以上のユーザーのみ</strong>利用可能<br />
                13歳未満の方は保護者の同意があっても利用できません<br />
                年齢確認は利用者の申告に基づくものとします
              </p>
            </div>
          </section>

          {/* 8. セッション維持と保存情報 */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">
              8. セッション維持と保存情報（Cookie / ブラウザストレージ）
            </h2>
            <p>
              本サービスは以下の目的で<strong>ブラウザの保存機能</strong>（技術的にはCookieやLocalStorageと呼ばれるもの）を使用します：
            </p>
            <ul className="privacy-list">
              <li><strong>Firebase認証情報の保持</strong>：匿名ログイン状態を維持するため</li>
              <li><strong>セッション管理</strong>：ルーム参加状態の維持</li>
            </ul>
            <p>第三者による広告トラッキング等は一切行っておりません。</p>
          </section>

          {/* 9. プライバシーポリシーの変更 */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">
              9. プライバシーポリシーの変更
            </h2>
            <p>
              本ポリシーは予告なく変更される場合があります。<br />
              重要な変更の場合は、サービス内で告知いたします。<br />
              変更後も継続利用された場合は、改定後のポリシーに同意いただいたものとみなします。
            </p>
          </section>

          {/* 10. 適用法・管轄 */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">
              10. 適用法・管轄
            </h2>
            <p>
              本プライバシーポリシーは<strong>日本法</strong>に準拠し、東京地方裁判所を専属的合意管轄裁判所とします。
            </p>
          </section>

          {/* 11. お問い合わせ */}
          <section className="privacy-contact">
            <h2 className="privacy-contact-title">
              11. お問い合わせ
            </h2>
            <p>
              プライバシーに関するご質問・ご意見は、以下よりお願いいたします：
            </p>
            <a 
              href="https://forms.gle/Q1afr7URr3kURVDs6"
              target="_blank"
              rel="noopener noreferrer"
              className="privacy-contact-link"
            >
              お問い合わせフォーム
            </a>
            <p className="privacy-contact-note">
              ※個人開発のため、お問い合わせへの個別返信は<br />
              難しい場合がございます。ご了承ください。
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
