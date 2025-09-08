import React, { useState, useEffect } from 'react';
import { 
  FaHotel, FaBuilding, FaUsers, FaChartLine, 
  FaSync, FaEye, FaPlus, FaExclamationTriangle,
  FaGlobe, FaExclamationCircle, FaArrowUp, FaArrowDown
} from 'react-icons/fa';
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
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { TrendingUp, Users, MapPin, Activity, Globe, Star } from 'lucide-react';
import './Dashboard.css';

// Register Chart.js components
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

const API_BASE = "https://hotels-8v0p.onrender.com/api";
const API_STATS = `${API_BASE}/dashboard/stats`;
const API_RECENT_ACTIVITIES = `${API_BASE}/dashboard/recent-activities`;
const API_HOTELS_BY_COUNTRY = `${API_BASE}/dashboard/hotels-by-country`;
const API_AGENCIES_BY_COUNTRY = `${API_BASE}/dashboard/agencies-by-country`;
const API_TOP_COUNTRIES = `${API_BASE}/dashboard/top-countries`;
const API_MONTHLY_STATS = `${API_BASE}/dashboard/monthly-stats`;

const Dashboard = ({ showNotification, onNavigate }) => {
  const [stats, setStats] = useState({
    totalHotels: 0,
    totalAgencies: 0,
    activeHotels: 0,
    pendingApprovals: 0,
    totalCountries: 0,
    monthlyGrowth: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [hotelsByCountry, setHotelsByCountry] = useState([]);
  const [agenciesByCountry, setAgenciesByCountry] = useState([]);
  const [topCountries, setTopCountries] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  
  // Chart options and data
  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Performance',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
    maintainAspectRatio: false,
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Hotels vs Agencies by Country',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
    maintainAspectRatio: false,
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
    maintainAspectRatio: false,
  };

  const fetchDashboardData = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      const [
        statsRes,
        activitiesRes,
        hotelsByCountryRes,
        agenciesByCountryRes,
        topCountriesRes,
        monthlyStatsRes
      ] = await Promise.allSettled([
        fetch(API_STATS),
        fetch(API_RECENT_ACTIVITIES),
        fetch(API_HOTELS_BY_COUNTRY),
        fetch(API_AGENCIES_BY_COUNTRY),
        fetch(API_TOP_COUNTRIES),
        fetch(API_MONTHLY_STATS)
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        const statsData = await statsRes.value.json();
        setStats(statsData);
      }

      if (activitiesRes.status === 'fulfilled' && activitiesRes.value.ok) {
        const activitiesData = await activitiesRes.value.json();
        setRecentActivities(activitiesData);
      }

      if (hotelsByCountryRes.status === 'fulfilled' && hotelsByCountryRes.value.ok) {
        const hotelsByCountryData = await hotelsByCountryRes.value.json();
        setHotelsByCountry(hotelsByCountryData);
      }

      if (agenciesByCountryRes.status === 'fulfilled' && agenciesByCountryRes.value.ok) {
        const agenciesByCountryData = await agenciesByCountryRes.value.json();
        setAgenciesByCountry(agenciesByCountryData);
      }

      if (topCountriesRes.status === 'fulfilled' && topCountriesRes.value.ok) {
        const topCountriesData = await topCountriesRes.value.json();
        setTopCountries(topCountriesData);
      }

      if (monthlyStatsRes.status === 'fulfilled' && monthlyStatsRes.value.ok) {
        const monthlyStatsData = await monthlyStatsRes.value.json();
        setMonthlyStats(monthlyStatsData);
      }

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message);
      if (showNotification) {
        showNotification(`Error loading dashboard: ${err.message}`, "error");
      }
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Prepare chart data
  const lineChartData = {
    labels: monthlyStats.map(stat => stat.month),
    datasets: [
      {
        label: 'Hotels',
        data: monthlyStats.map(stat => stat.hotels),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Agencies',
        data: monthlyStats.map(stat => stat.agencies),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const barChartData = {
    labels: topCountries.slice(0, 5).map(country => country.countryName),
    datasets: [
      {
        label: 'Hotels',
        data: topCountries.slice(0, 5).map(country => country.hotelCount),
        backgroundColor: 'rgba(91, 170, 223, 0.8)',
      },
      {
        label: 'Agencies',
        data: topCountries.slice(0, 5).map(country => country.agencyCount),
        backgroundColor: 'rgba(255, 99, 132, 0.8)',
      },
    ],
  };

  const doughnutData = {
    labels: ['Hotels', 'Agencies', 'Pending'],
    datasets: [
      {
        label: 'Distribution',
        data: [stats.totalHotels, stats.totalAgencies, stats.pendingApprovals],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(255, 206, 86, 0.8)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const StatCard = ({ title, value, icon, color, trend, subtitle }) => (
    <div className={`dashboard-stat-card ${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <h3>{value}</h3>
        <p>{title}</p>
        {trend && (
          <div className={`stat-trend ${trend > 0 ? 'positive' : 'negative'}`}>
            {trend > 0 ? <FaArrowUp /> : <FaArrowDown />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
        {subtitle && <div className="stat-subtitle">{subtitle}</div>}
      </div>
    </div>
  );

  const QuickAction = ({ title, icon, description, onClick }) => (
    <div className="quick-action-card" onClick={onClick}>
      <div className="action-icon">{icon}</div>
      <div className="action-content">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
    </div>
  );

  const MetricCard = ({ title, value, change, icon, backgroundColor, color, border  }) => (
    <div className="metric-card">
      <div className="metric-icon" style={{ backgroundColor, color, border }}>
        {icon}
      </div>
      <div className="metric-content">
        <h3>{value}</h3>
        <p>{title}</p>
        {change && (
          <span className={`metric-change ${change > 0 ? 'positive' : 'negative'}`}>
            {change > 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
    </div>
  );

  if (loading) return (
    <div className="dashboard-loading">
      <div className="dashboard-spinner"></div>
      <p>Loading dashboard...</p>
    </div>
  );

  if (error) return (
    <div className="dashboard-error">
      <div className="error-icon">
        <FaExclamationCircle />
      </div>
      <h2>Unable to Load Dashboard</h2>
      <p>{error}</p>
      <button className="dashboard-retry-btn" onClick={fetchDashboardData}>
        <FaSync className={refreshing ? 'spinning' : ''} />
        Try Again
      </button>
    </div>
  );

  return (
    
    <div className="dashboard-container ">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Dashboard Overview</h1>
          <p>Real-time insights and analytics</p>
        </div>
        <button className="dashboard-refresh-btn" onClick={fetchDashboardData}>
          <FaSync className={refreshing ? 'spinning' : ''} />
          Refresh Data
        </button>
      </div>

      {/* Key Metrics Row */}
      <div className="metrics-grid">
        <MetricCard
          title="Total Hotels"
          value={stats.totalHotels}
          change={12}
          icon={<FaHotel />}
          backgroundColor=" rgb(232 246 255)"
          color= "rgb(52, 152, 219)"
          border=" 2px solid rgb(52, 152, 219)"
        />
        <MetricCard
          title="Total Agencies"
          value={stats.totalAgencies}
          change={8}
          icon={<FaBuilding />}
          color=" rgb(46, 204, 113)"
          backgroundColor=" rgb(221 255 235)"
          border= " 2px solid rgb(46, 204, 113)"
        />
        <MetricCard
          title="Active Properties"
          value={stats.activeHotels}
          change={5}
          icon={<Activity size={20} />}
          color="#9b59b6"
          backgroundColor="rgba(251, 241, 255, 1)"
          border="2px solid rgb(155, 89, 182)"
        />
        <MetricCard
          title="Countries Covered"
          value={stats.totalCountries}
          change={3}
          icon={<Globe size={20} />}
          color="#e67e22"
          backgroundColor="#fff9f4ff"
          border="2px solid #e67e22"
        />
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-content">
        {/* Left Column - Charts */}
        <div className="main-content">
          {/* Performance Chart */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Monthly Performance Trend</h3>
              <span className="chart-subtitle">Last 6 months</span>
            </div>
            <div className="chart-container">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>

          {/* Distribution Charts */}
          <div className="charts-row">
            <div className="chart-card">
              <div className="chart-header">
                <h3>Distribution Overview</h3>
              </div>
              <div className="chart-container">
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <h3>Top Countries Comparison</h3>
              </div>
              <div className="chart-container">
                <Bar data={barChartData} options={barChartOptions} />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions-section">
            <h2>Quick Actions</h2>
            <div className="quick-actions-grid">
              <QuickAction
                title="Manage Hotels"
                icon={<fml-icon name="business-outline"></fml-icon>}
                description="View and manage all hotel properties"
                onClick={() => onNavigate('./hotel')}
              />
              <QuickAction
                title="Manage Agencies"
                icon={<FaBuilding />}
                description="View and manage agency partners"
                onClick={() => onNavigate('./agencies')}
              />
              <QuickAction
                title="Add New Property"
                icon={<fml-icon name="add-outline"></fml-icon>}
                description="Register a new hotel property"
                onClick={() => onNavigate('add-hotel')}
              />
              <QuickAction
                title="Analytics Report"
                icon={<fml-icon name="analytics-outline"></fml-icon>}
                description="Generate detailed analytics reports"
                onClick={() => showNotification("Analytics feature coming soon!", "info")}
              />
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="dashboard-sidebar">
          {/* Recent Activities */}
          <div className="recent-activities">
            <div className="section-header">
              <h3>Recent Activities</h3>
              <Users size={18} />
            </div>
            <div className="activities-list">
              {recentActivities.slice(0, 6).map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">
                    {activity.type === 'hotel' && <FaHotel />}
                    {activity.type === 'agency' && <FaBuilding />}
                  </div>
                  <div className="activity-content">
                    <p className="activity-text">{activity.name}</p>
                    <div className="activity-meta">
                      <span className="activity-type">{activity.type}</span>
                      <span className="activity-time">{activity.timeAgo}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Countries */}
          <div className="top-countries">
            <div className="section-header">
              <h3>Top Countries</h3>
              <MapPin size={18} />
            </div>
            <div className="countries-list">
              {topCountries.slice(0, 5).map((country, index) => (
                <div key={country.countryId} className="country-item">
                  <div className="country-rank">{index + 1}</div>
                  <div className="country-info">
                    <span className="country-name">{country.countryName}</span>
                    <span className="country-stats">
                      {country.hotelCount} hotels • {country.agencyCount} agencies
                    </span>
                  </div>
                  <div className="country-score">
                    <Star size={14} fill="currentColor" />
                    {Math.round((country.hotelCount + country.agencyCount) / 2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="system-status">
            <div className="section-header">
              <h3>System Status</h3>
              <Activity size={18} />
            </div>
            <div className="status-items">
              <div className="status-item online">
                <div className="status-dot"></div>
                <span>API Services</span>
                <span className="status-badge">Online</span>
              </div>
              <div className="status-item online">
                <div className="status-dot"></div>
                <span>Database</span>
                <span className="status-badge">Online</span>
              </div>
              <div className="status-item online">
                <div className="status-dot"></div>
                <span>Storage</span>
                <span className="status-badge">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;