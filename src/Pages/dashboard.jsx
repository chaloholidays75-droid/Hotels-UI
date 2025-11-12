import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  fetchDashboardData,
  getUpcomingDeadlines,
} from "../api/dashboardApi";
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
    upcomingDeadlines: null,
    bookingStatus: null,
    topAgencies: null,
    topSuppliers: null,
    recentBookings: null,
    recentActivities: null,
  });

  useEffect(() => {
    loadDashboard();
  }, [dateRange]);

  useEffect(() => {
    async function loadDeadlines() {
      try {
        const result = await getUpcomingDeadlines();
        setDashboardData((prev) => ({ ...prev, upcomingDeadlines: result }));
      } catch (err) {
        console.error("Error loading deadlines:", err);
      }
    }
    loadDeadlines();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await fetchDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      if (error.response?.status === 401) {
        console.log("Session expired — please log in again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="ds-page-content">
      <motion.header
        className="ds-system-header"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="ds-header-container">
          <div className="ds-header-content">
            <div>
              <h1 className="ds-header-title">
                Analytics Dashboard
              </h1>
              <p className="ds-header-subtitle">
                ChaloHoliday Online Performance
              </p>
            </div>

            <div className="ds-header-controls">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="ds-date-select"
              >
                <option>This Month</option>
                <option>Last 6 Months</option>
                <option>Custom</option>
              </select>

              <div className="ds-user-avatar">
                <div className="ds-avatar-icon">
                  <span className="ds-avatar-text">CH</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="ds-main-content">
        <motion.section
          className="ds-kpi-grid"
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
                  changeType="increase"
                  icon="📊"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <DashboardCard
                  title="Revenue"
                  value={`$${dashboardData.summary.cards.totalRevenue.toLocaleString()}`}
                  changeType="increase"
                  icon="💰"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <DashboardCard
                  title="Profit"
                  value={`$${dashboardData.summary.cards.totalProfit.toLocaleString()}`}
                  changeType="increase"
                  icon="📈"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <DashboardCard
                  title="Hotels"
                  value={dashboardData.summary.cards.totalHotels}
                  changeType="decrease"
                  icon="🏨"
                />
              </motion.div>
            </>
          )}
        </motion.section>

        <motion.section
          className="ds-charts-section"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="ds-charts-main" variants={itemVariants}>
            <DashboardCharts
              financialTrend={dashboardData.financialTrend}
              bookingsTrend={dashboardData.bookingsTrend}
              bookingStatus={dashboardData.bookingStatus}
              topAgencies={dashboardData.topAgencies}
              topSuppliers={dashboardData.topSuppliers}
            />
          </motion.div>

          <motion.div className="ds-sidebar-section" variants={itemVariants}>
            <div className="ds-sidebar-card">
              <h3 className="ds-sidebar-title">
                Upcoming Deadlines (Next 3 Days)
              </h3>

              {dashboardData.upcomingDeadlines &&
              dashboardData.upcomingDeadlines.length > 0 ? (
                <ul className="ds-deadlines-list">
                  {dashboardData.upcomingDeadlines
                    .filter(
                      (b) =>
                        b.status &&
                        b.status.toLowerCase().includes("confirmed") &&
                        !b.status.toLowerCase().includes("reconfirmed")
                    )
                    .map((b, i) => (
                      <li key={i} className="ds-deadline-item">
                        <div className="ds-deadline-content">
                          <div>
                            <p className="ds-deadline-ticket">
                              {b.ticketNumber || `Booking #${b.id}`}
                            </p>
                            <p className="ds-deadline-info">
                              {b.hotelName || "Unknown Hotel"} •{" "}
                              <span
                                className={`ds-deadline-status ${
                                  b.status?.toLowerCase().includes("cancel")
                                    ? "ds-status-cancelled"
                                    : "ds-status-confirmed"
                                }`}
                              >
                                {b.status}
                              </span>
                            </p>
                          </div>

                          {(() => {
                            const today = new Date();
                            const deadline = new Date(b.deadline);
                            const diffDays = Math.floor(
                              (deadline - today) / (1000 * 60 * 60 * 24)
                            );

                            const isSoon = diffDays <= 1 && diffDays >= 0;
                            const isExpired = diffDays < 0;

                            const badgeColor = isSoon
                              ? "ds-deadline-soon"
                              : "ds-deadline-normal";

                            const label = isExpired
                              ? "Expired"
                              : diffDays === 0
                              ? "Today"
                              : diffDays === 1
                              ? "Tomorrow"
                              : deadline.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                });

                            return (
                              <span
                                className={`ds-deadline-badge ${badgeColor} ${
                                  isExpired
                                    ? "ds-deadline-expired"
                                    : ""
                                }`}
                              >
                                {label}
                              </span>
                            );
                          })()}
                        </div>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="ds-no-data">No upcoming deadlines</p>
              )}
            </div>

            <div className="ds-sidebar-card">
              <h3 className="ds-sidebar-title">
                Top Agencies
              </h3>
              <div className="ds-chart-placeholder"></div>
            </div>
          </motion.div>
        </motion.section>

        <motion.section
          className="ds-bottom-section"
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