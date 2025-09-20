import React, { useState, useCallback, useEffect } from 'react';
import StatsBar from '../components/statsbar';
import AddHotelTab from './AddHotelTab';
import HotelSalesList from './HotelSalesList';
import { FaCheckCircle, FaTimesCircle, FaTimes, FaSync } from 'react-icons/fa';
import ViewHotelModal from './ViewHotelModal';
import EditHotelModal from './EditHotelModal';
import Modal from './Modal';
import './HotelManagementSystem.css';

// Main Component
const HotelManagementSystem = () => {
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [activeView, setActiveView] = useState('view');
  const [viewModal, setViewModal] = useState({ isOpen: false, hotel: null });
  const [editModal, setEditModal] = useState({ isOpen: false, hotel: null });
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  // Get user role from localStorage
  useEffect(() => {
    const fetchUserRole = () => {
      const role = localStorage.getItem('userRole') || 'employee';
      console.log('User role from localStorage:', role);
      setUserRole(role);
    };
    
    fetchUserRole();
  }, []);

  const showNotification = useCallback((message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 5000);
  }, []);

  // Automatic refresh strategies
  useEffect(() => {
    let intervalId;
    let visibilityTimeout;
    let focusTimeout;

    const refreshData = () => {
      if (activeView === 'view' && autoRefreshEnabled) {
        console.log('Auto-refreshing hotel data...');
        fetchHotels();
      }
    };

    // Strategy 1: Periodic refresh every 60 seconds
    if (activeView === 'view' && autoRefreshEnabled) {
      intervalId = setInterval(refreshData, 60000);
    }

    // Strategy 2: Refresh when tab becomes visible (with debounce)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && activeView === 'view' && autoRefreshEnabled) {
        clearTimeout(visibilityTimeout);
        visibilityTimeout = setTimeout(refreshData, 1000); // Wait 1 second after becoming visible
      }
    };

    // Strategy 3: Refresh when window gains focus (with debounce)
    const handleFocus = () => {
      if (activeView === 'view' && autoRefreshEnabled) {
        clearTimeout(focusTimeout);
        focusTimeout = setTimeout(refreshData, 1500); // Wait 1.5 seconds after focus
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      if (intervalId) clearInterval(intervalId);
      clearTimeout(visibilityTimeout);
      clearTimeout(focusTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [activeView, autoRefreshEnabled]);

  // Fetch hotels when switching to view tab
  useEffect(() => {
    if (activeView === 'view') {
      fetchHotels();
    }
  }, [activeView]);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const API_BASE_HOTEL = "https://backend.chaloholidayonline.com/api/hotels";
      const API_BASE_COUNTRIES = "https://backend.chaloholidayonline.com/api/countries";
      const API_BASE_CITIES = "https://backend.chaloholidayonline.com/api/cities/by-country";
      
      // Fetch hotels
      const hotelRes = await fetch(API_BASE_HOTEL);
      if (!hotelRes.ok) throw new Error(`Hotel fetch failed: ${hotelRes.status}`);
      const hotelData = await hotelRes.json();

      // Fetch countries
      const countryRes = await fetch(API_BASE_COUNTRIES);
      if (!countryRes.ok) throw new Error(`Countries fetch failed: ${countryRes.status}`);
      const countryData = await countryRes.json();

      // Fetch cities for each unique countryId
      const cityPromises = [...new Set(hotelData.map(h => h.countryId))].map(countryId =>
        fetch(`${API_BASE_CITIES}/${countryId}`).then(async res => {
          if (!res.ok) throw new Error(`Cities fetch failed for country ${countryId}: ${res.status}`);
          return res.json();
        })
      );
      const citiesData = (await Promise.all(cityPromises)).flat();

      // Create lookup maps
      const countryMap = new Map(countryData.map(c => [c.id, c.name]));
      const cityMap = new Map(citiesData.map(c => [c.id, c.name]));

      // Map hotel data with country and city names
      const adjustedData = hotelData.map(hotel => ({
        ...hotel,
        country: countryMap.get(hotel.countryId) || "Unknown Country",
        city: cityMap.get(hotel.cityId) || "Unknown City",
        salesPersons: Array.isArray(hotel.salesPersons) ? hotel.salesPersons : (hotel.salesPersonName ? [{ name: hotel.salesPersonName, email: hotel.salesPersonEmail, contact: hotel.salesPersonContact }] : []),
        reservationPersons: Array.isArray(hotel.reservationPersons) ? hotel.reservationPersons : (hotel.reservationPersonName ? [{ name: hotel.reservationPersonName, email: hotel.reservationPersonEmail, contact: hotel.reservationPersonContact }] : []),
        accountsPersons: Array.isArray(hotel.accountsPersons) ? hotel.accountsPersons : (hotel.accountsPersonName ? [{ name: hotel.accountsPersonName, email: hotel.accountsPersonEmail, contact: hotel.accountsPersonContact }] : []),
        receptionPersons: Array.isArray(hotel.receptionPersons) ? hotel.receptionPersons : (hotel.receptionPersonName ? [{ name: hotel.receptionPersonName, email: hotel.receptionPersonEmail, contact: hotel.receptionPersonContact }] : []),
        concierges: Array.isArray(hotel.concierges) ? hotel.concierges : (hotel.conciergeName ? [{ name: hotel.conciergeName, email: hotel.conciergeEmail, contact: hotel.conciergeContact }] : []),
        isActive: hotel.isActive !== undefined ? hotel.isActive : true
      }));

      setHotels(adjustedData);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Error fetching hotels:", err);
      showNotification(`Error fetching hotels: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const openViewModal = (hotel) => {
    setViewModal({ isOpen: true, hotel });
  };

  const closeViewModal = () => {
    setViewModal({ isOpen: false, hotel: null });
  };

  const openEditModal = (hotel) => {
    if (!hotel.isActive) {
      showNotification("Cannot edit deactivated hotels. Please activate first.", "error");
      return;
    }
    
    if (userRole.toLowerCase() !== 'admin') {
      showNotification("You do not have permission to edit hotels.", "error");
      return;
    }
    
    setEditModal({ isOpen: true, hotel });
  };

  const closeEditModal = () => {
    setEditModal({ isOpen: false, hotel: null });
  };

  const saveHotel = async (hotel) => {
    try {
      const API_BASE_HOTEL = "https://backend.chaloholidayonline.com/api/hotels";
      await fetch(`${API_BASE_HOTEL}/${hotel.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hotel),
      });
      closeEditModal();
      fetchHotels(); // Refresh the list
      showNotification("Hotel updated successfully!", "success");
    } catch (err) {
      console.error("Error updating hotel:", err);
      showNotification("Error updating hotel", "error");
    }
  };

  const toggleHotelStatus = async (id, currentStatus) => {
    if (userRole.toLowerCase() !== 'admin') {
      showNotification("You do not have permission to change hotel status.", "error");
      return;
    }
    
    const newStatus = !currentStatus;
    
    try {
      const API_BASE_HOTEL = "https://backend.chaloholidayonline.com/api/hotels";
      await fetch(`${API_BASE_HOTEL}/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });
      
      // Update local state immediately for better UX
      setHotels(prev => prev.map(h => 
        h.id === id ? { ...h, isActive: newStatus } : h
      ));
      
      // Also refresh the entire list to ensure consistency
      setTimeout(() => fetchHotels(), 500);
      
      showNotification(`Hotel ${newStatus ? 'activated' : 'deactivated'} successfully!`, "success");
    } catch (err) {
      console.error("Error updating hotel status:", err);
      showNotification("Error updating hotel status", "error");
    }
  };

  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(prev => !prev);
    showNotification(
      `Auto-refresh ${!autoRefreshEnabled ? 'enabled' : 'disabled'}`,
      'success'
    );
  };

  const manualRefresh = () => {
    fetchHotels();
    showNotification('Data refreshed manually', 'success');
  };

  const isAdmin = userRole.toLowerCase() === 'admin';

  const formatTimeSinceLastRefresh = () => {
    if (!lastRefresh) return 'Never';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - lastRefresh) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  };

  return (
    <div className="hms-page-content ">
      {/* Notification System */}
      {notification.show && (
        <div className={`hms-notification ${notification.type}`}>
          <div className="hms-notification-content">
            <div className="hms-notification-icon">
              {notification.type === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
            </div>
            <span className="hms-notification-message">{notification.message}</span>
            <button 
              className="hms-notification-close" 
              onClick={() => setNotification({ show: false, message: '', type: '' })}
              aria-label="Close notification"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}
      
      {/* Header Section */}
      <header className="hms-system-header">
        <div className="hms-header-content">
          <div className="hms-header-content-title">
            <h1 className="hms-header-title">Hotel Management System</h1>
            <p className="hms-header-subtitle">Manage hotel information, contacts, and facilities</p>
            <div className="hms-user-role-badge">
              Logged in as: <span className={`hms-role-${userRole.toLowerCase()}`}>{userRole}</span>
            </div>
          </div>
          <div className="hms-nav-buttons">
            {isAdmin && (
              <button 
                className={`hms-nav-button ${activeView === 'add' ? 'hms-active' : ''}`} 
                onClick={() => setActiveView('add')}
              >
                <fml-icon name="add-outline" size="medium"></fml-icon> 
                <span>Add Hotel</span>
              </button>
            )}
            <button 
              className={`hms-nav-button ${activeView === 'view' ? 'hms-active' : ''}`} 
              onClick={() => setActiveView('view')}
            >
              <fml-icon name="document-text-outline"></fml-icon>
              <span>View Hotels ({hotels.length})</span>
            </button>
            
            {/* Refresh Controls */}
            {activeView === 'view' && (
              <div className="hms-refresh-controls">
                <button 
                  className={`hms-refresh-btn ${autoRefreshEnabled ? 'hms-refresh-active' : 'hms-refresh-inactive'}`}
                  onClick={toggleAutoRefresh}
                  title={autoRefreshEnabled ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
                >
                  <FaSync /> Auto
                </button>
                <button 
                  className="hms-refresh-btn hms-refresh-manual"
                  onClick={manualRefresh}
                  title="Refresh now"
                >
                  <FaSync /> Refresh
                </button>
                <span className="hms-last-refresh">
                  Last: {formatTimeSinceLastRefresh()}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Content Section */}
      <main className="hms-content">
        {activeView === 'add' && isAdmin && <AddHotelTab showNotification={showNotification} />}
        {activeView === 'view' && (
          <HotelSalesList 
            hotels={hotels}
            loading={loading}
            showNotification={showNotification}
            openViewModal={openViewModal}
            openEditModal={openEditModal}
            toggleHotelStatus={toggleHotelStatus}
            isAdmin={isAdmin}
            refreshHotels={fetchHotels}
          />
        )}
      </main>

      {/* Modals */}
      {viewModal.isOpen && (
        <ViewHotelModal
          hotel={viewModal.hotel}
          onClose={closeViewModal}
        />
      )}

      {editModal.isOpen && (
        <EditHotelModal
          hotel={editModal.hotel}
          onSave={saveHotel}
          onCancel={closeEditModal}
        />
      )}
    </div>
  );
};

export default HotelManagementSystem;