import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";

import { formatDistanceToNow } from 'date-fns';

const API_BASE = "https://backend.chaloholidayonline.com/api";
const API_ENDPOINTS = {
  stats: `${API_BASE}/dashboard/stats`,
  activities: `${API_BASE}/dashboard/recent-activities`,
  hotelsByCountry: `${API_BASE}/dashboard/hotels-by-country`,
  agenciesByCountry: `${API_BASE}/dashboard/agencies-by-country`,
  topCountries: `${API_BASE}/dashboard/top-countries`,
  monthlyStats: `${API_BASE}/dashboard/monthly-stats`
};

const Dashboard = ({ showNotification }) => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [hotelsByCountry, setHotelsByCountry] = useState([]);
  const [agenciesByCountry, setAgenciesByCountry] = useState([]);
  const [topCountries, setTopCountries] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // === Token validation ===
  const getValidToken = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    try {
      const decoded = jwt_decode(token);
      const now = Date.now() / 1000;
      if (decoded.exp && decoded.exp < now) return null;
      return token;
    } catch (err) {
      console.error("Invalid token:", err);
      return null;
    }
  };
  const decoded = jwtDecode(token);
console.log(decoded);
  const token = getValidToken();

  // Redirect if token is invalid
  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);

  const fetchDashboardData = async () => {
    setRefreshing(true);
    setError(null);

    if (!token) return;

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };

    try {
      const [
        statsRes,
        activitiesRes,
        hotelsRes,
        agenciesRes,
        topCountriesRes,
        monthlyStatsRes
      ] = await Promise.allSettled([
        fetch(API_ENDPOINTS.stats, { headers }),
        fetch(API_ENDPOINTS.activities, { headers }),
        fetch(API_ENDPOINTS.hotelsByCountry, { headers }),
        fetch(API_ENDPOINTS.agenciesByCountry, { headers }),
        fetch(API_ENDPOINTS.topCountries, { headers }),
        fetch(API_ENDPOINTS.monthlyStats, { headers })
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        setStats(await statsRes.value.json());
      }

      if (activitiesRes.status === 'fulfilled' && activitiesRes.value.ok) {
        const data = await activitiesRes.value.json();
        const normalized = data.map(activity => ({
          id: activity.id || Math.random().toString(36).substr(2, 9),
          user: activity.user || activity.userName || activity.createdBy || "System",
          action: activity.action || "performed action on",
          type: activity.type || "item",
          name: activity.name || activity.title || "Unnamed",
          timestamp: activity.timestamp || new Date().toISOString(),
          country: activity.country || null,
          timeAgo: activity.timestamp
            ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })
            : "Recently"
        }));
        setRecentActivities(normalized);
      }

      if (hotelsRes.status === 'fulfilled' && hotelsRes.value.ok) {
        setHotelsByCountry(await hotelsRes.value.json());
      }

      if (agenciesRes.status === 'fulfilled' && agenciesRes.value.ok) {
        setAgenciesByCountry(await agenciesRes.value.json());
      }

      if (topCountriesRes.status === 'fulfilled' && topCountriesRes.value.ok) {
        setTopCountries(await topCountriesRes.value.json());
      }

      if (monthlyStatsRes.status === 'fulfilled' && monthlyStatsRes.value.ok) {
        setMonthlyStats(await monthlyStatsRes.value.json());
      }

    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.message);
      if (showNotification) showNotification(`Error loading dashboard: ${err.message}`, "error");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h1>Dashboard Overview</h1>
      <p>Total Hotels: {stats.totalHotels}</p>
      <p>Total Agencies: {stats.totalAgencies}</p>
      <p>Recent Activities:</p>
      <ul>
        {recentActivities.slice(0, 5).map(a => (
          <li key={a.id}>{`${a.user} ${a.action} ${a.type} "${a.name}" (${a.timeAgo})`}</li>
        ))}
      </ul>
      <button onClick={fetchDashboardData} disabled={refreshing}>
        {refreshing ? "Refreshing..." : "Refresh Data"}
      </button>
    </div>
  );
};

export default Dashboard;
