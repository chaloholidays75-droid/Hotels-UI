import { useState, useEffect } from 'react';
import { FaHotel, FaGlobe, FaCalendar, FaExclamationTriangle } from 'react-icons/fa';
import CountUp from 'react-countup';
import { getStats } from "../api/api";
// import './statsbar.css'

const StatsBar = () => {
  const [stats, setStats] = useState({
    totalHotels: 0,
    totalCountries: 0,
    newThisMonth: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
        setError('Failed to load statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statItems = [
    { 
      icon: <FaHotel className="stats-bar__icon" />, 
      label: 'Total Hotels', 
      value: stats.totalHotels,
      key: 'totalHotels'
    },
    { 
      icon: <FaGlobe className="stats-bar__icon" />, 
      label: 'Countries', 
      value: stats.totalCountries,
      key: 'totalCountries'
    },
    { 
      icon: <FaCalendar className="stats-bar__icon" />, 
      label: 'New This Month', 
      value: stats.newThisMonth,
      key: 'newThisMonth'
    },
  ];

  return (
    <div className="stats-bar">
      {statItems.map((item) => (
        <div key={item.key} className="stats-bar__card">
          <div className="stats-bar__icon-container">
            {item.icon}
          </div>
          <div className="stats-bar__content">
            <p className="stats-bar__label">{item.label}</p>
            {isLoading ? (
              <div className="stats-bar__loader"></div>
            ) : error ? (
              <div className="stats-bar__error">
                <FaExclamationTriangle className="stats-bar__error-icon" />
                <span>Error</span>
              </div>
            ) : (
              <p className="stats-bar__value">
                <CountUp end={item.value} duration={1.5} separator="," />
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsBar;