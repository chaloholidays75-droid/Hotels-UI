// import React, { useState, useEffect, useRef } from 'react';
// import { 
//   FaHotel, FaBuilding, FaUsers, FaChartLine, 
//   FaSync, FaExclamationCircle, FaArrowUp, FaArrowDown 
// } from 'react-icons/fa';
// import { Pie, Line, Bar } from 'react-chartjs-2';
// import { useNavigate } from 'react-router-dom';
// import { formatDistanceToNow } from 'date-fns';
// import 'chartjs-adapter-date-fns';

// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   ArcElement,
//   Title,
//   Tooltip,
//   Legend,
//   Filler,
//   TimeScale
// } from 'chart.js';
// import { Users, MapPin, Activity, Globe, Star } from 'lucide-react';
// import './Dashboard.css';

// // Register Chart.js components
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   ArcElement,
//   TimeScale,
//   Title,
//   Tooltip,
//   Legend,
//   Filler
// );

// const API_BASE = "https://backend.chaloholidayonline.com/api";
// const API_ENDPOINTS = {
//   stats: `${API_BASE}/dashboard/stats`,
//   recentActivities: `${API_BASE}/dashboard/recent-activities`,
//   topCountries: `${API_BASE}/dashboard/top-countries`,
//   monthlyStats: `${API_BASE}/dashboard/monthly-stats`
// };

// const Dashboard = ({ showNotification, onNavigate }) => {
//   const navigate = useNavigate();
//   const lineChartRef = useRef(null);
//   const barChartRef = useRef(null);
//   const pieChartRef = useRef(null);

//   const [stats, setStats] = useState({});
//   const [recentActivities, setRecentActivities] = useState([]);
//   const [topCountries, setTopCountries] = useState([]);
//   const [monthlyStats, setMonthlyStats] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState(null);

//   // Fetch all dashboard data
//   const fetchDashboardData = async () => {
//     setRefreshing(true);
//     setError(null);
//     try {
//       const [statsRes, activitiesRes, topCountriesRes, monthlyStatsRes] = await Promise.allSettled([
//         fetch(API_ENDPOINTS.stats),
//         fetch(API_ENDPOINTS.recentActivities),
//         fetch(API_ENDPOINTS.topCountries),
//         fetch(API_ENDPOINTS.monthlyStats)
//       ]);

//       if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
//         setStats(await statsRes.value.json());
//       }
//       if (activitiesRes.status === 'fulfilled' && activitiesRes.value.ok) {
//         setRecentActivities(await activitiesRes.value.json());
//       }
//       if (topCountriesRes.status === 'fulfilled' && topCountriesRes.value.ok) {
//         setTopCountries(await topCountriesRes.value.json());
//       }
//       if (monthlyStatsRes.status === 'fulfilled' && monthlyStatsRes.value.ok) {
//         setMonthlyStats(await monthlyStatsRes.value.json());
//       }
//     } catch (err) {
//       console.error(err);
//       setError(err.message);
//       showNotification?.(`Error loading dashboard: ${err.message}`, "error");
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   useEffect(() => { fetchDashboardData(); }, []);

//   // Metric Card Component
//   const MetricCard = ({ title, value, change, icon, color, backgroundColor, border, navigateTo }) => (
//     <div className="metric-card" onClick={() => navigateTo && onNavigate(navigateTo)}>
//       <div className="metric-icon" style={{ backgroundColor, color, border }}>
//         {icon}
//       </div>
//       <div className="metric-content">
//         <h3>{value}</h3>
//         <p>{title}</p>
//         {change && (
//           <span className={`metric-change ${change > 0 ? 'positive' : 'negative'}`}>
//             {change > 0 ? '+' : ''}{change}%
//           </span>
//         )}
//       </div>
//     </div>
//   );

//   // Line Chart Click
//   const handleLineChartClick = (event) => {
//     if (!lineChartRef.current) return;
//     const points = lineChartRef.current.getElementsAtEventForMode(
//       event.nativeEvent, 'nearest', { intersect: true }, true
//     );
//     if (points.length) {
//       const monthData = monthlyStats[points[0].index];
//       if (monthData) onNavigate(`/backend/monthly/${monthData.month}`);
//     }
//   };

//   // Bar Chart Click
//   const handleBarChartClick = (event) => {
//     if (!barChartRef.current) return;
//     const bars = barChartRef.current.getElementsAtEventForMode(
//       event.nativeEvent, 'nearest', { intersect: true }, true
//     );
//     if (bars.length) {
//       const country = topCountries[bars[0].index];
//       if (country) onNavigate(`/backend/country/${country.countryId}`);
//     }
//   };

