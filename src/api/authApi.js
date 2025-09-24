import api from './apiInstance'; // Axios instance with interceptors

// ✅ Login
export async function login(email, password) {
  try {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('userRole', data.userRole || 'employee'); // save role
    return { userFullName: data.userFullName, accessToken: data.accessToken };
  } catch (err) {
    console.error('Login failed:', err.response?.data || err.message);
    throw new Error(err.response?.data?.message || 'Login failed');
  }
}

// ✅ Register
export async function register(firstName, lastName, email, password) {
  try {
    await api.post('/auth/register', { firstName, lastName, email, password , role }); 
    return true;
  } catch (err) {
    console.error('Registration failed:', err.response?.data || err.message);
    throw new Error(err.response?.data?.message || 'Registration failed');
  }
}

// ✅ Forgot Password
export async function forgotPassword(email) {
  try {
    await api.post('/auth/forgot-password', { email });
    return true;
  } catch (err) {
    console.error('Forgot password failed:', err.response?.data || err.message);
    throw new Error(err.response?.data?.message || 'Forgot password failed');
  }
}

// ✅ Reset Password
export async function resetPassword(email, token, newPassword) {
  try {
    await api.post('/auth/reset-password', { email, token, newPassword });
    return true;
  } catch (err) {
    console.error('Reset password failed:', err.response?.data || err.message);
    throw new Error(err.response?.data?.message || 'Reset password failed');
  }
}

// ✅ Check auth (get current user)
export async function checkAuth() {
  try {
    const { data } = await api.get('/auth/me');
    return { isAuthenticated: true, userFullName: data.fullName, userRole: data.role || 'employee' };
  } catch (err) {
    console.error('Auth check failed:', err.response?.status, err.message);
    return { isAuthenticated: false, userFullName: null, userRole: 'employee' };
  }
}
export default api;