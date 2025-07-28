// src/pages/NotFoundPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
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
          🔍
        </div>

        {/* タイトル */}
        <h1 style={{
          fontSize: '24px',
          color: '#8B4513',
          marginBottom: '12px',
          fontWeight: 'bold'
        }}>
          あれれ？ページが見つからないみたい！
        </h1>

        {/* 説明 */}
        <p style={{
          fontSize: '16px',
          color: '#666',
          lineHeight: '1.5',
          marginBottom: '24px'
        }}>
          アクセスしようとしたページは、<br />
          今はもう使えなくなってるか、間違ってるかも💦
        </p>

        {/* 対処案内 */}
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
            💡 こんなことが考えられるよ
          </h3>
          <ul style={{
            fontSize: '14px',
            color: '#333',
            margin: 0,
            lineHeight: '1.4',
            textAlign: 'left',
            paddingLeft: '16px'
          }}>
            <li>URLが間違ってるかも？（スペルをチェックしてみてね）</li>
            <li>ページが削除されたか、引っ越ししちゃった可能性もあるよ〜</li>
          </ul>
        </div>

        {/* ボタン */}
        <button
          onClick={handleGoHome}
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
            width: '100%'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          🏠 トップページにもどる
        </button>

        {/* 補足説明 */}
        <div style={{
          marginTop: '24px',
          fontSize: '12px',
          color: '#999',
          lineHeight: '1.4'
        }}>
          <p style={{ margin: 0 }}>
            ※ もう一度URLを確認して、<br />
            アクセスし直してみてね！
          </p>
        </div>
      </div>
    </div>
  );
}
