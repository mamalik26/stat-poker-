import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthAPI } from '../services/authAPI';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    if (AuthAPI.isAuthenticated()) {
      const result = await AuthAPI.getCurrentUser();
      if (result.success) {
        setUser(result.data);
        setIsAuthenticated(true);
      } else {
        // Clear invalid token
        await AuthAPI.logout();
        setUser(null);
        setIsAuthenticated(false);
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    setLoading(false);
  };

  const login = async (credentials) => {
    const result = await AuthAPI.login(credentials);
    if (result.success) {
      setUser(result.data.user);
      setIsAuthenticated(true);
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  };

  const register = async (userData) => {
    const result = await AuthAPI.register(userData);
    if (result.success) {
      setUser(result.data.user);
      setIsAuthenticated(true);
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  };

  const logout = async () => {
    await AuthAPI.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const refreshUser = async () => {
    if (isAuthenticated) {
      const result = await AuthAPI.getCurrentUser();
      if (result.success) {
        setUser(result.data);
      }
    }
  };

  const hasActiveSubscription = () => {
    return user?.subscription_status === 'active' || user?.role === 'moderator' || user?.role === 'admin';
  };

  const isModerator = () => {
    return user?.role === 'moderator' || user?.role === 'admin';
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
    hasActiveSubscription,
    isModerator
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};