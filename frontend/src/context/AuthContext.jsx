import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getCurrentSession, logoutSession } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Para cuando ya tenemos el perfil en la mano (respuesta de /auth/session):
  // evita un GET /auth/me redundante justo después de iniciar sesión.
  const applySession = useCallback((sessionUser) => {
    setUser(sessionUser || null);
    setLoading(false);
    return sessionUser || null;
  }, []);

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
    <AuthContext.Provider value={{ user, loading, refreshAuth, applySession, logout, isAuthenticated: Boolean(user) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    return {
      user: null,
      loading: false,
      refreshAuth: async () => null,
      applySession: (sessionUser) => sessionUser || null,
      logout: async () => undefined,
      isAuthenticated: false,
    };
  }

  return context;
}