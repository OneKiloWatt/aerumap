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
import { testFirestoreConnection, updateMyMessage, updateMyNickname, calculateDistance } from '../api/locationApi';
import { exitRoom } from '../api/exitRoom';
import { logger } from '../utils/logger';
import ToastContainer from './ToastContainer';
import LoadingComponent from './LoadingComponent'; // 👈 LoadingComponent追加

// 型定義
interface MarkerData {
  id: string;
  nickname: string;
  message?: string;
  lat: number;
  lng: number;
  isMe: boolean;
  distance?: string;
  updatedAt: Date; // 👈 更新時刻を追加
}

interface MapViewProps {
  roomId?: string;
  onShareClick?: () => void;
  onMapReady?: () => void;
}

// 時刻フォーマット関数
const formatUpdateTime = (date: Date): string => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return 'たった今更新';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}分前更新`;
  } else if (diffInMinutes < 1440) { // 24時間
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}時間前更新`;
  } else {
    // 24時間以上の場合は時刻を表示
    const timeString = date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    return `${timeString}更新`;
  }
};

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
  // 🔧 プライバシー保護：初期表示位置を新宿駅に設定
  const INITIAL_CENTER: [number, number] = [35.6896, 139.7006]; // 新宿駅
  const [hasMovedToUserLocation, setHasMovedToUserLocation] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  
  // 地図インスタンス参照用
  const mapRef = React.useRef<L.Map | null>(null);
  
  // 地図インスタンス取得用の内部コンポーネント（Edge対応）
  const MapInstanceGetter = () => {
    const map = useMap();
    
    React.useEffect(() => {
      if (map && !mapRef.current) {
        mapRef.current = map;
        logger.debug('地図インスタンス取得完了（useMap使用）');
      }
    }, [map]);
    
    return null;
  };
  
  // 位置情報フック
  logger.debug('useGeolocation フック呼び出し開始');
  
  // オプションをメモ化せずに直接設定（キャッシュ問題回避）
  const geolocationOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000,
    watchPosition: true,
  };
  
  const { position, loading, error } = useGeolocation(geolocationOptions);
  
  // 位置情報共有フック
  const { 
    otherUsers, 
    isSharing, 
    lastSentAt, 
    error: sharingError 
  } = useLocationSharing({
    roomId: roomId || '',
    enabled: !!roomId && !!position && !loading,
    position
  });

  // 自分のメンバー情報取得フック
  const { 
    memberInfo: myMemberInfo, 
    loading: memberLoading, 
    error: memberError 
  } = useMyMemberInfo(roomId || '');
  
  // 位置情報の状態ログ
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
  const isInitialLoadRef = React.useRef(true);
  
  // otherUsersの変化を監視してリアルタイム通知
  React.useEffect(() => {
    if (!isSharing || !myMemberInfo) return;
    
    const prevUsers = prevOtherUsersRef.current;
    const currentUsers = otherUsers;
    
    logger.debug('otherUsers変化検出', {
      prevCount: prevUsers.length,
      currentCount: currentUsers.length,
      isInitialLoad: isInitialLoadRef.current,
      prevUsers: prevUsers.map(u => ({ uid: u.uid.substring(0, 4) + '***', nickname: u.nickname, message: u.message })),
      currentUsers: currentUsers.map(u => ({ uid: u.uid.substring(0, 4) + '***', nickname: u.nickname, message: u.message }))
    });
    
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

  // 🔧 新機能：自分の位置が確定したら地図を移動（ブラウザ互換性対応）
  React.useEffect(() => {
    if (position && !hasMovedToUserLocation) {
      logger.debug('初回位置確定、地図を自分の位置に移動', {
        position: position,
        hasMapRef: !!mapRef.current
      });
      
      // Edgeブラウザ対応：少し遅延を入れて地図インスタンスの準備を待つ
      const moveToUserLocation = () => {
        if (mapRef.current) {
          logger.debug('地図インスタンス確認済み、移動実行');
          mapRef.current.setView(position, 16, { 
            animate: true, 
            duration: 1.5 
          });
          setHasMovedToUserLocation(true);
        } else {
          logger.debug('地図インスタンス未準備、100ms後に再試行');
          // 地図インスタンスがまだ準備できていない場合は少し待って再試行
          setTimeout(moveToUserLocation, 100);
        }
      };
      
      // 初回は即実行、失敗したら遅延再試行
      moveToUserLocation();
    }
  }, [position, hasMovedToUserLocation]);

  // Firestore接続テスト（デバッグ用）
  React.useEffect(() => {
    if (roomId && position && !loading) {
      logger.debug('Firestore接続テスト実行');
      testFirestoreConnection(roomId);
    }
  }, [roomId, position, loading]);

  // マーカーデータに距離と更新時刻を含める
  const markers: MarkerData[] = useMemo(() => {
    const markerList: MarkerData[] = [];
    const now = new Date();

    // 自分のマーカー
    if (position && myMemberInfo) {
      markerList.push({
        id: 'me',
        nickname: myMemberInfo.nickname,
        message: myMemberInfo.message || '現在地',
        lat: position[0],
        lng: position[1],
        isMe: true,
        updatedAt: now
      });
      
      logger.debug('自分のマーカー作成', {
        nickname: myMemberInfo.nickname,
        hasMessage: !!myMemberInfo.message
      });
    } else if (position && !myMemberInfo && !memberLoading) {
      markerList.push({
        id: 'me',
        nickname: '自分',
        message: '現在地',
        lat: position[0],
        lng: position[1],
        isMe: true,
        updatedAt: now
      });
      
      logger.debug('自分のマーカー作成（フォールバック）');
    }

    // 他のユーザーのマーカー（距離計算を正確に行う）
    otherUsers.forEach(user => {
      // 🔧 距離計算：自分の位置が確定している場合のみ再計算
      let distance: string;
      if (position && user.lat && user.lng) {
        distance = calculateDistance(position[0], position[1], user.lat, user.lng);
        logger.debug('距離再計算', {
          nickname: user.nickname,
          myPosition: [position[0], position[1]],
          userPosition: [user.lat, user.lng],
          calculatedDistance: distance
        });
      } else {
        // フォールバック：useLocationSharingで計算された距離をそのまま使用
        distance = user.distance || '計算中';
        logger.debug('距離計算スキップ', {
          nickname: user.nickname,
          reason: !position ? '自分の位置未確定' : '相手の位置不正',
          fallbackDistance: distance
        });
      }

      markerList.push({
        id: user.uid,
        nickname: user.nickname,
        message: user.message,
        lat: user.lat,
        lng: user.lng,
        isMe: false,
        distance: distance,
        updatedAt: user.updatedAt || now
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
      const coordinates: [number, number][] = markers.map(marker => [marker.lat, marker.lng]);
      
      logger.debug('座標計算', { 
        coordinates: coordinates.map(coord => ({ lat: coord[0], lng: coord[1] }))
      });

      if (coordinates.length === 1) {
        const [lat, lng] = coordinates[0];
        mapRef.current.setView([lat, lng], 16, { animate: true, duration: 1.0 });
        
        logger.debug('単一マーカー中央表示', { lat, lng, zoom: 16 });
        showInfo('現在位置に移動しました 📍');
      } else {
        const bounds = L.latLngBounds(coordinates);
        
        const paddingOptions: L.FitBoundsOptions = {
          paddingTopLeft: [50, 100] as [number, number],
          paddingBottomRight: [50, 50] as [number, number],
          animate: true,
          duration: 1.0,
          maxZoom: 18
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
    const basename = process.env.PUBLIC_URL || ''; // GitHub Pages対応
    const roomUrl = roomId 
      ? `${window.location.origin}${basename}/room/${roomId}`
      : `${window.location.origin}${basename}/room/ABC123`;
    
    logger.debug('共有ボタン押下', { roomUrl });
    
    navigator.clipboard.writeText(roomUrl).then(() => {
      showSuccess('招待リンクをコピーしました！みんなに送ってね 📋');
    }).catch(() => {
      showError('コピーに失敗しました。ブラウザの設定をご確認ください。');
    });
    
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
    const currentMessage = myMemberInfo?.message || '';
    setEditingMessage(currentMessage);
    
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

  // 位置情報エラーと読み込み状態の判定
  logger.debug('位置情報エラー判定デバッグ', {
    hasPosition: !!position,
    loading,
    hasError: !!error,
    errorType: typeof error,
    errorValue: error,
    errorString: String(error)
  });

  const hasLocationError = !!error;
  const shouldShowError = !position || hasLocationError;

  if (loading) {
    logger.debug('位置情報ローディング中を表示');
    return (
      <LoadingComponent message="あなたの居場所をさがしてるよ〜📍🔍 ちょっとまっててね！" />
    );
  }

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

  if (sharingError) {
    logger.warn('位置情報共有エラー', { sharingError });
  }

  if (memberError) {
    logger.warn('メンバー情報取得エラー', { memberError });
  }

  logger.debug('正常な地図をレンダリング', { 
    markersCount: markers.length,
    isSharing,
    hasRoomId: !!roomId,
    hasMyMemberInfo: !!myMemberInfo
  });

  logger.debug('MapView JSXレンダリング開始');

  return (
    <div className="map-container">
      {/* メッセージ編集モーダル */}
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
        center={INITIAL_CENTER}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        {/* Edge対応：確実な地図インスタンス取得 */}
        <MapInstanceGetter />
        
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* マーカー表示 */}
        {markers.map(marker => (
          <Marker
            key={`marker-${marker.id}`}
            position={[marker.lat, marker.lng]}
            icon={createCustomIcon(marker.isMe, marker.nickname)}
          >
            <Popup
              autoPan={false}
              closeOnClick={false}
              autoClose={false}
              keepInView={true}
            >
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
                <div className="popup-time">{formatUpdateTime(marker.updatedAt)}</div>
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

      {/* 退出確認ダイアログ */}
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
