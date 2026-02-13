import { createContext, useContext, useEffect, useState } from "react";
import { AuthAPI } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // [SESSION MANAGEMENT] Restore user session on mount.
  // Uses sessionStorage (tab-scoped) so sessions do NOT persist across tabs.
  // Opening a new tab requires a fresh login, but refreshing keeps the session.
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (token) {
          const response = await AuthAPI.getCurrentUser();
          setUser(response.user);
        }
      } catch (err) {
        console.error("Failed to restore session:", err);
        sessionStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const register = async (email, password, fullName) => {
    try {
      setError(null);
      const response = await AuthAPI.register(email, password, fullName);
      // [SESSION MANAGEMENT] Store token in sessionStorage (tab-scoped, not shared across tabs)
      sessionStorage.setItem("token", response.token);
      setUser(response.user);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await AuthAPI.login(email, password);
      // [SESSION MANAGEMENT] Store token in sessionStorage (tab-scoped, not shared across tabs)
      sessionStorage.setItem("token", response.token);
      setUser(response.user);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const adminLogin = async (email, password) => {
    try {
      setError(null);
      const response = await AuthAPI.adminLogin(email, password);
      // [SESSION MANAGEMENT] Store token in sessionStorage (tab-scoped, not shared across tabs)
      sessionStorage.setItem("token", response.token);
      setUser(response.user);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    // [ADMIN AUDIT LOGS] If admin, log the logout action on the server
    try {
      const token = sessionStorage.getItem("token");
      if (token && user?.is_admin) {
        await AuthAPI.adminLogout();
      }
    } catch (err) {
      // Ignore errors during logout logging
    }
    // [SESSION MANAGEMENT] Clear sessionStorage token on logout
    sessionStorage.removeItem("token");
    setUser(null);
    setError(null);
  };

  // Determine user role
  const getRole = () => {
    if (!user) return null;
    if (user.is_admin === true || user.is_admin === "true") return "admin";
    if (user.is_employee) return "employee";
    return "user";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        register,
        login,
        adminLogin,
        logout,
        role: getRole(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
