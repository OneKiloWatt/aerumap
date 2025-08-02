import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Request, Response } from 'express';

// Firestore参照
const db = admin.firestore();

/**
 * ランダムなroomIdを生成（12文字の英数字）
 */
function generateRoomId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * レート制限チェック（同一IPから30分に5回まで）
 */
async function checkRateLimit(ip: string, action: string = 'createRoom'): Promise<boolean> {
  const rateLimitRef = db.collection('rateLimits').doc(`${action}_${ip}`);
  const now = new Date();
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

  try {
    const doc = await rateLimitRef.get();

    if (!doc.exists) {
      // 初回アクセス
      await rateLimitRef.set({
        count: 1,
        lastReset: now,
        attempts: [now],
        expiresAt: new Date(now.getTime() + 3 * 60 * 60 * 1000)
      });
      return true;
    }

    const data = doc.data()!;
    const attempts = data.attempts || [];

    // 30分以内のアクセス回数をカウント（Date型として処理）
    const recentAttempts = attempts.filter((timestamp: any) => {
      if (timestamp?.toDate) return timestamp.toDate() > thirtyMinutesAgo;
      if (timestamp instanceof Date) return timestamp > thirtyMinutesAgo;
      return false;
    });

    // レート制限に引っかかった
    if (recentAttempts.length >= 5) return false;

    const updatedAttempts = [...recentAttempts, now];
    await rateLimitRef.set({
      count: updatedAttempts.length,
      lastReset: now,
      attempts: updatedAttempts,
      expiresAt: new Date(now.getTime() + 3 * 60 * 60 * 1000)
    });

    return true;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return false; // エラー時は安全側に倒す
  }
}

/**
 * アクセスログを記録
 */
async function logAccess(ip: string, uid: string, success: boolean, error?: string): Promise<void> {
  try {
    await db.collection('accessLogs').add({
      endpoint: 'createRoom',
      ip,
      uid,
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
 * ルーム作成API
 */
export const createRoom = functions.https.onRequest(async (req: Request, res: Response) => {
  // CORS設定
  const allowedOrigins = ['http://localhost:3000', 'https://onekilowatt.github.io'];
  const origin = req.headers.origin || '';

  if (allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  } else {
    res.set('Access-Control-Allow-Origin', 'https://onekilowatt.github.io'); // fallback（←念のため）
  }
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

  try {
    console.log('CreateRoom request from IP:', clientIP);

    // レート制限チェック
    const rateLimitPassed = await checkRateLimit(clientIP, 'createRoom');
    if (!rateLimitPassed) {
      await logAccess(clientIP, uid, false, 'RATE_LIMIT_EXCEEDED');
      res.status(429).json({ error: 'Too many requests. Please try again later.' });
      return;
    }

    // 認証トークンの検証
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      await logAccess(clientIP, uid, false, 'MISSING_AUTH_TOKEN');
      res.status(401).json({ error: 'Authorization token required' });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    console.log('Verifying token...');

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    uid = decodedToken.uid;
    console.log('Token verified, UID:', uid);

    // リクエストボディの検証
    const { nickname } = req.body;
    if (!nickname || typeof nickname !== 'string' || nickname.trim().length === 0) {
      await logAccess(clientIP, uid, false, 'INVALID_NICKNAME');
      res.status(400).json({ error: 'Valid nickname is required' });
      return;
    }
    if (nickname.length > 50) {
      await logAccess(clientIP, uid, false, 'NICKNAME_TOO_LONG');
      res.status(400).json({ error: 'Nickname is too long' });
      return;
    }

    console.log('Nickname:', nickname);

    // ランダムなroomIdを生成（重複チェック付き）
    let roomId: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      roomId = generateRoomId();
      const roomDoc = await db.collection('rooms').doc(roomId).get();
      if (!roomDoc.exists) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      await logAccess(clientIP, uid, false, 'ROOM_ID_GENERATION_FAILED');
      res.status(500).json({ error: 'Failed to generate unique room ID' });
      return;
    }

    console.log('Generated roomId:', roomId);

    // Firestore書き込み処理（トランザクション）
    await db.runTransaction(async (transaction) => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 3 * 60 * 60 * 1000);

      // rooms/{roomId} ドキュメント作成
      const roomRef = db.collection('rooms').doc(roomId);
      transaction.set(roomRef, {
        createdAt: now,
        expiresAt: expiresAt
      });

      // rooms/{roomId}/members/{uid} ドキュメント作成（ホスト登録）
      const memberRef = roomRef.collection('members').doc(uid);
      transaction.set(memberRef, {
        joinedAt: now,
        nickname: nickname.trim()
	// messageは現時点では使用しない
      });
    });

    console.log('Firestore write successful');

    // 成功ログ記録
    await logAccess(clientIP, uid, true);

    res.status(200).json({
      roomId,
      url: `https://aimap.app/room/${roomId}`
    });
  } catch (error) {
    console.error('CreateRoom error:', error);
    const errorMessage = error instanceof Error ? error.message : 'INTERNAL_ERROR';
    await logAccess(clientIP, uid, false, errorMessage);
    res.status(500).json({ error: 'Internal server error' });
  }
});
