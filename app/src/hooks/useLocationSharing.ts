// src/hooks/useLocationSharing.ts

import { useState, useEffect, useRef, useCallback } from 'react';
import { writeLocation, subscribeToLocations, calculateDistance, updateMyMessage, OtherUserLocation } from '../api/locationApi';
import { logger } from '../utils/logger';

interface UseLocationSharingOptions {
  roomId: string;
  enabled: boolean;
  position: [number, number] | null;
}

interface UseLocationSharingReturn {
  otherUsers: OtherUserLocation[];
  isSharing: boolean;
  lastSentAt: Date | null;
  error: string | null;
  startSharing: () => void;
  stopSharing: () => void;
}

export function useLocationSharing(options: UseLocationSharingOptions): UseLocationSharingReturn {
  const { roomId, enabled, position } = options;
  
  const [otherUsers, setOtherUsers] = useState<OtherUserLocation[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [lastSentAt, setLastSentAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 送信制御用のref
  const lastSentPositionRef = useRef<[number, number] | null>(null);
  const lastSentTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  
  // 🔧 修正: 最新の位置情報を参照するためのref
  const positionRef = useRef<[number, number] | null>(position);

  // 🔧 修正: positionが変化したときにrefを更新
  useEffect(() => {
    positionRef.current = position;
    logger.debug('positionRef更新', { 
      hasPosition: !!position,
      position: position ? [position[0], position[1]] : null
    });
  }, [position]);

  /**
   * 位置情報送信判定（シンプル版）
   */
  const shouldSendLocation = useCallback((newPosition: [number, number]): boolean => {
    const now = Date.now();
    const lastSentTime = lastSentTimeRef.current;
    const lastSentPosition = lastSentPositionRef.current;
    
    // 5秒未満の送信は抑制
    if (now - lastSentTime < 5000) {
      return false;
    }
    
    // 初回送信
    if (!lastSentPosition) {
      return true;
    }
    
    // 距離による判定（5m以上移動）
    const distance = calculateDistance(
      lastSentPosition[0], lastSentPosition[1],
      newPosition[0], newPosition[1]
    );
    
    // 5m以上移動した場合
    if (parseFloat(distance.replace('m', '').replace('km', '')) >= 5) {
      return true;
    }
    
    // 30秒経過した場合（強制送信）
    if (now - lastSentTime >= 30000) {
      return true;
    }
    
    return false;
  }, []);

  /**
   * 位置情報送信実行
   */
  const sendLocationIfNeeded = useCallback(async (newPosition: [number, number]) => {
    if (!shouldSendLocation(newPosition)) {
      return;
    }

    logger.debug('位置情報送信開始');
    
    const success = await writeLocation(roomId, newPosition);
    
    if (success) {
      lastSentPositionRef.current = newPosition;
      lastSentTimeRef.current = Date.now();
      setLastSentAt(new Date());
      setError(null);
      logger.debug('位置情報送信成功');
    } else {
      setError('位置情報の送信に失敗しました');
      logger.error('位置情報送信失敗');
    }
  }, [roomId, shouldSendLocation]);

  /**
   * 位置共有開始
   */
  const startSharing = useCallback(() => {
    if (isSharing) {
      logger.debug('位置共有既に開始済み、スキップ');
      return;
    }

    logger.debug('位置共有開始', { roomId, hasPosition: !!position });
    setIsSharing(true);
    setError(null);

    // 他ユーザーの位置情報をリアルタイム監視
    logger.debug('subscribeToLocations呼び出し開始', { roomId });
    
    const unsubscribe = subscribeToLocations(roomId, (locations) => {
      logger.debug('他ユーザー位置情報コールバック実行', { 
        userCount: locations.length,
        users: locations.map(l => ({ uid: l.uid.substring(0, 4) + '***', nickname: l.nickname }))
      });
      
      // 自分の位置情報がある場合、距離を計算
      if (position) {
        const updatedLocations = locations.map(location => ({
          ...location,
          distance: calculateDistance(
            position[0], position[1],
            location.lat, location.lng
          )
        }));
        logger.debug('距離計算完了', { 
          calculatedCount: updatedLocations.length 
        });
        setOtherUsers(updatedLocations);
      } else {
        logger.debug('自分の位置情報なし、距離計算スキップ');
        setOtherUsers(locations);
      }
    });

    unsubscribeRef.current = unsubscribe;
    logger.debug('位置情報リアルタイム監視設定完了');

    // 🔧 修正: 定期送信のためのインターバル（30秒）- positionRefを使用
    intervalRef.current = setInterval(() => {
      const currentPosition = positionRef.current;
      if (currentPosition) {
        logger.debug('定期送信実行', { 
          hasPosition: !!currentPosition,
          position: [currentPosition[0], currentPosition[1]]
        });
        sendLocationIfNeeded(currentPosition);
      } else {
        logger.debug('定期送信スキップ（位置情報なし）');
      }
    }, 30000);

    logger.debug('位置共有開始完了');
  }, [isSharing, roomId, position, sendLocationIfNeeded]);

  /**
   * 位置共有停止
   */
  const stopSharing = useCallback(() => {
    if (!isSharing) return;

    logger.debug('位置共有停止');
    setIsSharing(false);

    // リアルタイム監視を停止
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // 定期送信を停止
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // 状態をリセット
    setOtherUsers([]);
    setError(null);
  }, [isSharing]);

  // position変化時の送信処理
  useEffect(() => {
    if (isSharing && position) {
      sendLocationIfNeeded(position);
    }
  }, [position, isSharing, sendLocationIfNeeded]);

  // enabled状態の変化
  useEffect(() => {
    if (enabled && !isSharing) {
      startSharing();
    } else if (!enabled && isSharing) {
      stopSharing();
    }
  }, [enabled, isSharing, startSharing, stopSharing]);

  // ページ非表示時の処理
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // バックグラウンド時は送信停止
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        logger.debug('位置共有一時停止（バックグラウンド）');
      } else {
        // 🔧 修正: フォアグラウンド復帰時は送信再開 - positionRefを使用
        if (isSharing && !intervalRef.current) {
          intervalRef.current = setInterval(() => {
            const currentPosition = positionRef.current;
            if (currentPosition) {
              sendLocationIfNeeded(currentPosition);
            }
          }, 30000);
          logger.debug('位置共有再開（フォアグラウンド）');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSharing, sendLocationIfNeeded]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      stopSharing();
    };
  }, [stopSharing]);

  return {
    otherUsers,
    isSharing,
    lastSentAt,
    error,
    startSharing,
    stopSharing
  };
}
