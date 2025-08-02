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
      const basename = process.env.PUBLIC_URL || '';
      window.location.href = `${basename}/`; // 単独タブの場合はトップに戻る
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
          
          {/* 📍 簡単な方法（最新ブラウザ共通） */}
          <section className="platform-section quick-method">
            <div className="platform-header" style={{ background: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)' }}>
              <h2 className="platform-title">⚡ 一番簡単な方法（最新ブラウザ）</h2>
            </div>
            <div className="step-list">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>📍 位置情報アイコンを探す</h3>
                  <p><strong>アドレスバーの左側にある📍のようなピンアイコン</strong>をクリック/タップ</p>
                  <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px', margin: '8px 0', border: '1px solid #e9ecef' }}>
                    <small style={{ color: '#666' }}>
                      💡 <strong>Chrome・Edge・Firefox・Safari</strong>で使える方法です！<br/>
                      位置情報が必要なサイトでは自動的にアイコンが表示されます
                    </small>
                  </div>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>✅ 「許可」を選択</h3>
                  <p>ポップアップで「このサイトの位置情報を許可する」または「許可」をクリック/タップ</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>🔄 ページを再読み込み</h3>
                  <p>設定完了後、F5キー（Mac: ⌘+R、スマホ: 更新ボタン）でページを再読み込み</p>
                </div>
              </div>
            </div>
          </section>

          {/* iOS Safari */}
          <section className="platform-section ios-safari">
            <div className="platform-header">
              <h2 className="platform-title">📱 iPhone・iPad（Safari）</h2>
            </div>
            <div className="step-list">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>📍 まず簡単な方法を試す</h3>
                  <p><strong>アドレスバーの📍アイコン</strong>または<strong>「ぁあ」アイコン</strong>をタップ → 「Webサイトの設定」→「位置情報」→「許可」</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>設定アプリを開く</h3>
                  <p>上記で解決しない場合：ホーム画面から「設定」アプリをタップ</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>プライバシーとセキュリティ</h3>
                  <p>「プライバシーとセキュリティ」→「位置情報サービス」をタップ</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>位置情報サービスをオン</h3>
                  <p>一番上の「位置情報サービス」がオンになっているか確認</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">5</div>
                <div className="step-content">
                  <h3>SafariのWebサイト</h3>
                  <p>「SafariのWebサイト」をタップして「このAppの使用中のみ許可」を選択</p>
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
                  <h3>📍 まず簡単な方法を試す</h3>
                  <p><strong>アドレスバーの左側にある📍アイコン</strong>をタップ → 「許可」を選択</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>設定アプリを開く</h3>
                  <p>上記で解決しない場合：ホーム画面から「設定」アプリをタップ</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Chromeアプリの設定</h3>
                  <p>アプリ一覧から「Chrome」をタップ</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>位置情報を許可</h3>
                  <p>「位置情報」をタップして「このAppの使用中のみ許可」を選択</p>
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
                  <h3>📍 まず簡単な方法を試す</h3>
                  <p><strong>アドレスバーの左側にある📍アイコン</strong>をタップ → 「許可」を選択</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Android端末の設定</h3>
                  <p>上記で解決しない場合：「設定」アプリ → 「位置情報」または「ロケーション」をオンにする</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Chromeアプリの権限</h3>
                  <p>「設定」→「アプリ」→「Chrome」→「権限」→「位置情報」で「許可」を選択</p>
                  <div style={{ background: '#e3f2fd', padding: '10px', borderRadius: '6px', margin: '8px 0', fontSize: '14px' }}>
                    <strong>💡 Android 12以降：</strong>「正確な位置情報を使用」もオンにしてください
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Android Firefox */}
          <section className="platform-section android-firefox">
            <div className="platform-header">
              <h2 className="platform-title">🤖 Android（Firefox）</h2>
            </div>
            <div className="step-list">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>📍 まず簡単な方法を試す</h3>
                  <p><strong>アドレスバーの左側にある位置情報アイコン</strong>をタップ → 「許可」を選択</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Firefoxの設定</h3>
                  <p>Firefoxアプリ → 右上の「⋮」→「設定」→「サイトの権限」→「位置情報」で許可</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Android端末の設定</h3>
                  <p>「設定」→「アプリ」→「Firefox」→「権限」→「位置情報」で「許可」を選択</p>
                </div>
              </div>
            </div>
          </section>

          {/* PC Chrome/Edge */}
          <section className="platform-section pc-chrome">
            <div className="platform-header">
              <h2 className="platform-title">💻 パソコン（Chrome・Edge）</h2>
            </div>
            <div className="step-list">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>📍 位置情報アイコンをクリック</h3>
                  <p><strong>アドレスバーの左側にある📍のようなピンアイコン</strong>をクリック</p>
                  <div style={{ background: '#e3f2fd', padding: '12px', borderRadius: '8px', margin: '8px 0', border: '1px solid #bbdefb' }}>
                    <small style={{ color: '#0d47a1' }}>
                      💡 <strong>これが一番簡単！</strong><br/>
                      🔒マークや🌐マークのあたりに位置情報アイコンが表示されます
                    </small>
                  </div>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>✅ 「許可」を選択</h3>
                  <p>ドロップダウンメニューで「許可」を選択</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>🔄 ページを再読み込み</h3>
                  <p>設定変更後、F5キー（Mac: ⌘+R）でページを再読み込み</p>
                </div>
              </div>
            </div>
          </section>

          {/* PC Firefox */}
          <section className="platform-section pc-firefox">
            <div className="platform-header">
              <h2 className="platform-title">💻 パソコン（Firefox）</h2>
            </div>
            <div className="step-list">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>📍 位置情報アイコンをクリック</h3>
                  <p><strong>アドレスバーの左側にある位置情報アイコン</strong>をクリック → 「許可」を選択</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Firefox設定から変更</h3>
                  <p>右上の「≡」→「設定」→「プライバシーとセキュリティ」→「許可設定」→「位置情報」→「設定」</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>位置情報を許可</h3>
                  <p>「位置情報へのアクセスの要求をブロックする」のチェックを外すか、個別サイトで「許可」を設定</p>
                </div>
              </div>
            </div>
          </section>

          {/* Mac Safari */}
          <section className="platform-section pc-safari">
            <div className="platform-header">
              <h2 className="platform-title">💻 Mac（Safari）</h2>
            </div>
            <div className="step-list">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>📍 アドレスバーのアイコン確認</h3>
                  <p>アドレスバーの左側に位置情報のアイコンがあればクリック → 「許可」を選択</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Mac システム設定</h3>
                  <p>Appleメニュー → 「システム設定」→「プライバシーとセキュリティ」→「位置情報サービス」をオン</p>
                  <div style={{ background: '#fff3e0', padding: '10px', borderRadius: '6px', margin: '8px 0', fontSize: '14px' }}>
                    <strong>⚠️ 注意：</strong>古いmacOSでは「システム環境設定」→「セキュリティとプライバシー」
                  </div>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Safariの設定</h3>
                  <p>Safari → 「設定」→「Webサイト」→「位置情報サービス」</p>
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
                <div className="troubleshooting-icon">📍</div>
                <div className="troubleshooting-content">
                  <h3>📍アイコンが見つからない</h3>
                  <p>ページを再読み込みするか、別のタブで開き直してみてください。位置情報が必要なサイトでは通常自動で表示されます</p>
                </div>
              </div>
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
          </div>
        </div>
      </div>
    </main>
  );
}