// Dashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import "chart.js/auto";
import './Dashboard.css';
import CommercialForm from "../Booking/CommercialForm";

const Dashboard = () => {
  // const [summary, setSummary] = useState({});
  // const [bookingTrends, setBookingTrends] = useState([]);
  // const [statusDistribution, setStatusDistribution] = useState([]);
  // const [agencyPerformance, setAgencyPerformance] = useState([]);
  // const [supplierPerformance, setSupplierPerformance] = useState([]);
  // const [hotelOccupancy, setHotelOccupancy] = useState([]);
  // const [topPerformers, setTopPerformers] = useState({});
  // const [dailyBookings, setDailyBookings] = useState([]);
  // const [upcomingBookings, setUpcomingBookings] = useState([]);
  // const [peakSeason, setPeakSeason] = useState({});
  // const [peopleDistribution, setPeopleDistribution] = useState([]);
  // const [averages, setAverages] = useState({});
  // const [recentActivity, setRecentActivity] = useState([]);
  // const [loading, setLoading] = useState(true);

  // const API_BASE = "http://localhost:5039/api/Dashboard";

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       setLoading(true);
  //       const [
  //         summaryRes,
  //         bookingTrendsRes,
  //         statusRes,
  //         agencyRes,
  //         supplierRes,
  //         hotelRes,
  //         topRes,
  //         dailyRes,
  //         upcomingRes,
  //         peakRes,
  //         peopleRes,
  //         avgRes,
  //         activityRes,
  //       ] = await Promise.all([
  //         axios.get(`${API_BASE}/summary`),
  //         axios.get(`${API_BASE}/booking-trends`),
  //         axios.get(`${API_BASE}/status-distribution`),
  //         axios.get(`${API_BASE}/agency-performance`),
  //         axios.get(`${API_BASE}/supplier-performance`),
  //         // axios.get(`${API_BASE}/hotel-occupancy`),
  //         axios.get(`${API_BASE}/top-performers`),
  //         axios.get(`${API_BASE}/daily-bookings`),
  //         axios.get(`${API_BASE}/upcoming-bookings`),
  //         axios.get(`${API_BASE}/peak-season`),
  //         // axios.get(`${API_BASE}/people-distribution`),
  //         // axios.get(`${API_BASE}/averages`),
  //         axios.get(`${API_BASE}/recent-activity`),
  //       ]);

  //       setSummary(summaryRes.data);
  //       setBookingTrends(bookingTrendsRes.data);
  //       setStatusDistribution(statusRes.data);
  //       setAgencyPerformance(agencyRes.data);
  //       setSupplierPerformance(supplierRes.data);
  //       setHotelOccupancy(hotelRes.data);
  //       setTopPerformers(topRes.data);
  //       setDailyBookings(dailyRes.data);
  //       setUpcomingBookings(upcomingRes.data);
  //       setPeakSeason(peakRes.data);
  //       setPeopleDistribution(peopleRes.data);
  //       setAverages(avgRes.data);
  //       setRecentActivity(activityRes.data);
  //     } catch (err) {
  //       console.error("Error fetching dashboard data:", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchData();
  // }, []);

  // const formatDate = (date) => {
  //   if (!date) return "N/A";
  //   const d = new Date(date);
  //   return isNaN(d) ? "N/A" : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  // };

  // const getStatusBadgeClass = (status) => {
  //   switch (status?.toLowerCase()) {
  //     case 'confirmed':
  //       return 'statusBadgeBase statusConfirmed';
  //     case 'pending':
  //       return 'statusBadgeBase statusPending';
  //     case 'cancelled':
  //       return 'statusBadgeBase statusCancelled';
  //     default:
  //       return 'statusBadgeBase';
  //   }
  // };

  // // Professional color palette
  // const colors = {
  //   primary: {
  //     blue: '#3b82f6',
  //     green: '#10b981',
  //     red: '#ef4444',
  //     teal: '#14b8a6',
  //     purple: '#8b5cf6',
  //     orange: '#f97316',
  //     indigo: '#6366f1'
  //   },
  //   light: {
  //     blue: 'rgba(59, 130, 246, 0.1)',
  //     green: 'rgba(16, 185, 129, 0.1)',
  //     red: 'rgba(239, 68, 68, 0.1)',
  //     teal: 'rgba(20, 184, 166, 0.1)',
  //     purple: 'rgba(139, 92, 246, 0.1)',
  //     orange: 'rgba(249, 115, 22, 0.1)',
  //     indigo: 'rgba(99, 102, 241, 0.1)'
  //   }
  // };

  // // Safe month label formatting
  // const getMonthLabel = (monthData) => {
  //   if (!monthData) return '';
  //   const month = monthData.month || monthData.monthName || '';
  //   const year = monthData.year || '';
    
  //   if (typeof month === 'number') {
  //     const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  //     const monthName = monthNames[month - 1] || month.toString();
  //     return `${monthName} '${year.toString().slice(-2)}`;
  //   }
    
  //   if (typeof month === 'string') {
  //     return `${month.slice(0, 3)} '${year.toString().slice(-2)}`;
  //   }
    
  //   return `${month} '${year.toString().slice(-2)}`;
  // };

  // // All KPIs - Including everything from summary and averages
  // const allKPIs = [
  //   // Summary KPIs
  //   { key: 'totalBookings', title: 'Total Bookings', value: summary.totalBookings || '0', icon: '📊', color: 'Blue' },
  //   // { key: 'totalRevenue', title: 'Revenue', value: summary.totalRevenue ? `$${Number(summary.totalRevenue).toLocaleString()}` : '$0', icon: '💰', color: 'Green' },
  //   // { key: 'confirmedBookings', title: 'Confirmed', value: summary.confirmedBookings || '0', icon: '✅', color: 'Teal' },
  //   // { key: 'cancelledBookings', title: 'Cancelled', value: summary.cancelledBookings || '0', icon: '❌', color: 'Red' },
    
  //   // Additional summary KPIs
  //   { key: 'pendingBookings', title: 'Pending', value: summary.pendingBookings || '0', icon: '⏳', color: 'Orange' },
  //   { key: 'totalAgencies', title: 'Agencies', value: summary.totalAgencies || '0', icon: '🏢', color: 'Purple' },
  //   { key: 'totalHotels', title: 'Hotels', value: summary.totalHotels || '0', icon: '🏨', color: 'Indigo' },
  //   { key: 'totalSuppliers', title: 'Suppliers', value: summary.totalSuppliers || '0', icon: '🤝', color: 'Blue' },
    
  //   // Averages
  //   { key: 'averageNights', title: 'Avg Nights', value: averages.averageNights || '0', icon: '🌙', color: 'Purple' },
  //   { key: 'averagePeople', title: 'Avg People', value: averages.averagePeople || '0', icon: '👥', color: 'Teal' },
    
  //   // Peak Season
  //   // { key: 'peakMonth', title: 'Peak Month', value: peakSeason.PeakMonthName || 'N/A', icon: '📈', color: 'Orange' }
  // ];

  // // Chart data configurations
  // const bookingTrendData = {
  //   labels: bookingTrends.slice(-6).map(d => getMonthLabel(d)),
  //   datasets: [
  //     { 
  //       label: "Total Bookings", 
  //       data: bookingTrends.slice(-6).map(d => d.totalBookings), 
  //       borderColor: colors.primary.blue,
  //       backgroundColor: colors.light.blue,
  //       borderWidth: 2,
  //       tension: 0.4,
  //       fill: true
  //     },
  //     { 
  //       label: "Confirmed", 
  //       data: bookingTrends.slice(-6).map(d => d.confirmed), 
  //       borderColor: colors.primary.green,
  //       backgroundColor: colors.light.green,
  //       borderWidth: 2,
  //       tension: 0.4,
  //       fill: true
  //     }
  //   ]
  // };

  // const statusPieData = {
  //   labels: statusDistribution.map(d => d.status),
  //   datasets: [{ 
  //     data: statusDistribution.map(d => d.count), 
  //     backgroundColor: [
  //       colors.primary.green,
  //       colors.primary.blue,
  //       colors.primary.red,
  //       colors.primary.orange,
  //       colors.primary.purple
  //     ],
  //     borderWidth: 2,
  //     borderColor: '#fff'
  //   }]
  // };

  // const agencyBarData = {
  //   labels: agencyPerformance.slice(0, 5).map(a => a.agency?.split(' ')[0] || 'Agency'),
  //   datasets: [{ 
  //     label: "Bookings", 
  //     data: agencyPerformance.slice(0, 5).map(a => a.bookings),
  //     backgroundColor: colors.primary.blue,
  //     borderColor: colors.primary.blue,
  //     borderWidth: 0,
  //     borderRadius: 4,
  //   }]
  // };

  // const supplierBarData = {
  //   labels: supplierPerformance.slice(0, 5).map(s => s.supplier?.split(' ')[0] || 'Supplier'),
  //   datasets: [{ 
  //     label: "Bookings", 
  //     data: supplierPerformance.slice(0, 5).map(s => s.bookings),
  //     backgroundColor: colors.primary.orange,
  //     borderColor: colors.primary.orange,
  //     borderWidth: 0,
  //     borderRadius: 4,
  //   }]
  // };

  // const hotelBarData = {
  //   // labels: hotelOccupancy.slice(0, 5).map(h => h.hotel?.split(' ')[0] || 'Hotel'),
  //   datasets: [
  //     { 
  //       label: "Bookings", 
  //       data: hotelOccupancy.slice(0, 5).map(h => h.bookings),
  //       backgroundColor: colors.primary.green,
  //       borderColor: colors.primary.green,
  //       borderWidth: 0,
  //       borderRadius: 4,
  //     },
  //     { 
  //       label: "People", 
  //       data: hotelOccupancy.slice(0, 5).map(h => h.people),
  //       backgroundColor: colors.primary.purple,
  //       borderColor: colors.primary.purple,
  //       borderWidth: 0,
  //       borderRadius: 4,
  //     }
  //   ]
  // };

  // const peopleBarData = {
  //   labels: peopleDistribution.map(p => p.people?.toString() || 'N/A'),
  //   datasets: [{ 
  //     label: "Bookings", 
  //     data: peopleDistribution.map(p => p.count),
  //     backgroundColor: colors.primary.indigo,
  //     borderColor: colors.primary.indigo,
  //     borderWidth: 0,
  //     borderRadius: 4,
  //   }]
  // };

  // const chartOptions = {
  //   responsive: true,
  //   maintainAspectRatio: false,
  //   plugins: {
  //     legend: {
  //       position: 'top',
  //       labels: {
  //         usePointStyle: true,
  //         padding: 8,
  //         color: '#6b7280',
  //         font: { size: 11, weight: '500' }
  //       }
  //     },
  //     tooltip: {
  //       backgroundColor: 'rgba(255, 255, 255, 0.95)',
  //       titleColor: '#1f2937',
  //       bodyColor: '#374151',
  //       borderColor: '#e5e7eb',
  //       borderWidth: 1,
  //       cornerRadius: 6,
  //       usePointStyle: true,
  //     }
  //   },
  //   scales: {
  //     y: {
  //       beginAtZero: true,
  //       grid: { color: 'rgba(229, 231, 235, 0.8)' },
  //       ticks: { color: '#6b7280', font: { size: 10 } }
  //     },
  //     x: {
  //       grid: { display: false },
  //       ticks: { color: '#6b7280', font: { size: 10 } }
  //     }
  //   }
  // };

  // const pieOptions = {
  //   responsive: true,
  //   maintainAspectRatio: false,
  //   cutout: '50%',
  //   plugins: {
  //     legend: {
  //       position: 'bottom',
  //       labels: {
  //         usePointStyle: true,
  //         padding: 8,
  //         color: '#6b7280',
  //         font: { size: 10 }
  //       }
  //     }
  //   }
  // };

  // if (loading) {
  //   return (
  //     <div className="dashboardLoadingWrapper">
  //       <div className="loadingSpinnerElement"></div>
  //       <p className="dashboardLoadingText">Loading dashboard...</p>
  //     </div>
  //   );
  // }

  // return (
  //   <div className="dashboardCore">
  //     {/* Header */}
  //     <header className="dashboardHeaderContainer">
  //       <div className="headerContentWrapper">
  //         <div className="headerTitleSection">
  //           <h1 className="dashboardMainTitle">Travel Analytics Dashboard</h1>
  //           <p className="dashboardSubtitleText">Complete performance overview</p>
  //         </div>
  //         <div className="headerActionsContainer">
  //           <div className="dateFilterBadge">
  //             <span>Last 30 Days</span>
  //           </div>
  //           <button className="exportButtonPrimary">Export Report</button>
  //         </div>
  //       </div>
  //     </header>

  //     {/* All KPIs Section - Compact Grid */}
  //     <section className="kpiSectionWrapper">
  //       <div className="sectionHeaderGlobal">
  //         <h2 className="sectionTitleGlobal">Key Performance Indicators</h2>
  //       </div>
  //       <div className="kpiGridCompactLayout">
  //         {allKPIs.map(kpi => (
  //           <div key={kpi.key} className={`kpiCardBase kpiCard${kpi.color}`}>
  //             <div className="kpiIconWrapper">{kpi.icon}</div>
  //             <div className="kpiContentArea">
  //               <h3 className="kpiTitleText">{kpi.title}</h3>
  //               <p className="kpiValueDisplay">{kpi.value}</p>
  //             </div>
  //           </div>
  //         ))}
  //       </div>
  //     </section>

  //     {/* Main Charts Grid - All Charts Included */}
  //     <section className="chartsSectionContainer">
  //       <div className="sectionHeaderGlobal">
  //         <h2 className="sectionTitleGlobal">Analytics & Performance</h2>
  //       </div>
  //       <div className="chartsGridCompact">
  //         {/* Row 1 */}
  //         <div className="chartCardBase mainChartCard">
  //           <div className="chartHeaderArea">
  //             <h3 className="chartTitleText">Booking Trends</h3>
  //             <span className="chartSubtitleText">Last 6 months</span>
  //           </div>
  //           <div className="chartWrapperContainer">
  //             <Line data={bookingTrendData} options={chartOptions} />
  //           </div>
  //         </div>

  //         <div className="chartCardBase">
  //           <div className="chartHeaderArea">
  //             <h3 className="chartTitleText">Status Distribution</h3>
  //           </div>
  //           <div className="chartWrapperContainer">
  //             <Doughnut data={statusPieData} options={pieOptions} />
  //           </div>
  //         </div>

  //         {/* Row 2 */}
  //         <div className="chartsGridRow">
  //           <div className="chartCardBase">
  //             <div className="chartHeaderArea">
  //               <h3 className="chartTitleText">Top Agencies</h3>
  //             </div>
  //             <div className="chartWrapperContainer">
  //               <Bar data={agencyBarData} options={chartOptions} />
  //             </div>
  //           </div>

  //           <div className="chartCardBase">
  //             <div className="chartHeaderArea">
  //               <h3 className="chartTitleText">Top Suppliers</h3>
  //             </div>
  //             <div className="chartWrapperContainer">
  //               <Bar data={supplierBarData} options={chartOptions} />
  //             </div>
  //           </div>

  //           <div className="chartCardBase">
  //             <div className="chartHeaderArea">
  //               <h3 className="chartTitleText">Hotel Performance</h3>
  //             </div>
  //             <div className="chartWrapperContainer">
  //               <Bar data={hotelBarData} options={chartOptions} />
  //             </div>
  //           </div>
  //         </div>

  //         {/* Row 3 */}
  //         <div className="chartCardBase">
  //           <div className="chartHeaderArea">
  //             <h3 className="chartTitleText">Group Size Distribution</h3>
  //           </div>
  //           <div className="chartWrapperContainer">
  //             <Bar data={peopleBarData} options={chartOptions} />
  //           </div>
  //         </div>
  //       </div>
  //     </section>

  //     {/* Data Tables Section - All Data Included */}
  //     <section className="tablesSectionWrapper">
  //       <div className="tablesGridCompact">
          
  //         {/* Upcoming Bookings */}
  //         <div className="tableCardBase">
  //           <div className="tableHeaderArea">
  //             <h3 className="tableTitleText">Upcoming Bookings</h3>
  //             <span className="viewAllLink">View All</span>
  //           </div>
  //           <div className="tableContentCompact">
  //             {upcomingBookings.slice(0, 6).map(booking => (
  //               <div key={booking.ticketNumber} className="tableRowCompact">
  //                 <div className="rowMainInfo">
  //                   <span className="ticketNumber">#{booking.ticketNumber}</span>
  //                   <span className="agencyName">{booking.agency}</span>
  //                 </div>
  //                 <div className="rowDetailsInfo">
  //                   <span className="hotelName">{booking.hotel}</span>
  //                   <span className="datesRange">
  //                     {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
  //                   </span>
  //                 </div>
  //                 <span className={getStatusBadgeClass(booking.status)}>
  //                   {booking.status}
  //                 </span>
  //               </div>
  //             ))}
  //           </div>
  //         </div>

  //         {/* Recent Activity */}
  //         <div className="tableCardBase">
  //           <div className="tableHeaderArea">
  //             <h3 className="tableTitleText">Recent Activity</h3>
  //             <span className="viewAllLink">View All</span>
  //           </div>
  //           <div className="tableContentCompact">
  //             {recentActivity.slice(0, 6).map((activity, index) => (
  //               <div key={index} className="tableRowCompact">
  //                 <div className="activityMessage">{activity.message}</div>
  //                 <div className="activityTime">{formatDate(activity.updatedAt)}</div>
  //               </div>
  //             ))}
  //           </div>
  //         </div>

  //         {/* Top Performers */}
  //         <div className="tableCardBase">
  //           <div className="tableHeaderArea">
  //             <h3 className="tableTitleText">Top Performers</h3>
  //           </div>
  //           <div className="performersGridLayout">
  //             <div className="performerCategory">
  //               <h4>🏆 Agencies</h4>
  //               {topPerformers.topAgencies?.slice(0, 3).map((agency, index) => (
  //                 <div key={agency.agency} className="performerItem">
  //                   <span className="rankBadge">{index + 1}</span>
  //                   <span className="performerName">{agency.agency}</span>
  //                   <span className="performerCount">{agency.count}</span>
  //                 </div>
  //               ))}
  //             </div>
  //             <div className="performerCategory">
  //               <h4>🏨 Hotels</h4>
  //               {topPerformers.topHotels?.slice(0, 3).map((hotel, index) => (
  //                 <div key={hotel.hotel} className="performerItem">
  //                   <span className="rankBadge">{index + 1}</span>
  //                   <span className="performerName">{hotel.hotel}</span>
  //                   <span className="performerCount">{hotel.count}</span>
  //                 </div>
  //               ))}
  //             </div>
  //             <div className="performerCategory">
  //               <h4>🤝 Suppliers</h4>
  //               {topPerformers.topSuppliers?.slice(0, 3).map((supplier, index) => (
  //                 <div key={supplier.supplier} className="performerItem">
  //                   <span className="rankBadge">{index + 1}</span>
  //                   <span className="performerName">{supplier.supplier}</span>
  //                   <span className="performerCount">{supplier.count}</span>
  //                 </div>
  //               ))}
  //             </div>
  //           </div>
  //         </div>

  //       </div>
  //     </section>
    // </div>
  // );

};

export default Dashboard;