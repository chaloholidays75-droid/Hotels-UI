import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  fetchDashboardData
} from "../api/dashboardApi"; // ✅ new import
import DashboardCard from "./DashboardCard";
import DashboardCharts from "./DashboardCharts";
import RecentBookings from "./RecentBookings";
import RecentActivities from "./RecentActivities";
import LoadingSkeleton from "./LoadingSkeleton";
import "./Dashboard.css";

const Dashboard = () => {
  const [dateRange, setDateRange] = useState("This Month");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    summary: null,
    bookingsTrend: null,
    financialTrends: null,
    bookingStatus: null,
    topAgencies: null,
    topSuppliers: null,
    recentBookings: null,
    recentActivities: null,
  });

  useEffect(() => {
    loadDashboard();
  }, [dateRange]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await fetchDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      if (error.response?.status === 401) {
        alert("Session expired — please log in again.");
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };
// console.log("Booking Status Data:", bookingStatus);
// console.log("Top Agencies Data:", topAgencies);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.header
        className="bg-white shadow-sm border-b"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Analytics Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                ChaloHoliday Online Performance
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option>This Month</option>
                <option>Last 6 Months</option>
                <option>Custom</option>
              </select>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">CH</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI Cards */}
        <motion.section
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {dashboardData.summary?.cards && (
            <>
              <motion.div variants={itemVariants}>
                <DashboardCard
                  title="Total Bookings"
                  value={dashboardData.summary.cards.totalBookings}
                  // change={12}
                  changeType="increase"
                  icon="📊"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <DashboardCard
                  title="Revenue"
                  value={`$${dashboardData.summary.cards.totalRevenue.toLocaleString()}`}
                  // change={8.2}
                  changeType="increase"
                  icon="💰"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <DashboardCard
                  title="Profit"
                  value={`$${dashboardData.summary.cards.totalProfit.toLocaleString()}`}
                  // change={15.5}
                  changeType="increase"
                  icon="📈"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <DashboardCard
                  title="Hotels"
                  value={dashboardData.summary.cards.totalHotels}
                  // change={-2.1}
                  changeType="decrease"
                  icon="🏨"
                />
              </motion.div>
            </>
          )}
        </motion.section>

        {/* Charts Section */}
        <motion.section
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="lg:col-span-2" variants={itemVariants}>
            <DashboardCharts
              financialTrend={dashboardData.financialTrend}
              bookingsTrend={dashboardData.bookingsTrend}
              bookingStatus={dashboardData.bookingStatus}
              topAgencies={dashboardData.topAgencies}
              topSuppliers={dashboardData.topSuppliers}
            />
          </motion.div>

          <motion.div className="space-y-6" variants={itemVariants}>
            <div className="bg-white rounded-card shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Booking Status
              </h3>
              <div className="h-64">{/* Doughnut chart */}</div>
            </div>

            <div className="bg-white rounded-card shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Top Agencies
              </h3>
              <div className="h-64">{/* Bar chart */}</div>
            </div>
          </motion.div>
        </motion.section>

        {/* Bottom Section */}
        <motion.section
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <RecentBookings data={dashboardData.recentBookings} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <RecentActivities data={dashboardData.recentActivities} />
          </motion.div>
        </motion.section>
      </main>
    </div>
  );
};

export default Dashboard;
