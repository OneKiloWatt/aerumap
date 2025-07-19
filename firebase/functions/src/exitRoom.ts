import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Request, Response } from 'express';

// Firestore参照
const db = admin.firestore();

/**
 * アクセスログの記録
 */
async function logAccess(ip: string, uid: string, roomId: string, success: boolean, error?: string): Promise<void> {
  try {
    await db.collection('accessLogs').add({
      endpoint: 'exitRoom',
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
 * ルーム退出API
 */
export const exitRoom = functions.https.onRequest(async (req: Request, res: Response) => {
  // CORS設定
  res.set('Access-Control-Allow-Origin', 'https://aimap.app');
  res.set('Access-Control-Allow-Methods', 'DELETE');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'DELETE') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  let uid = '';
  let roomId = '';

  try {
    console.log('ExitRoom request from IP:', clientIP);

    // 認証トークンの検証
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      await logAccess(clientIP, uid, roomId, false, 'MISSING_AUTH_TOKEN');
      res.status(401).json({ error: 'Authorization token required' });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    console.log('Verifying token...');
    
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    uid = decodedToken.uid;
    console.log('Token verified, UID:', uid);

    // リクエストボディの検証
    const { roomId: requestRoomId } = req.body;
    if (!requestRoomId || typeof requestRoomId !== 'string' || requestRoomId.trim().length === 0) {
      await logAccess(clientIP, uid, roomId, false, 'INVALID_ROOM_ID');
      res.status(400).json({ error: 'Valid roomId is required' });
      return;
    }

    roomId = requestRoomId.trim();
    console.log('RoomId:', roomId);

    // ルームの存在確認
    const roomRef = db.collection('rooms').doc(roomId);
    const roomDoc = await roomRef.get();
    
    if (!roomDoc.exists) {
      await logAccess(clientIP, uid, roomId, false, 'ROOM_NOT_FOUND');
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    // メンバーかどうか確認
    const memberRef = roomRef.collection('members').doc(uid);
    const memberDoc = await memberRef.get();
    
    if (!memberDoc.exists) {
      await logAccess(clientIP, uid, roomId, false, 'NOT_MEMBER');
      res.status(403).json({ error: 'You are not a member of this room' });
      return;
    }

    console.log('User is confirmed as member, proceeding with exit...');

    // 退出処理（トランザクション）
    await db.runTransaction(async (transaction) => {
      // メンバー情報を削除
      transaction.delete(memberRef);
      
      // 位置情報を削除
      const locationRef = roomRef.collection('locations').doc(uid);
      transaction.delete(locationRef);
    });

    console.log('Exit successful - member and location data deleted');

    // 成功ログ記録
    await logAccess(clientIP, uid, roomId, true);

    // レスポンス返却
    res.status(200).json({
      success: true,
      message: 'Successfully exited from room',
      roomId: roomId
    });

  } catch (error) {
    console.error('ExitRoom error:', error);
    
    let errorMessage = 'INTERNAL_ERROR';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    await logAccess(clientIP, uid, roomId, false, errorMessage);
    res.status(500).json({ error: 'Internal server error' });
  }
});
