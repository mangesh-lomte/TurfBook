import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; fullName: string; phone?: string; role?: Role }) => Promise<void>;
  logout: () => Promise<void>;
  demoLogin: (role: Role) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_CREDENTIALS = {
  ADMIN: { email: 'admin@turfbook.com', password: 'Admin@123456' },
  OWNER: { email: 'owner@turfbook.com', password: 'Owner@123456' },
  CUSTOMER: { email: 'customer@turfbook.com', password: 'Customer@123456' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('turfbook_access_token');
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const data = await api.get<User>('/auth/me');
      setUser(data);
      localStorage.setItem('turfbook_user', JSON.stringify(data));
    } catch {
      setUser(null);
      localStorage.removeItem('turfbook_access_token');
      localStorage.removeItem('turfbook_user');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    const handleLogoutEvent = () => {
      setUser(null);
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/login', {
        email,
        password,
      });

      localStorage.setItem('turfbook_access_token', res.accessToken);
      localStorage.setItem('turfbook_user', JSON.stringify(res.user));
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { email: string; password: string; fullName: string; phone?: string; role?: Role }) => {
    setIsLoading(true);
    try {
      const res = await api.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/register', data);
      localStorage.setItem('turfbook_access_token', res.accessToken);
      localStorage.setItem('turfbook_user', JSON.stringify(res.user));
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Continue client cleanup even if network fails
    } finally {
      localStorage.removeItem('turfbook_access_token');
      localStorage.removeItem('turfbook_user');
      setUser(null);
    }
  };

  const demoLogin = async (role: Role) => {
    const creds = DEMO_CREDENTIALS[role];
    if (creds) {
      await login(creds.email, creds.password);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        demoLogin,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
