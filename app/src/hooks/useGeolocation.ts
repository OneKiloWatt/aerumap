// hooks/useGeolocation.ts
import { useState, useEffect, useRef } from 'react';

interface GeolocationState {
  position: [number, number] | null;
  loading: boolean;
  error: string | null;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
  fallbackPosition?: [number, number];
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000,
    watchPosition = false,
    fallbackPosition = [35.6598, 139.7006] // 渋谷駅
  } = options;

  const [state, setState] = useState<GeolocationState>({
    position: null,
    loading: true,
    error: null
  });

  const watchIdRef = useRef<number | null>(null);

  const geolocationOptions: PositionOptions = {
    enableHighAccuracy,
    timeout,
    maximumAge
  };

  const handleSuccess = (position: GeolocationPosition) => {
    const newPosition: [number, number] = [
      position.coords.latitude,
      position.coords.longitude
    ];
    
    setState({
      position: newPosition,
      loading: false,
      error: null
    });
  };

  const handleError = (error: GeolocationPositionError) => {
    let errorMessage = '位置情報を取得できませんでした';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = '位置情報の使用が拒否されました';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = '位置情報が利用できません';
        break;
      case error.TIMEOUT:
        errorMessage = '位置情報の取得がタイムアウトしました';
        break;
    }

    console.error('位置情報取得エラー:', errorMessage, error);
    
    // フォールバック位置を設定
    setState({
      position: fallbackPosition,
      loading: false,
      error: errorMessage
    });
  };

  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      handleError({
        code: 2,
        message: 'Geolocation is not supported'
      } as GeolocationPositionError);
      return;
    }

    setState(prev => ({ ...prev, loading: true }));
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      geolocationOptions
    );
  };

  const startWatching = () => {
    if (!navigator.geolocation) {
      handleError({
        code: 2,
        message: 'Geolocation is not supported'
      } as GeolocationPositionError);
      return;
    }

    if (watchIdRef.current !== null) {
      return; // 既に監視中
    }

    setState(prev => ({ ...prev, loading: true }));
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      geolocationOptions
    );
  };

  const stopWatching = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  useEffect(() => {
    if (watchPosition) {
      startWatching();
    } else {
      getCurrentPosition();
    }

    return () => {
      stopWatching();
    };
  }, [watchPosition]);

  // ページが非表示になったら監視停止、表示されたら再開
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (watchPosition) {
        if (document.hidden) {
          stopWatching();
        } else {
          startWatching();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [watchPosition]);

  return {
    position: state.position,
    loading: state.loading,
    error: state.error,
    getCurrentPosition,
    startWatching,
    stopWatching
  };
}
