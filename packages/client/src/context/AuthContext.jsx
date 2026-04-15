import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  // Register 401 interceptor — logs out on any expired-token response
  useEffect(() => {
    api.onUnauthorized(logout);
    return () => api.onUnauthorized(null);
  }, [logout]);

  // On mount, if we have a token, fetch preferences and refresh the token
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .getPreferences(token)
      .then(async (data) => {
        setUser(data);
        // Silently refresh the token to extend the 7-day window
        try {
          const { token: newToken } = await api.refreshToken(token);
          localStorage.setItem('token', newToken);
          setToken(newToken);
        } catch { /* logout will be triggered by the 401 interceptor if needed */ }
        setLoading(false);
      })
      .catch(() => {
        // Token invalid — interceptor already called logout
        setLoading(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loginUser = async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const registerUser = async (email, password) => {
    const data = await api.register(email, password);
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const deleteAccount = async () => {
    try {
      await api.deleteAccount(token);
    } finally {
      logout();
    }
  };

  const updateUser = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginUser, registerUser, logout, deleteAccount, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
