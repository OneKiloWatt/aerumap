// src/api/joinRoom.ts

export type JoinRoomResponse =
  | { success: true; roomId: string; message?: string }
  | { success: false; error: string }

export async function joinRoom(roomId: string, nickname: string): Promise<JoinRoomResponse> {
  const baseUrl = process.env.REACT_APP_API_BASE_URL;

  if (!baseUrl) {
    return { success: false, error: 'API接続先が設定されていません' };
  }

  if (!roomId || roomId.length !== 12) {
    return { success: false, error: 'ルームIDが無効です' };
  }

  if (!nickname || nickname.trim().length === 0) {
    return { success: false, error: 'ニックネームが必要です' };
  }

  if (nickname.length > 50) {
    return { success: false, error: 'ニックネームが長すぎます（50文字以下）' };
  }

  try {
    // Firebase AuthのIDトークンを取得（必須）
    const { auth } = await import('../firebase');
    
    if (!auth.currentUser) {
      return { success: false, error: '認証が必要です' };
    }

    console.log('🔍 joinRoom送信UID:', auth.currentUser.uid);
    const idToken = await auth.currentUser.getIdToken();

    const response = await fetch(`${baseUrl}/joinRoom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ 
        roomId: roomId.trim(), 
        nickname: nickname.trim() 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        success: false, 
        error: errorData.error || `参加失敗 (${response.status})` 
      };
    }

    const data = await response.json();
    
    if (data.success) {
      return { 
        success: true, 
        roomId: data.roomId,
        message: data.message 
      };
    } else {
      return { 
        success: false, 
        error: data.error || '参加に失敗しました' 
      };
    }

  } catch (error) {
    console.error('joinRoom API エラー:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '通信エラー' 
    };
  }
}
