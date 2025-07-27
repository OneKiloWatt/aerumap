// src/components/LoadingComponent.tsx
import React, { useState, useEffect } from 'react';
import { getImagePath } from '../utils/imageUtils';
import './LoadingComponent.css';

interface LoadingComponentProps {
  message?: string;
}

export default function LoadingComponent({ 
  message = "ちょっとまっててねっ！おへやのかざり、がんばってるところ〜🎀✨" 
}: LoadingComponentProps) {
  const [dots, setDots] = useState('');

  // ドットアニメーション: . → .. → ... → 繰り返し
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) {
          return '.';
        }
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-container">
      {/* メイン画像 */}
      <div className="loading-image-wrapper">
        <img 
          src={getImagePath("/images/nowloading.png")} 
          alt="読み込み中" 
          className="loading-image"
        />
      </div>

      {/* Now Loading... */}
      <h1 className="loading-title">
        Now Loading{dots}
      </h1>

      {/* メッセージ */}
      <p className="loading-message">
        {message}
      </p>
    </div>
  );
}
