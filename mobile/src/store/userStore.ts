import { create } from 'zustand';
import {
  getAllUsers,
  createUser as firebaseCreateUser,
  updateUser as firebaseUpdateUser,
  deleteUser as firebaseDeleteUser,
} from '../services/firebaseUsers';

export type UserRole = 'Super Admin' | 'Admin' | 'Manager' | 'Employee';
export type UserStatus = 'Active' | 'Inactive' | 'Blocked';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created: string;
}

interface UserState {
  users: AppUser[];
  isLoading: boolean;
  loadUsers: () => Promise<void>;
  addUser: (user: Omit<AppUser, 'id' | 'created'>) => Promise<void>;
  updateUser: (id: string, patch: Partial<AppUser>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  isLoading: false,
  loadUsers: async () => {
    set({ isLoading: true });
    try {
      const users = await getAllUsers();
      set({ users, isLoading: false });
    } catch (error) {
      console.error('Error loading users:', error);
      set({ isLoading: false });
    }
  },
  addUser: async (user: Omit<AppUser, 'id' | 'created'>) => {
    try {
      await firebaseCreateUser(user);
      await get().loadUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  },
  updateUser: async (id: string, patch: Partial<AppUser>) => {
    try {
      await firebaseUpdateUser(id, patch);
      await get().loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },
  deleteUser: async (id: string) => {
    try {
      await firebaseDeleteUser(id);
      await get().loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },
}));
