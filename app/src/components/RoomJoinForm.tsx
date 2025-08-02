// src/components/RoomJoinForm.tsx
import React, { useState } from 'react';
import './RoomJoinForm.css';
import { nicknameList } from '../constants/nicknameList';
import { joinRoom } from '../api/joinRoom';
import { logger } from '../utils/logger';

type Props = {
  roomId: string;
  onSubmit: (nickname: string, position?: [number, number]) => void;
  onError?: (error: string) => void;
};

export default function RoomJoinForm({ roomId, onSubmit, onError }: Props) {
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // レンダリング確認用（デバッグ）
  console.log('📝 RoomJoinForm レンダリング実行中', {
    roomId,
    step,
    nickname: nickname.substring(0, 3) + '...'
  });

  const handleNext = () => {
    if (!nickname.trim()) {
      setError('ニックネームを入力してね');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!agreed) {
      setError('利用規約への同意が必要です');
      return;
    }

    setError(''); // エラーをクリア
    setIsSubmitting(true);
    
    try {
      // 1. joinRoom API を呼び出し
      console.log('ルーム参加API実行開始', { roomId, nickname });
      const result = await joinRoom(roomId, nickname);
      
      if (!result.success) {
        console.error('ルーム参加失敗:', result.error);
        setError(result.error);
        setIsSubmitting(false);
        
        // 親コンポーネントにもエラーを通知（オプション）
        if (onError) {
          onError(result.error);
        }
        return;
      }

      console.log('ルーム参加成功、位置情報取得開始');

      // 2. 位置情報取得を試行（Safari対応のため明示的なユーザーアクション直後）
      if (!navigator.geolocation) {
        console.warn('Geolocation not supported, proceeding to map view');
        onSubmit(nickname); // 位置情報非対応でも地図画面へ（エラー画面が表示される）
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          // 位置情報取得成功
          console.log('位置情報取得成功', {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          
          // 成功時は位置情報と一緒に親に通知
          const coordinates: [number, number] = [position.coords.latitude, position.coords.longitude];
          onSubmit(nickname, coordinates);
        },
        (locationError) => {
          // 位置情報取得失敗
          console.warn('位置情報取得失敗、エラー画面表示へ', {
            code: locationError.code,
            message: locationError.message
          });
          
          // 失敗時は位置情報なしで地図画面へ
          onSubmit(nickname);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      );

    } catch (error) {
      console.error('ルーム参加処理中エラー:', error);
      const errorMessage = '参加処理中にエラーが発生しました';
      setError(errorMessage);
      setIsSubmitting(false);
      
      if (onError) {
        onError(errorMessage);
      }
    }
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
                disabled={isSubmitting}
              />
              <button 
                onClick={handleRandomGenerate}
                disabled={isSubmitting}
              >
                🎲
              </button>
            </div>
            
            <p className="privacy-notice">
              ※プライバシー保護のため、本名や個人を特定できる名前は避けてください
            </p>

            {error && <div className="error-message">{error}</div>}

            <div className="button-row">
              <button 
                onClick={handleNext}
                disabled={isSubmitting}
              >
                次へ
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>⚠️ この招待、知ってる人から送られてきた？</h2>
            
            <div className="warning-content">
              <p>
                <strong>このページのリンクが信頼できる人から送られたものでなければ、参加しないでね！</strong>
              </p>
              <p>
                このルームでは、あなたの現在地がリアルタイムで共有されるよ〜
              </p>
              <p>
                詳しくは<a href="/terms" target="_blank" rel="noopener noreferrer">利用規約</a>へ。
              </p>
            </div>

            <div className="agreement-section">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  disabled={isSubmitting}
                />
                上記に同意する
              </label>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="button-row">
              <button 
                onClick={handleSubmit}
                disabled={!agreed || isSubmitting}
                className={(!agreed || isSubmitting) ? 'disabled' : ''}
              >
                {isSubmitting ? '参加中...' : '参加する'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
