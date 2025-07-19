// src/App.tsx
import { useEffect } from 'react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import AppRouter from "./routes/AppRouter";
import { auth } from './firebase';
import './index.css';

function App() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        signInAnonymously(auth).catch((err) => {
          console.error('匿名ログイン失敗:', err);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return <AppRouter />;
}

export default App;

