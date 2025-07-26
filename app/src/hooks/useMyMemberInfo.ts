// src/hooks/useMyMemberInfo.ts

import { useState, useEffect } from 'react';
import { doc as firestoreDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { logger } from '../utils/logger';

interface MyMemberInfo {
  nickname: string;
  message?: string;
  joinedAt: Date | null;
}

interface UseMyMemberInfoReturn {
  memberInfo: MyMemberInfo | null;
  loading: boolean;
  error: string | null;
}

export function useMyMemberInfo(roomId: string): UseMyMemberInfoReturn {
  const [memberInfo, setMemberInfo] = useState<MyMemberInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      logger.error('useMyMemberInfo: 未認証ユーザー');
      setError('認証が必要です');
      setLoading(false);
      return;
    }

    logger.debug('自分のメンバー情報取得開始', {
      roomId: roomId.substring(0, 4) + '***',
      uid: currentUser.uid.substring(0, 4) + '***'
    });

    // 自分のメンバー情報をリアルタイム監視
    const memberRef = firestoreDoc(db, `rooms/${roomId}/members`, currentUser.uid);
    
    const unsubscribe = onSnapshot(memberRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const info: MyMemberInfo = {
          nickname: data.nickname || 'Unknown',
          message: data.message || undefined,
          joinedAt: data.joinedAt?.toDate() || null
        };
        
        logger.debug('自分のメンバー情報取得成功', {
          hasNickname: !!info.nickname,
          hasMessage: !!info.message
        });
        
        setMemberInfo(info);
        setError(null);
      } else {
        logger.warn('自分のメンバー情報が存在しません');
        setError('メンバー情報が見つかりません');
        setMemberInfo(null);
      }
      setLoading(false);
    }, (err) => {
      logger.error('自分のメンバー情報取得エラー', err);
      setError('メンバー情報の取得に失敗しました');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  return {
    memberInfo,
    loading,
    error
  };
}
