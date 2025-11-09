'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import type { UserRecord, LoginPayload, RegisterPayload } from '../types/api';

interface AuthContextType {
  user: UserRecord | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const token = apiClient.getToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Убеждаемся, что токен установлен в клиенте
      apiClient.setToken(token);
      const userData = await apiClient.getMe();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      apiClient.setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (payload: LoginPayload) => {
    const tokenData = await apiClient.login(payload);
    apiClient.setToken(tokenData.access_token);
    await refreshUser();
  };

  const register = async (payload: RegisterPayload) => {
    await apiClient.register(payload);
    // После регистрации автоматически логинимся
    await login({ login: payload.login, password: payload.password });
  };

  const logout = () => {
    apiClient.setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
    >
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

