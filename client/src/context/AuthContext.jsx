import React, { createContext, useState, useEffect } from 'react';
import { request, setInMemoryToken } from '../services/api.js';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if session is alive on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const profile = await request('/auth/me');
        if (profile && profile._id) {
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const loginCitizen = async (identifier, password) => {
    try {
      const data = await request('/auth/citizen/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });
      
      setInMemoryToken(data.token);
      setUser(data);
      return data;
    } catch (error) {
      console.error('Citizen Login error:', error);
      throw error;
    }
  };

  const registerCitizen = async (name, email, phone, password) => {
    try {
      const data = await request('/auth/citizen/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone, password }),
      });
      
      setInMemoryToken(data.token);
      setUser(data);
      return data;
    } catch (error) {
      console.error('Citizen Register error:', error);
      throw error;
    }
  };

  const loginAuthority = async (identifier, password) => {
    try {
      const data = await request('/auth/authority/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });
      
      setInMemoryToken(data.token);
      setUser(data);
      return data;
    } catch (error) {
      console.error('Official Login error:', error);
      throw error;
    }
  };

  const logoutUser = async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Logout endpoint error:', err.message);
    }
    setInMemoryToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      loginCitizen, 
      registerCitizen, 
      loginAuthority, 
      logoutUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
