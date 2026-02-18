import { createUserWithEmailAndPassword, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../config/firebase';
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
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email address');
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
      const existingUserDoc = querySnapshot.docs[0].data();
      const existingUserUid = querySnapshot.docs[0].id;
      console.log('User already exists in Firestore:', existingUserUid, existingUserDoc);
      throw new Error(`This email "${emailLower}" is already registered. Please use a different email or edit the existing user from User Management.`);
    }
  } catch (queryError: any) {
    if (queryError.message && queryError.message.includes('already registered')) {
      useAuthStore.getState().setReauthenticating(false);
      throw queryError;
    }
    console.warn('Error checking existing user:', queryError);
  }

  // Create Firebase Auth user (this will automatically sign in as new user)
  let userCredential;
  let newUserUid: string;
  
  try {
    console.log('Creating Firebase Auth user:', email);
    userCredential = await createUserWithEmailAndPassword(auth, emailLower, password);
    newUserUid = userCredential.user.uid;
    console.log('Firebase Auth user created:', newUserUid);
  } catch (authError: any) {
    useAuthStore.getState().setReauthenticating(false);
    console.error('Firebase Auth error:', authError);
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

  // Create Firestore user doc
  const createdStr = formatDate(new Date());
  try {
    console.log('Creating Firestore user doc:', newUserUid);
    await setDoc(doc(db, 'users', newUserUid), {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      status: 'Active',
      created: createdStr,
    });
    console.log('Firestore user doc created successfully');
  } catch (firestoreError: any) {
    console.error('Firestore error:', firestoreError);
    useAuthStore.getState().setReauthenticating(false);
    try {
      await signOut(auth);
    } catch (e) {
      // Ignore
    }
    throw new Error(`Failed to create user profile: ${firestoreError.message || firestoreError.code}`);
  }

  // Sign out the new user, then re-login admin
  await signOut(auth);

  let adminReloggedIn = false;
  if (currentAdminEmail && adminProfile) {
    try {
      const storedPassword = await AsyncStorage.getItem(`admin_password_${currentAdminEmail}`);
      if (storedPassword) {
        await signInWithEmailAndPassword(auth, currentAdminEmail, storedPassword);
        adminReloggedIn = true;
        console.log('Admin re-logged in successfully');
      } else {
        console.warn('Admin password not found in storage');
      }
    } catch (reloginError: any) {
      console.error('Failed to re-login admin:', reloginError);
    }
  }

  await new Promise((resolve) => setTimeout(resolve, adminReloggedIn ? 500 : 1500));
  useAuthStore.getState().setReauthenticating(false);

  // Ensure auth store reflects admin after re-login (we skipped updates during flow)
  if (adminReloggedIn && auth.currentUser) {
    try {
      const { getCurrentUserProfile } = await import('../services/firebaseAuth');
      const adminUser = await getCurrentUserProfile();
      useAuthStore.setState({ user: adminUser, isLoading: false });
    } catch (e) {
      console.warn('Could not refresh admin profile:', e);
    }
  }

  return {
    success: true,
    uid: newUserUid,
    adminEmail: currentAdminEmail || undefined,
    adminReloggedIn,
    message: adminReloggedIn
      ? `User created successfully! Tap Share to send credentials via WhatsApp or Email.`
      : `User created successfully! Please log in again as admin.`,
    credentials: { name: name.trim(), email: emailLower, password, role },
  };
}
