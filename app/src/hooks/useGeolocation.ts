// src/hooks/useGeolocation.ts
import { useState, useEffect } from 'react';

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
  fallbackPosition?: [number, number]; // オプションとして残すが、デフォルトは undefined
}

interface UseGeolocationReturn {
  position: [number, number] | null;
  loading: boolean;
  error: string | null;
}

export function useGeolocation(options: UseGeolocationOptions = {}): UseGeolocationReturn {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { 
    enableHighAccuracy = true, 
    timeout = 10000, 
    maximumAge = 60000,
    watchPosition = true, // 👈 デフォルトで位置監視を有効に
    fallbackPosition // デフォルト値を削除：undefined のまま
  } = options;

  useEffect(() => {
    console.log('🧭 useGeolocation: フック開始', { watchPosition });
    
    if (!navigator.geolocation) {
      console.log('❌ useGeolocation: Geolocation API がサポートされていません');
      setError('位置情報がサポートされていません');
      
      // フォールバック位置が明示的に渡された場合のみ使用
      if (fallbackPosition) {
        console.log('🛡️ useGeolocation: フォールバック位置を使用', fallbackPosition);
        setPosition(fallbackPosition);
      } else {
        console.log('⚠️ useGeolocation: フォールバック位置なし、position は null のまま');
        // position は null のまま → エラー画面表示
      }
      setLoading(false);
      return;
    }

    const handleSuccess = (pos: GeolocationPosition) => {
      const coordinates: [number, number] = [pos.coords.latitude, pos.coords.longitude];
      const accuracy = pos.coords.accuracy;
      console.log('✅ useGeolocation: 位置情報取得成功', {
        coordinates,
        accuracy: `${accuracy}m`,
        timestamp: new Date(pos.timestamp).toLocaleTimeString()
      });
      setPosition(coordinates);
      setError(null);
      setLoading(false);
    };

    const handleError = (err: GeolocationPositionError) => {
      console.error('❌ useGeolocation: 位置情報取得エラー', err);
      let errorMessage = '位置情報の取得に失敗しました';
      
      switch (err.code) {
        case err.PERMISSION_DENIED:
          errorMessage = '位置情報アクセスが拒否されました';
          break;
        case err.POSITION_UNAVAILABLE:
          errorMessage = '位置情報が利用できません';
          break;
        case err.TIMEOUT:
          errorMessage = '位置情報取得がタイムアウトしました';
          break;
      }
      
      setError(errorMessage);
      
      // フォールバック位置が明示的に渡された場合のみ使用
      if (fallbackPosition) {
        console.log('🛡️ useGeolocation: エラー時フォールバック位置を使用', fallbackPosition);
        setPosition(fallbackPosition);
      } else {
        console.log('⚠️ useGeolocation: エラー時フォールバック位置なし、position は null のまま');
        // position は null のまま → エラー画面表示
      }
      setLoading(false);
    };

    const geolocationOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    };

    let watchId: number | null = null;

    if (watchPosition) {
      // 👈 位置の変化を継続監視
      console.log('📍 useGeolocation: watchPosition 開始');
      watchId = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        geolocationOptions
      );
    } else {
      // 従来の1回のみの取得
      console.log('📍 useGeolocation: getCurrentPosition 呼び出し');
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        geolocationOptions
      );
    }

    // クリーンアップ関数
    return () => {
      if (watchId !== null) {
        console.log('🛑 useGeolocation: watchPosition 停止');
        navigator.geolocation.clearWatch(watchId);
      }
    };

  }, [enableHighAccuracy, timeout, maximumAge, watchPosition, fallbackPosition]);

  return { position, loading, error };
}
