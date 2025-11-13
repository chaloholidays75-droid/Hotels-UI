// src/api/authApi.js
// import api from "./apiInstance";

// Small helper to decode JWT exp (no external deps)
// const decodeJwt = (token) => {
//   try {
//     const payload = JSON.parse(atob(token.split(".")[1]));
//     return payload || {};
//   } catch {
//     return {};
//   }
// };

// export async function login(email, password, rememberMe = false) {
//   const { data } = await api.post("/auth/login", { email, password, rememberMe });

//   // Store header-mode tokens (cookies are set by server automatically)
//   if (data.accessToken) localStorage.setItem("accessToken", data.accessToken);
//   if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);

//   const { name, role } = extractUserFromToken(data.accessToken);
//   return { userFullName: data.userFullName || name, userRole: data.userRole || role };
// }


// export async function login({ email, password, rememberMe }) {
//   try {
//     console.log("🔍 Debug - Login attempt with:", { email, password, rememberMe });
//     console.log("🔍 Debug - Request URL:", "/auth/login");
    
//     const requestData = { email, password, rememberMe };
//     console.log("🔍 Debug - Request payload:", JSON.stringify(requestData));
    
//     const { data } = await api.post("/auth/login", requestData);

//     console.log("✅ Login successful", data);

//     // Save access token (if returned)
//     if (data?.accessToken) {
//       localStorage.setItem("accessToken", data.accessToken);
//       console.log("🔍 Debug - Access token saved");
//     }

//     // ✅ Save rememberToken as a secure cookie if backend sent it
//     if (data?.rememberToken) {
//       document.cookie = `rememberToken=${data.rememberToken}; Secure; SameSite=None; Domain=.chaloholidayonline.com; Path=/; Max-Age=${
//         30 * 24 * 60 * 60
//       }`;
//       console.log("🔍 Debug - Remember token cookie set");
//     }

//     return data;
//   } catch (err) {
//     console.error("❌ Login failed - Full error:", err);
//     console.error("❌ Login failed - Response data:", err.response?.data);
//     console.error("❌ Login failed - Response status:", err.response?.status);
//     console.error("❌ Login failed - Response headers:", err.response?.headers);
//     throw err;
//   }
// }
// export async function login({ email, password, rememberMe }) {
//   try {
//     console.log("🔐 Starting login process...");
//     console.log("➡️ Login request details:", {
//       email,
//       rememberMe,
//       password: password ? "(hidden)" : "(empty)"
//     });

//     const requestBody = { email, password, rememberMe };

//     console.log("📨 Sending POST request → /auth/login");
//     console.log("📦 Request body:", requestBody);

//     const { data } = await api.post("/auth/login", requestBody);

//     console.log("✅ Login successful. Server response:", data);

//     if (data?.accessToken) {
//       localStorage.setItem("accessToken", data.accessToken);
//       console.log("💾 Access token saved to localStorage.");
//     }

//     if (data?.refreshToken) {
//       localStorage.setItem("refreshToken", data.refreshToken);
//       console.log("💾 Refresh token saved to localStorage.");
//     }

//     console.log("🎉 Login completed successfully.");
//     return data;

//   } catch (err) {
//     console.error("❌ Login failed.");
//     console.error("⚠️ Reason:", err.message);
//     console.error("📌 Status Code:", err.response?.status);
//     console.error("📄 Server Response:", err.response?.data);
//     throw err;
//   }
// }


// export async function autoLogin() {
//   // uses rememberToken cookie; server returns fresh tokens
//   const { data } = await api.post("/auth/auto-login");
//   if (data.accessToken) localStorage.setItem("accessToken", data.accessToken);
//   if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
//   const { name, role } = extractUserFromToken(data.accessToken);
//   return { userFullName: data.userFullName || name, userRole: data.userRole || role };
// }

// export async function refreshTokens() {
//   const refreshToken = localStorage.getItem("refreshToken");
//   if (!refreshToken) return null;
//   const { data } = await api.post("/auth/refresh-token", { refreshToken });
//   if (data.accessToken) localStorage.setItem("accessToken", data.accessToken);
//   if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
//   return data;
// }

// export async function checkAuth() {
//   console.log("🟦 Checking authentication...");
//   try {
//     const { data } = await api.get("/auth/me");
//     return { isAuthenticated: true, userFullName: data.fullName, userRole: data.role || "employee" };
//   } catch (err) {
//     console.warn("❌ Auth check failed:", err?.response?.status, err?.message);
//     return { isAuthenticated: false, userFullName: null, userRole: "employee" };
//   }
// }

// export async function logoutApi() {
//   try {
//     await api.post("/auth/logout", {
//       refreshToken: localStorage.getItem("refreshToken") || undefined,
//     });
//   } finally {
//     localStorage.removeItem("accessToken");
//     localStorage.removeItem("refreshToken");
//   }
// }

