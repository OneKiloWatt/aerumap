// src/components/NicknameForm.tsx
import React, { useState } from 'react';
import './NicknameForm.css';
import { nicknameList } from '../constants/nicknameList';

type Props = {
  onSubmit: (nickname: string, position?: [number, number]) => void;
  onClose: () => void;
};

export default function NicknameForm({ onSubmit, onClose }: Props) {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!nickname.trim()) {
      setError('ニックネームを入力してね〜');
      return;
    }

    setError('');
    setIsSubmitting(true);

    // 🆕 Safari対応：ルーム作成ボタン押下時に位置情報取得を試行
    if (navigator.geolocation) {
      console.log('🧭 NicknameForm: 位置情報取得開始（Safari対応）');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // 位置情報取得成功
          console.log('✅ NicknameForm: 位置情報取得成功', {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          
          // 位置情報と一緒にルーム作成処理を実行
          const coordinates: [number, number] = [position.coords.latitude, position.coords.longitude];
          onSubmit(nickname, coordinates);
        },
        (locationError) => {
          // 位置情報取得失敗
          console.warn('⚠️ NicknameForm: 位置情報取得失敗、ルーム作成は継続', {
            code: locationError.code,
            message: locationError.message
          });
          
          // 失敗時は位置情報なしでルーム作成継続
          onSubmit(nickname);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      );
    } else {
      // Geolocation非対応の場合もルーム作成は継続
      console.warn('⚠️ NicknameForm: Geolocation非対応、ルーム作成は継続');
      onSubmit(nickname);
    }
  };

  const handleRandomGenerate = () => {
    const random = nicknameList[Math.floor(Math.random() * nicknameList.length)];
    setNickname(random);
    setError('');
  };

  return (
    <div className="nickname-form-overlay">
      <div className="nickname-form-container">
        <button 
          className="close-button" 
          onClick={onClose}
          disabled={isSubmitting}
        >
          ×
        </button>
        <h2>最後にニックネームを決めよう</h2>

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

        {error && <div className="error-message">{error}</div>}

        <div className="button-row">
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'ルーム作成中...' : 'ルーム作成'}
          </button>
        </div>
      </div>
    </div>
  );
}
