import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getCurrentSession, logoutSession } from '../services/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    try {
      const response = await getCurrentSession();
      setUser(response.user);
      return response.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const logout = useCallback(async () => {
    await Promise.all([
      signOut(auth).catch(() => null),
      logoutSession().catch(() => null),
    ]);

    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshAuth, logout, isAuthenticated: Boolean(user) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}