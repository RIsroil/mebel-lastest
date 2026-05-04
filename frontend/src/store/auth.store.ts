import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile, TokenPair } from '@/types/auth.types'

interface AuthState {
  user: UserProfile | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
}

interface AuthActions {
  setAuth: (tokens: TokenPair, user: UserProfile) => void
  setTokens: (tokens: TokenPair) => void
  setUser: (user: UserProfile) => void
  logout: () => void
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      ...initialState,

      setAuth: (tokens, user) =>
        set({ ...tokens, user, isAuthenticated: true }),

      setTokens: (tokens) =>
        set({ ...tokens }),

      setUser: (user) =>
        set({ user }),

      logout: () =>
        set({ ...initialState }),
    }),
    {
      name: 'mebel-auth',
      // localStorage'da faqat tokenlar va user saqlanadi
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
