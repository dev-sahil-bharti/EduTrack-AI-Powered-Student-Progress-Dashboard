import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { userService } from '../services/user.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const storedToken = localStorage.getItem('token');
  const initialToken = storedToken && storedToken !== 'undefined' ? storedToken : null;
  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const userData = await userService.getProfile();
          // Assuming user profile is returned in data.data or directly
          setUser(userData.data || userData);
        } catch (error) {
          console.error('Failed to fetch user:', error);
          setToken(null);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    const { token, ...user } = res.data;
    setToken(token);
    setUser(user);
    localStorage.setItem('token', token);
    return res;
  };

  const register = async (userData) => {
    const res = await authService.register(userData);
    const { token, ...user } = res.data;
    setToken(token);
    setUser(user);
    localStorage.setItem('token', token);
    return res;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const updateUserProfile = async (profileData) => {
    const res = await userService.updateProfile(profileData);
    setUser(prev => ({ ...prev, ...res.data }));
    return res;
  };

  const loginWithGoogle = async (credential) => {
    const res = await authService.loginWithGoogle(credential);
    const { token, ...user } = res.data;
    setToken(token);
    setUser(user);
    localStorage.setItem('token', token);
    return res;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginWithGoogle, register, logout, updateUserProfile }}>
      {!loading && children}
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
