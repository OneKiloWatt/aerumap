// src/hooks/useRoomExpiry.ts
import { useState, useEffect } from 'react';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { logger } from '../utils/logger';

interface UseRoomExpiryOptions {
  roomId: string;
  enabled: boolean;
}

interface UseRoomExpiryResult {
  isExpired: boolean;
  expiresAt: Date | null;
  loading: boolean;
  error: string | null;
}

export function useRoomExpiry({ roomId, enabled }: UseRoomExpiryOptions): UseRoomExpiryResult {
  const [isExpired, setIsExpired] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    logger.debug('🔥 useRoomExpiry useEffect 実行開始', { 
      enabled, 
      roomId: roomId ? roomId.substring(0, 4) + '***' : 'なし',
      timestamp: new Date().toISOString()
    });

    // 位置情報が確定していない場合は監視しない
    if (!enabled || !roomId) {
      logger.debug('期限切れ監視スキップ', { enabled, hasRoomId: !!roomId });
      setLoading(false);
      setIsExpired(false);
      setError(null);
      return;
    }

    logger.debug('期限切れ監視開始', { roomId: roomId.substring(0, 4) + '***' });

    // Firestoreからルーム情報をリアルタイム監視
    const roomRef = doc(db, 'rooms', roomId);
    
    const unsubscribe = onSnapshot(
      roomRef,
      (docSnapshot) => {
        if (!docSnapshot.exists()) {
          logger.warn('監視中のルームが存在しません', { roomId: roomId.substring(0, 4) + '***' });
          setError('ルームが見つかりません');
          setIsExpired(true);
          setLoading(false);
          return;
        }

        const data = docSnapshot.data();
        const expiresAtTimestamp = data?.expiresAt as Timestamp;
        
        if (!expiresAtTimestamp) {
          logger.error('ルームにexpiresAtフィールドがありません', { roomId: roomId.substring(0, 4) + '***' });
          setError('ルーム期限情報が不正です');
          setLoading(false);
          return;
        }

        const expiresAtDate = expiresAtTimestamp.toDate();
        const now = new Date();
        const expired = now > expiresAtDate;

        // 🔧 時刻比較の詳細デバッグ
        logger.debug('期限チェック結果（詳細）', {
          roomId: roomId.substring(0, 4) + '***',
          expiresAt: expiresAtDate.toISOString(),
          expiresAtTime: expiresAtDate.getTime(),
          now: now.toISOString(),
          nowTime: now.getTime(),
          expired,
          timeDifference: now.getTime() - expiresAtDate.getTime(),
          remainingMinutes: Math.max(0, Math.floor((expiresAtDate.getTime() - now.getTime()) / (1000 * 60)))
        });

        setExpiresAt(expiresAtDate);
        setIsExpired(expired);
        setError(null);
        setLoading(false);
      },
      (err) => {
        logger.error('期限監視エラー', err);
        // Firestoreエラー時は監視を停止し、期限切れとして扱う
        setError('期限監視に失敗しました');
        setIsExpired(true);
        setLoading(false);
      }
    );

    // 🔧 定期的な期限チェック（1分おき）
    const checkInterval = setInterval(() => {
      if (expiresAt) {
        const now = new Date();
        const expired = now > expiresAt;
        
        logger.debug('定期期限チェック実行', { 
          roomId: roomId.substring(0, 4) + '***',
          now: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
          expired
        });
        
        if (expired && !isExpired) {
          logger.warn('定期チェックで期限切れを検出', {
            roomId: roomId.substring(0, 4) + '***',
            expiresAt: expiresAt.toISOString(),
            now: now.toISOString()
          });
          setIsExpired(true);
        }
      }
    }, 30 * 1000); // 30秒おき（期限切れ検出を早める）

    // クリーンアップ
    return () => {
      logger.debug('期限切れ監視終了', { roomId: roomId.substring(0, 4) + '***' });
      unsubscribe();
      clearInterval(checkInterval);
    };
  }, [roomId, enabled, Math.floor(Date.now() / 30000)]); // 🔥 30秒ごとに強制再実行

  return {
    isExpired,
    expiresAt,
    loading,
    error
  };
}
