// src/components/NicknameForm.tsx
import React, { useState } from 'react';
import './NicknameForm.css';
import { nicknameList } from '../constants/nicknameList';

type Props = {
  onSubmit: (nickname: string) => void;
  onClose: () => void;
};

export default function NicknameForm({ onSubmit, onClose }: Props) {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!nickname.trim()) {
      setError('ニックネームを入力してね〜');
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
    <div className="nickname-form-overlay">
      <div className="nickname-form-container">
        <button className="close-button" onClick={onClose}>×</button>
        <h2>ニックネームを入力してね</h2>

        <div className="input-with-button">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="例：ギャルマスター"
          />
          <button onClick={handleRandomGenerate}>🎲</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="button-row">
          <button onClick={handleSubmit}>ルーム作成</button>
        </div>
      </div>
    </div>
  );
}

