// // Dashboard.jsx
// import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import {
//   Box,
//   Grid,
//   Card,
//   CardContent,
//   Typography,
//   CircularProgress,
//   Alert,
//   Paper,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Chip,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   useTheme,
//   useMediaQuery,
//   Avatar,
//   Divider,
//   IconButton,
//   Tooltip,
//   alpha,
//   Skeleton
// } from '@mui/material';
// import {
//   BarChart,
//   Bar,
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip as RechartsTooltip,
//   Legend,
//   ResponsiveContainer,
//   AreaChart,
//   Area,
//   PieChart,
//   Pie,
//   Cell
// } from 'recharts';
// import {
//   Hotel,
//   Business,
//   LocalShipping,
//   BookOnline,
//   Public,
//   PendingActions,
//   CheckCircle,
//   Schedule,
//   Refresh,
//   TrendingUp,
//   TrendingDown,
//   ErrorOutline
// } from '@mui/icons-material';

// import './Dashboard.css';

// // Constants and Configuration
// const DASHBOARD_CONFIG = {
//   BASE_URL: process.env.REACT_APP_API_BASE_URL || "http://localhost:5039",
//   RETRY_DELAY: 3000,
//   REFRESH_INTERVAL: 300000, // 5 minutes
//   CHART_HEIGHT: 300,
//   MOBILE_CHART_HEIGHT: 250
// };

// // API Service with error handling and caching
// class DashboardAPIService {
//   constructor(baseUrl) {
//     this.baseUrl = baseUrl;
//     this.cache = new Map();
//     this.cacheTimeout = 60000; // 1 minute cache
//   }

//   async fetchWithCache(endpoint, options = {}) {
//     const cacheKey = `${endpoint}-${JSON.stringify(options)}`;
//     const cached = this.cache.get(cacheKey);
    
//     if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
//       return cached.data;
//     }

//     try {
//       const response = await fetch(`${this.baseUrl}${endpoint}`, {
//         headers: {
//           'Content-Type': 'application/json',
//           ...options.headers,
//         },
//         ...options
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//       }

//       const data = await response.json();
//       this.cache.set(cacheKey, { data, timestamp: Date.now() });
//       return data;
//     } catch (error) {
//       console.error(`API Error for ${endpoint}:`, error);
//       throw error;
//     }
//   }

//   getStats() {
//     return this.fetchWithCache('/api/dashboard/stats');
//   }

//   getHotelsByCountry() {
//     return this.fetchWithCache('/api/dashboard/hotels-by-country');
//   }

//   getAgenciesByCountry() {
//     return this.fetchWithCache('/api/dashboard/agencies-by-country');
//   }

//   getSuppliersByCountry() {
//     return this.fetchWithCache('/api/dashboard/suppliers-by-country');
//   }

//   getBookingsByCountry() {
//     return this.fetchWithCache('/api/dashboard/bookings-by-country');
//   }

//   getMonthlyStats(months = 6) {
//     return this.fetchWithCache(`/api/dashboard/monthly-stats?months=${months}`);
//   }

//   getTopCountries() {
//     return this.fetchWithCache('/api/dashboard/top-countries');
//   }

//   getRecentActivities() {
//     return this.fetchWithCache('/api/dashboard/recent-activities');
//   }

//   clearCache() {
//     this.cache.clear();
//   }
// }

// const dashboardAPI = new DashboardAPIService(DASHBOARD_CONFIG.BASE_URL);

// // Custom Hooks
// const useDashboardData = (monthsFilter) => {
//   const [state, setState] = useState({
//     loading: true,
//     error: null,
//     stats: null,
//     hotelsByCountry: [],
//     agenciesByCountry: [],
//     suppliersByCountry: [],
//     bookingsByCountry: [],
//     monthlyStats: [],
//     topCountries: [],
//     recentActivities: []
//   });

//   const fetchData = useCallback(async () => {
//     try {
//       setState(prev => ({ ...prev, loading: true, error: null }));

//       const [
//         statsData,
//         hotelsData,
//         agenciesData,
//         suppliersData,
//         bookingsData,
//         monthlyData,
//         topCountriesData,
//         activitiesData
//       ] = await Promise.all([
//         dashboardAPI.getStats(),
//         dashboardAPI.getHotelsByCountry(),
//         dashboardAPI.getAgenciesByCountry(),
//         dashboardAPI.getSuppliersByCountry(),
//         dashboardAPI.getBookingsByCountry(),
//         dashboardAPI.getMonthlyStats(monthsFilter),
//         dashboardAPI.getTopCountries(),
//         dashboardAPI.getRecentActivities()
//       ]);

