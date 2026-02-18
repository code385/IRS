import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../config/firebase';
import { Role, User } from '../store/authStore';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'Active' | 'Inactive' | 'Blocked';
  created: string;
}

const formatDate = (date: Date): string => {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export async function loginWithEmail(email: string, password: string): Promise<User> {
  console.log('Attempting login for:', email);
  
  let userCredential;
  try {
    userCredential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    console.log('Firebase Auth login successful:', userCredential.user.uid);
  } catch (authError: any) {
    console.error('Firebase Auth login error:', authError);
    if (authError.code === 'auth/user-not-found') {
      throw new Error('No account found with this email. Please check your email or contact admin.');
    } else if (authError.code === 'auth/wrong-password') {
      throw new Error('Incorrect password. Please try again.');
    } else if (authError.code === 'auth/invalid-email') {
      throw new Error('Invalid email format.');
    } else if (authError.code === 'auth/user-disabled') {
      throw new Error('This account has been disabled. Contact support.');
    } else {
      throw new Error(`Login failed: ${authError.message || authError.code}`);
    }
  }
  
  const firebaseUser = userCredential.user;
  console.log('Fetching user profile from Firestore...');
  
  const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
  if (!userDoc.exists()) {
    console.error('User profile not found in Firestore for UID:', firebaseUser.uid);
    await signOut(auth);
    throw new Error('User profile not found in database. Please contact admin.');
  }
  
  const profile = userDoc.data() as UserProfile;
  console.log('User profile found:', { name: profile.name, role: profile.role, status: profile.status });
  
  if (profile.status === 'Blocked') {
    await signOut(auth);
    throw new Error('Account blocked by company. Contact support.');
  }
  
  if (!profile.role) {
    console.error('User profile missing role field');
    throw new Error('User profile is incomplete. Please contact admin.');
  }
  
  // Store password temporarily for admin re-login after user creation
  // Only store for Admin/Super Admin roles
  if (profile.role === 'Admin' || profile.role === 'Super Admin') {
    try {
      await AsyncStorage.setItem(`admin_password_${email}`, password);
      // Auto-remove after 1 hour for security
      setTimeout(async () => {
        await AsyncStorage.removeItem(`admin_password_${email}`);
      }, 3600000); // 1 hour
    } catch (e) {
      console.warn('Could not store admin password:', e);
    }
  }
  
  return {
    id: firebaseUser.uid,
    name: profile.name,
    email: profile.email,
    role: profile.role,
  };
}

export async function signupWithEmail(
  email: string,
  password: string,
  name: string,
  role: Role
): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;
  
  const userProfile: UserProfile = {
    id: firebaseUser.uid,
    name,
    email,
    role,
    status: 'Active',
    created: formatDate(new Date()),
  };
  
  await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);
  
  return {
    id: firebaseUser.uid,
    name,
    email,
    role,
  };
}

export async function logout(): Promise<void> {
  const currentUser = auth.currentUser;
  if (currentUser?.email) {
    // Remove stored password on logout
    try {
      await AsyncStorage.removeItem(`admin_password_${currentUser.email}`);
    } catch (e) {
      // Ignore errors
    }
  }
  await signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function getCurrentUserProfile(): Promise<User | null> {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;
  
  const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
  if (!userDoc.exists()) return null;
  const profile = userDoc.data() as UserProfile;
  if (profile.status === 'Blocked') {
    await signOut(auth);
    return null;
  }
  return {
    id: firebaseUser.uid,
    name: profile.name,
    email: profile.email,
    role: profile.role,
  };
}
