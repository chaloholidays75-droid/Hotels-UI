// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import Loader from "./loader";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useContext(AuthContext);

  // 🔄 Wait while AuthContext bootstraps (autoLogin, token refresh, etc.)
  if (isLoading) {
    return <Loader />;
  }

  // 🚫 If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/backend/login" replace />;
  }

  // ✅ Authorized → render protected content
  return children;
};

export default ProtectedRoute;