//       setState({
//         loading: false,
//         error: null,
//         stats: statsData,
//         hotelsByCountry: hotelsData,
//         agenciesByCountry: agenciesData,
//         suppliersByCountry: suppliersData,
//         bookingsByCountry: bookingsData,
//         monthlyStats: monthlyData,
//         topCountries: topCountriesData,
//         recentActivities: activitiesData
//       });
//     } catch (err) {
//       setState(prev => ({
//         ...prev,
//         loading: false,
//         error: err.message || 'Failed to load dashboard data. Please try again.'
//       }));
//     }
//   }, [monthsFilter]);

//   return { ...state, refetch: fetchData };
// };

// // Enhanced Stat Card Component
// const StatCard = ({ 
//   title, 
//   value, 
//   subtitle, 
//   trend, 
//   color = '#1976d2', 
//   icon, 
//   loading = false 
// }) => (
//   <Card className="stat-card" sx={{ 
//     background: `linear-gradient(135deg, ${alpha(color, 0.05)} 0%, ${alpha(color, 0.1)} 100%)`,
//     border: `1px solid ${alpha(color, 0.1)}`
//   }}>
//     <CardContent className="stat-card-content">
//       <Box className="flex-between">
//         <Box flex={1}>
//           <Typography className="stat-card-title" color="text.secondary">
//             {title}
//           </Typography>
//           {loading ? (
//             <Skeleton variant="text" width={80} height={40} />
//           ) : (
//             <Typography className="stat-card-value" sx={{ color }}>
//               {typeof value === 'number' ? value.toLocaleString() : value}
//             </Typography>
//           )}
//           {subtitle && (
//             <Box className="flex-align-center" gap={1} mt={0.5}>
//               {loading ? (
//                 <Skeleton variant="text" width={120} height={20} />
//               ) : (
//                 <>
//                   <Typography className="stat-card-subtitle">
//                     {subtitle}
//                   </Typography>
//                   {trend && (
//                     <Tooltip title={`${trend.value > 0 ? 'Increased' : 'Decreased'} by ${Math.abs(trend.value)}% from last period`}>
//                       <Box className="flex-align-center">
//                         {trend.value > 0 ? (
//                           <TrendingUp sx={{ fontSize: 16, color: '#4caf50' }} />
//                         ) : (
//                           <TrendingDown sx={{ fontSize: 16, color: '#f44336' }} />
//                         )}
//                         <Typography 
//                           variant="caption" 
//                           sx={{ 
//                             color: trend.value > 0 ? '#4caf50' : '#f44336',
//                             fontWeight: 600
//                           }}
//                         >
//                           {Math.abs(trend.value)}%
//                         </Typography>
//                       </Box>
//                     </Tooltip>
//                   )}
//                 </>
//               )}
//             </Box>
//           )}
//         </Box>
//         <Box 
//           className="stat-card-icon" 
//           sx={{ 
//             color,
//             background: alpha(color, 0.1),
//             borderRadius: 2
//           }}
//         >
//           {icon}
//         </Box>
//       </Box>
//     </CardContent>
//   </Card>
// );

// // Enhanced Distribution Card Component
// const DistributionCard = ({ title, data, color, loading = false }) => {
//   const total = useMemo(() => 
//     data?.reduce((sum, item) => sum + (item.count || 0), 0) || 0,
//     [data]
//   );

//   const maxCount = useMemo(() => 
//     Math.max(...(data?.map(d => d.count) || [0])),
//     [data]
//   );

//   if (loading) {
//     return (
//       <Card className="distribution-card">
//         <CardContent>
//           <Skeleton variant="text" width={160} height={24} />
//           {[...Array(5)].map((_, index) => (
//             <Box key={index} sx={{ mt: 2 }}>
//               <Skeleton variant="text" width="80%" height={20} />
//               <Skeleton variant="rectangular" width="100%" height={8} sx={{ borderRadius: 1, mt: 0.5 }} />
//             </Box>
//           ))}
//         </CardContent>
//       </Card>
//     );
//   }

