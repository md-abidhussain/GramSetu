import React, { createContext, useCallback, useEffect, useState } from 'react';
import { request, SESSION_EXPIRED_EVENT } from '../services/api.js';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Is there a live session (HttpOnly cookie) already?
  useEffect(() => {
    let cancelled = false;
    request('/auth/me')
      .then((profile) => {
        if (!cancelled) {
          if (profile?._id) {
            setUser(profile);
          } else {
            setUser((current) => current || null);
          }
        }
      })
      .catch(() => {
        // Do not wipe out a user if signIn() succeeded while /auth/me was resolving
        if (!cancelled) {
          setUser((current) => current || null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // When a verified 401 confirms the session ended, drop the user so route guards send them to sign in.
  useEffect(() => {
    const onExpired = () => {
      setUser((current) => {
        if (current) setSessionExpired(true);
        return null;
      });
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const signIn = useCallback(async (endpoint, body) => {
    const data = await request(endpoint, { method: 'POST', body: JSON.stringify(body) });
    setSessionExpired(false);
    setUser(data);
    setLoading(false);
    return data;
  }, []);

  const loginCitizen = (identifier, password) => signIn('/auth/citizen/login', { identifier, password });
  const registerCitizen = (name, email, phone, password) => signIn('/auth/citizen/register', { name, email, phone, password });
  const loginAuthority = (identifier, password) => signIn('/auth/authority/login', { identifier, password });

  const logoutUser = async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch {
      // Signing out locally still happens if the server cannot be reached.
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, sessionExpired, loginCitizen, registerCitizen, loginAuthority, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};
