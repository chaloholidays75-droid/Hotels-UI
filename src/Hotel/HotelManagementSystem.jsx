import React, { useState, useCallback, useEffect } from 'react';
import StatsBar from '../components/statsbar';
import AddHotelTab from './AddHotelTab';
import HotelSalesList from './HotelSalesList';
import { FaCheckCircle, FaTimesCircle, FaTimes } from 'react-icons/fa';
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
  const [userRole, setUserRole] = useState(''); // Will be populated from auth context or API

  // In a real app, you would get this from your authentication context or API
  useEffect(() => {
    // Simulate fetching user role (replace with actual implementation)
    const fetchUserRole = () => {
      // This would typically come from your auth context or user API
      const role = localStorage.getItem('userRole') || 'employee'; // Default to employee
      console.log('User role from localStorage:', role); // Debug log
      setUserRole(role);
    };
    
    fetchUserRole();
  }, []);

  const showNotification = useCallback((message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 5000);
  }, []);

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
    // Only allow editing active hotels
    if (!hotel.isActive) {
      showNotification("Cannot edit deactivated hotels. Please activate first.", "error");
      return;
    }
    
    // FIXED: Case-insensitive admin check
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
    // FIXED: Case-insensitive admin check
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
      
      // Update local state
      setHotels(prev => prev.map(h => 
        h.id === id ? { ...h, isActive: newStatus } : h
      ));
      
      showNotification(`Hotel ${newStatus ? 'activated' : 'deactivated'} successfully!`, "success");
    } catch (err) {
      console.error("Error updating hotel status:", err);
      showNotification("Error updating hotel status", "error");
    }
  };

  // FIXED: Case-insensitive admin check
  const isAdmin = userRole.toLowerCase() === 'admin';

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