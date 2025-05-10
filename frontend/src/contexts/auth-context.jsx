import { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Data for fetch frequency safety logic
  const lastFetchRef = useRef(0);
  const FETCH_INTERVAL = 30 * 1000;

  const fetchUser = async ({ signal } = {}) => {
    const now = Date.now();
    if (user && now - lastFetchRef.current < FETCH_INTERVAL) {
      return;
    }
    lastFetchRef.current = now;

    setLoading(true);
    try {
      const response = await fetch("/api/v1/users/me", {
        credentials: "include",
        signal,
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        setUser(null);
      }
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  useEffect(() => {
    const { pathname } = location;
    const isVerificationPage = pathname.includes('/verify/');
  
    if (isVerificationPage) {
      setLoading(false);
      setInitialized(true);
      return;
    }
  
    const controller = new AbortController();
    fetchUser({ signal: controller.signal });
    return () => controller.abort();
  }, [location.pathname]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchUser();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);
  
  

  const login = async (credentials) => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include',
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "Login error");
      lastFetchRef.current = 0;
      await fetchUser();
      navigate("/dashboard");
      return true;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      initialized,
      login,
      logout,
      refreshUser: fetchUser,
    }),
    [user, loading, initialized, login, logout, fetchUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
