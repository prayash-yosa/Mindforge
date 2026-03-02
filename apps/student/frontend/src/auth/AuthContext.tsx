/**
 * Mindforge Client — Auth Context (Task 6.1)
 *
 * Manages authentication state.
 * Provides login/logout and token persistence via sessionStorage.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { api, setToken, clearToken, hasToken, ApiClientError } from '../api/client';
import type { LoginResponse } from '../api/types';

interface AuthState {
  isAuthenticated: boolean;
  studentName: string | null;
}

interface AuthContextValue extends AuthState {
  login: (mpin: string) => Promise<LoginResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: hasToken(),
    studentName: sessionStorage.getItem('mindforge_student_name'),
  });

  const login = useCallback(async (mpin: string): Promise<LoginResponse> => {
    const res = await api.post<LoginResponse>('/v1/auth/mpin/verify', { mpin });
    setToken(res.token);
    sessionStorage.setItem('mindforge_student_name', res.student.displayName);
    setState({ isAuthenticated: true, studentName: res.student.displayName });
    return res;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    sessionStorage.removeItem('mindforge_student_name');
    setState({ isAuthenticated: false, studentName: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { ApiClientError };