//   // Pie Chart Click
//   const handlePieChartClick = (event) => {
//     if (!pieChartRef.current) return;
//     const slices = pieChartRef.current.getElementsAtEventForMode(
//       event.nativeEvent, 'nearest', { intersect: true }, true
//     );
//     if (slices.length) {
//       const label = ['Hotels','Agencies','Pending'][slices[0].index];
//       if (label === 'Hotels') onNavigate('/backend/product/list');
//       if (label === 'Agencies') onNavigate('/backend/product/agency');
//       if (label === 'Pending') onNavigate('/backend/pending');
//     }
//   };

//   if (loading) return <div className="dashboard-loading">Loading dashboard...</div>;
//   if (error) return (
//     <div className="dashboard-error">
//       <FaExclamationCircle />
//       <p>{error}</p>
//       <button onClick={fetchDashboardData}><FaSync /> Retry</button>
//     </div>
//   );

//   // Chart data
//   const lineChartData = {
//     labels: monthlyStats.map(stat => new Date(stat.month + " 01, 2025")),
//     datasets: [
//       {
//         label: 'Hotels',
//         data: monthlyStats.map(stat => stat.hotels),
//         borderColor: 'rgba(79, 70, 229,1)',
//         backgroundColor: 'rgba(79,70,229,0.2)',
//         fill: true,
//         tension: 0.4,
//         pointRadius: 5
//       },
//       {
//         label: 'Agencies',
//         data: monthlyStats.map(stat => stat.agencies),
//         borderColor: 'rgba(220,38,38,1)',
//         backgroundColor: 'rgba(220,38,38,0.2)',
//         fill: true,
//         tension: 0.4,
//         pointRadius: 5
//       }
//     ]
//   };

//   const barChartData = {
//     labels: topCountries.map(c => c.countryName),
//     datasets: [
//       {
//         label: 'Hotels',
//         data: topCountries.map(c => c.hotelCount),
//         backgroundColor: 'rgba(79, 70, 229,0.8)',
//         borderRadius: 6
//       },
//       {
//         label: 'Agencies',
//         data: topCountries.map(c => c.agencyCount),
//         backgroundColor: 'rgba(220, 38, 38,0.8)',
//         borderRadius: 6
//       }
//     ]
//   };

//   const pieData = {
//     labels: ['Hotels','Agencies','Pending'],
//     datasets: [{
//       data: [stats.totalHotels, stats.totalAgencies, stats.pendingApprovals],
//       backgroundColor: [
//         'rgba(79, 70, 229,0.8)',
//         'rgba(220, 38, 38,0.8)',
//         'rgba(234, 179, 8,0.8)'
//       ]
//     }]
//   };

//   return (
//     <div className="dashboard-container">
//       <div className="metrics-grid">
//         <MetricCard
//           title="Total Hotels" value={stats.totalHotels} change={12} icon={<FaHotel />}
//           color="#3458DB" backgroundColor="#E8F6FF" border="2px solid #3458DB"
//           navigateTo="/backend/product/list"
//         />
//         <MetricCard
//           title="Total Agencies" value={stats.totalAgencies} change={8} icon={<FaBuilding />}
//           color="#2ECC71" backgroundColor="#DDFFEB" border="2px solid #2ECC71"
//           navigateTo="/backend/product/agency"
//         />
//         <MetricCard
//           title="Active Properties" value={stats.activeHotels} change={5} icon={<Activity />}
//           color="#9b59b6" backgroundColor="#FBF1FF" border="2px solid #9b59b6"
//           navigateTo="/backend/product/list"
//         />
//         <MetricCard
//           title="Countries Covered" value={stats.totalCountries} change={3} icon={<Globe />}
//           color="#e67e22" backgroundColor="#FFF9F4" border="2px solid #e67e22"
//           navigateTo="/backend/countries"
//         />
//       </div>

//       <div className="dashboard-content">
//         <div className="charts-column">
//           <div className="chart-card">
//             <h3>Monthly Performance</h3>
//             <Line ref={lineChartRef} data={lineChartData} onClick={handleLineChartClick} />
//           </div>
//           <div className="chart-card">
//             <h3>Top Countries</h3>
//             <Bar ref={barChartRef} data={barChartData} onClick={handleBarChartClick} />
//           </div>
//           <div className="chart-card">
//             <h3>Distribution</h3>
//             <Pie ref={pieChartRef} data={pieData} onClick={handlePieChartClick} />
//           </div>
//         </div>

//         <div className="dashboard-sidebar">
//           <div className="recent-activities">
//             <h3>Recent Activities</h3>
//             {recentActivities.map(act => (
//               <div key={act.id} className="activity-item" onClick={() => onNavigate(`/backend/activity/${act.id}`)}>
//                 <div className="activity-icon">
//                   {act.entity?.toLowerCase?.() === 'hotel' ? <FaHotel /> : <FaBuilding />}
//                 </div>
//                 <div>
//                   <p>{act.description}</p>
//                   <span>{formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}</span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;
