// src/api/locationApi.ts

import { doc as firestoreDoc, setDoc, collection, onSnapshot, query, deleteDoc, getDoc, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { logger } from '../utils/logger';

// 位置情報データ型
export interface LocationData {
  lat: number;
  lng: number;
  updatedAt: Date;
  nickname?: string;
  message?: string;
}

// 他ユーザーの位置情報型（自分以外）
export interface OtherUserLocation {
  uid: string;
  lat: number;
  lng: number;
  updatedAt: Date;
  nickname: string;
  message?: string;
  distance?: string;
}

// メンバーデータ型
interface MemberData {
  nickname: string;
  message?: string;
  joinedAt: any;
}

/**
 * 自分のニックネームを更新
 */
export async function updateMyNickname(roomId: string, nickname: string): Promise<boolean> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      logger.error('updateMyNickname: 未認証ユーザー');
      return false;
    }

    logger.debug('ニックネーム更新開始', {
      roomId: roomId.substring(0, 4) + '***',
      uid: currentUser.uid.substring(0, 4) + '***',
      nicknameLength: nickname.length
    });

    // バリデーション
    if (!roomId || roomId.length !== 12) {
      logger.error('updateMyNickname: 無効なroomId', { roomId });
      return false;
    }

    if (!nickname || nickname.trim().length === 0) {
      logger.error('updateMyNickname: 空のニックネーム');
      return false;
    }

    if (nickname.trim().length > 20) {
      logger.error('updateMyNickname: ニックネームが長すぎます', { length: nickname.trim().length });
      return false;
    }

    // メンバー情報を更新
    const memberRef = firestoreDoc(db, `rooms/${roomId}/members`, currentUser.uid);
    const locationRef = firestoreDoc(db, `rooms/${roomId}/locations`, currentUser.uid);
    
    logger.debug('Firestore ニックネーム更新開始', {
      path: `rooms/${roomId}/members/${currentUser.uid}`,
      nicknameLength: nickname.trim().length
    });

    // 並行でmembersとlocationsを更新（リアルタイム通知用）
    const [memberResult, locationResult] = await Promise.allSettled([
      setDoc(memberRef, {
        nickname: nickname.trim(),
        updatedAt: new Date()
      }, { merge: true }),
      
      setDoc(locationRef, {
        updatedAt: new Date() // リアルタイム通知のためにlocationsのupdatedAtも更新
      }, { merge: true })
    ]);

    // 結果をチェック
    if (memberResult.status === 'rejected') {
      logger.error('ニックネーム更新エラー', memberResult.reason);
      return false;
    }

    if (locationResult.status === 'rejected') {
      logger.warn('位置情報更新エラー（ニックネーム通知用）', locationResult.reason);
      // 位置情報更新失敗でもメンバー情報更新成功ならOKとする
    }

    logger.debug('ニックネーム更新成功', { 
      roomId: roomId.substring(0, 4) + '***',
      nicknameLength: nickname.trim().length
    });
    
    return true;
  } catch (error) {
    logger.error('ニックネーム更新エラー', error);
    return false;
  }
}

/**
 * 自分の位置情報をFirestoreに書き込み
 */
export async function writeLocation(roomId: string, position: [number, number]): Promise<boolean> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      logger.error('writeLocation: 未認証ユーザー');
      return false;
    }

    const [lat, lng] = position;
    
    logger.debug('writeLocation開始', {
      roomId: roomId.substring(0, 4) + '***',
      uid: currentUser.uid.substring(0, 4) + '***',
      hasPosition: !!(lat && lng)
    });
    
    // バリデーション
    if (!roomId || roomId.length !== 12) {
      logger.error('writeLocation: 無効なroomId', { roomId });
      return false;
    }

    if (isNaN(lat) || isNaN(lng)) {
      logger.error('writeLocation: 無効な位置情報', { lat, lng });
      return false;
    }

    // 位置情報をFirestoreに保存
    const locationRef = firestoreDoc(db, `rooms/${roomId}/locations`, currentUser.uid);
    
    logger.debug('Firestore書き込み開始', {
      path: `rooms/${roomId}/locations/${currentUser.uid}`,
      data: { lat, lng, updatedAt: 'Date()' }
    });

    await setDoc(locationRef, {
      lat,
      lng,
      updatedAt: new Date()
    }, { merge: true }); // 既存データがある場合はマージ

    logger.debug('Firestore書き込み完了');

    // 書き込み後の確認読み込み
    try {
      const readBack = await getDoc(locationRef);
      if (readBack.exists()) {
        const data = readBack.data();
        logger.debug('書き込み確認成功', {
          exists: true,
          data: {
            lat: data.lat,
            lng: data.lng,
            hasUpdatedAt: !!data.updatedAt
          }
        });
      } else {
        logger.warn('書き込み確認失敗: ドキュメントが存在しない');
      }
    } catch (readError) {
      logger.warn('書き込み確認読み込みエラー', readError);
    }

    logger.debug('位置情報書き込み成功', { 
      hasPosition: true,
      roomId: roomId.substring(0, 4) + '***' 
    });
    
    return true;
  } catch (error) {
    logger.error('位置情報書き込みエラー', error);
    return false;
  }
}

