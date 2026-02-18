import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCTZYkYTNftfKjqUqzIoVDrlrowht7di0Q',
  authDomain: 'hashtimesheet.firebaseapp.com',
  projectId: 'hashtimesheet',
  storageBucket: 'hashtimesheet.firebasestorage.app',
  messagingSenderId: '670914772713',
  appId: '1:670914772713:web:8fffa34e642dfb695a3a78',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// ✅ Works on Web + Android + iOS (no react-native persistence import)
export const auth = getAuth(app);

export const db = getFirestore(app);

export default app;
