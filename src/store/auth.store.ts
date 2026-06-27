/**
 * Zustand auth store.
 *
 * Manages client-side auth state: user, tokens, and loading state.
 * Persists to localStorage for cross-tab session sharing.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, AuthState } from "@/types/user";

interface AuthActions {
  setUser: (user: User | null) => void;
  setTokens: (access: string, refresh: string) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,

      setUser: (user) =>
        set({ user, isAuthenticated: !!user, isLoading: false }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setLoading: (isLoading) => set({ isLoading }),

      clearAuth: () =>
        set({
          ...initialState,
          isLoading: false,
        }),
    }),
    {
      name: "eoms-auth",
      storage: createJSONStorage(() => localStorage),
      // Only persist non-sensitive state
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // NOTE: tokens are stored in cookies by the API client, not here
      }),
    }
  )
);
