// src/hooks/useGeolocation.ts
import { useState, useEffect, useRef, useCallback } from 'react';

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
  fallbackPosition?: [number, number]; // オプションとして残すが、デフォルトは undefined
  autoStart?: boolean; // 🆕 自動開始するかどうか
}

interface UseGeolocationReturn {
  position: [number, number] | null;
  loading: boolean;
  error: string | null;
  startGeolocation: () => void; // 🆕 手動開始
  stopGeolocation: () => void;  // 🆕 手動停止
  retryGeolocation: () => void; // 🆕 再取得
}

export function useGeolocation(options: UseGeolocationOptions = {}): UseGeolocationReturn {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false); // 🔧 初期値をfalseに変更（自動開始しないため）
  const [error, setError] = useState<string | null>(null);
  
  const watchIdRef = useRef<number | null>(null);

  const { 
    enableHighAccuracy = true, 
    timeout = 10000, 
    maximumAge = 5000, // 🔧 60秒 → 5秒に短縮
    watchPosition = true,
    fallbackPosition,
    autoStart = true // 🆕 デフォルトで自動開始（既存の挙動を維持）
  } = options;

  // 🆕 位置情報取得を手動で開始する関数
  const startGeolocation = useCallback(() => {
    console.log('🧭 useGeolocation: 手動開始', { watchPosition });
    
    if (!navigator.geolocation) {
      console.log('❌ useGeolocation: Geolocation API がサポートされていません');
      setError('位置情報がサポートされていません');
      
      // フォールバック位置が明示的に渡された場合のみ使用
      if (fallbackPosition) {
        console.log('🛡️ useGeolocation: フォールバック位置を使用', fallbackPosition);
        setPosition(fallbackPosition);
      } else {
        console.log('⚠️ useGeolocation: フォールバック位置なし、position は null のまま');
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

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
      }
      setLoading(false);
    };

    const geolocationOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    };

    if (watchPosition) {
      // 位置の変化を継続監視
      console.log('📍 useGeolocation: watchPosition 開始');
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        geolocationOptions
      );
    } else {
      // 1回のみの取得
      console.log('📍 useGeolocation: getCurrentPosition 呼び出し');
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        geolocationOptions
      );
    }
  }, [enableHighAccuracy, timeout, maximumAge, watchPosition, fallbackPosition]);

  // 🆕 位置情報監視を停止する関数
  const stopGeolocation = useCallback(() => {
    if (watchIdRef.current !== null) {
      console.log('🛑 useGeolocation: watchPosition 停止');
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // 🆕 位置情報を再取得する関数
  const retryGeolocation = useCallback(() => {
    console.log('🔄 useGeolocation: 位置情報再取得開始');
    stopGeolocation();
    setPosition(null);
    startGeolocation();
  }, [startGeolocation, stopGeolocation]);

  // 🔧 自動開始のロジック（既存の挙動を維持するため）
  useEffect(() => {
    if (autoStart) {
      console.log('🚀 useGeolocation: 自動開始モード');
      startGeolocation();
    } else {
      console.log('⏸️ useGeolocation: 手動開始モード（自動開始なし）');
    }

    // クリーンアップ関数
    return () => {
      stopGeolocation();
    };
  }, [autoStart, startGeolocation, stopGeolocation]);

  return { 
    position, 
    loading, 
    error, 
    startGeolocation, 
    stopGeolocation, 
    retryGeolocation 
  };
}
