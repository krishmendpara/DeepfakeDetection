import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      const saved = localStorage.getItem('token');
      return (saved && saved !== 'null' && saved !== 'undefined') ? saved : null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return (saved && saved !== 'null' && saved !== 'undefined') ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      }).catch(() => {});
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  }, []);

  // Validate session on mount
  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      const savedToken = localStorage.getItem('token');
      if (!savedToken || savedToken === 'null' || savedToken === 'undefined') {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${savedToken}`
          },
          credentials: 'include'
        });

        if (res.ok) {
          const userData = await res.json();
          if (isMounted) {
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          }
        } else if (res.status === 401) {
          // Token expired or invalid
          if (isMounted) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Session restoration failed:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback((newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  // Authenticated fetch helper with auto 401 logout
  const apiFetch = useCallback(async (url, options = {}) => {
    const headers = {
      ...(options.headers || {})
    };

    const currentToken = token || localStorage.getItem('token');
    if (currentToken && currentToken !== 'null') {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });

    if (response.status === 401) {
      logout();
      window.history.pushState({}, '', '/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }

    return response;
  }, [token, logout]);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    loading,
    login,
    logout,
    apiFetch
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
