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
  startGeolocationDelayed: (delayMs?: number) => void; // 🆕 遅延開始
  stopGeolocation: () => void;  // 🆕 手動停止
  retryGeolocation: () => void; // 🆕 再取得
  forceRetryGeolocation: () => void; // 🆕 強制再取得
}

export function useGeolocation(options: UseGeolocationOptions = {}): UseGeolocationReturn {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false); // 🔧 初期値をfalseに変更（自動開始しないため）
  const [error, setError] = useState<string | null>(null);
  
  const watchIdRef = useRef<number | null>(null);
  const lastRequestTimeRef = useRef<number>(0); // 🆕 最後のリクエスト時間

  const { 
    enableHighAccuracy = true, 
    timeout = 10000, 
    maximumAge = 5000, // 🔧 60秒 → 5秒に短縮
    watchPosition = true,
    fallbackPosition,
    autoStart = true // 🆕 デフォルトで自動開始（既存の挙動を維持）
  } = options;
  
  // 🆕 短時間での重複リクエストを防ぐ関数
  const canMakeRequest = useCallback(() => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTimeRef.current;
    const minInterval = 5000; // 🔧 Firefox・他ブラウザ共通で5秒
    
    if (timeSinceLastRequest < minInterval) {
      console.log(`⏸️ 前回のリクエストから${timeSinceLastRequest}ms、${minInterval}ms未満のため再リクエストをスキップ`);
      return false;
    }
    
    return true;
  }, []);

  // 🆕 位置情報取得を手動で開始する関数
  const startGeolocation = useCallback(() => {
    // 🔧 重複リクエスト防止：5秒以内の再リクエストを防ぐ
    if (!canMakeRequest()) {
      console.log('🔄 重複リクエスト防止のためスキップ');
      return;
    }
    
    console.log('🧭 useGeolocation: 手動開始', { watchPosition });
    lastRequestTimeRef.current = Date.now(); // 🆕 リクエスト時間を記録
    
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
      maximumAge, // 🔧 Firefox・他ブラウザ共通で5秒（元の設定を使用）
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
  }, [enableHighAccuracy, timeout, maximumAge, watchPosition, fallbackPosition, canMakeRequest]);

  // 🆕 遅延付きで位置情報監視を開始する関数（重複ダイアログ防止）
  const startGeolocationDelayed = useCallback((delayMs?: number) => {
    const defaultDelay = 2000; // 🔧 全ブラウザ共通で2秒
    const actualDelay = delayMs || defaultDelay;
    
    console.log(`🕐 useGeolocation: ${actualDelay}ms遅延後に開始`);
    setTimeout(() => {
      startGeolocation();
    }, actualDelay);
  }, [startGeolocation]);

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

  // 🆕 強制的に位置情報を再取得する関数（制限を無視）
  const forceRetryGeolocation = useCallback(() => {
    console.log('💪 useGeolocation: 強制再取得開始（制限無視）');
    lastRequestTimeRef.current = 0; // リクエスト時間をリセット
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
    startGeolocationDelayed, // 🆕 遅延開始関数
    stopGeolocation, 
    retryGeolocation,
    forceRetryGeolocation // 🆕 強制再取得関数
  };
}