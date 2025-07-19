// src/pages/RoomPage.tsx
import React, { useState, useEffect } from 'react';
import RoomJoinForm from '../components/RoomJoinForm';
import MapView from '../components/MapView';
import RoomCreatorWelcome from '../components/RoomCreatorWelcome';
import Header from '../components/Header';

export default function RoomPage() {
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showCreatorWelcome, setShowCreatorWelcome] = useState(false);
  const [shouldShowWelcome, setShouldShowWelcome] = useState(false); // welcome表示フラグ
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // URLパラメータをチェック
    const searchParams = new URLSearchParams(window.location.search);
    const isCreator = searchParams.get('creator') === 'true';
    
    if (isCreator) {
      // 作成者の場合：地図画面表示 + welcome表示フラグをセット（まだ表示しない）
      setShouldShowWelcome(true);
      setShowJoinForm(false);
    } else {
      // 通常の参加者：ニックネーム入力
      setShowJoinForm(true);
      setShouldShowWelcome(false);
    }
    
    setIsLoading(false);
  }, []);
  
  const handleJoinSubmit = (nickname: string) => {
    console.log(`ルームに参加: ${nickname}`);
    // ここで実際の参加処理を行う
    setShowJoinForm(false);
  };

  const handleMapReady = () => {
    // 地図読み込み完了後、welcome表示フラグがtrueならwelcomeを表示
    if (shouldShowWelcome) {
      setShowCreatorWelcome(true);
    }
  };

  const handleCreatorWelcomeComplete = () => {
    // 吹き出しを閉じる
    setShowCreatorWelcome(false);
    setShouldShowWelcome(false);
    
    // URLからcreatorパラメータを削除
    const url = new URL(window.location.href);
    url.searchParams.delete('creator');
    window.history.replaceState({}, '', url.toString());
  };

  const handleShareClick = () => {
    // 共有ボタンが押されたらツールチップを閉じる
    if (showCreatorWelcome) {
      handleCreatorWelcomeComplete();
    }
  };

  // ローディング中は何も表示しない
  if (isLoading) {
    return <div></div>;
  }

  return (
    <>
      {showJoinForm && (
        <RoomJoinForm 
          onSubmit={handleJoinSubmit}
        />
      )}
      
      {!showJoinForm && (
        <>
          <Header />
          <MapView 
            onShareClick={handleShareClick}
            onMapReady={handleMapReady}
          />
          {showCreatorWelcome && (
            <RoomCreatorWelcome 
              onComplete={handleCreatorWelcomeComplete}
            />
          )}
        </>
      )}
    </>
  );
}