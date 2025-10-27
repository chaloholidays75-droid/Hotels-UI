import React, { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DashboardCharts = ({
  financialTrend,
  bookingsTrend,
  bookingStatus,
  topAgencies,
  topSuppliers,
}) => {
  // ✅ Normalize data safely
  const safeFinancialTrend = Array.isArray(financialTrend)
    ? financialTrend
    : [];
  const isSingleMonth = safeFinancialTrend.length === 1;

  // =============================
  // 📊 Financial Trend Chart
  // =============================
  const financialOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: { color: "#03045e", font: { size: 12, weight: "500" } },
      },
      title: {
        display: true,
        text: "Financial Trends",
        color: "#03045e",
        font: { size: 14, weight: "600" },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(3, 4, 94, 0.1)" },
        ticks: { color: "#03045e" },
      },
      x: { grid: { display: false }, ticks: { color: "#03045e" } },
    },
  };

  const financialData = {
    labels: safeFinancialTrend.map((item) => item.month),
    datasets: [
      {
        label: "Revenue",
        data: safeFinancialTrend.map((item) => Number(item.revenue ?? 0)),
        borderColor: "#03045e",
        backgroundColor: "rgba(3, 4, 94, 0.25)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: "Cost",
        data: safeFinancialTrend.map((item) => Number(item.cost ?? 0)),
        borderColor: "rgba(3, 4, 94, 0.6)",
        backgroundColor: "rgba(3, 4, 94, 0.15)",
        borderWidth: 1.8,
        tension: 0.4,
        fill: true,
      },
      {
        label: "Profit",
        data: safeFinancialTrend.map((item) => Number(item.profit ?? 0)),
        borderColor: "#0077b6",
        backgroundColor: "rgba(0, 119, 182, 0.25)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // =============================
  // 📈 Bookings Trend Chart
  // =============================
  const safeBookingsTrend = bookingsTrend || [];
  const bookingsOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: "Monthly Bookings Trend",
        color: "#03045e",
        font: { size: 14, weight: "600" },
      },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: "rgba(0, 0, 0, 0.1)" } },
      x: { grid: { display: false } },
    },
  };
  const bookingsData = {
    labels: safeBookingsTrend.map((item) => item.month),
    datasets: [
      {
        label: "Bookings",
        data: safeBookingsTrend.map((item) => item.totalBookings),
        borderColor: "#7359ff",
        backgroundColor: "rgba(115, 89, 255, 0.2)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // =============================
  // 🍩 Booking Status Doughnut
  // =============================
  const normalizedStatus = Array.isArray(bookingStatus)
    ? bookingStatus.reduce((acc, s) => {
        const key = s.status?.toLowerCase() || s.Status?.toLowerCase();
        if (key) acc[key] = s.count ?? s.Count ?? 0;
        return acc;
      }, {})
    : bookingStatus || {};

  const statusCounts = {
    confirmed: normalizedStatus.confirmed ?? 0,
    pending: normalizedStatus.pending ?? 0,
    cancelled: normalizedStatus.cancelled ?? 0,
  };

  const totalBookings =
    (statusCounts.confirmed || 0) +
    (statusCounts.pending || 0) +
    (statusCounts.cancelled || 0);

  const confirmedPercent =
    totalBookings > 0
      ? ((statusCounts.confirmed / totalBookings) * 100).toFixed(1)
      : 0;

  // 🧠 Determine what center text should display
  let defaultCenterText = "No Data";
  if (totalBookings > 0) {
    const nonZeroStatuses = Object.entries(statusCounts).filter(
      ([, val]) => val > 0
    );
    if (nonZeroStatuses.length === 1) {
      const [status, value] = nonZeroStatuses[0];
      defaultCenterText = `${status.charAt(0).toUpperCase() + status.slice(1)}: ${value}`;
    } else {
      defaultCenterText = `${confirmedPercent}%`;
    }
  }

  const [centerText, setCenterText] = useState(defaultCenterText);

  const statusData = {
    labels: ["Confirmed", "Pending", "Cancelled"],
    datasets: [
      {
        label: "Booking Status",
        data: [
          statusCounts.confirmed,
          statusCounts.pending,
          statusCounts.cancelled,
        ],
        backgroundColor: [
          "#03045e",
          "rgba(3, 4, 94, 0.7)",
          "rgba(3, 4, 94, 0.4)",
        ],
        borderColor: [
          "#03045e",
          "rgba(3, 4, 94, 0.8)",
          "rgba(3, 4, 94, 0.6)",
        ],
        borderWidth: 1.5,
        hoverOffset: 8,
      },
    ],
  };

  // 🧠 Dynamic Center Text Plugin (hover-aware)
  const centerTextPlugin = {
    id: "centerText",
    afterDraw(chart) {
      const { ctx, chartArea, tooltip } = chart;
      if (!chartArea) return;
      ctx.save();
      ctx.font = "bold 18px 'Inter', sans-serif";
      ctx.fillStyle = "#03045e";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      let textToDisplay = centerText;
      if (tooltip && tooltip.dataPoints && tooltip.dataPoints.length > 0) {
        const { label, raw } = tooltip.dataPoints[0];
        textToDisplay = `${label}: ${raw}`;
      }

      ctx.fillText(
        textToDisplay,
        chartArea.width / 2 + chartArea.left,
        chartArea.height / 2 + chartArea.top
      );
      ctx.restore();
    },
  };

  const statusOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "45%",
    plugins: {
      legend: { position: "bottom" },
      title: {
        display: true,
        text: "Booking Status",
        color: "#03045e",
        font: { size: 14, weight: "600" },
      },
    },
    animation: { animateScale: true },
  };

  // =============================
  // 🧱 Render Layout
  // =============================
  return (
    <div className="space-y-6">
      {/* Financial Chart */}
      <div className="bg-white rounded-card shadow-sm p-6">
        {isSingleMonth ? (
          <Bar options={financialOptions} data={financialData} height={100} />
        ) : (
          <Line options={financialOptions} data={financialData} height={100} />
        )}
      </div>

      {/* Bookings Trend Chart */}
      <div className="bg-white rounded-card shadow-sm p-6">
        <Line options={bookingsOptions} data={bookingsData} height={100} />
      </div>

      {/* Booking Status Doughnut */}
      <div className="bg-white rounded-card shadow-sm p-6 flex flex-col items-center justify-center">
        <div
          style={{
            width: "520px",
            height: "320px",
            margin: "0 auto",
          }}
        >
          <Doughnut
            data={statusData}
            options={statusOptions}
            plugins={[centerTextPlugin]}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
