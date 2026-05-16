import { create } from 'zustand';
import { authApi, profileApi } from '../../shared/api';
import { loginAnonymously, getToken, onAuth } from '../../shared/api/firebase';
import type { UserProfile } from '../../shared/types';

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  init: () => void;
  sync: () => Promise<void>;
  updateUser: (data: Partial<UserProfile>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  error: null,

  init: () => {
    onAuth(async (fbUser) => {
      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          const res = await authApi.sync(token);
          set({ user: res.data, isLoading: false, error: null });
        } catch {
          set({ error: 'Sync failed', isLoading: false });
        }
      } else {
        // Auto login as guest
        get()
          .sync()
          .finally(() => set({ isLoading: false }));
      }
    });
  },

  sync: async () => {
    try {
      await loginAnonymously();
      const token = await getToken();
      if (!token) throw new Error('No token');
      const res = await authApi.sync(token);
      set({ user: res.data, error: null });
    } catch (err) {
      console.error('Sync error:', err);
      set({ error: 'Profile synchronization failed' });
      throw err;
    }
  },

  updateUser: (data) => set((state) => ({ user: state.user ? { ...state.user, ...data } : null })),
}));
