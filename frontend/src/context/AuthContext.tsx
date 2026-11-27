import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api, tokenStore } from '../lib/api';
import type { User } from '../lib/types';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  /** Confirms the email matches an account and returns a short-lived token
   * authorising a new password for it. Throws (404) if there is no match. */
  requestPasswordReset: (email: string) => Promise<string>;
  /** Spends that token to set a new password, and signs the account in. */
  resetPassword: (token: string, newPassword: string) => Promise<User>;
  logout: () => void;
  isAdmin: boolean;
  /** Admin or kitchen. Kitchen can work orders and nothing else. */
  isStaff: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type TokenResponse = { access_token: string; user: User };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<User>('/auth/me')
      .then(setUser)
      .catch(() => {
        tokenStore.clear();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener('camelia:unauthorized', onUnauthorized);
    return () => window.removeEventListener('camelia:unauthorized', onUnauthorized);
  }, []);

  const login = useCallback(async (email: string, password: string, remember = true) => {
    const data = await api.post<TokenResponse>('/auth/login', { email, password });
    tokenStore.set(data.access_token, remember);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const data = await api.post<TokenResponse>('/auth/register', { name, email, password });
    tokenStore.set(data.access_token);
    setUser(data.user);
    return data.user;
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const data = await api.post<{ token: string }>('/auth/forgot-password', { email });
    return data.token;
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    const data = await api.post<TokenResponse>('/auth/reset-password', { token, new_password: newPassword });
    tokenStore.set(data.access_token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      requestPasswordReset,
      resetPassword,
      logout,
      isAdmin: user?.role === 'admin',
      isStaff: user?.role === 'admin' || user?.role === 'kitchen',
    }),
    [user, loading, login, register, requestPasswordReset, resetPassword, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
