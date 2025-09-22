// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    name: localStorage.getItem("userFullName") || "User",
    role: localStorage.getItem("userRole") || "Guest",
  });

  // Keep localStorage and state in sync
  useEffect(() => {
    localStorage.setItem("userFullName", user.name);
    localStorage.setItem("userRole", user.role);
  }, [user]);

  const loginUser = (data) => {
    setUser({ name: data.userFullName, role: data.role });
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
  };

  const logoutUser = () => {
    setUser({ name: "User", role: "Guest" });
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};
