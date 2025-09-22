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

  // Simple refresh only when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && activeView === 'view') {
        console.log('Tab visible - refreshing hotels');
        fetchHotels();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeView]);

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
    
    console.log('Using PATCH endpoint for status update');
    
    // FIXED: Send proper JSON object (not just boolean)
    const patchResponse = await fetch(`${API_BASE_HOTEL}/${id}/status`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify({ isActive: newStatus }), // ← Send as object, not just boolean
    });

    console.log('PATCH response status:', patchResponse.status);
    
    if (patchResponse.ok) {
      const result = await patchResponse.json();
      console.log('PATCH success:', result);
      
      // Update UI immediately
      setHotels(prev => prev.map(h => 
        h.id === id ? { ...h, isActive: newStatus } : h
      ));
      
      showNotification(`Hotel ${newStatus ? 'activated' : 'deactivated'} successfully!`, "success");
      return;
    }
    
    // If PATCH fails, show detailed error
    const errorText = await patchResponse.text();
    console.error('PATCH error response:', errorText);
    
    if (patchResponse.status === 404) {
      showNotification("Error: Status update endpoint not found. Please check server configuration.", "error");
    } else {
      showNotification(`Error: Could not update hotel status (${patchResponse.status})`, "error");
    }
    
  } catch (err) {
    console.error("Error updating hotel status:", err);
    showNotification("Error: Could not update hotel status", "error");
  }
};
//  const toggleHotelStatus = async (id, currentStatus) => {
//   if (userRole.toLowerCase() !== 'admin') {
//     showNotification("You do not have permission to change hotel status.", "error");
//     return;
//   }
  
//   const newStatus = !currentStatus;
  
//   try {
//     const API_BASE_HOTEL = "https://backend.chaloholidayonline.com/api/hotels";
    
//     console.log('Using PATCH endpoint for status update');
    
//     const patchResponse = await fetch(`${API_BASE_HOTEL}/${id}/status`, {
//       method: "PATCH",
//       headers: { 
//         "Content-Type": "application/json",
//         "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
//       },
//       body: JSON.stringify(newStatus), // Just send the boolean value
//     });

//     console.log('PATCH response status:', patchResponse.status);
    
//     if (!patchResponse.ok) {
//       const errorText = await patchResponse.text();
//       console.error('PATCH error response:', errorText);
      
//       // If PATCH fails, fall back to PUT
//       console.log('Falling back to PUT method...');
//       await updateUsingPut(id, newStatus);
//       return;
//     }

//     // Parse the JSON response from PATCH
//     const result = await patchResponse.json();
//     console.log('PATCH success:', result);
    
//     // Update UI
//     setHotels(prev => prev.map(h => 
//       h.id === id ? { ...h, isActive: newStatus } : h
//     ));
    
//     showNotification(`Hotel ${newStatus ? 'activated' : 'deactivated'} successfully!`, "success");
    
//   } catch (err) {
//     console.error("Error updating hotel status:", err);
//     showNotification("Error: Could not update hotel status", "error");
//   }
// };

// // Fallback PUT method
// const updateUsingPut = async (id, newStatus) => {
//   try {
//     const API_BASE_HOTEL = "https://backend.chaloholidayonline.com/api/hotels";
    
//     const getResponse = await fetch(`${API_BASE_HOTEL}/${id}`);
//     if (!getResponse.ok) throw new Error(`Failed to fetch hotel: ${getResponse.status}`);
    
//     const hotelData = await getResponse.json();
    
//     // Use UPPERCASE 'I' for IsActive
//     const updatedHotel = {
//       ...hotelData,
//       IsActive: newStatus
//     };
    
//     const putResponse = await fetch(`${API_BASE_HOTEL}/${id}`, {
//       method: "PUT",
//       headers: { 
//         "Content-Type": "application/json",
//         "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
//       },
//       body: JSON.stringify(updatedHotel),
//     });

//     if (!putResponse.ok) {
//       const errorText = await putResponse.text();
//       throw new Error(`PUT failed: ${putResponse.status}, ${errorText}`);
//     }

//     setHotels(prev => prev.map(h => 
//       h.id === id ? { ...h, isActive: newStatus } : h
//     ));
    
//   } catch (error) {
//     console.error('PUT fallback also failed:', error);
//     throw error;
//   }
// };

  const manualRefresh = () => {
    fetchHotels();
    showNotification('Data refreshed', 'info');
  };

  const formatTimeSinceLastRefresh = () => {
    if (!lastRefresh) return 'Never';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - lastRefresh) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
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
            
            {/* Simple Refresh Button */}
            {activeView === 'view' && (
              <button 
                className="hms-refresh-btn"
                onClick={manualRefresh}
                title="Refresh data"
              >
                <FaSync /> Refresh
              </button>
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