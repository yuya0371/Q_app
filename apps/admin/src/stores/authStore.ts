import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AdminUser {
  email: string
  name: string
}

interface AuthState {
  isAuthenticated: boolean
  user: AdminUser | null
  token: string | null

  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,

      login: async (email: string, password: string) => {
        // TODO: Implement actual Cognito authentication
        // For now, simulate login
        if (email && password) {
          set({
            isAuthenticated: true,
            user: { email, name: '管理者' },
            token: 'mock-token',
          })
        }
      },

      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
        })
      },
    }),
    {
      name: 'admin-auth',
    }
  )
)
