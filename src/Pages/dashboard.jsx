import React, { useState, useEffect } from 'react';
import { 
  FaHotel, FaBuilding, FaUsers, FaChartLine, 
  FaSync, FaEye, FaPlus, FaExclamationTriangle,
  FaGlobe, FaExclamationCircle, FaArrowUp, FaArrowDown
} from 'react-icons/fa';
import { Pie, Line, Bar } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import 'chartjs-adapter-date-fns';

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
  TimeScale
} from 'chart.js';
import { Users, MapPin, Activity, Globe, Star } from 'lucide-react';
import './Dashboard.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  TimeScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

const API_BASE = "https://backend.chaloholidayonline.com/api";
const API_STATS = `${API_BASE}/dashboard/stats`;
const API_RECENT_ACTIVITIES = `${API_BASE}/dashboard/recent-activities`;
const API_TOP_COUNTRIES = `${API_BASE}/dashboard/top-countries`;
const API_MONTHLY_STATS = `${API_BASE}/dashboard/monthly-stats`;

const Dashboard = ({ showNotification, onNavigate }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalHotels: 0,
    totalAgencies: 0,
    activeHotels: 0,
    pendingApprovals: 0,
    totalCountries: 0,
    monthlyGrowth: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [topCountries, setTopCountries] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [
        statsRes,
        activitiesRes,
        topCountriesRes,
        monthlyStatsRes
      ] = await Promise.allSettled([
        fetch(API_STATS),
        fetch(API_RECENT_ACTIVITIES),
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
      if (showNotification) showNotification(`Error loading dashboard: ${err.message}`, "error");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Metric Card
  const MetricCard = ({ title, value, change, icon, backgroundColor, color, border, onClick }) => (
    <div className="metric-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
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
      <div className="error-icon"><FaExclamationCircle /></div>
      <h2>Unable to Load Dashboard</h2>
      <p>{error}</p>
      <button className="dashboard-retry-btn" onClick={fetchDashboardData}>
        <FaSync className={refreshing ? 'spinning' : ''} /> Try Again
      </button>
    </div>
  );

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Dashboard Overview</h1>
          <p>Real-time insights and analytics</p>
        </div>
        <button className="dashboard-refresh-btn" onClick={fetchDashboardData}>
          <FaSync className={refreshing ? 'spinning' : ''} /> Refresh Data
        </button>
      </div>

      {/* Key Metrics Row - Clickable */}
      <div className="metrics-grid">
        <MetricCard
          title="Total Hotels"
          value={stats.totalHotels}
          change={12}
          icon={<FaHotel />}
          backgroundColor="rgb(232 246 255)"
          color="rgb(52, 152, 219)"
          border="2px solid rgb(52, 152, 219)"
          onClick={() => onNavigate('/backend/product/list')}
        />
        <MetricCard
          title="Total Agencies"
          value={stats.totalAgencies}
          change={8}
          icon={<FaBuilding />}
          backgroundColor="rgb(221 255 235)"
          color="rgb(46, 204, 113)"
          border="2px solid rgb(46, 204, 113)"
          onClick={() => onNavigate('/backend/product/agency')}
        />
        <MetricCard
          title="Active Properties"
          value={stats.activeHotels}
          change={5}
          icon={<Activity size={20} />}
          backgroundColor="rgba(251, 241, 255, 1)"
          color="#9b59b6"
          border="2px solid rgb(155, 89, 182)"
          onClick={() => onNavigate('/backend/product/list')}
        />
        <MetricCard
          title="Countries Covered"
          value={stats.totalCountries}
          change={3}
          icon={<Globe size={20} />}
          backgroundColor="#fff9f4ff"
          color="#e67e22"
          border="2px solid #e67e22"
          onClick={() => onNavigate('/backend/countries')}
        />
      </div>

      {/* Right Column - Recent Activities */}
      <div className="dashboard-sidebar">
        <div className="recent-activities">
          <div className="section-header">
            <h3>Recent Activities</h3>
            <Users size={18} />
          </div>
          <div className="activities-list">
            {recentActivities.slice(0, 6).map((activity) => {
              const entityType = (activity.entity || '').toLowerCase();
              const activityDate = activity.createdAt ? new Date(activity.createdAt) : null;
              return (
                <div
                  key={activity.id || Math.random()}
                  className="activity-item"
                  onClick={() => onNavigate(`/backend/recent-activity/${activity.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="activity-icon">
                    {entityType === 'hotel' && <FaHotel />}
                    {entityType === 'agency' && <FaBuilding />}
                    {!['hotel','agency'].includes(entityType) && <FaExclamationTriangle />}
                  </div>
                  <div className="activity-content">
                    <p className="activity-text">{activity.description || 'No description available'}</p>
                    <div className="activity-meta">
                      <span className="activity-user">{activity.username || 'Unknown User'}</span>
                      <span className="activity-time">
                        {activityDate ? formatDistanceToNow(activityDate, { addSuffix: true }) : 'Date not available'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
