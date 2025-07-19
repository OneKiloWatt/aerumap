// src/firebase.ts - デバッグ情報追加版
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, connectAuthEmulator, setPersistence, browserLocalPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY!,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN!,
  projectId: process.env.REACT_APP_PROJECT_ID!,
  appId: process.env.REACT_APP_APP_ID!,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 認証状態の永続化を設定
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Firebase Auth persistence設定エラー:', error);
});

if (process.env.REACT_APP_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
}

export const getFirebaseIdToken = async (): Promise<string> => {
  console.log('🔍 Firebase Auth状態:', {
    currentUser: auth.currentUser?.uid,
    isAnonymous: auth.currentUser?.isAnonymous
  });

  if (!auth.currentUser) {
    console.log('🚀 匿名ログイン実行中...');
    const result = await signInAnonymously(auth);
    console.log('✅ 匿名ログイン完了:', result.user.uid);
  }
  
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('IDトークンの取得に失敗しました');
  return token;
};

export { auth };
