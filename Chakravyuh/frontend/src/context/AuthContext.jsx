import React, { createContext, useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const normalizeRole = (role) => String(role || '').toLowerCase();

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken) {
      setToken(storedToken);
    }

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser({
        ...parsedUser,
        role: normalizeRole(parsedUser.role)
      });
    }
    
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Login failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setToken(data.access_token);
      setUser({
        id: data.user_id,
        name: data.name,
        email: email,
        role: normalizeRole(data.role),
      });

      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify({
        id: data.user_id,
        name: data.name,
        email: email,
        role: normalizeRole(data.role),
      }));

      return data;
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error(`Cannot connect to backend at ${API_URL}. Please ensure the backend is running.`);
      }
      throw error;
    }
  }, [API_URL]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