// // Optional: register/forgot/reset
// export async function register(firstName, lastName, email, password, role) {
//   const { data } = await api.post("/auth/register", { firstName, lastName, email, password, role });
//   return data;
// }

// export async function forgotPassword(email) {
//   await api.post("/auth/forgot-password", { email });
//   return true;
// }

// export async function resetPassword(email, token, newPassword) {
//   await api.post("/auth/reset-password", { email, token, newPassword });
//   return true;
// }

// // Helpers
// function extractUserFromToken(accessToken) {
//   const payload = decodeJwt(accessToken || "");
//   const name =
//     payload?.FullName ||
//     payload?.name ||
//     [payload?.firstName, payload?.lastName].filter(Boolean).join(" ") ||
//     "";
//   const role = payload?.role || payload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
//   const exp = payload?.exp ? payload.exp * 1000 : null;
//   return { name, role, exp };
// }

// export function getAccessExpiryMs() {
//   const token = localStorage.getItem("accessToken");
//   const { exp } = extractUserFromToken(token);
//   return exp || null;
// }
// export default {
//   login,
//   autoLogin,
//   refreshTokens,
//   checkAuth,
//   logoutApi,
//   register,
//   forgotPassword,
//   resetPassword,
// };
// src/api/authApi.js
import api from "./apiInstance";

const decodeJwt = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
};

// ------------------------------
// LOGIN
// ------------------------------
export async function login({ email, password, rememberMe }) {
  try {
    const body = { email, password, rememberMe };
    const { data } = await api.post("/auth/login", body);

    if (data?.accessToken)
      localStorage.setItem("accessToken", data.accessToken);

    if (data?.refreshToken)
      localStorage.setItem("refreshToken", data.refreshToken);

    return data;
  } catch (err) {
    console.error("❌ Login failed:", err.response?.data);
    throw err;
  }
}

// ------------------------------
// CHECK AUTH  (🚨 Must throw on 401)
// ------------------------------
export async function checkAuth() {
  try {
    const { data } = await api.get("/auth/me");
    return {
      isAuthenticated: true,
      userFullName: data.fullName,
      userRole: data.role || "employee"
    };
  } catch (err) {
    if (err.response?.status === 401) {
      return {
        isAuthenticated: false,
        userFullName: null,
        userRole: "employee"
      };
    }
    throw err;
  }
}


// ------------------------------
// AUTO LOGIN (TRY ONCE ONLY)
// ------------------------------
export async function autoLogin() {
  try {
    const { data } = await api.post("/auth/auto-login");

    if (data?.accessToken)
      localStorage.setItem("accessToken", data.accessToken);

    if (data?.refreshToken)
      localStorage.setItem("refreshToken", data.refreshToken);

    return data;
  } catch (err) {
    if (err.response?.status === 401) {
      console.warn("⚠️ autoLogin() → rememberToken invalid. Returning null.");
      return null;   // IMPORTANT
    }
    throw err;
  }
}

export async function register(firstName, lastName, email, password, role) {
  const { data } = await api.post("/auth/register", {
    firstName,
    lastName,
    email,
    password,
    role
  });
  return data;
}

// ------------------------------
// REFRESH TOKENS (header-mode)
// ------------------------------
export async function refreshTokens() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) throw new Error("no-refresh-token");

  const { data } = await api.post("/auth/refresh-token", { refreshToken });

  if (data.accessToken)
    localStorage.setItem("accessToken", data.accessToken);

  if (data.refreshToken)
    localStorage.setItem("refreshToken", data.refreshToken);

  return data;
}

// ------------------------------
// LOGOUT
// ------------------------------
export async function logoutApi() {
  try {
    await api.post("/auth/logout", {
      refreshToken: localStorage.getItem("refreshToken"),
    });
  } finally {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
}

// ------------------------------
// USER TOKEN HELPERS
// ------------------------------
export function extractUserFromToken(accessToken) {
  const payload = decodeJwt(accessToken || "");
  const name =
    payload?.FullName ||
    payload?.name ||
    [payload?.firstName, payload?.lastName].filter(Boolean).join(" ") ||
    "";
  const role =
    payload?.role ||
    payload?.[
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
    ];
  const exp = payload?.exp ? payload.exp * 1000 : null;
  return { name, role, exp };
}

export function getAccessExpiryMs() {
  const token = localStorage.getItem("accessToken");
  const { exp } = extractUserFromToken(token);
  return exp || null;
}
export async function forgotPassword(email) {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(email, token, newPassword) {
  const { data } = await api.post("/auth/reset-password", {
    email,
    token,
    newPassword
  });
  return data;
}

// Default export
export default {
  login,
  autoLogin,
  register,
  refreshTokens,
  checkAuth,
  logoutApi,
  extractUserFromToken,
  getAccessExpiryMs,
  forgotPassword,
  resetPassword
};
