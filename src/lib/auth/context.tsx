/**
 * Auth context provider.
 *
 * Combines Zustand store + React Query to provide:
 * - Current user state
 * - Login / logout actions
 * - Session validation on mount
 */
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { getMe, login as loginAPI, logout as logoutAPI } from "@/lib/api/auth";
import { getAccessToken, getRefreshToken, clearTokens } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth.store";
import type { LoginCredentials, User } from "@/types/user";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, setUser, setTokens, setLoading, clearAuth } =
    useAuthStore();

  // ── Session validation on mount ──────────────────────────────────────────
  useEffect(() => {
    const validateSession = async () => {
      const token = getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const me = await getMe();
        setUser(me);
      } catch {
        clearTokens();
        clearAuth();
      }
    };

    validateSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Login ────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setLoading(true);
      try {
        const response = await loginAPI(credentials);
        setTokens(response.access, response.refresh);
        setUser(response.user);
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    },
    [router, setLoading, setTokens, setUser]
  );

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    const refresh = getRefreshToken();
    if (refresh) {
      await logoutAPI(refresh).catch(() => null);
    }
    clearAuth();
    router.push("/login");
  }, [clearAuth, router]);

  const value = useMemo(
    () => ({ user, isAuthenticated, isLoading, login, logout }),
    [user, isAuthenticated, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
