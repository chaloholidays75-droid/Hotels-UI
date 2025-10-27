import api from "../api/apiInstance";

/**
 * 🕒 Refresh JWT tokens every 15 min (for header-based users)
 */
export const scheduleTokenRefresh = () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    console.log("⏸ No refresh token found — skipping auto-refresh");
    return;
  }

  console.log("🟢 Starting silent JWT refresh every 15 min...");
  refreshTokenRequest();
  const interval = setInterval(refreshTokenRequest, 15 * 60 * 1000);
  return () => clearInterval(interval);
};

async function refreshTokenRequest() {
  try {
    console.log("♻️ Silent JWT token refresh...");
    const { data } = await api.post("/auth/refresh-token", {
      refreshToken: localStorage.getItem("refreshToken"),
    });
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    console.log("✅ Token refreshed silently");
  } catch (err) {
    console.warn("🔴 Silent refresh failed:", err.response?.data || err.message);
    localStorage.clear();
  }
}
