// context/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";
import { checkAuth, logoutApi } from "../api/authApi"; // logoutApi will call your backend

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { name, role }
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await checkAuth();
        console.log("Raw user data from backend:", response);
        const { isAuthenticated, userFullName, userRole } = response;
        setIsAuthenticated(isAuthenticated);
        setUser({ name: userFullName, role: userRole || "Employee" });
      } catch (err) {
        console.error("Auth check failed:", err);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    verifyAuth();
  }, []);

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await logoutApi({ refreshToken }); // call backend to revoke
      }
    } catch (err) {
      console.error("Logout API failed:", err);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
