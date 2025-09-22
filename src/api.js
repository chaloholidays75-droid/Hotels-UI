import axios from 'axios';

// Create a unified Axios instance for ALL API calls
const api = axios.create({
  baseURL: 'https://backend.chaloholidayonline.com/api',
});

// Axios interceptor for adding JWT token to ALL requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Axios interceptor for refreshing tokens on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await api.post('/auth/refresh-token', { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          localStorage.setItem('userRole', data.role);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userRole');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

// ✅ Get all hotel sales - UPDATED to use axios
export async function getHotelSales() {
  const response = await api.get('/hotels');
  return response.data;
}

// ✅ Get by Id - UPDATED
export async function getHotelSaleById(id) {
  const response = await api.get(`/hotels/${id}`);
  return response.data;
}

// ✅ Create new - UPDATED
export async function createHotelSale(data) {
  const response = await api.post('/hotels', data);
  return response.data;
}

// ✅ Update - UPDATED
export async function updateHotelSale(id, data) {
  const response = await api.put(`/hotels/${id}`, data);
  return response.data;
}

// ✅ Delete - UPDATED
export async function deleteHotelSale(id) {
  const response = await api.delete(`/hotels/${id}`);
  return response.data;
}

// ✅ Update hotel status - FIXED to match backend expectation
export async function updateHotelStatus(id, isActive) {
  const response = await api.patch(`/hotels/${id}/status`, { isActive });
  return response.data;
}

// Auth functions
export async function checkAuth() {
  try {
    const response = await api.get('/auth/me');
    const data = response.data;
    
    if (data.role) {
      localStorage.setItem('userRole', data.role);
    }
    if (data.fullName) {
      localStorage.setItem('userFullName', data.fullName);
    }
    
    return { 
      isAuthenticated: true, 
      userFullName: data.fullName,
      role: data.role 
    };
  } catch (error) {
    console.error('Auth check failed:', error);
    return { isAuthenticated: false, userFullName: null, role: null };
  }
}

// Auth: Login
export async function login(email, password) {
  try {
    const { data } = await api.post('/auth/login', { email, password });

    console.log('Login API Response:', data);
    console.log('Role from API:', data.role);
    
    
    // Store tokens AND user role
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('userRole', data.role); // ← ADD THIS LINE
    localStorage.setItem('userFullName', data.userFullName); // Optional: store name too
    
    return { 
      userFullName: data.userFullName, 
      accessToken: data.accessToken,
      role: data.role // ← Also return role
    };
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Login failed. Check server.');
  }
}

// Auth: Register
export async function register(firstName, lastName, email, password) {
  try {
    console.log("📡 Sending Register request to:", `${API_BASE}/auth/register`);
    console.log("📦 Payload:", { firstName, lastName, email, password });

    await api.post('/auth/register', { firstName, lastName, email, password });
    return true;
  } catch (error) {
    console.error("❌ Registration failed for:", `${API_BASE}/auth/register`);
    console.error("Response:", error.response?.data);
    console.error("Status:", error.response?.status);
    throw new Error('Registration failed');
  }
}


// Auth: Forgot Password
export async function forgotPassword(email) {
  try {
    await api.post('/auth/forgot-password', { email });
    return true;
  } catch (error) {
    console.error('Forgot password failed:', error.response?.data || error.message);
    return null;
  }
}

// Auth: Reset Password
export async function resetPassword(email, token, newPassword) {
  try {
    await api.post('/auth/reset-password', { email, token, newPassword });
    return true;
  } catch (error) {
    console.error('Reset password failed:', error.response?.data || error.message);
    return null;
  }
}

// Stats
export async function getStats() {
  return await safeAxios(`${API_BASE}/stats`);
}

// Countries
export async function getCountries() {
  return await safeAxios(`${API_BASE}/countries`);
}

// Hotels by City
export async function getHotelsByCity(cityId) {
  if (!cityId) return null; // Safety check
  return await safeAxios(`${API_BASE}/hotels/by-city/${cityId}`);
}

export const getRecentActivities = async () => {
  try {
    const response = await axios.get(`${API_BASE}/RecentActivity`);
    // If your API wraps data in 'data' property
    return Array.isArray(response.data) ? response.data : response.data.data || [];
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    return [];
  }
};
// // ✅ Add this function to your api.js
// export async function updateHotelStatus(id, isActive) {
//   try {
//     const response = await api.post(`/hotels/${id}/status`, { isActive });
//     return response.data;
//   } catch (error) {
//     console.error('Update hotel status failed:', error);
//     throw error;
//   }
// }


export default api;