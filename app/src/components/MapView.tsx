import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import './MapView.css';
import { useGeolocation } from '../hooks/useGeolocation';
import { useLocationSharing } from '../hooks/useLocationSharing';
import { useMyMemberInfo } from '../hooks/useMyMemberInfo';
import { testFirestoreConnection } from '../api/locationApi';
import { exitRoom } from '../api/exitRoom';
import { logger } from '../utils/logger';

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
  const [showMenu, setShowMenu] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [exitLoading, setExitLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  
  // 位置情報フック
  logger.debug('useGeolocation フック呼び出し開始');
  
  // オプションをメモ化して無限ループを防ぐ
  const geolocationOptions = useMemo(() => ({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000,
    watchPosition: false,
    fallbackPosition: [35.6598, 139.7006] as [number, number] // 渋谷駅
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
    enabled: !!roomId && !!position && !loading,
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

  // Firestore接続テスト（デバッグ用）
  React.useEffect(() => {
    if (roomId && position && !loading) {
      logger.debug('Firestore接続テスト実行');
      testFirestoreConnection(roomId);
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
    // TODO: 全ての人が画面内に収まるように地図の表示範囲を調整する
    // React-LeafletのuseMapフックを使用してマップインスタンスにアクセス
    // markersの座標を元にboundsを計算してfitBounds()を呼び出す
    logger.debug('現在位置ボタン押下');
  };

  const handleShare = () => {
    // 実際のルームの招待URLを生成
    const roomUrl = roomId 
      ? `${window.location.origin}/room/${roomId}`
      : `${window.location.origin}/room/ABC123`; // フォールバック
    
    logger.debug('共有ボタン押下');
    
    navigator.clipboard.writeText(roomUrl).then(() => {
      alert('招待リンクをコピーしました！');
    }).catch(() => {
      alert('コピーに失敗しました');
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

  const handleEditNickname = () => {
    // TODO: ニックネーム編集モーダルを表示
    logger.debug('ニックネーム編集ボタン押下');
    alert('ニックネーム編集機能（未実装）');
    setShowMenu(false);
  };

  const handleExitRoom = () => {
    logger.debug('ルーム退出ボタン押下');
    setShowMenu(false);
    setShowExitDialog(true);
  };

  const handleExitConfirm = async () => {
    if (!roomId) {
      logger.error('roomId が存在しません');
      return;
    }

    logger.debug('退出確認ダイアログで確認ボタン押下');
    setExitLoading(true);

    try {
      const result = await exitRoom(roomId);
      
      if (result.success) {
        logger.debug('ルーム退出成功、/goodbye へリダイレクト');
        setShowExitDialog(false);
        navigate('/goodbye');
      } else {
        logger.error('ルーム退出失敗', result.error);
        alert(result.error || '退出に失敗しました。もう一度お試しください。');
      }
    } catch (error) {
      logger.error('ルーム退出処理エラー', error);
      alert('通信エラーが発生しました。ネットワーク環境をご確認ください。');
    } finally {
      setExitLoading(false);
    }
  };

  const handleExitCancel = () => {
    logger.debug('退出確認ダイアログでキャンセル');
    setShowExitDialog(false);
  };

  if (loading) {
    logger.debug('位置情報ローディング中を表示');
    return (
      <div className="map-loading">
        <div>地図を読み込み中...</div>
      </div>
    );
  }

  if (!position) {
    logger.warn('位置情報取得失敗', { hasError: !!error });
    return (
      <div className="map-loading">
        <div>位置情報を取得できませんでした</div>
        {error && <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>{error}</div>}
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
      {/* 実際の地図 */}
      <MapContainer
        {...({ center: position } as any)}
        {...({ zoom: 16 } as any)}
        style={{ height: '100%', width: '100%' }}
        {...({ zoomControl: false } as any)}
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
                  <button className="edit-message-btn">✏️ メッセージ編集</button>
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
    </div>
  );
}
