'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './api';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, captchaToken?: string | null, deviceFingerprint?: string | null) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        return;
      }
      
      const response: any = await api.getProfile();
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (error: any) {
      // Sadece 401 (geçersiz/süresi dolmuş token) durumunda çıkış yap
      // Network hatası veya sunucu hatalarında token'ı silme
      const status = error?.status || error?.response?.status;
      const message = error?.message || '';
      const isAuthError = status === 401 || message.includes('401') || message.includes('Unauthorized') || message.includes('Invalid token') || message.includes('jwt');
      
      if (isAuthError) {
        setUser(null);
        localStorage.removeItem('token');
      }
      // Diğer hatalarda (500, network vb.) mevcut user state'i koru
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string, captchaToken?: string | null, deviceFingerprint?: string | null) => {
    const response = await api.login(email, password, captchaToken, deviceFingerprint);
    if (response.success && response.data) {
      await refreshUser();
    }
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
