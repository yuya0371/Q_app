import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

// SecureStore adapter for zustand persist
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

interface User {
  userId: string;
  email: string;
  appId?: string;
  displayName?: string;
  profileImageUrl?: string;
}

interface AuthState {
  // State
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;

  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setOnboardingComplete: () => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      user: null,
      accessToken: null,
      refreshToken: null,

      // Actions
      setAuth: (user, accessToken, refreshToken) =>
        set({
          isAuthenticated: true,
          user,
          accessToken,
          refreshToken,
          // Check if user has completed onboarding (has appId)
          hasCompletedOnboarding: !!user.appId,
        }),

      setOnboardingComplete: () =>
        set({
          hasCompletedOnboarding: true,
        }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      logout: () =>
        set({
          isAuthenticated: false,
          hasCompletedOnboarding: false,
          user: null,
          accessToken: null,
          refreshToken: null,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
