import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Share2 } from 'lucide-react';
import L from 'leaflet';
import './MapView.css';
import { useGeolocation } from '../hooks/useGeolocation';

// 型定義
interface MarkerData {
  id: number;
  nickname: string;
  message?: string;
  lat: number;
  lng: number;
  isMe: boolean;
  distance?: string;
}

interface MapViewProps {
  onShareClick?: () => void;
  onMapReady?: () => void; // 地図読み込み完了を通知
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
  console.log('🗺️ MapView コンポーネント開始');
  
  const { onShareClick, onMapReady } = props;
  const [showMenu, setShowMenu] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  
  // 位置情報フック
  console.log('🧭 useGeolocation フック呼び出し開始');
  
  // オプションをメモ化して無限ループを防ぐ
  const geolocationOptions = useMemo(() => ({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000,
    watchPosition: false,
    fallbackPosition: [35.6598, 139.7006] as [number, number] // 渋谷駅
  }), []);
  
  const { position, loading, error } = useGeolocation(geolocationOptions);
  
  console.log('📍 位置情報状態:', { position, loading, error });

  // 地図読み込み完了時の処理
  React.useEffect(() => {
    if (!loading && position && !mapReady) {
      console.log('🗺️ MapView: 地図読み込み完了処理開始');
      setMapReady(true);
      if (onMapReady) {
        console.log('🔄 MapView: onMapReady コールバック実行');
        onMapReady();
      }
    }
  }, [loading, position, mapReady, onMapReady]);

  // 仮のマーカーデータ（現在地周辺）
  const markers: MarkerData[] = position ? [
    { id: 1, nickname: 'ギャルマスター', message: '渋谷駅にいるよ！', lat: position[0], lng: position[1], isMe: true },
    { id: 2, nickname: 'たろう', message: 'もうすぐ着く〜', lat: position[0] - 0.0003, lng: position[1] + 0.0004, isMe: false, distance: '250m' },
    { id: 3, nickname: 'みゆき', message: 'カフェで待ってます☕', lat: position[0] + 0.0004, lng: position[1] - 0.0004, isMe: false, distance: '180m' }
  ] : [];

  const handleFitBounds = () => {
    // TODO: 全ての人が画面内に収まるように地図の表示範囲を調整する
    // React-LeafletのuseMapフックを使用してマップインスタンスにアクセス
    // markersの座標を元にboundsを計算してfitBounds()を呼び出す
    console.log('🎯 現在位置ボタンが押されました - 全員が画面内に収まるように調整予定');
  };

  const handleShare = () => {
    // TODO: ルームの招待URLをクリップボードにコピー
    const roomUrl = `${window.location.origin}/room/ABC123`; // 仮のURL
    console.log('📋 共有ボタン押下 - URL:', roomUrl);
    
    navigator.clipboard.writeText(roomUrl).then(() => {
      alert('招待リンクをコピーしました！');
    }).catch(() => {
      alert('コピーに失敗しました');
    });
    
    // 親コンポーネントに共有ボタンが押されたことを通知
    if (onShareClick) {
      console.log('🔄 MapView: onShareClick コールバック実行');
      onShareClick();
    }
  };

  const handleMenuToggle = () => {
    console.log('📱 メニューボタン押下 - showMenu:', !showMenu);
    setShowMenu(!showMenu);
  };

  const handleEditNickname = () => {
    // TODO: ニックネーム編集モーダルを表示
    console.log('✏️ ニックネーム編集ボタン押下');
    alert('ニックネーム編集機能（未実装）');
    setShowMenu(false);
  };

  const handleExitRoom = () => {
    console.log('🚪 ルーム退出ボタン押下');
    alert('ルームから退出します');
    setShowMenu(false);
  };

  if (loading) {
    console.log('⏳ MapView: ローディング中を表示');
    return (
      <div className="map-loading">
        <div>地図を読み込み中...</div>
      </div>
    );
  }

  if (!position) {
    console.log('❌ MapView: 位置情報なしエラーを表示', { error });
    return (
      <div className="map-loading">
        <div>位置情報を取得できませんでした</div>
        {error && <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>{error}</div>}
      </div>
    );
  }

  console.log('🎯 MapView: 正常な地図をレンダリング予定', { position, markersCount: markers.length });

  // JSXレンダリング開始ログ
  console.log('🏗️ MapView: JSXレンダリング開始');

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
    </div>
  );
}
