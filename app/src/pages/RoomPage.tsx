// src/pages/RoomPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import RoomJoinForm from '../components/RoomJoinForm';
import MapView from '../components/MapView';
import RoomCreatorWelcome from '../components/RoomCreatorWelcome';
import LocationButtonGuide from '../components/LocationButtonGuide';
import Header from '../components/Header';
import LoadingComponent from '../components/LoadingComponent';
import { checkRoom } from '../api/checkRoom';
import { logger } from '../utils/logger';
import { useNavigate } from 'react-router-dom';

export default function RoomPage() {
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showCreatorWelcome, setShowCreatorWelcome] = useState(false);
  const [showLocationGuide, setShowLocationGuide] = useState(false);
  const [shouldShowWelcome, setShouldShowWelcome] = useState(false);
  const [shouldShowLocationGuide, setShouldShowLocationGuide] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [roomId, setRoomId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  
  // useEffect実行回数カウント（デバッグ用）
  const executeCountRef = React.useRef(0);
  
  // 動的OGP設定（React 19対応）
  useEffect(() => {
    // タイトル設定
    document.title = 'リアルタイムで合流できる地図を開こう - あえるまっぷ';
    
    // メタタグ更新
    const updateMeta = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    const updateTwitterMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // OGP設定
    updateMeta('og:title', 'リアルタイムで合流できる地図を開こう - あえるまっぷ');
    updateMeta('og:description', '「今どこ？」はもう卒業！すぐに合流できる地図リンク📍');
    updateMeta('og:url', `https://onekilowatt.github.io/aerumap/room/${roomId}`);
    updateMeta('og:image', 'https://onekilowatt.github.io/aerumap/ogp.png');
    updateMeta('og:type', 'website');

    // Twitter Card設定
    updateTwitterMeta('twitter:title', 'リアルタイムで合流できる地図を開こう - あえるまっぷ');
    updateTwitterMeta('twitter:description', '「今どこ？」はもう卒業！すぐに合流できる地図リンク📍');
    updateTwitterMeta('twitter:image', 'https://onekilowatt.github.io/aerumap/ogp.png');

    // クリーンアップ時にデフォルトに戻す
    return () => {
      document.title = 'あえるまっぷ | 友達とリアルタイムで位置を共有できる地図アプリ';
      updateMeta('og:title', 'あえるまっぷ');
      updateMeta('og:description', '「今どこ？」のやり取りを省ける、インストール不要のリアルタイム位置共有アプリ。');
      updateMeta('og:url', 'https://onekilowatt.github.io/aerumap/');
    };
  }, [roomId]);
  
  useEffect(() => {
    executeCountRef.current += 1;
    console.log(`🔄 useEffect実行回数: ${executeCountRef.current}`);
    
    const searchParams = new URLSearchParams(window.location.search);
    const isCreator = searchParams.get('creator') === 'true';
    
    // URLからroomIdを取得（/room/:roomId形式）
    const pathSegments = window.location.pathname.split('/');
    const currentRoomId = pathSegments[pathSegments.length - 1];
    
    if (!currentRoomId || currentRoomId.length !== 12) {
      // 無効なルームIDも期限切れページにリダイレクト
      logger.warn('無効なルームID形式、期限切れページへリダイレクト', { 
        roomId: currentRoomId,
        length: currentRoomId?.length 
      });
      navigate('/expired', { replace: true });
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
        // 存在しないルームも期限切れページにリダイレクト
        logger.warn('ルームが見つかりません、期限切れページへリダイレクト');
        navigate('/expired', { replace: true });
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
        logger.warn('ルームの有効期限が切れています');
        // 期限切れページにリダイレクト
        navigate('/expired', { replace: true });
        return;
      }

      if (isCreator) {
        if (isMember) {
          // 作成者かつメンバー：地図画面 + welcome表示
          console.log('🎯 作成者（既にメンバー）: 地図画面 + welcome');
          setShouldShowWelcome(true);
          setShouldShowLocationGuide(false);
          setShowJoinForm(false);
        } else {
          // 作成者だがまだメンバーでない：参加フォーム → 地図画面 + welcome
          console.log('🎯 作成者（未メンバー）: 参加フォーム → welcome');
          setShowJoinForm(true);
          setShouldShowWelcome(true); // 参加後にwelcomeを表示
          setShouldShowLocationGuide(false);
        }
      } else {
        if (isMember) {
          // 既存メンバーの場合：直接地図画面へ（ガイドなし）
          console.log('✅ 既存メンバーとして地図画面へ: showJoinForm=false');
          setShowJoinForm(false);
          setShouldShowWelcome(false);
          setShouldShowLocationGuide(false);
        } else {
          // 新規参加者：ニックネーム入力 → 地図画面 + 現在位置ボタンガイド
          console.log('👋 新規参加者としてニックネーム入力へ: showJoinForm=true');
          setShowJoinForm(true);
          setShouldShowWelcome(false);
          setShouldShowLocationGuide(true); // 参加後に現在位置ボタンガイドを表示
        }
      }
      
      setIsLoading(false);
    }).catch((error) => {
      console.error('checkRoom 呼び出しエラー:', error);
      setError('ルーム確認中にエラーが発生しました');
      setIsLoading(false);
    });
  }, [navigate]);
  
  const handleJoinSubmit = useCallback((nickname: string) => {
    logger.success(`ルームに参加: ${nickname}`);
    setShowJoinForm(false);
  }, []);

  const handleJoinError = useCallback((errorMessage: string) => {
    logger.error('ルーム参加エラー', errorMessage);
    setError(errorMessage);
  }, []);

  const handleMapReady = useCallback(() => {
    // 地図読み込み完了後、適切なガイドを表示
    if (shouldShowWelcome) {
      logger.debug('地図読み込み完了、作成者welcome表示');
      setShowCreatorWelcome(true);
    } else if (shouldShowLocationGuide) {
      logger.debug('地図読み込み完了、現在位置ボタンガイド表示');
      setShowLocationGuide(true);
    }
  }, [shouldShowWelcome, shouldShowLocationGuide]);

  const handleCreatorWelcomeComplete = useCallback(() => {
    // 作成者ウェルカム吹き出しを閉じる
    logger.debug('作成者ウェルカム完了');
    setShowCreatorWelcome(false);
    setShouldShowWelcome(false);
    
    // URLからcreatorパラメータを削除
    const url = new URL(window.location.href);
    url.searchParams.delete('creator');
    window.history.replaceState({}, '', url.toString());
  }, []);

  const handleLocationGuideComplete = useCallback(() => {
    // 現在位置ボタンガイドを閉じる
    logger.debug('現在位置ボタンガイド完了');
    setShowLocationGuide(false);
    setShouldShowLocationGuide(false);
  }, []);

  const handleShareClick = useCallback(() => {
    // 共有ボタンが押されたらツールチップを閉じる
    if (showCreatorWelcome) {
      handleCreatorWelcomeComplete();
    }
  }, [showCreatorWelcome, handleCreatorWelcomeComplete]);

  // エラー状態の場合
  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>エラー</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>
          トップページに戻る
        </button>
      </div>
    );
  }

  // ローディング中
  if (isLoading) {
    return <LoadingComponent />;
  }

  // デバッグ用状態表示（開発時のみ）
  logger.debug('RoomPage レンダリング状態', {
    showJoinForm,
    showCreatorWelcome,
    showLocationGuide,
    shouldShowWelcome,
    shouldShowLocationGuide,
    isLoading,
    hasError: !!error
  });

  return (
    <>
      {/* デバッグ用：実際の表示条件確認 */}
      {logger.debug('レンダリング分岐', {
        'showJoinForm条件': showJoinForm,
        'RoomJoinForm表示': showJoinForm,
        '地図画面表示': !showJoinForm
      })}
      
      {showJoinForm && (
        <>
          {logger.debug('RoomJoinForm をレンダリング中')}
          <RoomJoinForm 
            roomId={roomId}
            onSubmit={handleJoinSubmit}
            onError={handleJoinError}
          />
        </>
      )}
      
      {!showJoinForm && (
        <>
          {logger.debug('MapView をレンダリング中')}
          <Header />
          <MapView 
            roomId={roomId}
            onShareClick={handleShareClick}
            onMapReady={handleMapReady}
          />
          {showCreatorWelcome && (
            <RoomCreatorWelcome 
              onComplete={handleCreatorWelcomeComplete}
            />
          )}
          {showLocationGuide && (
            <LocationButtonGuide 
              onComplete={handleLocationGuideComplete}
            />
          )}
        </>
      )}
    </>
  );
}
