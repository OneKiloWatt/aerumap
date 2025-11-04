// src/hooks/useGeolocation.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '../utils/logger';

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
  fallbackPosition?: [number, number];
  autoStart?: boolean;
}

interface UseGeolocationReturn {
  position: [number, number] | null;
  loading: boolean;
  error: string | null;
  startGeolocation: () => void;
  startGeolocationDelayed: (delayMs?: number) => void;
  stopGeolocation: () => void;
  retryGeolocation: () => void;
  forceRetryGeolocation: () => void;
}

export function useGeolocation(options: UseGeolocationOptions = {}): UseGeolocationReturn {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const watchIdRef = useRef<number | null>(null);
  const lastRequestTimeRef = useRef<number>(0);
  const isStartingRef = useRef<boolean>(false);

  const { 
    enableHighAccuracy = true, 
    timeout = 10000, 
    maximumAge = 5000,
    watchPosition = true,
    fallbackPosition,
    autoStart = true
  } = options;
  
  const optionsRef = useRef({ enableHighAccuracy, timeout, maximumAge, watchPosition, fallbackPosition });
  useEffect(() => {
    optionsRef.current = { enableHighAccuracy, timeout, maximumAge, watchPosition, fallbackPosition };
  }, [enableHighAccuracy, timeout, maximumAge, watchPosition, fallbackPosition]);
  
  const canMakeRequest = useCallback(() => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTimeRef.current;
    const minInterval = 5000;
    
    if (timeSinceLastRequest < minInterval) {
      logger.debug(`前回のリクエストから${timeSinceLastRequest}ms、${minInterval}ms未満のため再リクエストをスキップ`);
      return false;
    }
    
    return true;
  }, []);

  const stopGeolocation = useCallback(() => {
    if (watchIdRef.current !== null) {
      logger.debug('useGeolocation: watchPosition 停止');
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    isStartingRef.current = false;
    lastRequestTimeRef.current = 0;
    setLoading(false);
  }, []);

  // 🆕 内部用：loadingを変更せずに位置情報取得を開始（フォアグラウンド復帰用）
  const startGeolocationInternal = useCallback((showLoading: boolean) => {
    if (isStartingRef.current) {
      logger.debug('起動処理中のためスキップ');
      return;
    }

    if (watchIdRef.current !== null) {
      logger.debug('既にwatchPosition実行中、スキップ');
      return;
    }

    if (!canMakeRequest()) {
      logger.debug('重複リクエスト防止のためスキップ');
      return;
    }
    
    isStartingRef.current = true;
    logger.debug('useGeolocation: 手動開始', { watchPosition: optionsRef.current.watchPosition, showLoading });
    lastRequestTimeRef.current = Date.now();
    
    if (!navigator.geolocation) {
      logger.debug('useGeolocation: Geolocation API がサポートされていません');
      setError('位置情報がサポートされていません');
      
      if (optionsRef.current.fallbackPosition) {
        logger.debug('useGeolocation: フォールバック位置を使用', optionsRef.current.fallbackPosition);
        setPosition(optionsRef.current.fallbackPosition);
      } else {
        logger.debug('useGeolocation: フォールバック位置なし、position は null のまま');
      }
      if (showLoading) {
        setLoading(false);
      }
      isStartingRef.current = false;
      return;
    }

    if (showLoading) {
      setLoading(true);
    }
    setError(null);

    const handleSuccess = (pos: GeolocationPosition) => {
      const coordinates: [number, number] = [pos.coords.latitude, pos.coords.longitude];
      const accuracy = pos.coords.accuracy;
      logger.debug('useGeolocation: 位置情報取得成功', {
        coordinates,
        accuracy: `${accuracy}m`,
        timestamp: new Date(pos.timestamp).toLocaleTimeString()
      });
      setPosition(coordinates);
      setError(null);
      if (showLoading) {
        setLoading(false);
      }
      isStartingRef.current = false;
    };

    const handleError = (err: GeolocationPositionError) => {
      logger.error('useGeolocation: 位置情報取得エラー', err);
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
      
      if (optionsRef.current.fallbackPosition) {
        logger.debug('useGeolocation: エラー時フォールバック位置を使用', optionsRef.current.fallbackPosition);
        setPosition(optionsRef.current.fallbackPosition);
      } else {
        logger.debug('useGeolocation: エラー時フォールバック位置なし、position は null のまま');
      }
      if (showLoading) {
        setLoading(false);
      }
      isStartingRef.current = false;
    };

    const geolocationOptions = {
      enableHighAccuracy: optionsRef.current.enableHighAccuracy,
      timeout: optionsRef.current.timeout,
      maximumAge: optionsRef.current.maximumAge,
    };

    if (optionsRef.current.watchPosition) {
      logger.debug('useGeolocation: watchPosition 開始');
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        geolocationOptions
      );
    } else {
      logger.debug('useGeolocation: getCurrentPosition 呼び出し');
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        geolocationOptions
      );
    }
  }, [canMakeRequest]);

  const startGeolocation = useCallback(() => {
    startGeolocationInternal(true);
  }, [startGeolocationInternal]);

  const startGeolocationDelayed = useCallback((delayMs?: number) => {
    const defaultDelay = 2000;
    const actualDelay = delayMs || defaultDelay;
    
    logger.debug(`useGeolocation: ${actualDelay}ms遅延後に開始`);
    setTimeout(() => {
      startGeolocation();
    }, actualDelay);
  }, [startGeolocation]);

  const retryGeolocation = useCallback(() => {
    logger.debug('useGeolocation: 位置情報再取得開始');
    stopGeolocation();
    setPosition(null);
    startGeolocation();
  }, [startGeolocation, stopGeolocation]);

  const forceRetryGeolocation = useCallback(() => {
    logger.debug('useGeolocation: 強制再取得開始（制限無視）');
    lastRequestTimeRef.current = 0;
    stopGeolocation();
    setPosition(null);
    startGeolocation();
  }, [startGeolocation, stopGeolocation]);

  useEffect(() => {
    if (autoStart) {
      logger.debug('useGeolocation: 自動開始モード');
      startGeolocation();
    } else {
      logger.debug('useGeolocation: 手動開始モード（自動開始なし）');
    }

    return () => {
      stopGeolocation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  // 🔧 Page Visibility API：loadingを変更しない再起動
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && optionsRef.current.watchPosition) {
        logger.debug('フォアグラウンド復帰検出、位置情報取得を再起動（loading変更なし）');
        
        if (watchIdRef.current !== null) {
          logger.debug('useGeolocation: watchPosition 停止');
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        isStartingRef.current = false;
        lastRequestTimeRef.current = 0;
        
        // 🔧 loadingを変更せずに再起動
        setTimeout(() => {
          startGeolocationInternal(false); // showLoading = false
        }, 500);
      } else if (document.hidden) {
        logger.debug('バックグラウンドに移行、ブラウザの省電力化に任せる');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [startGeolocationInternal]);

  return { 
    position, 
    loading, 
    error, 
    startGeolocation, 
    startGeolocationDelayed,
    stopGeolocation, 
    retryGeolocation,
    forceRetryGeolocation
  };
}