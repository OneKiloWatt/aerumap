// src/components/LocationButtonGuide.tsx
import React, { useEffect } from 'react';
import './LocationButtonGuide.css';
import { getImagePath } from '../utils/imageUtils';

type Props = {
  onComplete: () => void;
};

export default function LocationButtonGuide({ onComplete }: Props) {
  
  // 外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // 現在位置ボタンや吹き出し内をクリックした場合は閉じない
      if (target.closest('.location-button') || target.closest('.location-guide-tooltip')) {
        return;
      }
      onComplete();
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [onComplete]);

  // 5秒後に自動で閉じる
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="location-guide-tooltip">
      <div className="location-tooltip-content">
        
        <div className="location-tooltip-character">
          <img src={getImagePath("/images/map.webp")} alt="あいまっぷキャラクター" />
        </div>

        <div className="location-tooltip-message">
          <h3>ここだよ〜📍</h3>
          <p>このボタンで、みんなの場所がぜ〜んぶ見えるようになるよ！</p>
          <p className="location-sub-message">迷子になったら押してみて♪</p>
        </div>

      </div>
      <div className="location-tooltip-arrow"></div>
    </div>
  );
}