//   return (
//     <Card className="distribution-card">
//       <CardContent className="distribution-card-content">
//         <Typography className="distribution-card-title" variant="h6" gutterBottom>
//           {title}
//         </Typography>
//         <Box sx={{ mt: 2 }}>
//           {data?.slice(0, 5).map((item, index) => (
//             <Box key={item.countryId || index} className="distribution-item" sx={{ mb: 2 }}>
//               <Box className="distribution-item-header">
//                 <Tooltip title={item.country}>
//                   <Typography className="distribution-country" noWrap>
//                     {item.country}
//                   </Typography>
//                 </Tooltip>
//                 <Box className="flex-align-center" gap={0.5}>
//                   <Typography className="distribution-count">
//                     {item.count?.toLocaleString()}
//                   </Typography>
//                   <Typography variant="caption" color="text.secondary">
//                     ({Math.round((item.count / total) * 100)}%)
//                   </Typography>
//                 </Box>
//               </Box>
//               <Box className="distribution-bar-container">
//                 <Box
//                   className="distribution-bar"
//                   sx={{
//                     backgroundColor: color,
//                     width: `${(item.count / maxCount) * 100}%`,
//                     transition: 'width 0.5s ease-in-out'
//                   }}
//                 />
//               </Box>
//             </Box>
//           ))}
//         </Box>
//       </CardContent>
//     </Card>
//   );
// };

// // Chart Components
// const MonthlyStatsChart = ({ data, loading, isMobile }) => {
//   if (loading) {
//     return <Skeleton variant="rectangular" height={isMobile ? DASHBOARD_CONFIG.MOBILE_CHART_HEIGHT : DASHBOARD_CONFIG.CHART_HEIGHT} />;
//   }

//   return (
//     <ResponsiveContainer width="100%" height={isMobile ? DASHBOARD_CONFIG.MOBILE_CHART_HEIGHT : DASHBOARD_CONFIG.CHART_HEIGHT}>
//       <AreaChart data={data}>
//         <defs>
//           <linearGradient id="colorHotels" x1="0" y1="0" x2="0" y2="1">
//             <stop offset="5%" stopColor="#1976d2" stopOpacity={0.3}/>
//             <stop offset="95%" stopColor="#1976d2" stopOpacity={0}/>
//           </linearGradient>
//           <linearGradient id="colorAgencies" x1="0" y1="0" x2="0" y2="1">
//             <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.3}/>
//             <stop offset="95%" stopColor="#2e7d32" stopOpacity={0}/>
//           </linearGradient>
//         </defs>
//         <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//         <XAxis 
//           dataKey="month" 
//           tick={{ fontSize: 12 }}
//           tickLine={false}
//         />
//         <YAxis 
//           tick={{ fontSize: 12 }}
//           tickLine={false}
//         />
//         <RechartsTooltip 
//           contentStyle={{ 
//             borderRadius: 8,
//             boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
//           }}
//         />
//         <Legend />
//         <Area 
//           type="monotone" 
//           dataKey="hotels" 
//           stroke="#1976d2" 
//           fill="url(#colorHotels)" 
//           strokeWidth={2}
//           name="Hotels"
//         />
//         <Area 
//           type="monotone" 
//           dataKey="agencies" 
//           stroke="#2e7d32" 
//           fill="url(#colorAgencies)" 
//           strokeWidth={2}
//           name="Agencies"
//         />
//       </AreaChart>
//     </ResponsiveContainer>
//   );
// };

// // Loading Component
// const LoadingSpinner = ({ message = "Loading Dashboard..." }) => (
//   <Box className="loading-container">
//     <Box className="flex-column flex-center">
//       <CircularProgress className="loading-spinner" size={60} thickness={4} />
//       <Typography className="loading-text" variant="h6" mt={2}>
//         {message}
//       </Typography>
//     </Box>
//   </Box>
// );

// // Error Component
// const ErrorDisplay = ({ error, onRetry }) => (
//   <Box className="error-container">
//     <Alert 
//       severity="error" 
//       className="error-alert"
//       icon={<ErrorOutline />}
//       action={
//         <IconButton size="small" onClick={onRetry}>
//           <Refresh />
//         </IconButton>
//       }
//     >
//       <Typography variant="body1" fontWeight={600}>
//         Unable to load dashboard
//       </Typography>
//       <Typography variant="body2">
//         {error}
//       </Typography>
//     </Alert>
//   </Box>
// );

// // Main Dashboard Component
// const Dashboard = () => {
//   const theme = useTheme();
//   const isMobile = useMediaQuery(theme.breakpoints.down('md'));
//   const [monthsFilter, setMonthsFilter] = useState(6);
//   const [lastRefresh, setLastRefresh] = useState(new Date());

