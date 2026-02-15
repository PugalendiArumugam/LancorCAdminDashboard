"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export type UserType = "ADMIN" | "EC" | "OWNER" | "TENANT" | "STAFF" | "SECURITY";

export interface User {
  user_id: string;
  society_id: string;
  full_name: string;
  email: string;
  phone: string;
  user_type: UserType;
  is_active: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (response: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "lancorc_auth";
const EXPIRATION_MS = 48 * 60 * 60 * 1000;

interface StoredAuth {
  user: User;
  token: string;
  timestamp: number;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const parsed: StoredAuth = JSON.parse(stored);
        const now = Date.now();
        if (now - parsed.timestamp > EXPIRATION_MS) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        } else {
          setUser(parsed.user);
          setToken(parsed.token);
        }
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const login = useCallback((response: AuthResponse) => {
    const stored: StoredAuth = {
      user: response.user,
      token: response.token,
      timestamp: Date.now(),
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(stored));
    setUser(response.user);
    setToken(response.token);
  }, []);

  const isAdmin = user?.user_type === "ADMIN";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isAdmin,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
