import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Request, Response } from 'express';

// Firestore参照
const db = admin.firestore();

/**
 * IP地域チェック（日本国内のみ許可）
 */
function isJapaneseIP(ip: string): boolean {
  // 開発環境やローカルホストは許可
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return true;
  }
  
  // TODO: 本格的なGeoIP判定の実装が必要
  return true; // 一時的に全て許可
}

/**
 * レート制限チェック（同一IPから1分に10回まで）
 */
async function checkRateLimit(ip: string): Promise<boolean> {
  const rateLimitRef = db.collection('rateLimits').doc(`checkRoom_${ip}`);
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

  try {
    const doc = await rateLimitRef.get();
    
    if (!doc.exists) {
      // 初回アクセス
      await rateLimitRef.set({
        count: 1,
        lastReset: now,
        attempts: [now]
      });
      return true;
    }

    const data = doc.data()!;
    const attempts = data.attempts || [];
    
    // 1分以内のアクセス回数をカウント
    const recentAttempts = attempts.filter((timestamp: any) => {
      if (timestamp && timestamp.toDate) {
        return timestamp.toDate() > oneMinuteAgo;
      }
      if (timestamp instanceof Date) {
        return timestamp > oneMinuteAgo;
      }
      return false;
    });

    if (recentAttempts.length >= 10) {
      return false; // レート制限に引っかかった
    }

    // 新しいアクセスを記録（最新50件のみ保持）
    const updatedAttempts = [...recentAttempts, now].slice(-50);
    await rateLimitRef.set({
      count: updatedAttempts.length,
      lastReset: now,
      attempts: updatedAttempts
    });

    return true;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return false; // エラー時は安全側に倒す
  }
}

/**
 * アクセスログの記録
 */
async function logAccess(ip: string, roomId: string, success: boolean, error?: string): Promise<void> {
  try {
    await db.collection('accessLogs').add({
      endpoint: 'checkRoom',
      ip,
      roomId,
      success,
      error: error || null,
      timestamp: new Date(),
      // 30日後に自動削除（TTL）
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
  } catch (logError) {
    console.error('Failed to log access:', logError);
  }
}

/**
 * ルーム存在確認API（セキュア版）
 */
export const checkRoom = functions.https.onRequest(async (req: Request, res: Response) => {
  // CORS設定
  res.set('Access-Control-Allow-Origin', 'https://aimap.app');
  res.set('Access-Control-Allow-Methods', 'GET');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  let roomId = '';

  try {
    console.log('CheckRoom request from IP:', clientIP);

    // roomIdをパスから取得
    roomId = req.path.split('/').pop() || '';
    if (!roomId || roomId.length !== 12) {
      await logAccess(clientIP, roomId, false, 'INVALID_ROOM_ID_FORMAT');
      res.status(400).json({ 
        exists: false, 
        expired: true,
        error: 'Invalid room ID format' 
      });
      return;
    }

    // IP地域チェック（日本国内のみ）
    if (!isJapaneseIP(clientIP)) {
      await logAccess(clientIP, roomId, false, 'IP_REGION_BLOCKED');
      res.status(403).json({ 
        exists: false, 
        expired: true,
        error: 'Access from outside Japan is not allowed' 
      });
      return;
    }

    // レート制限チェック
    const rateLimitPassed = await checkRateLimit(clientIP);
    if (!rateLimitPassed) {
      await logAccess(clientIP, roomId, false, 'RATE_LIMIT_EXCEEDED');
      res.status(429).json({ 
        exists: false, 
        expired: true,
        error: 'Too many requests. Please try again later.' 
      });
      return;
    }

    console.log('Checking room:', roomId);

    // ルームの存在確認（Admin権限で）
    const roomRef = db.collection('rooms').doc(roomId);
    const roomDoc = await roomRef.get();
    
    if (!roomDoc.exists) {
      await logAccess(clientIP, roomId, true, 'ROOM_NOT_FOUND');
      res.status(200).json({
        exists: false,
        expired: true
      });
      return;
    }

    // ルームの有効期限チェック
    const roomData = roomDoc.data()!;
    const expiresAt = roomData.expiresAt;
    const now = new Date();
    
    let expired = false;
    if (expiresAt && expiresAt.toDate) {
      expired = expiresAt.toDate() < now;
    } else if (expiresAt instanceof Date) {
      expired = expiresAt < now;
    }

    console.log(`Room ${roomId}: exists=true, expired=${expired}`);

    // 成功ログ記録
    await logAccess(clientIP, roomId, true, expired ? 'ROOM_EXPIRED' : 'ROOM_VALID');

    // レスポンス返却（最小限の情報のみ）
    res.status(200).json({
      exists: true,
      expired: expired
    });

  } catch (error) {
    console.error('CheckRoom error:', error);
    
    let errorMessage = 'INTERNAL_ERROR';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    await logAccess(clientIP, roomId, false, errorMessage);
    res.status(500).json({ 
      exists: false, 
      expired: true,
      error: 'Internal server error' 
    });
  }
});