//   const {
//     loading,
//     error,
//     stats,
//     hotelsByCountry,
//     agenciesByCountry,
//     suppliersByCountry,
//     bookingsByCountry,
//     monthlyStats,
//     topCountries,
//     recentActivities,
//     refetch
//   } = useDashboardData(monthsFilter);

//   // Color palette with professional shades
//   const COLORS = useMemo(() => ({
//     hotels: '#1976d2',
//     agencies: '#2e7d32',
//     suppliers: '#ed6c02',
//     bookings: '#d32f2f',
//     countries: '#7b1fa2',
//     success: '#4caf50',
//     warning: '#ff9800',
//     error: '#f44336'
//   }), []);

//   const handleRefresh = useCallback(async () => {
//     dashboardAPI.clearCache();
//     await refetch();
//     setLastRefresh(new Date());
//   }, [refetch]);

//   const handleMonthsFilterChange = useCallback((event) => {
//     setMonthsFilter(event.target.value);
//   }, []);

//   // Auto-refresh interval
//   useEffect(() => {
//     const interval = setInterval(handleRefresh, DASHBOARD_CONFIG.REFRESH_INTERVAL);
//     return () => clearInterval(interval);
//   }, [handleRefresh]);

//   if (loading && !stats) {
//     return <LoadingSpinner />;
//   }

//   if (error) {
//     return <ErrorDisplay error={error} onRetry={handleRefresh} />;
//   }

//   return (
//     <Box className="dashboard-container" p={isMobile ? 2 : 3}>
//       {/* Header with Controls */}
//       <Box className="flex-between mb-4" flexDirection={isMobile ? 'column' : 'row'} gap={2}>
//         <Box>
//           <Typography variant="h4" className="dashboard-title" gutterBottom fontWeight={700}>
//             Business Intelligence Dashboard
//           </Typography>
//           <Typography variant="body1" className="dashboard-subtitle" color="text.secondary">
//             Real-time overview of hotel management performance and metrics
//           </Typography>
//           {lastRefresh && (
//             <Typography variant="caption" color="text.secondary">
//               Last updated: {lastRefresh.toLocaleTimeString()}
//             </Typography>
//           )}
//         </Box>
        
//         <Box className="flex-align-center" gap={2}>
//           <FormControl size="small" className="filter-select" sx={{ minWidth: 120 }}>
//             <InputLabel>Time Range</InputLabel>
//             <Select
//               value={monthsFilter}
//               label="Time Range"
//               onChange={handleMonthsFilterChange}
//             >
//               <MenuItem value={3}>Last 3 Months</MenuItem>
//               <MenuItem value={6}>Last 6 Months</MenuItem>
//               <MenuItem value={12}>Last Year</MenuItem>
//               <MenuItem value={24}>Last 2 Years</MenuItem>
//             </Select>
//           </FormControl>
          
//           <Tooltip title="Refresh Data">
//             <IconButton 
//               onClick={handleRefresh}
//               className="refresh-button"
//               size="large"
//             >
//               <Refresh />
//             </IconButton>
//           </Tooltip>
//         </Box>
//       </Box>

//       {/* Key Performance Indicators */}
//       <Grid container spacing={3} className="mb-4">
//         <Grid item xs={12} sm={6} md={3}>
//           <StatCard
//             title="Total Hotels"
//             value={stats?.totalHotels}
//             subtitle={`${stats?.activeHotels || 0} active`}
//             trend={{ value: 12.5 }}
//             color={COLORS.hotels}
//             icon={<Hotel sx={{ fontSize: 28 }} />}
//             loading={loading}
//           />
//         </Grid>
//         <Grid item xs={12} sm={6} md={3}>
//           <StatCard
//             title="Partner Agencies"
//             value={stats?.totalAgencies}
//             subtitle={`${stats?.activeAgencies} active`}
//             trend={{ value: 8.3 }}
//             color={COLORS.agencies}
//             icon={<Business sx={{ fontSize: 28 }} />}
//             loading={loading}
//           />
//         </Grid>
//         <Grid item xs={12} sm={6} md={3}>
//           <StatCard
//             title="Supply Partners"
//             value={stats?.totalSuppliers}
//             subtitle={`${stats?.activeSuppliers} active`}
//             trend={{ value: -2.1 }}
//             color={COLORS.suppliers}
//             icon={<LocalShipping sx={{ fontSize: 28 }} />}
//             loading={loading}
//           />
//         </Grid>
//         <Grid item xs={12} sm={6} md={3}>
//           <StatCard
//             title="Total Bookings"
//             value={stats?.totalBookings}
//             subtitle={`${stats?.pendingBookings} pending`}
//             trend={{ value: 15.7 }}
//             color={COLORS.bookings}
//             icon={<BookOnline sx={{ fontSize: 28 }} />}
//             loading={loading}
//           />
//         </Grid>
//       </Grid>

