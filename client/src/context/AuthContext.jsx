import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { canUser } from '../utils/permissions';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('adminsphere_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('adminsphere_token'));
  const [loading, setLoading] = useState(true);

  // Validate session on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('adminsphere_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('adminsphere_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Session verification failed, logging out:', err.message);
          localStorage.removeItem('adminsphere_token');
          localStorage.removeItem('adminsphere_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('adminsphere_token', newToken);
      localStorage.setItem('adminsphere_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      return newUser;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout API call failed:', err.message);
    } finally {
      localStorage.removeItem('adminsphere_token');
      localStorage.removeItem('adminsphere_user');
      setUser(null);
      setToken(null);
      window.location.href = '/login';
    }
  };

  const updateCurrentUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('adminsphere_user', JSON.stringify(updatedUser));
  };

  const checkPermission = (perm) => canUser(user, perm);

  const checkRole = (roles) => {
    if (!user || !user.role) return false;
    if (user.role.name === 'Super Admin') return true;
    const allowed = Array.isArray(roles) ? roles : [roles];
    return allowed.includes(user.role.name);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        login,
        logout,
        updateCurrentUser,
        canUser: checkPermission,
        hasRole: checkRole
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
