// src/context/AuthContext.jsx
import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { autoLogin, checkAuth, login as apiLogin, logoutApi, refreshTokens, getAccessExpiryMs } from "../api/authApi";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);      // { name, role }
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef(null);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    const exp = getAccessExpiryMs();
    if (!exp) return;

    const now = Date.now();
    // refresh 60s before expiry (min clamp 5s)
    const ms = Math.max(exp - now - 60_000, 5_000);

    refreshTimerRef.current = setTimeout(async () => {
      try {
        const data = await refreshTokens();
        if (!data) return; // no refresh token -> maybe cookie-only; axios interceptor will handle 401s
        // re-schedule after successful refresh
        scheduleRefresh();
      } catch {
        // Try cookie auto-login as fallback
        try {
          const auto = await autoLogin();
          if (auto) {
            setUser({ name: auto.userFullName, role: auto.userRole || "Employee" });
            setIsAuthenticated(true);
            scheduleRefresh();
            return;
          }
        } catch {
          // finally give up
          await doLogout(false);
        }
      }
    }, ms);
  }, []);

  const bootstrap = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1) Check current session (works with header or cookie)
      const res = await checkAuth();
      if (res.isAuthenticated) {
        setUser({ name: res.userFullName, role: res.userRole || "Employee" });
        setIsAuthenticated(true);
        scheduleRefresh();
        return;
      }

      // 2) Not authenticated → try cookie auto-login
      const auto = await autoLogin();
      if (auto) {
        setUser({ name: auto.userFullName, role: auto.userRole || "Employee" });
        setIsAuthenticated(true);
        scheduleRefresh();
        return;
      }

      // 3) Still unauthenticated
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [scheduleRefresh]);

  useEffect(() => {
    bootstrap();
    return () => refreshTimerRef.current && clearTimeout(refreshTimerRef.current);
  }, [bootstrap]);

  const login = useCallback(async (email, password, rememberMe = false) => {
    const data = await apiLogin({ email, password, rememberMe });
    setUser({ name: data.userFullName, role: data.userRole || "Employee" });
    setIsAuthenticated(true);
    scheduleRefresh();
    return true;
  }, [scheduleRefresh]);

  const doLogout = useCallback(async (callApi = true) => {
    try {
      if (callApi) await logoutApi();
    } catch { /* ignore */ }
    setIsAuthenticated(false);
    setUser(null);
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    login,
    logout: doLogout,
  }), [user, isAuthenticated, isLoading, login, doLogout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
