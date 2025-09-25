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
          const { isAuthenticated, user } = await checkAuth(); // get full user object
          setIsAuthenticated(isAuthenticated);
          setUser({
            name: `${user.firstName} ${user.lastName}`, // combine names
            role: user.role || "Employee"               // use actual role
          });
        } catch {
          setIsAuthenticated(false);
          setUser(null);
        } finally {
          setIsLoading(false);
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
