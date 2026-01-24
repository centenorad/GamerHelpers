import { createContext, useContext, useEffect, useState } from "react";
import { AuthAPI } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore user session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const response = await AuthAPI.getCurrentUser();
          setUser(response.user);
        }
      } catch (err) {
        console.error("Failed to restore session:", err);
        localStorage.removeItem("token");
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
      localStorage.setItem("token", response.token);
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
      localStorage.setItem("token", response.token);
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
      localStorage.setItem("token", response.token);
      setUser(response.user);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
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