/**
 * 自分のメッセージを更新
 */
export async function updateMyMessage(roomId: string, message: string): Promise<boolean> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      logger.error('updateMyMessage: 未認証ユーザー');
      return false;
    }

    logger.debug('メッセージ更新開始', {
      roomId: roomId.substring(0, 4) + '***',
      uid: currentUser.uid.substring(0, 4) + '***',
      messageLength: message.length
    });

    // バリデーション
    if (!roomId || roomId.length !== 12) {
      logger.error('updateMyMessage: 無効なroomId', { roomId });
      return false;
    }

    if (message.length > 100) {
      logger.error('updateMyMessage: メッセージが長すぎます', { length: message.length });
      return false;
    }

    // メンバー情報を更新
    const memberRef = firestoreDoc(db, `rooms/${roomId}/members`, currentUser.uid);
    const locationRef = firestoreDoc(db, `rooms/${roomId}/locations`, currentUser.uid);
    
    logger.debug('Firestore メンバー情報更新開始', {
      path: `rooms/${roomId}/members/${currentUser.uid}`,
      messageLength: message.length
    });

    // 並行でmembersとlocationsを更新（リアルタイム通知用）
    const [memberResult, locationResult] = await Promise.allSettled([
      setDoc(memberRef, {
        message: message.trim(),
        updatedAt: new Date()
      }, { merge: true }),
      
      setDoc(locationRef, {
        updatedAt: new Date() // リアルタイム通知のためにlocationsのupdatedAtも更新
      }, { merge: true })
    ]);

    // 結果をチェック
    if (memberResult.status === 'rejected') {
      logger.error('メンバー情報更新エラー', memberResult.reason);
      return false;
    }

    if (locationResult.status === 'rejected') {
      logger.warn('位置情報更新エラー（メッセージ通知用）', locationResult.reason);
      // 位置情報更新失敗でもメンバー情報更新成功ならOKとする
    }

    logger.debug('メッセージ更新成功', { 
      roomId: roomId.substring(0, 4) + '***',
      messageLength: message.trim().length
    });
    
    return true;
  } catch (error) {
    logger.error('メッセージ更新エラー', error);
    return false;
  }
}

/**
 * 自分の位置情報を削除（退出時）
 */
export async function deleteMyLocation(roomId: string): Promise<boolean> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      logger.error('deleteMyLocation: 未認証ユーザー');
      return false;
    }

    const locationRef = firestoreDoc(db, `rooms/${roomId}/locations`, currentUser.uid);
    await deleteDoc(locationRef);

    logger.debug('位置情報削除成功');
    return true;
  } catch (error) {
    logger.error('位置情報削除エラー', error);
    return false;
  }
}

/**
 * ルーム内の他ユーザーの位置情報をリアルタイム監視
 */
export function subscribeToLocations(
  roomId: string,
  callback: (locations: OtherUserLocation[]) => void
): () => void {
  logger.debug('位置情報リアルタイム監視開始', { roomId });

  const locationsRef = collection(db, `rooms/${roomId}/locations`);
  const q = query(locationsRef);

  logger.debug('Firestore onSnapshot設定開始');

  const unsubscribe = onSnapshot(q, async (snapshot) => {
    try {
      logger.debug('Firestore snapshot受信', { 
        docCount: snapshot.docs.length,
        docIds: snapshot.docs.map(doc => doc.id.substring(0, 4) + '***')
      });

      const currentUser = auth.currentUser;
      if (!currentUser) {
        logger.error('subscribeToLocations: 未認証ユーザー');
        return;
      }

      logger.debug('現在のユーザー確認', { 
        currentUID: currentUser.uid.substring(0, 4) + '***' 
      });

      const locations: OtherUserLocation[] = [];

      // 自分以外のドキュメントをフィルタ
      const otherUserDocs = snapshot.docs.filter(docSnapshot => {
        const isNotMe = docSnapshot.id !== currentUser.uid;
        logger.debug('ドキュメントフィルタ', { 
          docId: docSnapshot.id.substring(0, 4) + '***',
          isNotMe,
          data: docSnapshot.data()
        });
        return isNotMe;
      });

      logger.debug('他ユーザードキュメント', { 
        count: otherUserDocs.length,
        ids: otherUserDocs.map(doc => doc.id.substring(0, 4) + '***')
      });

      // 並行してメンバー情報も取得（ニックネーム取得のため）
      const membersPromises = otherUserDocs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        const uid = docSnapshot.id;

        logger.debug('位置情報ドキュメント処理', { 
          uid: uid.substring(0, 4) + '***',
          hasLat: !!data.lat,
          hasLng: !!data.lng,
          hasUpdatedAt: !!data.updatedAt
        });

        // メンバー情報からニックネームを取得
        try {
          const memberRef = firestoreDoc(db, `rooms/${roomId}/members`, uid);
          const memberSnap = await getDoc(memberRef);
          
          logger.debug('メンバー情報取得', { 
            uid: uid.substring(0, 4) + '***',
            exists: memberSnap.exists()
          });

          const memberData = memberSnap.exists() ? memberSnap.data() as MemberData : null;

          const userLocation: OtherUserLocation = {
            uid,
            lat: data.lat,
            lng: data.lng,
            updatedAt: data.updatedAt?.toDate() || new Date(),
            nickname: memberData?.nickname || 'Unknown',
            message: memberData?.message || undefined,
            distance: undefined // 初期値
          };

          logger.debug('ユーザー位置情報作成完了', {
            uid: uid.substring(0, 4) + '***',
            nickname: memberData?.nickname || 'Unknown',
            hasPosition: !!(data.lat && data.lng)
          });

          return userLocation;
        } catch (error) {
          logger.warn('メンバー情報取得エラー', { 
            uid: uid.substring(0, 4) + '***',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          const userLocation: OtherUserLocation = {
            uid,
            lat: data.lat,
            lng: data.lng,
            updatedAt: data.updatedAt?.toDate() || new Date(),
            nickname: 'Unknown',
            message: undefined,
            distance: undefined
          };
          return userLocation;
        }
      });

      const resolvedLocations = await Promise.all(membersPromises);
      
      logger.debug('全ユーザー位置情報解決完了', { 
        resolvedCount: resolvedLocations.length,
        users: resolvedLocations.map(l => ({ 
          uid: l.uid.substring(0, 4) + '***', 
          nickname: l.nickname,
          lat: l.lat,
          lng: l.lng
        }))
      });

      // 距離計算（自分の位置が必要な場合）
      resolvedLocations.forEach(location => {
        // TODO: 自分の位置情報との距離計算
        location.distance = '計算中';
      });

      logger.debug('位置情報更新コールバック実行', { 
        userCount: resolvedLocations.length 
      });

      callback(resolvedLocations);
    } catch (error) {
      logger.error('位置情報監視エラー', error);
    }
  }, (error) => {
    logger.error('位置情報監視ストリームエラー', error);
  });

  logger.debug('onSnapshot設定完了、unsubscribe関数を返却');
  return unsubscribe;
}

