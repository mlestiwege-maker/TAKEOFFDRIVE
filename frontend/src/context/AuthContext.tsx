import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import * as authService from "../services/authService";
import { clearSession, getToken, setSession } from "../services/api";
import type { CurrentUser } from "../types/auth";

interface AuthContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithToken: (token: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      return;
    }
    try {
      const me = await authService.getMe();
      setUser(me);
    } catch {
      clearSession();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const loginWithToken = useCallback(
    async (token: string, role: string) => {
      setSession(token, role);
      await refreshUser();
    },
    [refreshUser]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Revocation is best-effort from the client's perspective — even if
      // this call fails (offline, expired token), we still clear the local
      // session below so the user is signed out on this device either way.
    }
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, isAuthenticated: !!user, loginWithToken, logout, refreshUser }),
    [user, isLoading, loginWithToken, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
