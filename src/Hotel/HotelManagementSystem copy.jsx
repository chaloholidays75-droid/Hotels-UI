import React, { useState, useCallback, useEffect, useContext } from 'react';
import { FaCheckCircle, FaTimesCircle, FaTimes, FaHotel } from 'react-icons/fa';
import AddHotelTab from './AddHotelTab';
import HotelSalesList from './HotelSalesList';
import ViewHotelModal from './ViewHotelModal';
import EditHotelModal from './EditHotelModal';
import { AuthContext } from '../context/AuthContext';
import { getHotelSales, toggleHotelStatus, updateHotelSale, getCountries, getCitiesByCountry } from '../api/hotelApi';
import './HotelManagementSystem.css';

/**
 * Hotel Management System Component
 * Provides hotel management functionality with role-based access control
 */
const HotelManagementSystem = () => {
  // Context & Authentication
  const { user } = useContext(AuthContext);
  const userRole = user?.role?.toLowerCase() || 'employee';
  const isAdmin = userRole === 'admin';
  const canAddHotel = isAdmin || userRole === 'employee';

  // State Management
  const [notification, setNotification] = useState({ 
    show: false, 
    message: '', 
    type: '' 
  });
  const [activeView, setActiveView] = useState('view');
  const [viewModal, setViewModal] = useState({ 
    isOpen: false, 
    hotel: null 
  });
  const [editModal, setEditModal] = useState({ 
    isOpen: false, 
    hotel: null 
  });
  const [hotels, setHotels] = useState([]);

  // Notification System
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ show: true, message, type });
    const timer = setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  // Data Fetching
  const fetchHotels = async () => {
    try {
      const hotels = await getHotelSales();
      const countries = await getCountries();
      
      const countryMap = new Map(countries.map(c => [c.id, c.name]));
      const citiesMap = {};

      // Fetch cities for each unique country
      const uniqueCountryIds = [...new Set(hotels.map(h => h.countryId))];
      await Promise.all(
        uniqueCountryIds.map(async (countryId) => {
          const cities = await getCitiesByCountry(countryId);
          citiesMap[countryId] = new Map(cities.map(c => [c.id, c.name]));
        })
      );

      // Transform hotel data
      const adjustedHotels = hotels.map(hotel => ({
        ...hotel,
        country: countryMap.get(hotel.countryId) || 'Unknown Country',
        city: citiesMap[hotel.countryId]?.get(hotel.cityId) || 'Unknown City',
        salesPersons: normalizePersonArray(hotel.salesPersons, hotel, 'salesPerson'),
        reservationPersons: normalizePersonArray(hotel.reservationPersons, hotel, 'reservationPerson'),
        accountsPersons: normalizePersonArray(hotel.accountsPersons, hotel, 'accountsPerson'),
        receptionPersons: normalizePersonArray(hotel.receptionPersons, hotel, 'receptionPerson'),
        concierges: normalizePersonArray(hotel.concierges, hotel, 'concierge'),
        isActive: hotel.isActive !== undefined ? hotel.isActive : true
      }));

      setHotels(adjustedHotels);
    } catch (err) {
      console.error('Error fetching hotels:', err);
      showNotification(`Failed to load hotels: ${err.message}`, 'error');
    }
  };

  // Helper function to normalize person arrays
  const normalizePersonArray = (personsArray, hotel, prefix) => {
    if (Array.isArray(personsArray)) return personsArray;
    
    const name = hotel[`${prefix}Name`];
    if (name) {
      return [{
        name,
        email: hotel[`${prefix}Email`] || '',
        contact: hotel[`${prefix}Contact`] || ''
      }];
    }
    
    return [];
  };

  // Modal Management
  const openViewModal = (hotel) => {
    setViewModal({ isOpen: true, hotel });
  };

  const closeViewModal = () => {
    setViewModal({ isOpen: false, hotel: null });
  };

  const openEditModal = (hotel) => {
    if (!isAdmin) {
      showNotification("Administrator access required to edit hotels.", "error");
      return;
    }
    
    if (!hotel.isActive) {
      showNotification("Please activate the hotel before editing.", "error");
      return;
    }
    
    setEditModal({ isOpen: true, hotel });
  };

  const closeEditModal = () => {
    setEditModal({ isOpen: false, hotel: null });
  };

  // Hotel Operations
  const saveHotel = async (hotel) => {
    try {
      await updateHotelSale(hotel.id, hotel);
      closeEditModal();
      await fetchHotels();
      showNotification("Hotel updated successfully!", "success");
    } catch (err) {
      console.error('Error updating hotel:', err);
      showNotification("Failed to update hotel information", "error");
    }
  };

  const handleToggleHotelStatus = async (id, currentStatus) => {
    if (!isAdmin) {
      showNotification("Administrator access required to modify hotel status.", "error");
      return;
    }

    try {
      await toggleHotelStatus(id, !currentStatus);
      setHotels(prev => prev.map(h => 
        h.id === id ? { ...h, isActive: !currentStatus } : h
      ));
      showNotification(`Hotel ${!currentStatus ? 'activated' : 'deactivated'} successfully!`, 'success');
    } catch (err) {
      console.error('Error updating hotel status:', err);
      showNotification("Failed to update hotel status", "error");
    }
  };

  // Effects
  useEffect(() => {
    if (activeView === 'view') {
      fetchHotels();
    }
  }, [activeView]);

  return (
    <div className="hms-page-content">
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
            <h1 className="hms-header-title">
              <FaHotel className="hms-title-icon" />
              Hotel Management System
            </h1>
            <p className="hms-header-subtitle">
              Comprehensive hotel information and contact management
            </p>
            <div className="hms-user-role-badge">
              Logged in as: <span className={`hms-role-${userRole}`}>{userRole}</span>
            </div>
          </div>
          
          <div className="hms-nav-buttons">
            <button 
              className={`hms-nav-button ${activeView === 'add' ? 'hms-active' : ''} ${!canAddHotel ? 'hms-disabled' : ''}`} 
              onClick={() => canAddHotel && setActiveView('add')}
              title={!canAddHotel ? "Insufficient permissions to add hotels" : "Add new hotel to system"}
              disabled={!canAddHotel}
            >
              <fml-icon name="add-outline" size="medium"></fml-icon> 
              <span>Add Hotel</span>
            </button>
            
            <button 
              className={`hms-nav-button ${activeView === 'view' ? 'hms-active' : ''}`} 
              onClick={() => setActiveView('view')}
            >
              <fml-icon name="document-text-outline"></fml-icon>
              <span>View Hotels</span>
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content Section */}
      <main className="hms-content">
        {activeView === 'add' && canAddHotel && (
          <AddHotelTab 
            showNotification={showNotification}
            onHotelAdded={fetchHotels}
          />
        )}
        
        {activeView === 'view' && (
          <HotelSalesList 
            hotels={hotels}
            showNotification={showNotification}
            openViewModal={openViewModal}
            openEditModal={openEditModal}
            toggleHotelStatus={handleToggleHotelStatus}
            userRole={userRole}
            isAdmin={isAdmin}
          />
        )}
      </main>

      {/* Modal Components */}
      <ViewHotelModal
        isOpen={viewModal.isOpen}
        hotel={viewModal.hotel}
        onClose={closeViewModal}
      />

      <EditHotelModal
        isOpen={editModal.isOpen}
        hotel={editModal.hotel}
        onSave={saveHotel}
        onCancel={closeEditModal}
      />
    </div>
  );
};

export default HotelManagementSystem;