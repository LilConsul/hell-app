import { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiRequest } from "@/lib/utils";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const lastFetchRef = useRef(0);
  const FETCH_INTERVAL = 30 * 1000;

  const fetchUser = async ({ signal } = {}) => {
    const now = Date.now();
    if (user && now - lastFetchRef.current < FETCH_INTERVAL) return;
    lastFetchRef.current = now;

    setLoading(true);
    try {
      const data = await apiRequest("/api/v1/users/me", { signal });
      setUser(data.data);
      sessionStorage.setItem('user', JSON.stringify(data.data));
    } catch (error) {
      if (error.name !== 'AbortError') {
        setUser(null);
        sessionStorage.removeItem('user');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { pathname } = location;
    const isVerificationPage = pathname.includes('/verify/');

    if (isVerificationPage) {
      setLoading(false);
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
      const result = await apiRequest('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });
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
      await apiRequest("/api/v1/auth/logout", { method: "POST", credentials: "include" });
      setUser(null);
      sessionStorage.removeItem('user');
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const updateUser = (userData) => {
    if (!userData) return;
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    sessionStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = useMemo(
    () => ({ 
      user, 
      loading, 
      isAuthenticated: !!user, 
      login, 
      logout, 
      refreshUser: fetchUser,
      updateUser
    }),
    [user, loading, login, logout, fetchUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};