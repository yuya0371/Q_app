import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/auth';

interface AdminUser {
  userId: string;
  email: string;
  name: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: AdminUser | null;
  token: string | null;
  refreshToken: string | null;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,

      login: async (email: string, password: string) => {
        const response = await authService.login(email, password);

        if (!response.user) {
          throw new Error('ユーザー情報が見つかりません');
        }

        if (!response.user.isAdmin) {
          throw new Error('管理者権限がありません');
        }

        set({
          isAuthenticated: true,
          user: {
            userId: response.user.userId,
            email: response.user.email,
            name: response.user.displayName || '管理者',
          },
          token: response.idToken, // API GatewayはidTokenを必要とする
          refreshToken: response.refreshToken,
        });
      },

      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          refreshToken: null,
        });
      },

      refreshSession: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          get().logout();
          return;
        }
        try {
          const response = await authService.refresh(refreshToken);
          set({
            token: response.idToken, // API GatewayはidTokenを必要とする
          });
        } catch {
          get().logout();
        }
      },
    }),
    {
      name: 'admin-auth',
    }
  )
);
