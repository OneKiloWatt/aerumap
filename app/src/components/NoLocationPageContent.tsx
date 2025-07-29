import React, { useState, useEffect } from 'react';
import './NoLocationPageContent.css';

interface PlatformInfo {
  platform: string;
  browser: string;
  userAgent: string;
}

export default function NoLocationPageContent() {
  const [detectedPlatform, setDetectedPlatform] = useState<PlatformInfo | null>(null);

  // プラットフォーム検出
  useEffect(() => {
    const detectPlatform = (): PlatformInfo => {
      const userAgent = navigator.userAgent;
      
      if (/iPhone|iPad|iPod/.test(userAgent)) {
        if (/CriOS/.test(userAgent)) {
          return { platform: 'iOS', browser: 'Chrome', userAgent };
        } else if (/FxiOS/.test(userAgent)) {
          return { platform: 'iOS', browser: 'Firefox', userAgent };
        } else {
          return { platform: 'iOS', browser: 'Safari', userAgent };
        }
      } else if (/Android/.test(userAgent)) {
        if (/Chrome/.test(userAgent) && !/Edg/.test(userAgent)) {
          return { platform: 'Android', browser: 'Chrome', userAgent };
        } else if (/Firefox/.test(userAgent)) {
          return { platform: 'Android', browser: 'Firefox', userAgent };
        } else {
          return { platform: 'Android', browser: 'その他', userAgent };
        }
      } else if (/Windows/.test(userAgent)) {
        if (/Edg/.test(userAgent)) {
          return { platform: 'Windows', browser: 'Edge', userAgent };
        } else if (/Chrome/.test(userAgent)) {
          return { platform: 'Windows', browser: 'Chrome', userAgent };
        } else if (/Firefox/.test(userAgent)) {
          return { platform: 'Windows', browser: 'Firefox', userAgent };
        } else {
          return { platform: 'Windows', browser: 'その他', userAgent };
        }
      } else if (/Mac/.test(userAgent)) {
        if (/Chrome/.test(userAgent) && !/Edg/.test(userAgent)) {
          return { platform: 'Mac', browser: 'Chrome', userAgent };
        } else if (/Firefox/.test(userAgent)) {
          return { platform: 'Mac', browser: 'Firefox', userAgent };
        } else {
          return { platform: 'Mac', browser: 'Safari', userAgent };
        }
      } else {
        return { platform: 'その他', browser: 'その他', userAgent };
      }
    };

    setDetectedPlatform(detectPlatform());
  }, []);

  const handleRetry = () => {
    window.close(); // 別タブの場合は閉じる
    if (window.opener) {
      window.opener.location.reload(); // 元のページを再読み込み
    } else {
      window.location.href = '/'; // 単独タブの場合はトップに戻る
    }
  };

  return (
    <main className="no-location-main">
      <div className="no-location-container">
        {/* ヘッダーセクション */}
        <div className="no-location-header">
          <div className="no-location-icon">📍</div>
          <h1 className="no-location-title">
            位置情報の設定方法
          </h1>
          <p className="no-location-description">
            あえるまっぷを使うには、位置情報の共有が必要です。<br />
            お使いのデバイスに合わせて設定してみてね！
          </p>
        </div>

        {/* 検出されたプラットフォーム表示 */}
        {detectedPlatform && (
          <div className="detected-platform">
            <h2>🔍 あなたの環境</h2>
            <div className="platform-info">
              <span className="platform-badge">
                {detectedPlatform.platform} • {detectedPlatform.browser}
              </span>
            </div>
          </div>
        )}

        <div className="no-location-content">
          
          {/* iOS Safari */}
          <section className="platform-section ios-safari">
            <div className="platform-header">
              <h2 className="platform-title">📱 iPhone・iPad（Safari）</h2>
            </div>
            <div className="step-list">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>設定アプリを開く</h3>
                  <p>ホーム画面から「設定」アプリをタップ</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>プライバシーとセキュリティ</h3>
                  <p>「プライバシーとセキュリティ」→「位置情報サービス」をタップ</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>位置情報サービスをオン</h3>
                  <p>一番上の「位置情報サービス」がオンになっているか確認</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>Safariの設定</h3>
                  <p>「Safari」をタップして「このAppの使用中のみ許可」を選択</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">5</div>
                <div className="step-content">
                  <h3>ページを再読み込み</h3>
                  <p>設定完了後、ブラウザでページを再読み込みしてください</p>
                </div>
              </div>
            </div>
          </section>

          {/* iOS Chrome */}
          <section className="platform-section ios-chrome">
            <div className="platform-header">
              <h2 className="platform-title">📱 iPhone・iPad（Chrome）</h2>
            </div>
            <div className="step-list">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>設定アプリを開く</h3>
                  <p>ホーム画面から「設定」アプリをタップ</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Chromeアプリの設定</h3>
                  <p>アプリ一覧から「Chrome」をタップ</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>位置情報を許可</h3>
                  <p>「位置情報」をタップして「このAppの使用中のみ許可」を選択</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>Chromeブラウザでも許可</h3>
                  <p>ページにアクセスした時に位置情報の許可を求められたら「許可」をタップ</p>
                </div>
              </div>
            </div>
          </section>

          {/* Android Chrome */}
          <section className="platform-section android-chrome">
            <div className="platform-header">
              <h2 className="platform-title">🤖 Android（Chrome）</h2>
            </div>
            <div className="step-list">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>設定アプリを開く</h3>
                  <p>ホーム画面から「設定」アプリをタップ</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>位置情報をオン</h3>
                  <p>「位置情報」または「ロケーション」をタップしてオンにする</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>アプリの権限</h3>
                  <p>「アプリの権限」→「Chrome」→「位置情報」で「許可」を選択</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>ブラウザでも許可</h3>
                  <p>ページで位置情報の許可を求められたら「許可」をタップ</p>
                </div>
              </div>
            </div>
          </section>

          {/* PC Chrome */}
          <section className="platform-section pc-chrome">
            <div className="platform-header">
              <h2 className="platform-title">💻 パソコン（Chrome）</h2>
            </div>
            <div className="step-list">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>アドレスバーの設定</h3>
                  <p>アドレスバーの左側にある🔒マークまたは🌐マークをクリック</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>位置情報を許可</h3>
                  <p>「位置情報」の項目を「許可」に変更</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>ページを再読み込み</h3>
                  <p>設定変更後、F5キーまたは⌘+Rでページを再読み込み</p>
                </div>
              </div>
            </div>
          </section>

          {/* PC Safari */}
          <section className="platform-section pc-safari">
            <div className="platform-header">
              <h2 className="platform-title">💻 Mac（Safari）</h2>
            </div>
            <div className="step-list">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Safariの設定</h3>
                  <p>メニューバーから「Safari」→「設定」をクリック</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Webサイトタブ</h3>
                  <p>「Webサイト」タブを選択</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>位置情報サービス</h3>
                  <p>左側から「位置情報サービス」を選択</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>このサイトを許可</h3>
                  <p>あえるまっぷのサイトを「許可」に設定</p>
                </div>
              </div>
            </div>
          </section>

          {/* トラブルシューティング */}
          <section className="troubleshooting-section">
            <div className="troubleshooting-header">
              <h2 className="troubleshooting-title">🔧 うまくいかない時は</h2>
            </div>
            <div className="troubleshooting-list">
              <div className="troubleshooting-item">
                <div className="troubleshooting-icon">🔄</div>
                <div className="troubleshooting-content">
                  <h3>ブラウザを再起動</h3>
                  <p>設定を変更した後は、一度ブラウザを完全に閉じて再起動してみてください</p>
                </div>
              </div>
              <div className="troubleshooting-item">
                <div className="troubleshooting-icon">📶</div>
                <div className="troubleshooting-content">
                  <h3>Wi-FiやGPSをオン</h3>
                  <p>Wi-Fi、モバイルデータ、GPSがオンになっているか確認してください</p>
                </div>
              </div>
              <div className="troubleshooting-item">
                <div className="troubleshooting-icon">🏠</div>
                <div className="troubleshooting-content">
                  <h3>屋内の場合</h3>
                  <p>建物の中だと位置情報が取得しにくいことがあります。窓際や屋外で試してみてください</p>
                </div>
              </div>
              <div className="troubleshooting-item">
                <div className="troubleshooting-icon">🔒</div>
                <div className="troubleshooting-content">
                  <h3>プライベートモードの場合</h3>
                  <p>プライベートブラウジングモードでは位置情報が制限される場合があります</p>
                </div>
              </div>
            </div>
          </section>

          {/* 注意事項 */}
          <section className="notice-section">
            <div className="notice-header">
              <h2 className="notice-title">⚠️ 大切なお知らせ</h2>
            </div>
            <div className="notice-content">
              <div className="notice-item">
                <h3>🔐 プライバシーについて</h3>
                <p>
                  位置情報は信頼できる人とのみ共有してください。<br />
                  退出するか、3〜6時間経過すると自動で削除されます。
                </p>
              </div>
              <div className="notice-item">
                <h3>🔋 バッテリーについて</h3>
                <p>
                  位置情報の共有は端末のバッテリーを消耗します。<br />
                  長時間の使用時は充電環境をご用意ください。
                </p>
              </div>
            </div>
          </section>

          {/* アクションボタン */}
          <div className="action-buttons">
            <button 
              className="retry-button"
              onClick={handleRetry}
            >
              🔄 設定完了、戻って試してみる
            </button>
            <a 
              href="/"
              className="home-button"
              target="_blank"
              rel="noopener noreferrer"
            >
              🏠 トップページに戻る
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