export async function testFirestoreConnection(roomId: string): Promise<void> {
  try {
    logger.debug('Firestore接続テスト開始');
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      logger.error('testFirestoreConnection: 未認証ユーザー');
      return;
    }

    logger.debug('認証状態詳細', {
      uid: currentUser.uid,
      isAnonymous: currentUser.isAnonymous,
      metadata: {
        creationTime: currentUser.metadata.creationTime,
        lastSignInTime: currentUser.metadata.lastSignInTime
      }
    });

    // 1. 自分のメンバー情報を確認
    try {
      const myMemberRef = firestoreDoc(db, `rooms/${roomId}/members`, currentUser.uid);
      const myMemberSnap = await getDoc(myMemberRef);
      
      logger.debug('自分のメンバー情報確認', {
        path: `rooms/${roomId}/members/${currentUser.uid}`,
        exists: myMemberSnap.exists(),
        data: myMemberSnap.exists() ? myMemberSnap.data() : null
      });

      if (!myMemberSnap.exists()) {
        logger.error('⚠️ メンバー情報が存在しません - これがpermission-deniedの原因です');
        return;
      }
    } catch (memberError) {
      logger.error('メンバー情報読み取りエラー', memberError);
      return;
    }

    // 2. 自分の位置情報ドキュメントに直接アクセス
    try {
      const myLocationRef = firestoreDoc(db, `rooms/${roomId}/locations`, currentUser.uid);
      const myLocationSnap = await getDoc(myLocationRef);
      
      logger.debug('自分の位置情報確認', {
        path: `rooms/${roomId}/locations/${currentUser.uid}`,
        exists: myLocationSnap.exists(),
        data: myLocationSnap.exists() ? myLocationSnap.data() : null
      });
    } catch (locationError) {
      logger.error('位置情報読み取りエラー', locationError);
    }

    // 🔧 位置情報の書き込みテストを削除（実際の位置情報を上書きしないため）
    // 3. 位置情報の書き込みテスト - 削除しました

    // 4. ルーム情報の確認
    try {
      const roomRef = firestoreDoc(db, 'rooms', roomId);
      const roomSnap = await getDoc(roomRef);
      
      logger.debug('ルーム情報確認', {
        exists: roomSnap.exists(),
        data: roomSnap.exists() ? {
          createdAt: roomSnap.data()?.createdAt,
          expiresAt: roomSnap.data()?.expiresAt
        } : null
      });
    } catch (roomError) {
      logger.error('ルーム情報読み取りエラー', roomError);
    }

    logger.debug('Firestore接続テスト完了');

  } catch (error) {
    logger.error('Firestore接続テスト全体エラー', error);
  }
}

/**
 * 距離計算（Haversine公式）
 */
export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): string {
  const R = 6371; // 地球の半径 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c * 1000; // メートルに変換

  if (distance < 1000) {
    return `${Math.round(distance)}m`;
  } else {
    return `${(distance / 1000).toFixed(1)}km`;
  }
}
