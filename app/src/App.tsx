// src/App.tsx - デバッグ版
import { useEffect, useState } from 'react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import AppRouter from "./routes/AppRouter";
import { auth } from './firebase';
import './index.css';

function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔄 Firebase Auth状態変化:', {
        uid: user?.uid,
        isAnonymous: user?.isAnonymous,
        email: user?.email
      });

      setUser(user);

      if (!user) {
        console.log('🚀 匿名ログイン開始...');
        signInAnonymously(auth)
          .then((result) => {
            console.log('✅ 匿名ログイン成功:', result.user.uid);
            setAuthLoading(false);
          })
          .catch((err) => {
            console.error('❌ 匿名ログイン失敗:', err);
            setAuthLoading(false);
          });
      } else {
        console.log('✅ 既存ユーザー確認:', user.uid);
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 認証ロード中は読み込み画面を表示
  if (authLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#8B4513' 
      }}>
        認証中...
      </div>
    );
  }

  return <AppRouter />;
}

export default App;
