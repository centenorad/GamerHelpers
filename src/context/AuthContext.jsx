import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [type, setType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedType = localStorage.getItem("type");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setType(storedType);
    }
    setLoading(false);
  }, []);

  const loginUser = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("type", "regular");
    setUser(userData);
    setType("regular");
  };

  const loginAdmin = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("type", "admin");
    setUser(userData);
    setType("admin");
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("type");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, type, loginUser, loginAdmin, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
