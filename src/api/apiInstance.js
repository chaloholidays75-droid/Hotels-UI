// // ✅ apiInstance.js
// import axios from "axios";

// const api = axios.create({
//   baseURL: "https://backend.chaloholidayonline.com/api",
//   withCredentials: true, // allow cookies
// });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("accessToken");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// api.interceptors.response.use(
//   res => res,
//   async (error) => {
//     const originalRequest = error.config;

//     // Prevent infinite retry loops
//     if (
//       error.response?.status === 401 &&
//       !originalRequest._retry &&
//       !originalRequest.url.includes("/auth/auto-login")
//     ) {
//       originalRequest._retry = true;

//       try {
//         const { data } = await api.post("/auth/auto-login");
//         if (data?.accessToken) {
//           localStorage.setItem("accessToken", data.accessToken);
//           originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
//           return api(originalRequest);
//         }
//       } catch (err) {
//         console.warn("Auto-login failed:", err.response?.data?.message);
//         localStorage.clear();
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export default api;


// src/api/apiInstance.js
import axios from "axios";

const api = axios.create({
  baseURL: "https://backend.chaloholidayonline.com/api",
  withCredentials: true, // ✅ send cookies automatically
});

// 🚫 No need to attach Authorization manually
api.interceptors.request.use((config) => {
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // Auto-login retry if cookie session expired
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/auto-login")
    ) {
      originalRequest._retry = true;
      try {
        console.warn("Attempting auto-login...");
        const { data } = await api.post("/auth/auto-login");
        if (data?.accessToken) {
          // Backend will reset new cookies automatically
          return api(originalRequest);
        }
      } catch (err) {
        console.error("Auto-login failed:", err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
