// firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const useEmulator = process.env.REACT_APP_USE_FIREBASE_EMULATOR === 'true';

const firebaseConfig = useEmulator
  ? {
      apiKey: 'demo-key',
      authDomain: 'localhost',
      projectId: 'demo-project',
      appId: 'demo-app',
    }
  : {
      apiKey: process.env.REACT_APP_API_KEY!,
      authDomain: process.env.REACT_APP_AUTH_DOMAIN!,
      projectId: process.env.REACT_APP_PROJECT_ID!,
      appId: process.env.REACT_APP_APP_ID!,
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

if (useEmulator) {
  // 🚨ここにオプション追加
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
}

export { auth };

