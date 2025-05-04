import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchUser = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/users/me", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };


  useEffect(() => {
    const isVerificationPage = location.pathname.includes('/verify/');
    
    if (!isVerificationPage) {
      fetchUser();
    } else {
      setLoading(false);
      setInitialized(true);
    }
  }, [location.pathname]);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.detail || "An error occurred during login");
      }
      await fetchUser();      
      navigate("/dashboard");
      return true;
    } catch (error) {
      throw error;
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

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    initialized,
    login,
    logout,
    refreshUser: fetchUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};