'use client';

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';

const AUTH_STORAGE_KEY = 'calcutta_auth';

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  role?: string;
  shopCode?: string;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

type AuthContextValue = AuthState & {
  setAuth: (token: string, user: AuthUser | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getStoredAuth(): Pick<AuthState, 'token' | 'user'> {
  if (typeof window === 'undefined') return { token: null, user: null };
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return { token: null, user: null };
    const { token, user } = JSON.parse(stored);
    return { token: token || null, user: user || null };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  /** Runs before paint so AuthGuard is not stuck on a blurred overlay after hydration. */
  useLayoutEffect(() => {
    const { token, user } = getStoredAuth();
    setState({
      token,
      user,
      isAuthenticated: !!token,
      isLoading: false,
    });
  }, []);

  const setAuth = useCallback((token: string, user: AuthUser | null) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user }));
    setState({
      token,
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setState({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      setAuth,
      logout,
    }),
    [state, setAuth, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
