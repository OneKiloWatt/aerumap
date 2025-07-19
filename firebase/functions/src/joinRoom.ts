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
  // 現在は簡易チェックのみ
  return true; // 一時的に全て許可
}

/**
 * レート制限チェック（同一IPで5回連続失敗 → 一時ブロック）
 */
async function checkJoinRateLimit(ip: string, success: boolean): Promise<boolean> {
  const rateLimitRef = db.collection('rateLimits').doc(`joinRoom_${ip}`);
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  try {
    const doc = await rateLimitRef.get();
    
    if (!doc.exists) {
      // 初回アクセス
      await rateLimitRef.set({
        consecutiveFailures: success ? 0 : 1,
        lastFailure: success ? null : now,
        totalAttempts: 1,
        lastReset: now
      });
      return true;
    }

    const data = doc.data()!;
    const consecutiveFailures = data.consecutiveFailures || 0;
    const lastFailure = data.lastFailure;

    // 成功の場合、失敗カウントをリセット
    if (success) {
      await rateLimitRef.update({
        consecutiveFailures: 0,
        lastFailure: null,
        totalAttempts: (data.totalAttempts || 0) + 1
      });
      return true;
    }

    // 失敗の場合
    // 既に5回連続失敗している場合
    if (consecutiveFailures >= 5) {
      // 最後の失敗から1時間経過していれば制限解除
      if (lastFailure && lastFailure.toDate && lastFailure.toDate() < oneHourAgo) {
        await rateLimitRef.update({
          consecutiveFailures: 1,
          lastFailure: now,
          totalAttempts: (data.totalAttempts || 0) + 1
        });
        return true;
      } else {
        // まだ制限時間内
        return false;
      }
    }

    // 失敗カウントを増加
    await rateLimitRef.update({
      consecutiveFailures: consecutiveFailures + 1,
      lastFailure: now,
      totalAttempts: (data.totalAttempts || 0) + 1
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
async function logAccess(ip: string, uid: string, roomId: string, success: boolean, error?: string): Promise<void> {
  try {
    await db.collection('accessLogs').add({
      endpoint: 'joinRoom',
      ip,
      uid,
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
 * ルーム参加API
 */
export const joinRoom = functions.https.onRequest(async (req: Request, res: Response) => {
  // CORS設定
  res.set('Access-Control-Allow-Origin', 'https://aimap.app');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  let uid = '';
  let roomId = '';

  try {
    console.log('JoinRoom request from IP:', clientIP);

    // IP地域チェック（日本国内のみ）
    if (!isJapaneseIP(clientIP)) {
      await logAccess(clientIP, uid, roomId, false, 'IP_REGION_BLOCKED');
      res.status(403).json({ success: false, error: 'Access from outside Japan is not allowed' });
      return;
    }

    // 認証トークンの検証
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      await checkJoinRateLimit(clientIP, false);
      await logAccess(clientIP, uid, roomId, false, 'MISSING_AUTH_TOKEN');
      res.status(401).json({ success: false, error: 'Authorization token required' });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    console.log('Verifying token...');
    
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    uid = decodedToken.uid;
    console.log('Token verified, UID:', uid);

    // リクエストボディの検証
    const { roomId: requestRoomId, nickname } = req.body;
    
    if (!requestRoomId || typeof requestRoomId !== 'string' || requestRoomId.trim().length === 0) {
      await checkJoinRateLimit(clientIP, false);
      await logAccess(clientIP, uid, roomId, false, 'INVALID_ROOM_ID');
      res.status(400).json({ success: false, error: 'Valid roomId is required' });
      return;
    }

    if (!nickname || typeof nickname !== 'string' || nickname.trim().length === 0) {
      await checkJoinRateLimit(clientIP, false);
      await logAccess(clientIP, uid, roomId, false, 'INVALID_NICKNAME');
      res.status(400).json({ success: false, error: 'Valid nickname is required' });
      return;
    }

    if (nickname.length > 50) {
      await checkJoinRateLimit(clientIP, false);
      await logAccess(clientIP, uid, roomId, false, 'NICKNAME_TOO_LONG');
      res.status(400).json({ success: false, error: 'Nickname is too long' });
      return;
    }

    roomId = requestRoomId.trim();
    console.log('RoomId:', roomId, 'Nickname:', nickname);

    // ルームの存在確認
    const roomRef = db.collection('rooms').doc(roomId);
    const roomDoc = await roomRef.get();
    
    if (!roomDoc.exists) {
      await checkJoinRateLimit(clientIP, false);
      await logAccess(clientIP, uid, roomId, false, 'ROOM_NOT_FOUND');
      res.status(404).json({ success: false, error: 'Room not found' });
      return;
    }

    // ルームの有効期限チェック
    const roomData = roomDoc.data()!;
    const expiresAt = roomData.expiresAt;
    if (expiresAt && expiresAt.toDate && expiresAt.toDate() < new Date()) {
      await checkJoinRateLimit(clientIP, false);
      await logAccess(clientIP, uid, roomId, false, 'ROOM_EXPIRED');
      res.status(410).json({ success: false, error: 'Room has expired' });
      return;
    }

    console.log('Room exists and is valid');

    // 既存メンバーかどうか確認
    const memberRef = roomRef.collection('members').doc(uid);
    const memberDoc = await memberRef.get();
    
    if (memberDoc.exists) {
      // 既に参加済み - 早期リターン（成功扱い）
      console.log('User is already a member of this room');
      await checkJoinRateLimit(clientIP, true);
      await logAccess(clientIP, uid, roomId, true, 'ALREADY_MEMBER');
      
      res.status(200).json({
        success: true,
        roomId: roomId,
        message: 'Already a member of this room'
      });
      return;
    }

    console.log('User is not a member, proceeding with join...');

    // 新規参加処理
    await memberRef.set({
      joinedAt: new Date(),
      nickname: nickname.trim()
      // messageは現時点では使用しない
    });

    console.log('Successfully joined room');

    // 成功時のレート制限更新とログ記録
    await checkJoinRateLimit(clientIP, true);
    await logAccess(clientIP, uid, roomId, true);

    // レスポンス返却
    res.status(200).json({
      success: true,
      roomId: roomId
    });

  } catch (error) {
    console.error('JoinRoom error:', error);
    
    let errorMessage = 'INTERNAL_ERROR';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    await checkJoinRateLimit(clientIP, false);
    await logAccess(clientIP, uid, roomId, false, errorMessage);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
