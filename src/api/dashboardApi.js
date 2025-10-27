// src/api/dashboardApi.js
import api from "./api"; // ✅ your pre-configured axios instance with interceptors

// -----------------------------
// 1️⃣ SUMMARY (KPI CARDS)
// -----------------------------
export const getDashboardSummary = async () => {
  const res = await api.get("/dashboard/summary");
  return res.data;
};

// -----------------------------
// 2️⃣ BOOKINGS TREND
// -----------------------------
export const getBookingsTrend = async () => {
  const res = await api.get("/dashboard/bookings-trend");
  return res.data;
};

// -----------------------------
// 3️⃣ FINANCIAL TRENDS
// -----------------------------
export const getFinancialTrends = async () => {
  const res = await api.get("/dashboard/financial-trends");
  return res.data;
};

// -----------------------------
// 4️⃣ BOOKING STATUS DISTRIBUTION
// -----------------------------
export const getBookingStatus = async () => {
  const res = await api.get("/dashboard/booking-status");
  return res.data;
};

// -----------------------------
// 5️⃣ TOP AGENCIES
// -----------------------------
export const getTopAgencies = async () => {
  const res = await api.get("/dashboard/top-agencies");
  return res.data;
};

// -----------------------------
// 6️⃣ TOP SUPPLIERS
// -----------------------------
export const getTopSuppliers = async () => {
  const res = await api.get("/dashboard/top-suppliers");
  return res.data;
};

// -----------------------------
// 7️⃣ RECENT BOOKINGS
// -----------------------------
export const getRecentBookings = async () => {
  const res = await api.get("/dashboard/recent-bookings");
  return res.data;
};

// -----------------------------
// 8️⃣ RECENT ACTIVITIES
// -----------------------------
export const getRecentActivities = async () => {
  const res = await api.get("/dashboard/recent-activities");
  return res.data;
};

// -----------------------------
// 9️⃣ WEEKLY BOOKINGS
// -----------------------------
export const getWeeklyBookings = async () => {
  const res = await api.get("/dashboard/weekly-bookings");
  return res.data;
};

// -----------------------------
// 🔟 AGENCY PERFORMANCE
// -----------------------------
export const getAgencyPerformance = async () => {
  const res = await api.get("/dashboard/agency-performance");
  return res.data;
};

// -----------------------------
// 🌍 REVENUE BY COUNTRY
// -----------------------------
export const getRevenueByCountry = async () => {
  const res = await api.get("/dashboard/revenue-by-country");
  return res.data;
};

// -----------------------------
// 📊 FETCH ALL DASHBOARD DATA
// -----------------------------
export const fetchDashboardData = async () => {
  try {
    const [
      summary,
      bookingsTrend,
      financialTrend,
      bookingStatus,
      topAgencies,
      topSuppliers,
      recentBookings,
      recentActivities,
    ] = await Promise.all([
      getDashboardSummary(),
      getBookingsTrend(),
      getFinancialTrends(),
      getBookingStatus(),
      getTopAgencies(),
      getTopSuppliers(),
      getRecentBookings(),
      getRecentActivities(),
    ]);

    // ✅ Log all data for debugging
    console.group("📊 DASHBOARD API DATA");
    console.log("Summary:", summary);
    console.log("Bookings Trend:", bookingsTrend);
    console.log("Financial Trend:", financialTrend);
    console.log("Booking Status:", bookingStatus);
    console.log("Top Agencies:", topAgencies);
    console.log("Top Suppliers:", topSuppliers);
    console.log("Recent Bookings:", recentBookings);
    console.log("Recent Activities:", recentActivities);
    console.groupEnd();

    return {
      summary,
      bookingsTrend,
      financialTrend,
      bookingStatus,
      topAgencies,
      topSuppliers,
      recentBookings,
      recentActivities,
    };
  } catch (error) {
    console.error("❌ Dashboard API Error:", error.response || error.message);
    throw error;
  }
};

