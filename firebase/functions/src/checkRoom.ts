import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Request, Response } from 'express';

const db = admin.firestore();

// Firebase Auth トークンの検証
async function verifyAuthToken(req: Request): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded.uid;
  } catch {
    return null;
  }
}

async function checkRateLimit(ip: string): Promise<boolean> {
  const rateLimitRef = db.collection('rateLimits').doc(`checkRoom_${ip}`);
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

  try {
    const doc = await rateLimitRef.get();
    if (!doc.exists) {
      await rateLimitRef.set({ count: 1, lastReset: now, attempts: [now] });
      return true;
    }

    const data = doc.data()!;
    const attempts = data.attempts || [];
    const recentAttempts = attempts.filter((timestamp: any) =>
      (timestamp?.toDate?.() || timestamp) > oneMinuteAgo
    );

    if (recentAttempts.length >= 10) return false;

    const updatedAttempts = [...recentAttempts, now].slice(-50);
    await rateLimitRef.set({
      count: updatedAttempts.length,
      lastReset: now,
      attempts: updatedAttempts,
    });

    return true;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return false;
  }
}

async function logAccess(ip: string, roomId: string, success: boolean, error?: string): Promise<void> {
  try {
    await db.collection('accessLogs').add({
      endpoint: 'checkRoom',
      ip,
      roomId,
      success,
      error: error || null,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  } catch (logError) {
    console.error('Failed to log access:', logError);
  }
}

export const checkRoom = functions.https.onRequest(async (req: Request, res: Response) => {
  const allowedOrigins = ['http://localhost:3000', 'https://onekilowatt.github.io'];
  const origin = req.headers.origin || '';
  res.set('Access-Control-Allow-Origin', allowedOrigins.includes(origin) ? origin : 'https://onekilowatt.github.io');
  res.set('Access-Control-Allow-Methods', 'GET');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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
    roomId = req.path.split('/').pop() || '';
    if (!roomId || roomId.length !== 12) {
      await logAccess(clientIP, roomId, false, 'INVALID_ROOM_ID_FORMAT');
      res.status(400).json({ exists: false, expired: true, error: 'Invalid room ID format' });
      return;
    }

    const rateLimitPassed = await checkRateLimit(clientIP);
    if (!rateLimitPassed) {
      await logAccess(clientIP, roomId, false, 'RATE_LIMIT_EXCEEDED');
      res.status(429).json({ exists: false, expired: true, error: 'Too many requests' });
      return;
    }

    const roomRef = db.collection('rooms').doc(roomId);
    const roomDoc = await roomRef.get();

    if (!roomDoc.exists) {
      await logAccess(clientIP, roomId, true, 'ROOM_NOT_FOUND');
      res.status(200).json({ exists: false, expired: true });
      return;
    }

    const roomData = roomDoc.data()!;
    const expiresAt = roomData.expiresAt;
    const now = new Date();
    const expired = expiresAt?.toDate?.() ? expiresAt.toDate() < now : expiresAt < now;

    const uid = await verifyAuthToken(req);
    let isMember = false;

    if (uid) {
      const memberRef = db.collection(`rooms/${roomId}/members`).doc(uid);
      const memberDoc = await memberRef.get();
      isMember = memberDoc.exists;
    }

    await logAccess(clientIP, roomId, true, expired ? 'ROOM_EXPIRED' : 'ROOM_VALID');

    res.status(200).json({
      exists: true,
      expired: expired,
      isMember: isMember,
    });

  } catch (error) {
    console.error('CheckRoom error:', error);
    const message = error instanceof Error ? error.message : 'UNKNOWN';
    await logAccess(clientIP, roomId, false, message);
    res.status(500).json({ exists: false, expired: true, error: 'Internal server error' });
  }
});
