// src/components/TopPageContent.tsx
import React, { useState } from 'react';
import './TopPageContent.css';
import NicknameForm from './NicknameForm';
import { useNavigate } from 'react-router-dom';

export default function TopPageContent() {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleNicknameSubmit = (nickname: string) => {
    alert(`ルームを作成するよ！ニックネーム：${nickname}`);
    setShowModal(false);
    navigate('/room');
  };

  return (
    <>
      {/* ヒーローセクション */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1>「今どこ？」のやり取り、<br />もうおしまい</h1>
              <p>スマホ一つで、友達の居場所がリアルタイムでわかっちゃう。</p>
              <a
                href="#"
                className="cta-button"
                onClick={(e) => {
                  e.preventDefault();
                  handleOpenModal();
                }}
              >
                ルームを作成する
              </a>
            </div>
            <div className="hero-character">
              <img src="images/map.webp" alt="地図アプリのイメージ" />
            </div>
          </div>
        </div>
      </section>

      {/* ニックネームモーダル */}
      {showModal && (
        <NicknameForm
          onSubmit={handleNicknameSubmit}
          onClose={handleCloseModal}
        />
      )}

      {/* ストーリー説明 */}
      <section className="story">
        <div className="container">
          <div className="story-content">
            <div className="problem">
              <h2>待ち合わせで、こんな経験ありませんか？</h2>
              <p>
                「今どこ？」「もうすぐ着く？」「どの出口にいる？」<br />
                友達との待ち合わせで、何度もLINEでやり取り...。<br />
                お互いイライラして、楽しい時間が台無しになっちゃうこと、ありますよね。
              </p>
            </div>
            <div className="solution">
              <h3>あいまっぷなら、そんな煩わしさとサヨナラ</h3>
              <p>
                リアルタイムで位置情報を共有できるから、<br />
                「今どこ？」の連絡は一切不要。<br />
                待ち合わせがスムーズになって、みんなハッピー！
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 使い方セクション */}
      <section className="how-to-use">
        <div className="container">
          <h2 className="section-title">使い方はカンタン3ステップ</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-icon">📱</div>
              <h3>ルーム作成</h3>
              <p>「ルームを作成する」ボタンをタップして、待ち合わせ用のルームを作成します。</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-icon">📤</div>
              <h3>友達を招待</h3>
              <p>生成されたURLをLINEやメールで友達に送信。友達はURLをタップするだけで参加完了！</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-icon">🗺️</div>
              <h3>リアルタイム共有</h3>
              <p>地図上でお互いの位置がリアルタイムで表示。もう「今どこ？」の連絡は不要です。</p>
            </div>
          </div>
        </div>
      </section>

      {/* 最終CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>今すぐ始めよう</h2>
          <p>
            無料で使えて、アプリのインストールも不要。<br />
            ブラウザがあれば、今すぐ始められます。
          </p>
          <a href="#" className="cta-button" onClick={handleOpenModal}>
            ルームを作成する
          </a>
        </div>
      </section>
    </>
  );
}

