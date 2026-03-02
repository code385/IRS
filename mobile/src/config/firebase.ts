import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { initializeFirestore, getFirestore, memoryLocalCache } from 'firebase/firestore';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCTZYkYTNftfKjqUqzIoVDrlrowht7di0Q',
  authDomain: 'hashtimesheet.firebaseapp.com',
  projectId: 'hashtimesheet',
  storageBucket: 'hashtimesheet.firebasestorage.app',
  messagingSenderId: '670914772713',
  appId: '1:670914772713:web:8fffa34e642dfb695a3a78',
};

// Initialize app only once (hot-reload safe)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth: use AsyncStorage persistence on native so login survives app restarts.
// On web: use default browser session persistence.
// Guard against double-initialization on hot reload.
let auth: ReturnType<typeof getAuth>;
try {
  auth = Platform.OS === 'web'
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
} catch {
  auth = getAuth(app);
}
export { auth };

// Firestore: memoryLocalCache avoids slow IndexedDB init on web.
// Guard against double-initialization on hot reload.
let db: ReturnType<typeof getFirestore>;
try {
  db = initializeFirestore(app, { localCache: memoryLocalCache() });
} catch {
  db = getFirestore(app);
}
export { db };

export default app;
