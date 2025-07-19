// src/components/RoomJoinForm.tsx
import React, { useState } from 'react';
import './RoomJoinForm.css';
import { nicknameList } from '../constants/nicknameList';

type Props = {
  onSubmit: (nickname: string) => void;
};

export default function RoomJoinForm({ onSubmit }: Props) {
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!nickname.trim()) {
      setError('ニックネームを入力してね');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = () => {
    if (!agreed) {
      setError('利用規約への同意が必要です');
      return;
    }
    onSubmit(nickname);
  };

  const handleRandomGenerate = () => {
    const random = nicknameList[Math.floor(Math.random() * nicknameList.length)];
    setNickname(random);
    setError('');
  };

  return (
    <div className="room-join-form-overlay">
      <div className="room-join-form-container">
        
        {step === 1 ? (
          <>
            <div className="app-subtitle">🔍 友達と位置をシェアできるアプリ</div>
            <h2>あえるまっぷへようこそ</h2>
            
            <div className="welcome-message">
              <p>友達から位置共有のルームに招待されたよ！</p>
              <p>ニックネームを入力して参加すると、お互いの場所がリアルタイムで見えるようになるよ✨</p>
            </div>
            
            <div className="location-notice">
              ※このルームに参加すると、あなたの現在地が他の参加者にリアルタイムで表示されます。
            </div>

            <div className="input-with-button">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="ニックネームを入れてね"
              />
              <button onClick={handleRandomGenerate}>🎲</button>
            </div>
            
            <p className="privacy-notice">
              ※プライバシー保護のため、本名や個人を特定できる名前は避けてください
            </p>

            {error && <div className="error-message">{error}</div>}

            <div className="button-row">
              <button onClick={handleNext}>次へ</button>
            </div>
          </>
        ) : (
          <>
            <h2>⚠️ このリンク、ほんとに信用できる？</h2>
            
            <div className="warning-content">
              <p>
                <strong>このリンクが信用できる人物から送られたものでなければ、絶対に参加しないでください。</strong>
              </p>
              <p>
                位置情報がリアルタイムで共有されることを理解し、信頼できる相手であることを確認してください。
              </p>
              <p>
                詳しくは<a href="/terms" target="_blank" rel="noopener noreferrer">利用規約</a>をご確認ください。
              </p>
            </div>

            <div className="agreement-section">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                上記に同意する
              </label>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="button-row">
              <button 
                onClick={handleSubmit}
                disabled={!agreed}
                className={!agreed ? 'disabled' : ''}
              >
                参加する
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
