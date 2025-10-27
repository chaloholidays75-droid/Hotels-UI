import api from './apiInstance'; // Axios instance with interceptors

// ✅ LOGIN
export async function login(email, password, rememberMe = false) {
  console.log("🟦 Login attempt:", { email, rememberMe });

  try {
    const { data } = await api.post("/auth/login", { email, password, rememberMe });

    console.log("✅ Login successful:", data);
    alert(`Welcome ${data.userFullName || "User"}!`);

    return data;
  } catch (err) {
    console.error("❌ Login failed:", err.response?.data || err.message);
    alert(err.response?.data?.message || "Login failed. Please check your credentials.");
    throw err;
  }
}

// ✅ LOGOUT
export async function logoutApi() {
  console.log("🔸 Logout initiated...");

  try {
    await api.post("/auth/logout");
    console.log("✅ Logout successful");
    alert("You have been logged out successfully!");
  } catch (err) {
    console.error("❌ Logout failed:", err.response?.data || err.message);
    alert(err.response?.data?.message || "Logout failed. Please try again.");
  } finally {
    // Always clear tokens from both local & session storage
    localStorage.clear();
    sessionStorage.clear();
  }
}

// ✅ REGISTER
export async function register(firstName, lastName, email, password, role) {
  console.log("🟩 Register attempt:", { firstName, lastName, email, role });

  try {
    const { data } = await api.post("/auth/register", {
      firstName,
      lastName,
      email,
      password,
      role,
    });

    console.log("✅ Registration successful:", data);
    alert(`Registration successful! Welcome ${firstName}.`);
    return true;
  } catch (err) {
    console.error("❌ Registration failed:", err.response?.data || err.message);
    alert(err.response?.data?.message || "Registration failed. Please try again.");
    throw err;
  }
}

// ✅ FORGOT PASSWORD
export async function forgotPassword(email) {
  console.log("📧 Forgot password attempt:", email);

  try {
    await api.post("/auth/forgot-password", { email });
    console.log("✅ Forgot password email sent.");
    alert("If the email exists, password reset instructions were sent!");
    return true;
  } catch (err) {
    console.error("❌ Forgot password failed:", err.response?.data || err.message);
    alert(err.response?.data?.message || "Error sending reset email.");
    throw err;
  }
}

// ✅ RESET PASSWORD
export async function resetPassword(email, token, newPassword) {
  console.log("🔑 Reset password attempt:", { email, token });

  try {
    await api.post("/auth/reset-password", { email, token, newPassword });
    console.log("✅ Password reset successful.");
    alert("Your password has been reset successfully!");
    return true;
  } catch (err) {
    console.error("❌ Reset password failed:", err.response?.data || err.message);
    alert(err.response?.data?.message || "Password reset failed.");
    throw err;
  }
}

// ✅ CHECK AUTH
export async function checkAuth() {
  console.log("🟦 Checking authentication...");

  try {
    const { data } = await api.get("/auth/me");
    console.log("✅ Auth check success:", data);
    return {
      isAuthenticated: true,
      userFullName: data.fullName,
      userRole: data.role || "employee",
    };
  } catch (err) {
    console.error("❌ Auth check failed:", err.response?.status, err.message);
    return {
      isAuthenticated: false,
      userFullName: null,
      userRole: "employee",
    };
  }
}

export default api;
