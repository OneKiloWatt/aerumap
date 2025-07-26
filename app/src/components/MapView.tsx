import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import './MapView.css';
import { useGeolocation } from '../hooks/useGeolocation';
import { useLocationSharing } from '../hooks/useLocationSharing';
import { useMyMemberInfo } from '../hooks/useMyMemberInfo';
import { useToast } from '../hooks/useToast';
import { testFirestoreConnection, updateMyMessage, updateMyNickname } from '../api/locationApi';
import { exitRoom } from '../api/exitRoom';
import { logger } from '../utils/logger';
import ToastContainer from './ToastContainer';

// 型定義
interface MarkerData {
  id: string;
  nickname: string;
  message?: string;
  lat: number;
  lng: number;
  isMe: boolean;
  distance?: string;
}

interface MapViewProps {
  roomId?: string; // roomIdを追加
  onShareClick?: () => void;
  onMapReady?: () => void;
}

// カスタムアイコン設定（文字表示）
const createCustomIcon = (isMe: boolean, nickname: string) => {
  const displayText = isMe ? 'ME' : nickname.charAt(0);
  
  return L.divIcon({
    className: `custom-marker ${isMe ? 'marker-me' : 'marker-other'}`,
    html: `<div class="marker-content">${displayText}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

export default function MapView(props: MapViewProps = {}) {
  logger.debug('MapView コンポーネント開始');
  
  const { roomId, onShareClick, onMapReady } = props;
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo, toasts, removeToast } = useToast();
  const [showMenu, setShowMenu] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [editingMessage, setEditingMessage] = useState('');
  const [editingNickname, setEditingNickname] = useState('');
  const [messageLoading, setMessageLoading] = useState(false);
  const [nicknameLoading, setNicknameLoading] = useState(false);
  const [exitLoading, setExitLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  
  // 地図インスタンス参照用
  const mapRef = React.useRef<L.Map | null>(null);
  
  // 位置情報フック（フォールバック位置無効化）
  logger.debug('useGeolocation フック呼び出し開始');
  
  // オプションをメモ化して無限ループを防ぐ（フォールバック位置削除）
  const geolocationOptions = useMemo(() => ({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000,
    watchPosition: false,
    // fallbackPosition を完全削除（間違った位置情報の送信を防ぐ）
  }), []);
  
  const { position, loading, error } = useGeolocation(geolocationOptions);
  
  // 位置情報共有フック
  const { 
    otherUsers, 
    isSharing, 
    lastSentAt, 
    error: sharingError 
  } = useLocationSharing({
    roomId: roomId || '',
    enabled: !!roomId && !!position && !loading, // positionがある場合のみ有効化
    position
  });

  // 自分のメンバー情報取得フック
  const { 
    memberInfo: myMemberInfo, 
    loading: memberLoading, 
    error: memberError 
  } = useMyMemberInfo(roomId || '');
  
  // 位置情報は機密情報なので本番では詳細を出さない
  logger.debug('位置情報状態', { 
    hasPosition: !!position, 
    loading, 
    hasError: !!error,
    isSharing,
    otherUsersCount: otherUsers.length,
    hasMyMemberInfo: !!myMemberInfo,
    memberLoading
  });

  // リアルタイム通知用：前回のotherUsers状態を記録
  const prevOtherUsersRef = React.useRef<typeof otherUsers>([]);
  const isInitialLoadRef = React.useRef(true); // 初回ロード判定
  
  // otherUsersの変化を監視してリアルタイム通知
  React.useEffect(() => {
    if (!isSharing || !myMemberInfo) return; // 自分が参加してない時は通知しない
    
    const prevUsers = prevOtherUsersRef.current;
    const currentUsers = otherUsers;
    
    // デバッグログ：状態変化を詳細記録
    logger.debug('otherUsers変化検出', {
      prevCount: prevUsers.length,
      currentCount: currentUsers.length,
      isInitialLoad: isInitialLoadRef.current,
      prevUsers: prevUsers.map(u => ({ uid: u.uid.substring(0, 4) + '***', nickname: u.nickname, message: u.message })),
      currentUsers: currentUsers.map(u => ({ uid: u.uid.substring(0, 4) + '***', nickname: u.nickname, message: u.message }))
    });
    
    // 初回ロード時のみスキップ（その後の変化は全て通知）
    if (isInitialLoadRef.current) {
      prevOtherUsersRef.current = currentUsers;
      isInitialLoadRef.current = false;
      logger.debug('初回ロード完了、次回から通知開始');
      return;
    }
    
    // 新規参加者を検出
    const newUsers = currentUsers.filter(current => 
      !prevUsers.some(prev => prev.uid === current.uid)
    );
    
    // 退出者を検出
    const leftUsers = prevUsers.filter(prev => 
      !currentUsers.some(current => current.uid === prev.uid)
    );
    
    // メッセージ更新者を検出
    const messageUpdatedUsers = currentUsers.filter(current => {
      const prevUser = prevUsers.find(prev => prev.uid === current.uid);
      if (!prevUser) return false;
      
      const messageChanged = prevUser.message !== current.message;
      logger.debug('メッセージ変更チェック', {
        uid: current.uid.substring(0, 4) + '***',
        nickname: current.nickname,
        prevMessage: prevUser.message,
        currentMessage: current.message,
        changed: messageChanged
      });
      
      return messageChanged;
    });
    
    logger.debug('変化検出結果', {
      newUsers: newUsers.length,
      leftUsers: leftUsers.length,
      messageUpdatedUsers: messageUpdatedUsers.length
    });
    
    // 新規参加通知
    newUsers.forEach(user => {
      logger.debug('新規参加者検出 → 通知表示', { nickname: user.nickname });
      showInfo(`${user.nickname}さんが参加しました 👋`, { duration: 4000 });
    });
    
    // 退出通知
    leftUsers.forEach(user => {
      logger.debug('退出者検出 → 通知表示', { nickname: user.nickname });
      showInfo(`${user.nickname}さんが退出しました 👋`, { duration: 4000 });
    });
    
    // メッセージ更新通知
    messageUpdatedUsers.forEach(user => {
      logger.debug('メッセージ更新検出 → 通知表示', { 
        nickname: user.nickname, 
        newMessage: user.message 
      });
      
      const messageText = user.message 
        ? `${user.nickname}さんがメッセージを更新しました：「${user.message}」`
        : `${user.nickname}さんがメッセージを更新しました`;
        
      showInfo(messageText, { duration: 5000 });
    });
    
    // 現在の状態を記録
    prevOtherUsersRef.current = currentUsers;
    
  }, [otherUsers, isSharing, myMemberInfo, showInfo]);

  // 地図読み込み完了時の処理
  React.useEffect(() => {
    if (!loading && position && !mapReady) {
      logger.debug('地図読み込み完了処理開始');
      setMapReady(true);
      if (onMapReady) {
        logger.debug('onMapReady コールバック実行');
        onMapReady();
      }
    }
  }, [loading, position, mapReady, onMapReady]);

/*
  // Firestore接続テスト（デバッグ用）
  React.useEffect(() => {
    if (roomId && position && !loading) {
      logger.debug('Firestore接続テスト実行');
      testFirestoreConnection(roomId);
    }
  }, [roomId, position, loading]);
*/
// Firestore接続テスト（デバッグ用）
React.useEffect(() => {
  if (roomId && position && !loading) {
    logger.debug('Firestore接続テスト実行');
    
    // 詳細デバッグを直接実行
    const debugFirestore = async () => {
      console.log('🚨 MapView内デバッグ開始');
      
      try {
        const { auth, db } = await import('../firebase');
        const { doc as firestoreDoc, setDoc, getDoc } = await import('firebase/firestore');
        
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.error('❌ 未認証ユーザー');
          return;
        }

        console.log('🔍 認証状態:', {
          uid: currentUser.uid,
          isAnonymous: currentUser.isAnonymous,
          projectId: db.app.options.projectId
        });

        // 1. 最小限の書き込みテスト
        console.log('📝 位置情報書き込みテスト開始...');
        const locationRef = firestoreDoc(db, `rooms/${roomId}/locations`, currentUser.uid);
        
        await setDoc(locationRef, {
          lat: position[0],
          lng: position[1],
          updatedAt: new Date(),
          test: true
        }, { merge: true });
        
        console.log('✅ 位置情報書き込みテスト成功！');

        // 2. 読み取りテスト
        console.log('📖 位置情報読み取りテスト開始...');
        const readResult = await getDoc(locationRef);
        
        if (readResult.exists()) {
          console.log('✅ 位置情報読み取りテスト成功！', readResult.data());
        } else {
          console.log('❌ ドキュメントが見つかりません');
        }

        // 3. メンバー情報確認
        console.log('👤 メンバー情報確認開始...');
        const memberRef = firestoreDoc(db, `rooms/${roomId}/members`, currentUser.uid);
        const memberResult = await getDoc(memberRef);
        
        if (memberResult.exists()) {
          console.log('✅ メンバー情報確認成功！', memberResult.data());
        } else {
          console.log('❌ メンバー情報が見つかりません！これが問題の原因です');
        }

        console.log('🎉 すべてのテスト完了');

      } catch (error: any) {
        console.error('🚨 デバッグエラー発生:', error);
        console.error('エラー詳細:', {
          message: error?.message,
          code: error?.code,
          stack: error?.stack
        });
      }
    };

    debugFirestore();
  }
}, [roomId, position, loading]);

  // 実際のマーカーデータ（実データ）
  const markers: MarkerData[] = useMemo(() => {
    const markerList: MarkerData[] = [];

    // 自分のマーカー（実際のニックネーム使用）
    if (position && myMemberInfo) {
      markerList.push({
        id: 'me',
        nickname: myMemberInfo.nickname,
        message: myMemberInfo.message || '現在地',
        lat: position[0],
        lng: position[1],
        isMe: true
      });
      
      logger.debug('自分のマーカー作成', {
        nickname: myMemberInfo.nickname,
        hasMessage: !!myMemberInfo.message
      });
    } else if (position && !myMemberInfo && !memberLoading) {
      // フォールバック：メンバー情報がない場合
      markerList.push({
        id: 'me',
        nickname: '自分',
        message: '現在地',
        lat: position[0],
        lng: position[1],
        isMe: true
      });
      
      logger.debug('自分のマーカー作成（フォールバック）');
    }

    // 他のユーザーのマーカー
    otherUsers.forEach(user => {
      markerList.push({
        id: user.uid,
        nickname: user.nickname,
        message: user.message,
        lat: user.lat,
        lng: user.lng,
        isMe: false,
        distance: user.distance
      });
    });

    return markerList;
  }, [position, otherUsers, myMemberInfo, memberLoading]);

  const handleFitBounds = () => {
    logger.debug('現在位置ボタン押下', { markersCount: markers.length });
    
    if (!mapRef.current) {
      logger.warn('地図インスタンスが見つかりません');
      showError('地図の操作に失敗しました。ページを再読み込みしてください。');
      return;
    }

    if (markers.length === 0) {
      logger.warn('マーカーが存在しません');
      showInfo('まだ誰も参加していないようです 🤔');
      return;
    }

    try {
      // 全マーカーの座標を取得
      const coordinates: [number, number][] = markers.map(marker => [marker.lat, marker.lng]);
      
      logger.debug('座標計算', { 
        coordinates: coordinates.map(coord => ({ lat: coord[0], lng: coord[1] }))
      });

      if (coordinates.length === 1) {
        // マーカーが1つだけの場合：適切なズームレベルで中央表示
        const [lat, lng] = coordinates[0];
        mapRef.current.setView([lat, lng], 16, { animate: true, duration: 1.0 });
        
        logger.debug('単一マーカー中央表示', { lat, lng, zoom: 16 });
        showInfo('現在位置に移動しました 📍');
      } else {
        // 複数マーカーの場合：全てが収まるようにfitBounds
        const bounds = L.latLngBounds(coordinates);
        
        // 適度な余白を追加（型安全な定義）
        const paddingOptions: L.FitBoundsOptions = {
          paddingTopLeft: [50, 100] as [number, number], // 上部ヘッダー分の余白
          paddingBottomRight: [50, 50] as [number, number], // 下部ボタン分の余白
          animate: true,
          duration: 1.0,
          maxZoom: 18 // 最大ズームレベル制限
        };
        
        mapRef.current.fitBounds(bounds, paddingOptions);
        
        logger.debug('複数マーカーfitBounds', { 
          markerCount: coordinates.length,
          bounds: bounds.toBBoxString()
        });
        showInfo(`全員の位置を表示しました（${coordinates.length}人） 👥`);
      }
    } catch (error) {
      logger.error('地図移動エラー', error);
      showError('地図の移動中にエラーが発生しました。');
    }
  };

  const handleShare = () => {
    // 実際のルームの招待URLを生成
    const roomUrl = roomId 
      ? `${window.location.origin}/room/${roomId}`
      : `${window.location.origin}/room/ABC123`; // フォールバック
    
    logger.debug('共有ボタン押下');
    
    navigator.clipboard.writeText(roomUrl).then(() => {
      showSuccess('招待リンクをコピーしました！みんなに送ってね 📋');
    }).catch(() => {
      showError('コピーに失敗しました。ブラウザの設定をご確認ください。');
    });
    
    // 親コンポーネントに共有ボタンが押されたことを通知
    if (onShareClick) {
      logger.debug('onShareClick コールバック実行');
      onShareClick();
    }
  };

  const handleMenuToggle = () => {
    logger.debug('メニューボタン押下', { newShowMenu: !showMenu });
    setShowMenu(!showMenu);
  };

  const handleEditMessage = () => {
    logger.debug('メッセージ編集ボタン押下');
    // 現在のメッセージを取得してモーダルに設定
    const currentMessage = myMemberInfo?.message || '';
    setEditingMessage(currentMessage);
    
    // ポップアップを閉じてからモーダル表示
    setTimeout(() => {
      setShowMessageModal(true);
    }, 100);
  };

  const handleMessageSave = async () => {
    if (!roomId) {
      logger.error('roomId が存在しません');
      showError('ルームIDが見つかりません。ページを再読み込みしてください。');
      return;
    }

    logger.debug('メッセージ保存開始', { messageLength: editingMessage.length });
    setMessageLoading(true);

    try {
      const success = await updateMyMessage(roomId, editingMessage);
      
      if (success) {
        logger.debug('メッセージ更新成功');
        setShowMessageModal(false);
        showSuccess('ひとことを更新しました！ 💬');
      } else {
        logger.error('メッセージ更新失敗');
        showError('メッセージの更新に失敗しました。もう一度お試しください。');
      }
    } catch (error) {
      logger.error('メッセージ更新エラー', error);
      showError('通信エラーが発生しました。ネットワーク環境をご確認ください。');
    } finally {
      setMessageLoading(false);
    }
  };

  const handleMessageCancel = () => {
    logger.debug('メッセージ編集キャンセル');
    setShowMessageModal(false);
    setEditingMessage('');
  };

  const handleEditNickname = () => {
    logger.debug('ニックネーム編集ボタン押下');
    // 現在のニックネームを取得してモーダルに設定
    const currentNickname = myMemberInfo?.nickname || '';
    setEditingNickname(currentNickname);
    setShowMenu(false);
    setShowNicknameModal(true);
  };

  const handleNicknameSave = async () => {
    if (!roomId) {
      logger.error('roomId が存在しません');
      showError('ルームIDが見つかりません。ページを再読み込みしてください。');
      return;
    }

    const trimmedNickname = editingNickname.trim();
    if (!trimmedNickname) {
      showError('ニックネームを入力してください。');
      return;
    }

    if (trimmedNickname.length > 20) {
      showError('ニックネームは20文字以下で入力してください。');
      return;
    }

    logger.debug('ニックネーム保存開始', { nicknameLength: trimmedNickname.length });
    setNicknameLoading(true);

    try {
      const success = await updateMyNickname(roomId, trimmedNickname);
      
      if (success) {
        logger.debug('ニックネーム更新成功');
        setShowNicknameModal(false);
        showSuccess('ニックネームを変更しました！ ✨');
      } else {
        logger.error('ニックネーム更新失敗');
        showError('ニックネームの変更に失敗しました。もう一度お試しください。');
      }
    } catch (error) {
      logger.error('ニックネーム更新エラー', error);
      showError('通信エラーが発生しました。ネットワーク環境をご確認ください。');
    } finally {
      setNicknameLoading(false);
    }
  };

  const handleNicknameCancel = () => {
    logger.debug('ニックネーム編集キャンセル');
    setShowNicknameModal(false);
    setEditingNickname('');
  };

  const handleExitRoom = () => {
    logger.debug('ルーム退出ボタン押下');
    setShowMenu(false);
    setShowExitDialog(true);
  };

  const handleExitConfirm = async () => {
    if (!roomId) {
      logger.error('roomId が存在しません');
      showError('ルームIDが見つかりません。ページを再読み込みしてください。');
      return;
    }

    logger.debug('退出確認ダイアログで確認ボタン押下');
    setExitLoading(true);

    try {
      const result = await exitRoom(roomId);
      
      if (result.success) {
        logger.debug('ルーム退出成功、/goodbye へリダイレクト');
        setShowExitDialog(false);
        showSuccess('ルームから退出しました。おつかれさま！ 👋');
        // 少し遅延してからリダイレクト（トーストを見せるため）
        setTimeout(() => {
          navigate('/goodbye');
        }, 1500);
      } else {
        logger.error('ルーム退出失敗', result.error);
        showError(result.error || '退出に失敗しました。もう一度お試しください。');
      }
    } catch (error) {
      logger.error('ルーム退出処理エラー', error);
      showError('通信エラーが発生しました。ネットワーク環境をご確認ください。');
    } finally {
      setExitLoading(false);
    }
  };

  const handleExitCancel = () => {
    logger.debug('退出確認ダイアログでキャンセル');
    setShowExitDialog(false);
  };

  // 位置情報エラーと読み込み状態の判定（安全性重視）
  logger.debug('位置情報エラー判定デバッグ', {
    hasPosition: !!position,
    loading,
    hasError: !!error,
    errorType: typeof error,
    errorValue: error,
    errorString: String(error)
  });

  // 確実なエラー検出：位置情報が取得できない場合は必ずエラー画面を表示
  const hasLocationError = !!error;
  const shouldShowError = !position || hasLocationError;

  if (loading) {
    logger.debug('位置情報ローディング中を表示');
    return (
      <div className="map-loading">
        <div>地図を読み込み中...</div>
      </div>
    );
  }

  // 位置情報が取得できない場合は確実にエラー画面を表示
  if (shouldShowError) {
    logger.warn('位置情報エラー画面表示', { 
      hasError: !!error, 
      error,
      hasPosition: !!position,
      hasLocationError,
      shouldShowError,
      reason: !position ? 'no_position' : 'has_error'
    });
    return (
      <div className="location-error-container">
        <div className="location-error-content">
          <div className="location-error-icon">📍</div>
          <h2 className="location-error-title">あれれ、今どこにいるかわかんないみたい！</h2>
          <p className="location-error-description">
            <strong>あえるまっぷを使うには、位置情報の共有が必要だよ〜！</strong><br />
            スマホやブラウザの設定をチェックして、もう一回試してみてね💡✨
          </p>
          
          {error && (
            <div className="location-error-detail">
              <strong>エラー詳細：</strong> {String(error)}
            </div>
          )}
          
          <div className="location-error-actions">
            <a 
              href="/no-location" 
              className="location-help-btn"
            >
              📖 位置情報の設定方法を見る
            </a>
            <button 
              className="location-retry-btn"
              onClick={() => window.location.reload()}
            >
              🔄 ページを再読み込み
            </button>
          </div>
          
          <div className="location-error-footer">
            <p>設定が完了したら、ページを再読み込みしてください</p>
          </div>
        </div>
      </div>
    );
  }

  // 位置情報共有エラーの表示
  if (sharingError) {
    logger.warn('位置情報共有エラー', { sharingError });
  }

  // メンバー情報エラーの表示
  if (memberError) {
    logger.warn('メンバー情報取得エラー', { memberError });
  }

  logger.debug('正常な地図をレンダリング', { 
    markersCount: markers.length,
    isSharing,
    hasRoomId: !!roomId,
    hasMyMemberInfo: !!myMemberInfo
  });

  // JSXレンダリング開始ログ
  logger.debug('MapView JSXレンダリング開始');

  return (
    <div className="map-container">
      {/* メッセージ編集モーダル（最上位に移動） */}
      {showMessageModal && (
        <div 
          className="message-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.4)',
            zIndex: 1500,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            boxSizing: 'border-box'
          }}
        >
          <div className="message-modal">
            <div className="message-modal-header">
              <h3>✏️ ひとこと編集</h3>
            </div>
            <div className="message-modal-content">
              <p>みんなに伝えたいひとことを入力してね！</p>
              <textarea
                className="message-input"
                value={editingMessage}
                onChange={(e) => setEditingMessage(e.target.value)}
                placeholder="例：電車で向かってます🚃、ちょっと遅れるかも🙏"
                maxLength={100}
                rows={3}
                disabled={messageLoading}
              />
              <div className="message-counter">
                {editingMessage.length}/100文字
              </div>
            </div>
            <div className="message-modal-buttons">
              <button 
                className="message-cancel-btn" 
                onClick={handleMessageCancel}
                disabled={messageLoading}
              >
                やめる
              </button>
              <button 
                className="message-save-btn" 
                onClick={handleMessageSave}
                disabled={messageLoading}
              >
                {messageLoading ? '保存中...' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ニックネーム編集モーダル */}
      {showNicknameModal && (
        <div 
          className="message-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.4)',
            zIndex: 1500,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            boxSizing: 'border-box'
          }}
        >
          <div className="message-modal">
            <div className="message-modal-header">
              <h3>✏️ 名前を変更</h3>
            </div>
            <div className="message-modal-content">
              <p>新しいニックネームを入力してね！</p>
              <input
                type="text"
                className="message-input"
                value={editingNickname}
                onChange={(e) => setEditingNickname(e.target.value)}
                placeholder="例：ぷるぷるペンギン、たい焼き道場"
                maxLength={20}
                disabled={nicknameLoading}
                style={{ resize: 'none', height: 'auto', minHeight: '40px' }}
              />
              <div className="message-counter">
                {editingNickname.length}/20文字
              </div>
            </div>
            <div className="message-modal-buttons">
              <button 
                className="message-cancel-btn" 
                onClick={handleNicknameCancel}
                disabled={nicknameLoading}
              >
                やめる
              </button>
              <button 
                className="message-save-btn" 
                onClick={handleNicknameSave}
                disabled={nicknameLoading}
              >
                {nicknameLoading ? '変更中...' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 実際の地図 */}
      <MapContainer
        {...({ center: position } as any)}
        {...({ zoom: 16 } as any)}
        style={{ height: '100%', width: '100%' }}
        {...({ zoomControl: false } as any)}
        {...({ whenReady: (e: any) => {
          mapRef.current = e.target;
          logger.debug('地図インスタンス取得完了');
        } } as any)}
      >
        <TileLayer
          {...({ url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" } as any)}
          {...({ attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' } as any)}
        />
        
        {/* マーカー表示 */}
        {markers.map(marker => (
          <Marker
            key={marker.id}
            {...({ position: [marker.lat, marker.lng] } as any)}
            {...({ icon: createCustomIcon(marker.isMe, marker.nickname) } as any)}
          >
            <Popup>
              <div className="popup-content-leaflet">
                <div className="popup-nickname">
                  {marker.isMe ? `${marker.nickname}(自分)` : marker.nickname}
                </div>
                {marker.message && (
                  <div className="popup-message">{marker.message}</div>
                )}
                {marker.distance && (
                  <div className="popup-distance">{marker.distance}</div>
                )}
                <div className="popup-time">14:32更新</div>
                {marker.isMe && (
                  <button 
                    className="edit-message-btn" 
                    onClick={handleEditMessage}
                  >
                    ✏️ ひとこと編集
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* 左上メニューボタン */}
      <button className="menu-button" onClick={handleMenuToggle}>
        ≡
      </button>

      {/* 右上共有ボタン */}
      <button className="share-button" onClick={handleShare}>
        <Share2 color="#8B4513" size={22} strokeWidth={2.5} />
      </button>

      {/* 右下現在位置ボタン */}
      <button className="location-button" onClick={handleFitBounds}>
        <div className="location-icon"></div>
      </button>

      {/* メニューオプション */}
      {showMenu && (
        <div className="menu-overlay" onClick={() => setShowMenu(false)}>
          <div className="menu-dropdown" onClick={e => e.stopPropagation()}>
            <button className="menu-item edit-nickname-btn" onClick={handleEditNickname}>
              ✏️ 名前を変更
            </button>
            <div className="menu-divider"></div>
            <button className="menu-item exit-btn" onClick={handleExitRoom}>
              🚪 ルームから退出する
            </button>
          </div>
        </div>
      )}

      {/* 退出確認ダイアログ（DESIGN.mdルール準拠版） */}
      {showExitDialog && (
        <div className="menu-overlay">
          <div className="exit-dialog">
            <div className="exit-dialog-header">
              <h3>⚠️ ほんとにルームを抜けちゃう？</h3>
            </div>
            <div className="exit-dialog-content">
              <p>ルームから抜けると、あなたの位置はみんなから見えなくなるよ。</p>
              <p><strong>※あとから元に戻すことはできないから注意してね！</strong></p>
            </div>
            <div className="exit-dialog-buttons">
              <button 
                className="exit-cancel-btn" 
                onClick={handleExitCancel}
                disabled={exitLoading}
              >
                やっぱりやめる
              </button>
              <button 
                className="exit-confirm-btn" 
                onClick={handleExitConfirm}
                disabled={exitLoading}
              >
                {exitLoading ? '抜けてる...' : 'うん、抜ける'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* トースト通知システム */}
      <ToastContainer 
        toasts={toasts} 
        onRemove={removeToast} 
      />
    </div>
  );
}
