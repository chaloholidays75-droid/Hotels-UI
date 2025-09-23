import React, { useState, useEffect, useCallback } from 'react';
import { FaCheckCircle, FaTimesCircle, FaTimes } from 'react-icons/fa';
import AddHotelTab from './AddHotelTab';
import HotelSalesList from './HotelSalesList';
import ViewHotelModal from './ViewHotelModal';
import EditHotelModal from './EditHotelModal';
import { getHotelSales, toggleHotelStatus, updateHotelSale } from '../api/hotelApi';
import './HotelManagementSystem.css';

const HotelManagementSystem = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('view');
  const [userRole, setUserRole] = useState('employee');
  const [isRoleLoaded, setIsRoleLoaded] = useState(false);
  const [viewModal, setViewModal] = useState({ isOpen: false, hotel: null });
  const [editModal, setEditModal] = useState({ isOpen: false, hotel: null });
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // Load user role
  useEffect(() => {
    const role = localStorage.getItem('userRole')?.toLowerCase() || 'employee';
    setUserRole(role);
    setIsRoleLoaded(true);
  }, []);

  // Fetch hotels
  const fetchHotels = async () => {
    setLoading(true);
    try {
      const data = await getHotelSales();
      setHotels(data);
    } catch (err) {
      console.error('Error fetching hotels:', err);
      showNotification(`Error fetching hotels: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === 'view') fetchHotels();
  }, [activeView]);

  const showNotification = useCallback((message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 5000);
  }, []);

  // Modals
  const openViewModal = hotel => setViewModal({ isOpen: true, hotel });
  const closeViewModal = () => setViewModal({ isOpen: false, hotel: null });
  const openEditModal = hotel => {
    if (userRole !== 'admin') {
      showNotification("Only admins can edit hotels", "error");
      return;
    }
    setEditModal({ isOpen: true, hotel });
  };
  const closeEditModal = () => setEditModal({ isOpen: false, hotel: null });

  const saveHotel = async hotel => {
    try {
      await updateHotelSale(hotel.id, hotel);
      closeEditModal();
      fetchHotels();
      showNotification("Hotel updated successfully!", "success");
    } catch (err) {
      console.error(err);
      showNotification("Failed to update hotel", "error");
    }
  };

  const handleToggleHotelStatus = async (id, currentStatus) => {
    if (userRole !== 'admin') {
      showNotification("Only admins can change hotel status", "error");
      return;
    }
    try {
      await toggleHotelStatus(id, !currentStatus);
      setHotels(prev => prev.map(h => h.id === id ? { ...h, isActive: !currentStatus } : h));
      showNotification(`Hotel ${!currentStatus ? 'activated' : 'deactivated'}!`, 'success');
    } catch (err) {
      console.error(err);
      showNotification("Failed to update hotel status", "error");
    }
  };

  const canAddHotel = (userRole === 'admin' || userRole === 'employee') && isRoleLoaded;

  return (
    <div className="hms-page-content">
      {notification.show && (
        <div className={`hms-notification ${notification.type}`}>
          <div className="hms-notification-content">
            <div className="hms-notification-icon">
              {notification.type === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
            </div>
            <span>{notification.message}</span>
            <button onClick={() => setNotification({ show: false, message: '', type: '' })}><FaTimes /></button>
          </div>
        </div>
      )}

      <header className="hms-system-header">
        <h1>Hotel Management System</h1>
        <p>Manage hotel information, contacts, and facilities</p>
        <div>Logged in as: <span className={`hms-role-${userRole}`}>{userRole}</span></div>
        <div className="hms-nav-buttons">
          <button disabled={!canAddHotel} onClick={() => canAddHotel && setActiveView('add')}>Add Hotel</button>
          <button onClick={() => setActiveView('view')}>View Hotels ({hotels.length})</button>
        </div>
      </header>

      <main className="hms-content">
        {activeView === 'add' && canAddHotel && <AddHotelTab showNotification={showNotification} />}
        {activeView === 'view' && (
          <HotelSalesList
            hotels={hotels}
            loading={loading}
            openViewModal={openViewModal}
            openEditModal={openEditModal}
            toggleHotelStatus={handleToggleHotelStatus}
          />
        )}
      </main>

      {viewModal.isOpen && <ViewHotelModal hotel={viewModal.hotel} onClose={closeViewModal} />}
      {editModal.isOpen && <EditHotelModal hotel={editModal.hotel} onSave={saveHotel} onCancel={closeEditModal} />}
    </div>
  );
};

export default HotelManagementSystem;
