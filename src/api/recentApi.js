import api from "./apiInstance"; // ✅ your preconfigured axios instance

// ==========================================================
// 1️⃣ Get all activities (Paginated)
// ==========================================================
export const getAllActivities = async (page = 1, pageSize = 20) => {
  try {
    console.log("📡 Fetching all activities →", `/recent-activities?page=${page}&pageSize=${pageSize}`);
    const res = await api.get(`/recent-activities?page=${page}&pageSize=${pageSize}`);
    console.log("✅ All Activities Response:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ Error fetching all activities:", err.response?.data || err.message);
    throw err;
  }
};

// ==========================================================
// 2️⃣ Get latest 30 activities (for dashboard widget)
// ==========================================================
export const getLatestActivities = async () => {
  try {
    console.log("📡 Fetching latest activities → /recent-activities/latest");
    const res = await api.get("/recent-activities/latest");
    console.log("✅ Latest Activities Response:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ Error fetching latest activities:", err.response?.data || err.message);
    throw err;
  }
};

// ==========================================================
// 3️⃣ Log a new activity manually
// ==========================================================
export const logActivity = async (activity) => {
  try {
    console.log("📝 Logging new activity → /recent-activities/log");
    console.log("📦 Payload:", activity);
    const res = await api.post("/recent-activities/log", activity);
    console.log("✅ Activity Logged Successfully:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ Error logging activity:", err.response?.data || err.message);
    throw err;
  }
};

// ==========================================================
// 4️⃣ Filter activities (by table name, user, or both)
// ==========================================================
export const filterActivities = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    console.log("📡 Filtering activities →", `/recent-activities/filter?${query}`);
    const res = await api.get(`/recent-activities/filter?${query}`);
    console.log("✅ Filtered Activities Response:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ Error filtering activities:", err.response?.data || err.message);
    throw err;
  }
};
