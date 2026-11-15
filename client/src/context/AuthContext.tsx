import React, { createContext, useContext, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { invalidateAdminBusinesses } from '../services/adminBusinessCache';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'CLIENT' | 'EMPLOYEE';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  redirectByRole: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isTokenExpired = (token: string): boolean => {
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
};

const readStoredSession = (): { token: string | null; user: User | null } => {
  try {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser && !isTokenExpired(storedToken)) {
      return { token: storedToken, user: JSON.parse(storedUser) as User };
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch {
    // localStorage bloqueado o JSON corrupto: se trata como sesión inexistente
  }
  return { token: null, user: null };
};

export const redirectByRole = (role: User['role']): string => {
  switch (role) {
    case 'ADMIN':     return '/dashboard/admin';
    case 'EMPLOYEE':  return '/dashboard/employee';
    case 'CLIENT':    return '/dashboard';
    default:          return '/home';
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Lazy initial state: se lee localStorage ANTES del primer render.
  // Si se hiciera en un useEffect, el primer render tendría user = null y
  // PrivateRoute redirigiría a /login al recargar cualquier página protegida.
  const [session] = useState(readStoredSession);
  const [user, setUser] = useState<User | null>(session.user);
  const [token, setToken] = useState<string | null>(session.token);

  const login = async (token: string, user: User) => {
    setToken(token);
    setUser(user);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    invalidateAdminBusinesses();
  };

  const redirectByRoleCtx = () => redirectByRole(user?.role ?? 'CLIENT');

  return (
    <AuthContext.Provider value={{ user, token, login, logout, redirectByRole: redirectByRoleCtx }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
