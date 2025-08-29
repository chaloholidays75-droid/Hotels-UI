import { useState, useEffect } from 'react';
import { FaHotel, FaUsers, FaGlobe, FaCalendar } from 'react-icons/fa';
import { getStats } from "../api";

const StatsBar = () => {
  const [stats, setStats] = useState({ totalHotels: 0, activeContacts: 0, totalCountries: 0, newThisMonth: 0 });

  useEffect(() => {
    getStats().then(setStats).catch(console.error);
  }, []);

  return (
    <div className="stats-bar">
      <div className="stat-item"><FaHotel /> Total Hotels <span>{stats.totalHotels}</span></div>
      <div className="stat-item active-contacts"><FaUsers /> Active Contacts <span>{stats.activeContacts}</span></div>
      <div className="stat-item"><FaGlobe /> Countries <span>{stats.totalCountries}</span></div>
      <div className="stat-item new-this-month"><FaCalendar /> New This Month <span>{stats.newThisMonth}</span></div>
    </div>
  );
};

export default StatsBar;
