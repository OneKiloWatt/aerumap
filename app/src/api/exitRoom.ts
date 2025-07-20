// src/api/exitRoom.ts

import { logger } from '../utils/logger';

export type ExitRoomResponse =
  | { success: true; message?: string }
  | { success: false; error: string }

export async function exitRoom(roomId: string): Promise<ExitRoomResponse> {
  const baseUrl = process.env.REACT_APP_API_BASE_URL;

  if (!baseUrl) {
    return { success: false, error: 'API接続先が設定されていません' };
  }

  if (!roomId || roomId.length !== 12) {
    return { success: false, error: 'ルームIDが無効です' };
  }

  try {
    // Firebase AuthのIDトークンを取得（必須）
    const { auth } = await import('../firebase');
    
    if (!auth.currentUser) {
      return { success: false, error: '認証が必要です' };
    }

    logger.debug('exitRoom API呼び出し開始');
    const idToken = await auth.currentUser.getIdToken();

    const response = await fetch(`${baseUrl}/exitRoom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ 
        roomId: roomId.trim()
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('exitRoom API失敗', { status: response.status });
      return { 
        success: false, 
        error: errorData.error || `退出失敗 (${response.status})` 
      };
    }

    const data = await response.json();
    
    if (data.success) {
      logger.api('exitRoom成功', { 
        hasMessage: !!data.message 
      });
      return { 
        success: true, 
        message: data.message 
      };
    } else {
      logger.error('exitRoom処理失敗', data.error);
      return { 
        success: false, 
        error: data.error || '退出に失敗しました' 
      };
    }

  } catch (error) {
    logger.error('exitRoom通信エラー', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '通信エラー' 
    };
  }
}
