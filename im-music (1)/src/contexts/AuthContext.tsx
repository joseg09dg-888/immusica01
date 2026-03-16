import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: () => void;
  logout: () => void;
  handleAuthCallback: (code: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('im_music_token'));

  useEffect(() => {
    if (token) {
      // Fetch user data if token exists
      api.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => logout());
    }
  }, [token]);

  const login = () => {
    window.location.href = `${api.defaults.baseURL}/auth/login`;
  };

  const logout = () => {
    localStorage.removeItem('im_music_token');
    setToken(null);
    setUser(null);
  };

  const handleAuthCallback = async (code: string) => {
    try {
      const response = await api.get(`/auth/callback?code=${code}`);
      const { token, user } = response.data;
      localStorage.setItem('im_music_token', token);
      setToken(token);
      setUser(user);
    } catch (error) {
      console.error('Error en autenticación:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, handleAuthCallback, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
