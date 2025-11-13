// src/context/AuthContext.jsx
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  autoLogin,
  checkAuth,
  login as apiLogin,
  logoutApi,
  refreshTokens,
  getAccessExpiryMs
} from "../api/authApi";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef(null);

  // Refresh token timer
  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current)
      clearTimeout(refreshTimerRef.current);

    const exp = getAccessExpiryMs();
    if (!exp) return;

    const now = Date.now();
    const ms = Math.max(exp - now - 60_000, 5000);

    refreshTimerRef.current = setTimeout(async () => {
      try {
        const data = await refreshTokens();
        if (!data) return;
        scheduleRefresh();
      } catch {
        // fallback to cookie auto-login
        try {
          const auto = await autoLogin();
          if (auto) {
            setUser({
              name: auto.userFullName,
              role: auto.userRole ?? "Employee",
            });
            setIsAuthenticated(true);
            scheduleRefresh();
            return;
          }
        } catch {
          await doLogout(false);
        }
      }
    }, ms);
  }, []);

  // ---------------------------------------------------------
  // INITIAL AUTH CHECK (DO NOT RUN ON LOGIN PAGE)
  // ---------------------------------------------------------
  const bootstrap = useCallback(async () => {
    setIsLoading(true);

    const isLoginPage = window.location.pathname.includes("login");
    if (isLoginPage) {
      // DO NOT RUN checkAuth or autoLogin here!
      setIsLoading(false);
      return;
    }

    try {
      const res = await checkAuth();
      if (res.isAuthenticated) {
        setUser({
          name: res.userFullName,
          role: res.userRole ?? "Employee",
        });
        setIsAuthenticated(true);
        scheduleRefresh();
        setIsLoading(false);
        return;
      }

      const auto = await autoLogin();
      if (auto) {
        setUser({
          name: auto.userFullName,
          role: auto.userRole ?? "Employee",
        });
        setIsAuthenticated(true);
        scheduleRefresh();
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [scheduleRefresh]);

  useEffect(() => {
    bootstrap();
    return () => {
      if (refreshTimerRef.current)
        clearTimeout(refreshTimerRef.current);
    };
  }, [bootstrap]);

  // LOGIN
  const login = useCallback(
    async (email, password, rememberMe) => {
      const data = await apiLogin({ email, password, rememberMe });

      setUser({
        name: data.userFullName,
        role: data.userRole ?? "Employee",
      });
      setIsAuthenticated(true);
      scheduleRefresh();

      return true;
    },
    [scheduleRefresh]
  );

  // LOGOUT
  const doLogout = useCallback(async (callApi = true) => {
    try {
      if (callApi) await logoutApi();
    } catch {}

    setIsAuthenticated(false);
    setUser(null);
    if (refreshTimerRef.current)
      clearTimeout(refreshTimerRef.current);

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      login,
      logout: doLogout,
    }),
    [user, isAuthenticated, isLoading, login, doLogout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