//       {/* Performance Metrics */}
//       <Grid container spacing={3} className="mb-4">
//         <Grid item xs={12} sm={6} md={2}>
//           <StatCard
//             title="Global Reach"
//             value={stats?.totalCountries}
//             color={COLORS.countries}
//             icon={<Public sx={{ fontSize: 24 }} />}
//             loading={loading}
//           />
//         </Grid>
//         <Grid item xs={12} sm={6} md={2}>
//           <StatCard
//             title="Pending Actions"
//             value={stats?.pendingApprovals}
//             color={COLORS.warning}
//             icon={<PendingActions sx={{ fontSize: 24 }} />}
//             loading={loading}
//           />
//         </Grid>
//         <Grid item xs={12} sm={6} md={2}>
//           <StatCard
//             title="Success Rate"
//             value="98.2%"
//             color={COLORS.success}
//             icon={<CheckCircle sx={{ fontSize: 24 }} />}
//             loading={loading}
//           />
//         </Grid>
//         <Grid item xs={12} sm={6} md={2}>
//           <StatCard
//             title="Avg. Response"
//             value="2.4h"
//             color={COLORS.hotels}
//             icon={<Schedule sx={{ fontSize: 24 }} />}
//             loading={loading}
//           />
//         </Grid>
//         <Grid item xs={12} sm={6} md={2}>
//           <StatCard
//             title="Revenue"
//             value="$2.8M"
//             trend={{ value: 22.3 }}
//             color={COLORS.success}
//             icon={<TrendingUp sx={{ fontSize: 24 }} />}
//             loading={loading}
//           />
//         </Grid>
//         <Grid item xs={12} sm={6} md={2}>
//           <StatCard
//             title="Churn Rate"
//             value="1.2%"
//             trend={{ value: -0.5 }}
//             color={COLORS.error}
//             icon={<TrendingDown sx={{ fontSize: 24 }} />}
//             loading={loading}
//           />
//         </Grid>
//       </Grid>

//       {/* Charts Section */}
//       <Grid container spacing={3} className="mb-4">
//         {/* Monthly Performance Chart */}
//         <Grid item xs={12} lg={8}>
//           <Card className="chart-container" sx={{ height: '100%' }}>
//             <CardContent className="chart-content">
//               <Box className="flex-between" mb={2}>
//                 <Typography variant="h6" className="chart-title">
//                   Monthly Performance Trends
//                 </Typography>
//                 <Chip 
//                   label="Real-time" 
//                   size="small" 
//                   color="primary" 
//                   variant="outlined"
//                 />
//               </Box>
//               <MonthlyStatsChart 
//                 data={monthlyStats} 
//                 loading={loading}
//                 isMobile={isMobile}
//               />
//             </CardContent>
//           </Card>
//         </Grid>

//         {/* Distribution Charts */}
//         <Grid item xs={12} lg={4}>
//           <Grid container spacing={2}>
//             <Grid item xs={12}>
//               <DistributionCard
//                 title="Hotels Distribution"
//                 data={hotelsByCountry}
//                 color={COLORS.hotels}
//                 loading={loading}
//               />
//             </Grid>
//             <Grid item xs={12}>
//               <DistributionCard
//                 title="Booking Distribution"
//                 data={bookingsByCountry}
//                 color={COLORS.bookings}
//                 loading={loading}
//               />
//             </Grid>
//           </Grid>
//         </Grid>
//       </Grid>

//       {/* Additional content remains similar but with loading states and enhanced styling */}
//       {/* ... (rest of the component with similar enhancements) ... */}
//     </Box>
//   );
// };

// // Helper function for consistent avatar colors
// const getRandomColor = (str) => {
//   const colors = [
//     '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
//     '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
//     '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800'
//   ];
//   let hash = 0;
//   for (let i = 0; i < str.length; i++) {
//     hash = str.charCodeAt(i) + ((hash << 5) - hash);
//   }
//   return colors[Math.abs(hash) % colors.length];
// };

// export default Dashboard;