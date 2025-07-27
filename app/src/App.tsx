// src/App.tsx
import { useEffect, useState } from 'react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import AppRouter from "./routes/AppRouter";
import LoadingComponent from './components/LoadingComponent';
import { auth } from './firebase';
import { logger } from './utils/logger';
import './index.css';

function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      logger.debug('Firebase Auth状態変化', {
        hasUser: !!user,
        isAnonymous: user?.isAnonymous,
        hasEmail: !!user?.email
      });

      setUser(user);

      if (!user) {
        logger.debug('匿名ログイン開始');
        signInAnonymously(auth)
          .then((result) => {
            logger.success('匿名ログイン成功');
            setAuthLoading(false);
          })
          .catch((err) => {
            logger.error('匿名ログイン失敗', err);
            setAuthLoading(false);
          });
      } else {
        logger.success('既存ユーザー確認');
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 認証ロード中は読み込み画面を表示
  if (authLoading) {
    return <LoadingComponent />;
  }

  return <AppRouter />;
}

export default App;
