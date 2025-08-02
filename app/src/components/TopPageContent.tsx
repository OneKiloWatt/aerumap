// src/components/TopPageContent.tsx
import React, { useState } from 'react';
import './TopPageContent.css';
import NicknameForm from './NicknameForm';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../api/createRoom';
import { getAuth } from 'firebase/auth';
import { auth } from '../firebase';
import { getImagePath } from '../utils/imageUtils';

export default function TopPageContent() {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  // 🔧 位置情報も受け取るように修正
  const handleNicknameSubmit = async (nickname: string, position?: [number, number]) => {
    try {
      const user = getAuth().currentUser;
      if (!user) throw new Error('未ログイン状態です');
  
      const idToken = await user.getIdToken();
      const roomId = await createRoom(nickname, idToken);
  
      setShowModal(false);
      
      // 🔧 位置情報がある場合はクエリパラメータで渡す
      let url = `/room/${roomId}?creator=true`;
      if (position) {
        const [lat, lng] = position;
        url += `&lat=${lat}&lng=${lng}`;
        console.log('📍 位置情報をMapViewに渡します', { lat, lng });
      }
      
      navigate(url);
    } catch (err) {
      console.error('ルーム作成エラー:', err);
      alert('ルーム作成に失敗しました😭');
    }
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
              <button
                type="button"
                className="cta-button"
                onClick={handleOpenModal}
              >
              ルームを作成する
              </button>
            </div>
            <div className="hero-character">
              <img src={getImagePath("images/map.webp")} alt="地図アプリのイメージ" />
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
              <h3>あえるまっぷなら、そんな煩わしさとサヨナラ</h3>
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
              <div className="step-icon">
                <img 
                  src={getImagePath("/images/steps/step-1-create.png")} 
                  alt="ルーム作成" 
                  width="100" 
                  height="100"
                />
              </div>
              <h3>ルーム作成</h3>
              <p>「ルームを作成する」ボタンをタップして、待ち合わせ用のルームを作成します。</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-icon">
                <img 
                  src={getImagePath("/images/steps/step-2-invite.png")} 
                  alt="友達を招待" 
                  width="100" 
                  height="100"
                />
              </div>
              <h3>友達を招待</h3>
              <p>生成されたURLをLINEやメールで友達に送信。友達はURLをタップするだけで参加完了！</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-icon">
                <img 
                  src={getImagePath("/images/steps/step-3-share.png")} 
                  alt="リアルタイム共有" 
                  width="100" 
                  height="100"
                />
              </div>
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
          <button
            type="button"
            className="cta-button"
            onClick={handleOpenModal}
          >
          ルームを作成する
          </button>
        </div>
      </section>
    </>
  );
}
