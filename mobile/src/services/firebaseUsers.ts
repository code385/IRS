import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserRole, UserStatus, AppUser } from '../store/userStore';

const COLLECTION_USERS = 'users';

const formatDate = (date: Date): string => {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export async function getAllUsers(): Promise<AppUser[]> {
  const q = query(collection(db, COLLECTION_USERS), orderBy('created', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AppUser[];
}

export async function getUserById(userId: string): Promise<AppUser | null> {
  const userRef = doc(db, COLLECTION_USERS, userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) return null;
  
  return {
    id: userDoc.id,
    ...userDoc.data(),
  } as AppUser;
}

export async function createUser(
  user: Omit<AppUser, 'id' | 'created'>
): Promise<string> {
  const userRef = doc(collection(db, COLLECTION_USERS));
  const userData: Omit<AppUser, 'id'> = {
    ...user,
    created: formatDate(new Date()),
  };
  
  await setDoc(userRef, userData);
  return userRef.id;
}

export async function updateUser(
  userId: string,
  patch: Partial<AppUser>
): Promise<void> {
  const userRef = doc(db, COLLECTION_USERS, userId);
  await updateDoc(userRef, patch);
}

export async function deleteUser(userId: string): Promise<void> {
  const userRef = doc(db, COLLECTION_USERS, userId);
  await deleteDoc(userRef);
  
  // Note: Firebase Auth user deletion requires Admin SDK (Cloud Function)
  // For now, we only delete Firestore document. Auth user will remain but won't be able to login
  // because Firestore profile won't exist (login check fails).
}
