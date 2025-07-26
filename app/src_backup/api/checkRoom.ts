// src/api/checkRoom.ts

import { logger } from '../utils/logger';

export type CheckRoomResponse =
  | { ok: true; found: true; data: { exists: boolean; expired: boolean; isMember: boolean } }
  | { ok: true; found: false }
  | { ok: false; error: string }

export async function checkRoom(roomId: string): Promise<CheckRoomResponse> {
  const baseUrl = process.env.REACT_APP_API_BASE_URL;

  if (!baseUrl) {
    return { ok: false, error: 'API接続先が設定されていません' };
  }

  if (!roomId || roomId.length !== 12) {
    return { ok: false, error: 'ルームIDが無効です' };
  }

  try {
    // Firebase AuthのIDトークンを取得（オプション）
    let headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // 認証済みの場合はトークンを付与
    try {
      const { auth } = await import('../firebase');
      if (auth.currentUser) {
        const idToken = await auth.currentUser.getIdToken();
        headers.Authorization = `Bearer ${idToken}`;
        logger.debug('checkRoom認証付きで送信');
      } else {
        logger.debug('checkRoom未認証で送信');
      }
    } catch (authError) {
      // 認証エラーは無視（匿名でもcheckRoomは利用可能）
      logger.warn('認証トークン取得失敗（無視）', authError);
    }

    const response = await fetch(`${baseUrl}/checkRoom/${roomId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('checkRoom API失敗', { status: response.status });
      return { ok: false, error: `取得失敗: ${errorText}` };
    }

    const data = await response.json();
    
    // exists=falseの場合は見つからなかった
    if (!data.exists) {
      logger.debug('checkRoom: ルーム見つからず');
      return { ok: true, found: false };
    }

    logger.api('checkRoom成功', { 
      exists: data.exists, 
      expired: data.expired, 
      isMember: data.isMember 
    });
    
    return { ok: true, found: true, data };
  } catch (error) {
    logger.error('checkRoom通信エラー', error);
    return { ok: false, error: error instanceof Error ? error.message : '通信エラー' };
  }
}
