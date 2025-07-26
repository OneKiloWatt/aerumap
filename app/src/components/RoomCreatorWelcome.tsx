// src/components/RoomCreatorWelcome.tsx
import React, { useEffect } from 'react';
import './RoomCreatorWelcome.css';
import { getImagePath } from '../utils/imageUtils';

type Props = {
  onComplete: () => void;
};

export default function RoomCreatorWelcome({ onComplete }: Props) {
  
  // 外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // 共有ボタンや吹き出し内をクリックした場合は閉じない
      if (target.closest('.share-button') || target.closest('.creator-tooltip')) {
        return;
      }
      onComplete();
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [onComplete]);

  return (
    <div className="creator-tooltip">
      <div className="tooltip-content">
        
        <div className="tooltip-character">
          <img src={getImagePath("/images/map.webp")} alt="あいまっぷキャラクター" />
        </div>

        <div className="tooltip-message">
          <h3>ルームができたよ✨</h3>
          <p>この共有ボタンから友達にシェアしてね〜！</p>
          <p className="sub-message">みんなをここに呼ぼっ♪</p>
        </div>

      </div>
      <div className="tooltip-arrow"></div>
    </div>
  );
}
