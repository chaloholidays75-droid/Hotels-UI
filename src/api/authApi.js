// src/api/authApi.js
import api from "./apiInstance";

// Small helper to decode JWT exp (no external deps)
const decodeJwt = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload || {};
  } catch {
    return {};
  }
};

export async function login(email, password, rememberMe = false) {
  const { data } = await api.post("/auth/login", { email, password, rememberMe });

  // Store header-mode tokens (cookies are set by server automatically)
  if (data.accessToken) localStorage.setItem("accessToken", data.accessToken);
  if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);

  const { name, role } = extractUserFromToken(data.accessToken);
  return { userFullName: data.userFullName || name, userRole: data.userRole || role };
}

export async function autoLogin() {
  // uses rememberToken cookie; server returns fresh tokens
  const { data } = await api.post("/auth/auto-login");
  if (data.accessToken) localStorage.setItem("accessToken", data.accessToken);
  if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
  const { name, role } = extractUserFromToken(data.accessToken);
  return { userFullName: data.userFullName || name, userRole: data.userRole || role };
}

export async function refreshTokens() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;
  const { data } = await api.post("/auth/refresh-token", { refreshToken });
  if (data.accessToken) localStorage.setItem("accessToken", data.accessToken);
  if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
  return data;
}

export async function checkAuth() {
  console.log("🟦 Checking authentication...");
  try {
    const { data } = await api.get("/auth/me");
    return { isAuthenticated: true, userFullName: data.fullName, userRole: data.role || "employee" };
  } catch (err) {
    console.warn("❌ Auth check failed:", err?.response?.status, err?.message);
    return { isAuthenticated: false, userFullName: null, userRole: "employee" };
  }
}

export async function logoutApi() {
  try {
    await api.post("/auth/logout", {
      refreshToken: localStorage.getItem("refreshToken") || undefined,
    });
  } finally {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
}

// Optional: register/forgot/reset
export async function register(firstName, lastName, email, password, role) {
  const { data } = await api.post("/auth/register", { firstName, lastName, email, password, role });
  return data;
}

export async function forgotPassword(email) {
  await api.post("/auth/forgot-password", { email });
  return true;
}

export async function resetPassword(email, token, newPassword) {
  await api.post("/auth/reset-password", { email, token, newPassword });
  return true;
}

// Helpers
function extractUserFromToken(accessToken) {
  const payload = decodeJwt(accessToken || "");
  const name =
    payload?.FullName ||
    payload?.name ||
    [payload?.firstName, payload?.lastName].filter(Boolean).join(" ") ||
    "";
  const role = payload?.role || payload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
  const exp = payload?.exp ? payload.exp * 1000 : null;
  return { name, role, exp };
}

export function getAccessExpiryMs() {
  const token = localStorage.getItem("accessToken");
  const { exp } = extractUserFromToken(token);
  return exp || null;
}
export default {
  login,
  autoLogin,
  refreshTokens,
  checkAuth,
  logoutApi,
  register,
  forgotPassword,
  resetPassword,
};
