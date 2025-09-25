// context/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";
import { checkAuth } from "../api/authApi";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { name, role }
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);


useEffect(() => {
  const verifyAuth = async () => {
    try {
      const response = await checkAuth(); // call API
      console.log("Raw user data from backend:", response); // ✅ log full response

      const { isAuthenticated, user } = response;
      setIsAuthenticated(isAuthenticated);

      // Construct user object for frontend
      setUser({
        name: `${user.firstName} ${user.lastName}`,
        role: user.role || "Employee"
      });

    } catch (err) {
      console.error("Auth check failed:", err);
      setIsAuthenticated(false);
      setUser(null);
    }
  };
  verifyAuth();
}, []);




  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
