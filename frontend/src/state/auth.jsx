import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);
const STORAGE_KEY = 'mf_token';

export function AuthContextProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('mf_user');
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (token) localStorage.setItem(STORAGE_KEY, token); else localStorage.removeItem(STORAGE_KEY);
    if (user) localStorage.setItem('mf_user', JSON.stringify(user)); else localStorage.removeItem('mf_user');
  }, [token, user]);

  // Polling to check if user account has been deleted
  useEffect(() => {
    if (!token || !user) return;
    
    const checkUserStatus = async () => {
      try {
        await api.get('/auth/check-status');
      } catch (error) {
        if (error?.response?.status === 401 && 
            error?.response?.data?.error === 'Account deleted') {
          // User has been deleted, log them out and redirect
          setToken(null);
          setUser(null);
          window.location.replace('/account-deleted');
        }
      }
    };
    
    // Check every 3 seconds
    const interval = setInterval(checkUserStatus, 3000);
    return () => clearInterval(interval);
  }, [token, user]);

  const value = useMemo(() => ({
    token,
    user,
    isAuthenticated: Boolean(token),
    login: (tok, usr) => { setToken(tok); setUser(usr); },
    logout: () => { setToken(null); setUser(null); }
  }), [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}


