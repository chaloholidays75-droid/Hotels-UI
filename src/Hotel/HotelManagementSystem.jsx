import React, { useState, useCallback, useEffect } from 'react';
import StatsBar from '../components/statsbar';
import AddHotelTab from './AddHotelTab';
import HotelSalesList from './HotelSalesList';
import { FaCheckCircle, FaTimesCircle, FaTimes } from 'react-icons/fa';
import ViewHotelModal from './ViewHotelModal';
import EditHotelModal from './EditHotelModal';
import Modal from './Modal';
import { getHotelSales, updateHotelSale, updateHotelStatus, checkAuth } from '../api';
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

  // Fetch user role and check authentication
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const authInfo = await checkAuth();
        if (authInfo.isAuthenticated) {
          setUserRole(authInfo.role);
          localStorage.setItem('userRole', authInfo.role);
        } else {
          // Fallback to localStorage if API fails
          const role = localStorage.getItem('userRole') || 'employee';
          setUserRole(role);
        }
      } catch (error) {
        console.error('Failed to fetch user role:', error);
        const role = localStorage.getItem('userRole') || 'employee';
        setUserRole(role);
      }
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
      const hotelData = await getHotelSales();
      
      // Map hotel data with additional information
      const adjustedData = hotelData.map(hotel => ({
        ...hotel,
        salesPersons: Array.isArray(hotel.salesPersons) ? hotel.salesPersons : [],
        reservationPersons: Array.isArray(hotel.reservationPersons) ? hotel.reservationPersons : [],
        accountsPersons: Array.isArray(hotel.accountsPersons) ? hotel.accountsPersons : [],
        receptionPersons: Array.isArray(hotel.receptionPersons) ? hotel.receptionPersons : [],
        concierges: Array.isArray(hotel.concierges) ? hotel.concierges : [],
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
      await updateHotelSale(hotel.id, hotel);
      closeEditModal();
      fetchHotels();
      showNotification("Hotel updated successfully!", "success");
    } catch (err) {
      console.error("Error updating hotel:", err);
      showNotification("Error updating hotel: " + err.message, "error");
    }
  };

  const toggleHotelStatus = async (id, currentStatus) => {
    if (userRole.toLowerCase() !== 'admin') {
      showNotification("You do not have permission to change hotel status.", "error");
      return;
    }
    
    const newStatus = !currentStatus;
    
    try {
      await updateHotelStatus(id, newStatus);
      
      setHotels(prev => prev.map(h => 
        h.id === id ? { ...h, isActive: newStatus } : h
      ));
      
      showNotification(`Hotel ${newStatus ? 'activated' : 'deactivated'} successfully!`, "success");
    } catch (err) {
      console.error("Error updating hotel status:", err);
      showNotification("Error updating hotel status: " + err.message, "error");
    }
  };

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
              Logged in as: <span className={`hms-role-${userRole}`}>{userRole}</span>
            </div>
          </div>
          <div className="hms-nav-buttons">
            <button 
              className={`hms-nav-button ${activeView === 'add' ? 'hms-active' : ''}`} 
              onClick={() => setActiveView('add')}
            >
              <span>Add Hotel</span>
            </button>
            <button 
              className={`hms-nav-button ${activeView === 'view' ? 'hms-active' : ''}`} 
              onClick={() => setActiveView('view')}
            >
              <span>View Hotels ({hotels.length})</span>
            </button>
          </div>
        </div>
      </header>
      
      {/* Content Section */}
      <main className="hms-content">
        {activeView === 'add' && <AddHotelTab showNotification={showNotification} userRole={userRole} onHotelAdded={fetchHotels} />}
        {activeView === 'view' && (
          <HotelSalesList 
            hotels={hotels}
            loading={loading}
            showNotification={showNotification}
            openViewModal={openViewModal}
            openEditModal={openEditModal}
            toggleHotelStatus={toggleHotelStatus}
            isAdmin={isAdmin}
            userRole={userRole}
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