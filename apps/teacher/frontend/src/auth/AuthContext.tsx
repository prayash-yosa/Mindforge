import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { setToken, clearToken, hasToken } from '../api/client';

interface AuthState {
  isAuthenticated: boolean;
  teacherName: string | null;
  teacherId: string | null;
}

interface AuthContextValue extends AuthState {
  login: (token: string, name: string, id: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: hasToken(),
    teacherName: sessionStorage.getItem('mindforge_teacher_name'),
    teacherId: sessionStorage.getItem('mindforge_teacher_id'),
  });

  const login = useCallback((token: string, name: string, id: string) => {
    setToken(token);
    sessionStorage.setItem('mindforge_teacher_name', name);
    sessionStorage.setItem('mindforge_teacher_id', id);
    setState({ isAuthenticated: true, teacherName: name, teacherId: id });
  }, []);

  const logout = useCallback(() => {
    clearToken();
    sessionStorage.removeItem('mindforge_teacher_name');
    sessionStorage.removeItem('mindforge_teacher_id');
    setState({ isAuthenticated: false, teacherName: null, teacherId: null });
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
