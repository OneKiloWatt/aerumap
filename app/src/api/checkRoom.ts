// src/api/checkRoom.ts

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
        console.log('🔍 checkRoom送信UID:', auth.currentUser.uid);
      } else {
        console.log('⚠️ checkRoom: 未認証状態');
      }
    } catch (authError) {
      // 認証エラーは無視（匿名でもcheckRoomは利用可能）
      console.warn('認証トークン取得失敗（無視）:', authError);
    }

    const response = await fetch(`${baseUrl}/checkRoom/${roomId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { ok: false, error: `取得失敗: ${errorText}` };
    }

    const data = await response.json();
    
    // exists=falseの場合は見つからなかった
    if (!data.exists) {
      return { ok: true, found: false };
    }

    return { ok: true, found: true, data };
  } catch (error) {
    console.error('checkRoom API エラー:', error);
    return { ok: false, error: error instanceof Error ? error.message : '通信エラー' };
  }
}
