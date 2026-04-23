import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getCurrentUserProfile, loginWithEmail, logout as firebaseLogout, signupWithEmail } from '../services/firebaseAuth';

export type Role = 'Super Admin' | 'Admin' | 'Manager' | 'Employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  /** True during admin re-login after user creation; prevents auth reset */
  isReauthenticating: boolean;
  setReauthenticating: (v: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: Role) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isReauthenticating: false,
  setReauthenticating: (v) => set({ isReauthenticating: v }),
  login: async (email: string, password: string) => {
    const user = await loginWithEmail(email, password);
    set({ user, isLoading: false });
  },
  signup: async (email: string, password: string, name: string, role: Role) => {
    await signupWithEmail(email, password, name, role);
    // Do NOT set user — they must verify email before accessing the app
    set({ isLoading: false });
  },
  logout: async () => {
    await firebaseLogout();
    set({ user: null, isLoading: false });
  },
  checkAuth: () => {
    set({ isLoading: true });
    onAuthStateChanged(auth, async (firebaseUser) => {
      // During user creation, ignore auth changes (admin re-login flow)
      if (useAuthStore.getState().isReauthenticating) return;
      if (firebaseUser) {
        // Block unverified users from accessing the app
        if (!firebaseUser.emailVerified) {
          set({ user: null, isLoading: false });
          return;
        }
        try {
          const user = await getCurrentUserProfile();
          if (user !== null) {
            set({ user, isLoading: false });
          } else {
            // Profile returned null but Firebase session is still valid.
            // Keep existing user to avoid spurious logout (e.g. token refresh race on iOS).
            const current = useAuthStore.getState().user;
            set({ user: current ?? null, isLoading: false });
          }
        } catch (err) {
          // On transient error, keep existing user to avoid logout
          const current = useAuthStore.getState().user;
          set({ user: current ?? null, isLoading: false });
        }
      } else {
        set({ user: null, isLoading: false });
      }
    });
  },
}));

