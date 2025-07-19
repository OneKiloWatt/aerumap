// src/pages/RoomPage.tsx
import React, { useState, useEffect } from 'react';
import RoomJoinForm from '../components/RoomJoinForm';
import MapView from '../components/MapView';
import RoomCreatorWelcome from '../components/RoomCreatorWelcome';
import Header from '../components/Header';
import { checkRoom } from '../api/checkRoom';

export default function RoomPage() {
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showCreatorWelcome, setShowCreatorWelcome] = useState(false);
  const [shouldShowWelcome, setShouldShowWelcome] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [roomId, setRoomId] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  // useEffect実行回数カウント（デバッグ用）
  const executeCountRef = React.useRef(0);
  
  useEffect(() => {
    executeCountRef.current += 1;
    console.log(`🔄 useEffect実行回数: ${executeCountRef.current}`);
    
    const searchParams = new URLSearchParams(window.location.search);
    const isCreator = searchParams.get('creator') === 'true';
    
    // URLからroomIdを取得（/room/:roomId形式）
    const pathSegments = window.location.pathname.split('/');
    const currentRoomId = pathSegments[pathSegments.length - 1];
    
    if (!currentRoomId || currentRoomId.length !== 12) {
      setError('無効なルームIDです');
      setIsLoading(false);
      return;
    }

    setRoomId(currentRoomId);

    // 認証状態とUIDを確認
    const { auth } = require('../firebase');
    console.log('🔍 RoomPage認証状態:', {
      currentUser: auth.currentUser?.uid,
      isAnonymous: auth.currentUser?.isAnonymous,
      roomId: currentRoomId
    });

    // ルーム状態をチェック
    checkRoom(currentRoomId).then((res) => {
      console.log('checkRoom結果:', res);
      
      if (!res.ok) {
        setError(res.error);
        setIsLoading(false);
        return;
      }
      
      if (!res.found) {
        setError('ルームが見つからないか期限切れです');
        setIsLoading(false);
        return;
      }
      
      const { expired, isMember } = res.data;
      
      console.log('📊 ルーム状態:', {
        expired,
        isMember,
        isCreator,
        currentUID: auth.currentUser?.uid
      });
      
      if (expired) {
        setError('ルームの有効期限が切れています');
        setIsLoading(false);
        return;
      }

      if (isCreator) {
        // 作成者の場合：地図画面表示 + welcome表示フラグをセット
        console.log('🎯 作成者として処理: showJoinForm=false, shouldShowWelcome=true');
        setShouldShowWelcome(true);
        setShowJoinForm(false);
      } else {
        if (isMember) {
          // 既存メンバーの場合：直接地図画面へ
          console.log('✅ 既存メンバーとして地図画面へ: showJoinForm=false');
          setShowJoinForm(false);
          setShouldShowWelcome(false);
        } else {
          // 新規参加者：ニックネーム入力
          console.log('❓ 新規参加者としてニックネーム入力へ: showJoinForm=true');
          setShowJoinForm(true);
          setShouldShowWelcome(false);
        }
      }
      
      setIsLoading(false);
    }).catch((error) => {
      console.error('checkRoom 呼び出しエラー:', error);
      setError('ルーム確認中にエラーが発生しました');
      setIsLoading(false);
    });
  }, []);
  
  const handleJoinSubmit = (nickname: string) => {
    console.log(`🎉 ルームに参加: ${nickname}`);
    console.log('🔄 setShowJoinForm(false) を実行');
    setShowJoinForm(false);
    console.log('✅ handleJoinSubmit 完了');
  };

  const handleJoinError = (errorMessage: string) => {
    setError(errorMessage);
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

  // エラー状態の場合
  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>エラー</h2>
        <p>{error}</p>
        <button onClick={() => window.location.href = '/'}>
          トップページに戻る
        </button>
      </div>
    );
  }

  // ローディング中
  if (isLoading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>読み込み中...</div>;
  }

  // デバッグ用状態表示（開発時のみ）
  console.log('🎯 RoomPage レンダリング状態:', {
    showJoinForm,
    showCreatorWelcome,
    shouldShowWelcome,
    isLoading,
    error,
    roomId
  });

  return (
    <>
      {/* デバッグ用：実際の表示条件確認 */}
      {console.log('🖥️ レンダリング分岐:', {
        'showJoinForm条件': showJoinForm,
        'RoomJoinForm表示': showJoinForm,
        '地図画面表示': !showJoinForm
      })}
      
      {showJoinForm && (
        <>
          {console.log('📝 RoomJoinForm をレンダリング中')}
          <RoomJoinForm 
            roomId={roomId}
            onSubmit={handleJoinSubmit}
            onError={handleJoinError}
          />
        </>
      )}
      
      {!showJoinForm && (
        <>
          {console.log('🗺️ MapView をレンダリング中')}
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
