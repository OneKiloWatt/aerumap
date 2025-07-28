// src/components/TermsPageContent.tsx
import React from 'react';
import './TermsPageContent.css';

export default function TermsPageContent() {
  return (
    <main className="terms-main">
      <div className="terms-container">
        {/* ヘッダーセクション */}
        <div className="terms-header">
          <h1 className="terms-title">
            あえるまっぷ 利用規約
          </h1>
          <p className="terms-description">
            本規約は、あえるまっぷ（以下「本サービス」）の利用に関する条件を定めるものです。<br />
            利用者は本サービスを利用することで、本規約に同意したものとみなされます。
          </p>
        </div>

        {/* 各条項 */}
        <div className="terms-content">
          
          {/* 第1条 */}
          <section className="terms-section">
            <h2 className="terms-section-title">
              第1条（サービス内容）
            </h2>
            <p>
              本サービスは、インストール不要のWebアプリケーションとして提供される位置情報共有サービスです。<br />
              利用者同士がルームを作成し、そのルーム内でリアルタイムに位置情報を共有することができます。
            </p>
          </section>

          {/* 第2条 */}
          <section className="terms-section">
            <h2 className="terms-section-title">
              第2条（禁止事項）
            </h2>
            <p>以下の行為は禁止します：</p>
            <ul className="terms-list">
              <li>他人になりすます行為</li>
              <li>不正アクセスやサービスの不正利用</li>
              <li>実名その他、個人が特定されうる情報の投稿</li>
              <li>公序良俗に反する行為</li>
              <li>本サービスの運営を妨げる行為</li>
            </ul>
          </section>

          {/* 第3条 */}
          <section className="terms-section">
            <h2 className="terms-section-title">
              第3条（匿名性と識別）
            </h2>
            <p>
              本サービスでは Firebase Authentication による<strong>匿名認証</strong>を用いてユーザー識別を行います。<br />
              実名の登録は不要かつ推奨されません。<br />
              ユーザーはニックネーム入力時に、他人に個人が特定されないようご注意ください。
            </p>
          </section>

          {/* 第4条 */}
          <section className="terms-section">
            <h2 className="terms-section-title">
              第4条（位置情報の共有）
            </h2>
            <div className="terms-warning">
              <p>
                ⚠️ 重要：位置情報の取り扱いについて
              </p>
            </div>
            <p>
              本サービスはルーム参加中のユーザーの<strong>位置情報をリアルタイムに共有</strong>します。<br />
              ユーザーがルームを<strong>明示的に退出した場合</strong>、その位置情報は即時削除されます。
            </p>
            <p>
              退出操作を行わなかった場合でも、<strong>ルーム作成から3時間が経過した位置情報は削除対象となり、3時間おきに実行される自動削除処理により順次削除されます。</strong><br />
              この仕組みにより、<strong>位置情報の最大保持期間はおおむね3〜6時間以内</strong>となります。
            </p>
          </section>

          {/* 第5条 */}
          <section className="terms-section">
            <h2 className="terms-section-title">
              第5条（技術的なセキュリティ対策）
            </h2>
            <ul className="terms-list">
              <li>通信はすべて<strong>HTTPS（SSL/TLS）による暗号化</strong>を使用しています</li>
              <li>Firebase Authenticationにより匿名IDの発行と認証を行っています</li>
              <li>Firestore Security Rulesにより、<strong>ルームに参加していないユーザーのデータアクセスを厳しく制限</strong>しています</li>
              <li><strong>位置情報そのものは個別に暗号化されておりません。</strong> その点をご理解のうえご利用ください</li>
            </ul>
          </section>

          {/* 第6条 */}
          <section className="terms-section">
            <h2 className="terms-section-title">
              第6条（データの保存と移転）
            </h2>
            <p>
              本サービスは Google Firebase を基盤としており、ユーザーのデータ（位置情報を含む）は<br />
              <strong>日本国外（例：米国）のサーバーに保存・処理される可能性</strong>があります。<br />
              本サービスを利用することで、<strong>国外へのデータ移転に同意いただいたものとみなします。</strong>
            </p>
          </section>

          {/* 第7条 */}
          <section className="terms-section">
            <h2 className="terms-section-title">
              第7条（ログと監査）
            </h2>
            <p>
              APIアクセスに関するログ（IPアドレス、UID、タイムスタンプなど）はセキュリティ確保・不正利用対策・警察等からの協力要請への対応のために、<br />
              <strong>最大30日間保持されます。</strong>
            </p>
          </section>

          {/* 第8条 */}
          <section className="terms-section">
            <h2 className="terms-section-title">
              第8条（免責事項）
            </h2>
            <ul className="terms-list">
              <li>本サービスは一般的な待ち合わせ用途を想定しており、位置情報の正確性や即時性は保証されません</li>
              <li>高度な秘匿性や業務利用などには適しておりません</li>
              <li>ユーザー間のトラブルや位置情報の悪用について、運営者は一切の責任を負いません</li>
            </ul>
          </section>

          {/* 第9条 */}
          <section className="terms-section">
            <h2 className="terms-section-title">
              第9条（改定）
            </h2>
            <p>
              本規約は予告なく変更される場合があります。<br />
              変更後も本サービスを継続して利用された場合は、改定後の規約に同意したものとみなされます。
            </p>
          </section>

          {/* 第10条 */}
          <section className="terms-section">
            <h2 className="terms-section-title">
              第10条（年齢制限）
            </h2>
            <div className="terms-age-restriction">
              <p>
                本サービスは、<strong>13歳以上のユーザーのみ利用可能</strong>です。<br />
                13歳未満の方は、保護者の同意があっても利用できません。
              </p>
            </div>
          </section>

          {/* 第11条 */}
          <section className="terms-section">
            <h2 className="terms-section-title">
              第11条（サービス終了時のデータ処理）
            </h2>
            <p>
              本サービスの提供を終了する際は、<strong>すべてのユーザーデータ（位置情報・UID・ログ等）を適切に削除</strong>します。<br />
              削除処理が完了した後のデータは復元されません。
            </p>
          </section>

          {/* お問い合わせ */}
          <section className="terms-contact">
            <h2 className="terms-contact-title">
              📧 お問い合わせ
            </h2>
            <p>
              サービスに関するお問い合わせは、以下のGitHubリポジトリよりお願いいたします：
            </p>
            <a 
              href="https://github.com/OneKiloWatt/aerumap"
              target="_blank"
              rel="noopener noreferrer"
              className="terms-contact-link"
            >
              https://github.com/OneKiloWatt/aerumap
            </a>
          </section>
        </div>
      </div>
    </main>
  );
}
