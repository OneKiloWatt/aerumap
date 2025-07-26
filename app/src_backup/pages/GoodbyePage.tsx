// src/pages/GoodbyePage.tsx
import React from 'react';

export default function GoodbyePage() {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleCreateNewRoom = () => {
    // 新しいルーム作成ページへ遷移
    window.location.href = '/?create=true';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f2eb, #e8e2d4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        background: 'white',
        borderRadius: '12px',
        padding: '32px 24px',
        textAlign: 'center',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)'
      }}>
        {/* アイコン */}
        <div style={{
          fontSize: '64px',
          marginBottom: '16px'
        }}>
          👋
        </div>

        {/* タイトル */}
        <h1 style={{
          fontSize: '24px',
          color: '#8B4513',
          marginBottom: '12px',
          fontWeight: 'bold'
        }}>
          おつかれさま！
        </h1>

        {/* 説明 */}
        <p style={{
          fontSize: '16px',
          color: '#666',
          lineHeight: '1.5',
          marginBottom: '24px'
        }}>
          ルームから退出したよ！<br />
          位置情報もちゃんと削除されたから安心してね✨
        </p>

        {/* 感謝メッセージ */}
        <div style={{
          background: '#f8f9fa',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          borderLeft: '4px solid #8FBC8F'
        }}>
          <h3 style={{
            fontSize: '16px',
            color: '#8B4513',
            marginBottom: '8px',
            fontWeight: 'bold'
          }}>
            💝 ありがとう！
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#333',
            margin: 0,
            lineHeight: '1.4'
          }}>
            あえるまっぷを使ってくれてありがとう！<br />
            また待ち合わせするときは使ってね〜
          </p>
        </div>

        {/* ボタン */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <button
            onClick={handleCreateNewRoom}
            style={{
              background: 'linear-gradient(45deg, #ff7f7f, #ff6b6b)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            🚀 新しいルームを作る
          </button>

          <button
            onClick={handleGoHome}
            style={{
              background: 'transparent',
              color: '#8B4513',
              border: '2px solid #8B4513',
              borderRadius: '25px',
              padding: '10px 24px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#8B4513';
              e.currentTarget.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#8B4513';
            }}
          >
            🏠 トップページにもどる
          </button>
        </div>

        {/* 補足説明 */}
        <div style={{
          marginTop: '24px',
          fontSize: '12px',
          color: '#999',
          lineHeight: '1.4'
        }}>
          <p style={{ margin: 0 }}>
            ※ あなたの位置情報とメンバー情報は<br />
            完全に削除されました 🗑️✨
          </p>
        </div>
      </div>
    </div>
  );
}
