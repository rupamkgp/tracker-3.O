import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('tracker_token') || null);
  const [isLoading, setIsLoading] = useState(!localStorage.getItem('tracker_token'));
  const [onboardingCompleted, setOnboardingCompleted] = useState(localStorage.getItem('onboardingCompleted') === 'true');

  const authBaseUrl = typeof window !== 'undefined' ? `${window.location.origin}/auth` : '/auth';

  // Verify token and get session
  useEffect(() => {
    const fetchSession = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch(`${authBaseUrl}/get-session`, {
          // The browser will now send the better-auth.session_token cookie automatically
        });
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Server returned an invalid response (not JSON). Check your proxy or Netlify deployment.");
          }
          const data = await res.json();
          setUser(data.user);
          
          // Sync profile to our backend (Our backend uses the JWT token)
          const syncRes = await fetch('/api/profiles/sync', {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ email: data.user.email })
          });
          
          if (syncRes.ok) {
             const syncData = await syncRes.json();
             const isCompleted = syncData.profile?.onboarding_completed || false;
             setOnboardingCompleted(isCompleted);
             localStorage.setItem('onboardingCompleted', isCompleted);
          }
        } else {
          setToken(null);
          localStorage.removeItem('tracker_token');
          localStorage.removeItem('onboardingCompleted');
        }
      } catch (err) {
        console.error('Session error', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSession();
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch(`${authBaseUrl}/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error("Non-JSON response:", text);
      throw new Error('Server returned an invalid response. Your Netlify proxy rules might not be deployed yet.');
    }
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    
    setToken(data.token); // Save the JWT access token for our backend API
    localStorage.setItem('tracker_token', data.token);
  };

  const signup = async (email, password, name) => {
    const res = await fetch(`${authBaseUrl}/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error("Non-JSON response:", text);
      throw new Error('Server returned an invalid response. Your Netlify proxy rules might not be deployed yet.');
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Signup failed');
    
    setToken(data.token); // Save the JWT access token for our backend API
    localStorage.setItem('tracker_token', data.token);
  };

  const logout = async () => {
    await fetch(`${authBaseUrl}/sign-out`, { method: 'POST' });
    setToken(null);
    setUser(null);
    localStorage.removeItem('tracker_token');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, isLoading, login, signup, logout, onboardingCompleted, setOnboardingCompleted }}>
      {children}
    </AuthContext.Provider>
  );
};
