// import axios from 'axios';

// // Hotel API base URL (unchanged)
// const API_BASE_HOTEL = 'https://backend.chaloholidayonline.com/api/hotels';

// // Auth API base URL (aligned with your .NET backend)
// const API_BASE = 'https://backend.chaloholidayonline.com/api';

// // Create Axios instance for auth-related calls
// const api = axios.create({
//   baseURL: API_BASE,
// });

// // Axios interceptor for adding JWT token
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('accessToken');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// // Axios interceptor for refreshing tokens on 401
// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;
//     if (error.response.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;
//       const refreshToken = localStorage.getItem('refreshToken');
//       if (refreshToken) {
//         try {
//           const { data } = await api.post('/auth/refresh-token', {refreshToken});
//           localStorage.setItem('accessToken', data.accessToken);
//           localStorage.setItem('refreshToken', data.refreshToken);
//           originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
//           return api(originalRequest);
//         } catch (refreshError) {
//           console.error('Token refresh failed:', refreshError);
//             localStorage.removeItem('accessToken');
//             localStorage.removeItem('refreshToken');
//           return Promise.reject(refreshError);
//         }
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// // === HOTEL-RELATED FUNCTIONS (UNCHANGED) ===

// // ✅ Get all hotel sales
// export async function getHotelSales() {
//   const response = await fetch(API_BASE_HOTEL);
//   if (!response.ok) throw new Error('Failed to fetch hotel sales');
//   return response.json();
// }

// // ✅ Get by Id
// export async function getHotelSaleById(id) {
//   const response = await fetch(`${API_BASE_HOTEL}/${id}`);
//   if (!response.ok) throw new Error('Failed to fetch hotel sale');
//   return response.json();
// }

// // ✅ Create new
// export async function createHotelSale(data) {
//   const response = await fetch(API_BASE_HOTEL, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(data),
//   });

//   if (!response.ok) {
//     const errorText = await response.text();
//     throw new Error('Failed to create hotel sale: ' + errorText);
//   }

//   return response.json();
// }

// // ✅ Update
// export async function updateHotelSale(id, data) {
//   const response = await fetch(`${API_BASE_HOTEL}/${id}`, {
//     method: 'PUT',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(data),
//   });

//   if (!response.ok) {
//     const errorText = await response.text();
//     throw new Error('Failed to update hotel sale: ' + errorText);
//   }

//   return response.json();
// }

// // ✅ Delete
// export async function deleteHotelSale(id) {
//   const response = await fetch(`${API_BASE_HOTEL}/${id}`, {
//     method: 'DELETE',
//   });

//   if (!response.ok) throw new Error('Failed to delete hotel sale');
//   return true;
// }

// // === AUTH-RELATED AND NON-HOTEL FUNCTIONS ===

// // Utility function for Axios with error handling
// async function safeAxios(url, method = 'get', data = null) {
//   try {
//     const config = { method, url };
//     if (data) {
//       config.data = data;
//       config.headers = { 'Content-Type': 'application/json' };
//     }
//     const res = await api(config);
//     return res.data || null; // Return null if no data
//   } catch (error) {
//     console.error(`Request failed for ${url}:`, error.response?.status, error.message);
//     return null; // Return null instead of throwing
//   }
// }

// // Check authentication status
// export async function checkAuth() {
//   try {
//     const { data } = await api.get('/auth/me');
//     return { isAuthenticated: true, userFullName: data.fullName };
//   } catch (error) {
//     console.error('Auth check failed:', error.response?.status, error.message);
//     return { isAuthenticated: false, userFullName: null };
//   }
// }

// // Auth: Login
// export async function login(email, password) {
//   try {
//     const { data } = await api.post('/auth/login', { email, password });
//     localStorage.setItem('accessToken', data.accessToken);
//     localStorage.setItem('refreshToken', data.refreshToken);
//     return { userFullName: data.userFullName, accessToken: data.accessToken };
//   } catch (error) {
//     console.error('Login failed:', error.response?.data || error.message);
//     throw new Error(error.response?.data?.message || 'Login failed. Check server.');
//   }
// }

// // Auth: Register
// export async function register(firstName, lastName, email, password) {
//   try {
//     console.log("📡 Sending Register request to:", `${API_BASE}/auth/register`);
//     console.log("📦 Payload:", { firstName, lastName, email, password });

//     await api.post('/auth/register', { firstName, lastName, email, password });
//     return true;
//   } catch (error) {
//     console.error("❌ Registration failed for:", `${API_BASE}/auth/register`);
//     console.error("Response:", error.response?.data);
//     console.error("Status:", error.response?.status);
//     throw new Error('Registration failed');
//   }
// }


// // Auth: Forgot Password
// export async function forgotPassword(email) {
//   try {
//     await api.post('/auth/forgot-password', { email });
//     return true;
//   } catch (error) {
//     console.error('Forgot password failed:', error.response?.data || error.message);
//     return null;
//   }
// }

// // Auth: Reset Password
// export async function resetPassword(email, token, newPassword) {
//   try {
//     await api.post('/auth/reset-password', { email, token, newPassword });
//     return true;
//   } catch (error) {
//     console.error('Reset password failed:', error.response?.data || error.message);
//     return null;
//   }
// }

// // Stats
// export async function getStats() {
//   return await safeAxios(`${API_BASE}/stats`);
// }

// // Countries
// export async function getCountries() {
//   return await safeAxios(`${API_BASE}/countries`);
// }

// // Hotels by City
// export async function getHotelsByCity(cityId) {
//   if (!cityId) return null; // Safety check
//   return await safeAxios(`${API_BASE}/hotels/by-city/${cityId}`);
// }

// export default api;