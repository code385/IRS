import { createUserWithEmailAndPassword, signOut, signInWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import app, { auth, db } from '../config/firebase';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../store/userStore';

const formatDate = (date: Date): string => {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export interface CreateUserPayload {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface CreateUserResult {
  success: boolean;
  uid: string;
  message: string;
  adminEmail?: string;
  /** True if admin was re-logged in; dashboard should stay open */
  adminReloggedIn?: boolean;
  /** Credentials for sharing via Share button (WhatsApp, Email, etc.) */
  credentials?: { name: string; email: string; password: string; role: string };
  verificationEmailSent?: boolean;
  verificationEmailError?: string;
}

/**
 * Creates user client-side. Use Share button to send credentials via WhatsApp/Email (free).
 */

export async function createUserClientSide(
  payload: CreateUserPayload
): Promise<CreateUserResult> {
  const { email, password, name, role } = payload;

  // Save current admin user email and get profile BEFORE creating new user
  const currentAdminUser = auth.currentUser;
  const currentAdminEmail = currentAdminUser?.email;
  
  // Get admin profile from Firestore to get name/role for re-login
  let adminProfile: any = null;
  if (currentAdminUser) {
    try {
      const adminDoc = await getDoc(doc(db, 'users', currentAdminUser.uid));
      if (adminDoc.exists()) {
        adminProfile = adminDoc.data();
      }
    } catch (e) {
      console.warn('Could not fetch admin profile:', e);
    }
  }

  // Validate inputs
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!email || !emailRegex.test(email)) {
    throw new Error('Invalid email address. Please use format: name@company.com');
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  if (!name || name.trim().length === 0) {
    throw new Error('Name is required');
  }

  // Block auth store updates during user creation (prevents Employee dashboard flash)
  useAuthStore.getState().setReauthenticating(true);

  const emailLower = email.trim().toLowerCase();
  
  try {
    // Query Firestore to check if email already exists
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', emailLower));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      throw new Error(`This email "${emailLower}" is already registered. Please use a different email or edit the existing user from User Management.`);
    }
  } catch (queryError: any) {
    if (queryError.message && queryError.message.includes('already registered')) {
      useAuthStore.getState().setReauthenticating(false);
      throw queryError;
    }
    if (__DEV__) console.warn('Error checking existing user:', queryError);
  }

  // Create Firebase Auth user (this will automatically sign in as new user)
  let userCredential;
  let newUserUid: string;

  try {
    userCredential = await createUserWithEmailAndPassword(auth, emailLower, password);
    newUserUid = userCredential.user.uid;
  } catch (authError: any) {
    useAuthStore.getState().setReauthenticating(false);
    if (__DEV__) console.error('Firebase Auth error:', authError);
    if (authError.code === 'auth/email-already-in-use') {
      throw new Error(`This email "${emailLower}" is already registered in Firebase Auth. Please use a different email or contact support.`);
    } else if (authError.code === 'auth/invalid-email') {
      throw new Error('Invalid email format.');
    } else if (authError.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please use a stronger password.');
    } else {
      throw new Error(`Firebase Auth error: ${authError.message || authError.code}`);
    }
  }
  
  newUserUid = userCredential.user.uid;

  // Set displayName so Cloud Function can read it in the verification email
  try {
    await updateProfile(userCredential.user, { displayName: name.trim() });
  } catch (e) {
    if (__DEV__) console.warn('Could not set displayName:', e);
  }

  // Create Firestore user doc
  const createdStr = formatDate(new Date());
  try {
    await setDoc(doc(db, 'users', newUserUid), {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      status: 'Active',
      created: createdStr,
    });
  } catch (firestoreError: any) {
    if (__DEV__) console.error('Firestore error:', firestoreError);
    useAuthStore.getState().setReauthenticating(false);
    try { await signOut(auth); } catch (_) { /* ignore */ }
    throw new Error(`Failed to create user profile: ${firestoreError.message || firestoreError.code}`);
  }

  const fns = getFunctions(app);

  // Mark email as verified immediately while still signed in as the new user (self-verification).
  // Admin is vouching for this user — no email verification needed for any email type.
  try {
    await httpsCallable(fns, 'markUserEmailVerified')({ userId: newUserUid });
  } catch (e) {
    if (__DEV__) console.warn('Could not mark email as verified:', e);
  }

  const verificationEmailSent = false;
  const verificationEmailError: string | undefined = undefined;

  // Sign out the new user, then re-login admin
  await signOut(auth);

  let adminReloggedIn = false;
  if (currentAdminEmail && adminProfile) {
    try {
      const storedPassword = await AsyncStorage.getItem(`admin_password_${currentAdminEmail}`);
      if (storedPassword) {
        await signInWithEmailAndPassword(auth, currentAdminEmail, storedPassword);
        adminReloggedIn = true;
      } else {
        if (__DEV__) console.warn('Admin password not found in storage');
      }
    } catch (reloginError: any) {
      if (__DEV__) console.error('Failed to re-login admin:', reloginError);
    }
  }

  // Ensure auth store reflects admin after re-login BEFORE clearing isReauthenticating
  // so the onAuthStateChanged listener does not race and clear the user
  if (adminReloggedIn && auth.currentUser) {
    try {
      const { getCurrentUserProfile } = await import('../services/firebaseAuth');
      const adminUser = await getCurrentUserProfile();
      if (adminUser) {
        useAuthStore.setState({ user: adminUser, isLoading: false });
      }
    } catch (e) {
      console.warn('Could not refresh admin profile:', e);
    }
  }

  await new Promise((resolve) => setTimeout(resolve, adminReloggedIn ? 300 : 800));
  useAuthStore.getState().setReauthenticating(false);

  return {
    success: true,
    uid: newUserUid,
    adminEmail: currentAdminEmail || undefined,
    adminReloggedIn,
    verificationEmailSent,
    verificationEmailError,
    message: adminReloggedIn
      ? `User created successfully! Tap Share to send credentials via WhatsApp or Email.`
      : `User created successfully! Please log in again as admin.`,
    credentials: { name: name.trim(), email: emailLower, password, role },
  };
}
