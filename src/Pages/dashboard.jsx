import React, { useState, useEffect } from 'react';
import { 
  FaHotel, FaBuilding, FaUsers, FaChartLine, 
  FaSync, FaEye, FaPlus, FaExclamationTriangle,
  FaGlobe, FaExclamationCircle, FaArrowUp, FaArrowDown
} from 'react-icons/fa';
import { Pie, Line, Bar, Doughnut } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import 'chartjs-adapter-date-fns';
import './Dashboard.css';
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
import { TrendingUp, Users, MapPin, Activity, Globe, Star } from 'lucide-react';
import { borderRadius } from '@mui/system';

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
const API_HOTELS_BY_COUNTRY = `${API_BASE}/dashboard/hotels-by-country`;
const API_AGENCIES_BY_COUNTRY = `${API_BASE}/dashboard/agencies-by-country`;
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
  const [hotelsByCountry, setHotelsByCountry] = useState([]);
  const [agenciesByCountry, setAgenciesByCountry] = useState([]);
  const [topCountries, setTopCountries] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const fetchWithToken = async (url, options = {}) => {
  const token = localStorage.getItem('accessToken'); // get token
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    'Authorization': `Bearer ${token}`  // attach token
  };

  const response = await fetch(url, { ...options, headers });
  return response;
};

  // Chart options and data
  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            family: "'Inter', sans-serif",
            weight: '500'
          },
          color: '#1a1a1a'
        }
      },
      title: {
        display: true,
        text: 'Monthly Performance',
        align: 'start',
        font: {
          size: 18,
          family: "'Inter', sans-serif",
          weight: '600'
        },
        padding: {
          top: 0,
          bottom: 20
        },
        color: '#1a1a1a'
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1a1a1a',
        bodyColor: '#1a1a1a',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y}`;
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 2,
      },
      point: {
        radius: 4,
        hoverRadius: 6,
        borderWidth: 2,
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(215, 215, 215, 0.2)',
          drawBorder: false,
        },
        ticks: {
          padding: 10,
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          },
          color: '#6b7280'
        }
      },
      x: {
         type: 'time',          // <-- important
        time: {
          unit: 'month',
          tooltipFormat: 'MMM yyyy',
          displayFormats: {
            month: 'MMM yyyy'
          }
        },
        grid: {
          color: 'rgba(204, 204, 204, 0.1)',
          drawBorder: false,
        },
        ticks: {
          padding: 10,
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          },
          color: '#6b7280'
        }
      },
    },
    maintainAspectRatio: false,
    animations: {
      tension: {
        duration: 3000,
        easing: 'linear'
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            family: "'Inter', sans-serif",
            weight: '500'
          },
          color: '#1a1a1a'
        }
      },
      title: {
        display: true,
        text: 'Hotels vs Agencies by Country',
        align: 'start',
        font: {
          size: 18,
          family: "'Inter', sans-serif",
          weight: '600'
        },
        padding: {
          top: 0,
          bottom: 20
        },
        color: '#1a1a1a'
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1a1a1a',
        bodyColor: '#1a1a1a',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y}`;
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(215, 215, 215, 0.2)',
          drawBorder: false,
        },
        ticks: {
          padding: 10,
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          },
          color: '#6b7280'
        }
      },
      x: {
        grid: {
          color: 'rgba(204, 204, 204, 0.1)',
          drawBorder: false,
        },
        ticks: {
          padding: 10,
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          },
          color: '#6b7280'
        }
      },
    },
    maintainAspectRatio: false,
    datasets: {
      bar: {
        borderRadius: 6,
        borderSkipped: false,
        categoryPercentage: 0.8,
        barPercentage: 0.9,
      }
    },
    animations: {
      numbers: {
        duration: 1000,
        easing: 'easeOutQuart'
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            family: "'Inter', sans-serif",
            weight: '500'
          },
          color: '#1a1a1a'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1a1a1a',
        bodyColor: '#1a1a1a',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '65%',
    radius: '90%',
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 1000,
      easing: 'easeOutQuart'
    },
    maintainAspectRatio: false,
  };

  const pieData = {
    labels: ['Hotels', 'Agencies', 'Pending'],
    datasets: [
      {
        label: 'Distribution',
        data: [stats.totalHotels, stats.totalAgencies, stats.pendingApprovals],
        backgroundColor: [
          'rgba(79, 70, 229, 0.85)',
          'rgba(217, 70, 239, 0.85)',
          'rgba(234, 179, 8, 0.85)',
        ],
        borderColor: [
          'rgba(79, 70, 229, 1)',
          'rgba(220, 38, 38, 1)',
          'rgba(245, 158, 11, 1)',
        ],
        borderWidth: 2,
        borderJoinStyle: 'round',
        hoverBackgroundColor: [
          'rgba(67, 56, 202, 0.9)',
          'rgba(185, 28, 28, 0.9)',
          'rgba(217, 119, 6, 0.9)',
        ],
        hoverBorderColor: [
          'rgba(79, 70, 229, 1)',
          'rgba(220, 38, 38, 1)',
          'rgba(245, 158, 11, 1)',
        ],
        hoverBorderWidth: 3,
        hoverOffset: 8,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            family: "'Inter', sans-serif",
            weight: '500'
          },
          color: '#1a1a1a'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1a1a1a',
        bodyColor: '#1a1a1a',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    radius: '90%',
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 1000,
      easing: 'easeOutQuart'
    },
    maintainAspectRatio: false,
  };

  const doughnutData = {
    labels: ['Hotels', 'Agencies', 'Pending'],
    datasets: [
      {
        label: 'Distribution',
        data: [stats.totalHotels, stats.totalAgencies, stats.pendingApprovals],
        backgroundColor: [
          'rgba(59, 130, 246, 0.9)',
          'rgba(139, 92, 246, 0.9)',
          'rgba(245, 158, 11, 0.9)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(245, 158, 11, 1)',
        ],
        borderWidth: 0,
        hoverBackgroundColor: [
          'rgba(37, 99, 235, 0.95)',
          'rgba(124, 58, 237, 0.95)',
          'rgba(217, 119, 6, 0.95)',
        ],
        hoverBorderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(245, 158, 11, 1)',
        ],
        hoverBorderWidth: 2,
        hoverOffset: 5,
      },
    ],
  };

  // Custom plugin to display percentages inside doughnut segments
  const doughnutSegmentLabels = {
    id: 'doughnutSegmentLabels',
    afterDraw(chart) {
      const { ctx, chartArea: { width, height } } = chart;
      
      chart.data.datasets.forEach((dataset, i) => {
        const meta = chart.getDatasetMeta(i);
        
        meta.data.forEach((element, index) => {
          const total = dataset.data.reduce((a, b) => a + b, 0);
          const percentage = Math.round((dataset.data[index] / total) * 100);
          
          const { x, y } = element.tooltipPosition();
          
          ctx.save();
          ctx.font = 'bold 14px Inter';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${percentage}%`, x, y);
          ctx.restore();
        });
      });
    }
  };
  const monthMap = {
  Jan: "Jan", January: "Jan",
  Feb: "Feb", February: "Feb",
  Mar: "Mar", March: "Mar",
  Apr: "Apr", April: "Apr",
  May: "May",
  Jun: "Jun", June: "Jun",
  Jul: "Jul", July: "Jul",
  Aug: "Aug", August: "Aug",
  Sep: "Sep", Sept: "Sep", September: "Sep",   // <-- Fix here
  Oct: "Oct", October: "Oct",
  Nov: "Nov", November: "Nov",
  Dec: "Dec", December: "Dec",
};
  
  const lineChartData = {
  labels: monthlyStats.map(stat => {
    const [rawMonth, year] = stat.month.split(" "); // e.g. "Sept", "2025"
    const shortMonth = monthMap[rawMonth] || rawMonth.substring(0, 3);
    return new Date(`${shortMonth} 01, ${year}`);
  }),
    datasets: [
      {
        label: 'Hotels',
        data: monthlyStats.map(stat => stat.hotels),
         pointRadius: monthlyStats.map(stat => stat.hotels === 0 ? 3 : 6),
        borderColor: 'rgba(79, 70, 229, 1)',
        backgroundColor: (context) => {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return null;
          
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(79, 70, 229, 0.1)');
          gradient.addColorStop(0.7, 'rgba(79, 70, 229, 0.3)');
          gradient.addColorStop(1, 'rgba(79, 70, 229, 0.5)');
          return gradient;
        },
        pointBackgroundColor: 'rgba(79, 70, 229, 1)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        
        pointHoverRadius: 6,
        tension: 7,
        fill: true,
        
        borderWidth: 3,
      },
      {
        label: 'Agencies',
        data: monthlyStats.map(stat => stat.agencies),
         pointRadius: monthlyStats.map(stat => stat.agencies === 0 ? 3 : 6),
        borderColor: 'rgba(220, 38, 38, 1)',
        backgroundColor: (context) => {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return null;
          
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(220, 38, 38, 0.1)');
          gradient.addColorStop(0.7, 'rgba(220, 38, 38, 0.3)');
          gradient.addColorStop(1, 'rgba(220, 38, 38, 0.5)');
          return gradient;
        },
        pointBackgroundColor: 'rgba(220, 38, 38, 1)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        
        pointHoverRadius: 6,
        tension: 0.4,
        spanGaps:true,
        fill: true,
        borderWidth: 3,
      },
    ],
  };

  const barChartData = {
    labels: topCountries.slice(0, 5).map(country => country.countryName),
    datasets: [
      {
        label: 'Hotels',
        data: topCountries.slice(0, 5).map(country => country.hotelCount),
        backgroundColor: (context) => {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return 'rgba(79, 70, 229, 0.8)';
          
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(79, 70, 229, 0.8)');
          gradient.addColorStop(1, 'rgba(67, 56, 202, 0.9)');
          return gradient;
        },
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 0,
        borderRadius: 6,
        borderSkipped: false,
        hoverBackgroundColor: 'rgba(67, 56, 202, 0.9)',
      },
      {
        label: 'Agencies',
        data: topCountries.slice(0, 5).map(country => country.agencyCount),
        backgroundColor: (context) => {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return 'rgba(220, 38, 38, 0.8)';
          
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(220, 38, 38, 0.8)');
          gradient.addColorStop(1, 'rgba(185, 28, 28, 0.9)');
          return gradient;
        },
        borderColor: 'rgba(220, 38, 38, 1)',
        borderWidth: 0,
        borderRadius: 6,
        borderSkipped: false,
        hoverBackgroundColor: 'rgba(185, 28, 28, 0.9)',
      },
    ],
  };

const fetchDashboardData = async () => {
  setRefreshing(true);
  setError(null);

  try {
    // Get the JWT token from localStorage (or wherever you store it)
    const token = localStorage.getItem("token"); // adjust key if different

    const headers = token
      ? { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" };

    const [
      statsRes,
      activitiesRes,
      hotelsByCountryRes,
      agenciesByCountryRes,
      topCountriesRes,
      monthlyStatsRes
    ] = await Promise.allSettled([
      fetch(API_STATS, { headers }),
      fetch(API_RECENT_ACTIVITIES, { headers }),
      fetch(API_HOTELS_BY_COUNTRY, { headers }),
      fetch(API_AGENCIES_BY_COUNTRY, { headers }),
      fetch(API_TOP_COUNTRIES, { headers }),
      fetch(API_MONTHLY_STATS, { headers })
    ]);

    if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
      const statsData = await statsRes.value.json();
      setStats(statsData);
    }

    if (activitiesRes.status === 'fulfilled' && activitiesRes.value.ok) {
      const activitiesData = await activitiesRes.value.json();

       console.log("Raw Recent Activities from API:", activitiesData);
      // Normalize the activities data to handle missing user information
      const normalizedActivities = activitiesData.map(activity => ({
        id: activity.id || Math.random().toString(36).substr(2, 9),
        user: activity.user || activity.userName || activity.createdBy || "System",
        action: activity.action || "modified",
        type: activity.type || "item",
        name: activity.name || activity.title || "Unnamed",
        timeAgo: activity.timeAgo || (activity.timestamp ? 
          formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }) : 
          "Recently"),
        timestamp: activity.timestamp || new Date().toISOString(),
        country: activity.country || null
      }));
      
      setRecentActivities(normalizedActivities);
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
      console.log("Raw API response:", monthlyStatsData);
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
          
          icon={<FaHotel />}
          backgroundColor=" rgb(232 246 255)"
          color= "rgb(52, 152, 219)"
          border=" 2px solid rgb(52, 152, 219)"
        />
        <MetricCard
          title="Total Agencies"
          value={stats.totalAgencies}
          
          icon={<FaBuilding />}
          color=" rgb(46, 204, 113)"
          backgroundColor=" rgb(221 255 235)"
          border= " 2px solid rgb(46, 204, 113)"
        />
        <MetricCard
          title="Active Properties"
          value={stats.activeHotels}
          
          icon={<Activity size={20} />}
          color="#9b59b6"
          backgroundColor="rgba(251, 241, 255, 1)"
          border="2px solid rgb(155, 89, 182)"
        />
        <MetricCard
          title="Countries Covered"
          value={stats.totalCountries}
          
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
            {monthlyStats.length > 0 ? (
              <Line data={lineChartData} options={lineChartOptions} />
            ) : (
              <p>Loading chart...</p>
            )}
            </div>
          </div>

          {/* Distribution Charts */}
          <div className="charts-row">
            <div className="chart-card">
              <div className="chart-header">
                <h3>Distribution Overview</h3>
              </div>
              <div className="chart-container">
                <Pie data={pieData} options={pieOptions} />
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
        </div> 

        {/* Right Column - Sidebar */}
        <div className="dashboard-sidebar">
          <div className="recent-activities">
            <div className="section-header">
              <h3>Recent Activities</h3>
              <Users size={18} />
            </div>

            <div className="activities-list">
              {recentActivities.slice(0, 6).map((activity, index) => {
                // Determine user display name with better fallbacks
                const getUserDisplayName = () => {
                  if (activity.user) return activity.user;
                  if (activity.userName) return activity.userName;
                  if (activity.userEmail) return activity.userEmail.split('@')[0]; // Use part of email if available
                  if (activity.createdBy) return activity.createdBy;
                  return "System"; // Default fallback
                };

                // Determine activity description with better fallbacks
                const getActivityDescription = () => {
                  const user = getUserDisplayName();
                  const action = activity.action || "performed action on";
                  const type = activity.type || "item";
                  const name = activity.name || 'Unnamed';
                  
                  return `${user} ${action} ${type} "${name}"`;
                };

                return (
                  <div key={activity.id || `activity-${index}`} className="activity-item">
                    <div className="activity-icon">
                      {activity.type === 'hotel' && <FaHotel />}
                      {activity.type === 'agency' && <FaBuilding />}
                      {!activity.type && <FaExclamationTriangle />}
                    </div>
                    <div className="activity-content">
                      <p className="activity-text">
                        {getActivityDescription()}
                      </p>
                      <div className="activity-meta">
                        <span className="activity-time">
                          {activity.timestamp ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }) : 
                          activity.timeAgo || "Recently"}
                        </span>
                        {activity.country && (
                          <span className="activity-country">{activity.country}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="see-more-wrapper">
              <button
                className="see-more-btn"
                onClick={() => navigate("/recent-activities")}
              >
                See More
              </button>
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