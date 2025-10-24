import React, { useState, useEffect, useContext } from "react";
import BookingForm from "./BookingForm";
import BookingList from "./BookingList";
import BookingViewModal from "./BookingViewModal";
import BookingEditModal from "./BookingEditModal";
import CommercialForm from "./CommercialForm"; // Import the CommercialForm
import bookingApi from "../api/bookingApi";
import "./BookingManagement.css"
import { AuthContext } from "../context/AuthContext";
import CombinedBookingCommercial from "./CombinedBookingCommercial";

const BookingManagement = () => {
  const { user } = useContext(AuthContext);
  const userRole = user?.role || "employee";

  const [activeTab, setActiveTab] = useState("view");
  const [bookings, setBookings] = useState([]);
  const [viewModal, setViewModal] = useState({ isOpen: false, booking: null });
  const [editModal, setEditModal] = useState({ isOpen: false, booking: null });
  const [loading, setLoading] = useState(false);
  const [commercialModal, setCommercialModal] = useState({ isOpen: false, booking: null });


  const isAdmin = userRole.toLowerCase() === "admin";

  const handleTabChange = (tab) => setActiveTab(tab);

  useEffect(() => {
    if (activeTab === "view") fetchBookings();
  }, [activeTab]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await bookingApi.getBookings();
      console.log('API Response:', data);
      
      // Calculate nights for each booking and ensure specialRequest exists
      const mappedBookings = data.map((b) => {
        const nights = Math.ceil((new Date(b.checkOut) - new Date(b.checkIn)) / (1000 * 60 * 60 * 24));
        
        return {
          ...b, // Keep all the original API data
          nights: nights,
          specialRequest: b.specialRequest || "" // Add specialRequest if missing
        };
      });
      
      setBookings(mappedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      alert("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  const openViewModal = (booking) => {
    console.log('Opening view modal with booking:', booking);
    console.log('Booking rooms:', booking.rooms);
    console.log('Number of people:', booking.numberOfPeople);
    setViewModal({ isOpen: true, booking });
  };

  const closeViewModal = () => setViewModal({ isOpen: false, booking: null });

  const openEditModal = (booking) => {
    if (!isAdmin) {
      alert("You do not have permission to edit bookings.");
      return;
    }
    setEditModal({ isOpen: true, booking });
  };

  const closeEditModal = () => setEditModal({ isOpen: false, booking: null });

  const toggleBookingStatus = async (id, currentStatus) => {
    if (!isAdmin) {
      alert("You do not have permission to change booking status.");
      return;
    }

    const booking = bookings.find((b) => b.id === id);
    if (!booking) return;

    const newStatus = currentStatus === "Pending" ? "Confirmed" : "Pending";

    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    );

    try {
      await bookingApi.updateBookingStatus(id, newStatus);
      alert(`Booking status changed to ${newStatus}`);
    } catch (err) {
      console.error(err);
      alert("Failed to update booking status");
      // rollback
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: currentStatus } : b))
      );
    }
  };
  const openCommercialModal = (booking) => {
  if (!isAdmin) {
    alert("You do not have permission to edit commercial data.");
    return;
  }
  setCommercialModal({ isOpen: true, booking });
};

const closeCommercialModal = () => {
  setCommercialModal({ isOpen: false, booking: null });
  fetchBookings(); // Refresh to show updated commercial data
};


  return (
    <div className="booking-management-container">
      <div className="booking-management-header-tabs-container">
        <div className="booking-management-header-section">
          <div className="booking-management-title-section">
            <h1 className="booking-management-main-title">📖 Booking Management</h1>
            <p className="booking-management-subtitle">Manage bookings, hotels, agencies, and suppliers</p>
          </div>
          <div className="booking-management-user-role-badge">
            Logged in as: <span className={`booking-management-role-${userRole.toLowerCase()}`}>{userRole}</span>
          </div>
        </div>

        <div className="booking-management-tabs-section">
          <button
            className={activeTab === "add" ? "booking-management-tab booking-management-tab-active" : "booking-management-tab"}
            onClick={() => handleTabChange("add")}
          >
            Quick Booking
          </button>
          <button
            className={activeTab === "view" ? "booking-management-tab booking-management-tab-active" : "booking-management-tab"}
            onClick={() => handleTabChange("view")}
          >
            View Bookings ({bookings.length})
          </button>
          <button
            className={activeTab === "commercial" ? "booking-management-tab booking-management-tab-active" : "booking-management-tab"}
            onClick={() => handleTabChange("commercial")}
          >
             Booking + Commercial
          </button>
        </div>
      </div>

      <div className="booking-management-tab-content">
        {activeTab === "add" ? (
          <BookingForm
            booking={null}
            onSaved={() => {
              fetchBookings();
              setActiveTab("view");
            }}
            onCancel={() => setActiveTab("view")}
          />
        ) : activeTab === "view" ? (
          <BookingList
            bookings={bookings}
            loading={loading}
            openViewModal={openViewModal}
            openEditModal={openEditModal}
            toggleBookingStatus={toggleBookingStatus}
            isAdmin={isAdmin}
            refreshBookings={fetchBookings}
          />
        ) : (
          <CombinedBookingCommercial
            onSaved={(completeData) => {
              console.log('Complete booking with commercial data:', completeData);
              alert('Booking created successfully with commercial details!');
              fetchBookings();
              setActiveTab("view");
            }}
            onCancel={() => setActiveTab("view")}
          />
        )}
      </div>
{viewModal.isOpen && (
  <BookingViewModal 
    booking={viewModal.booking} 
    onClose={closeViewModal}
    onEditCommercial={openCommercialModal} // Add this prop
  />
)}

{/* // Add Commercial Modal:
{commercialModal.isOpen && (
  <CommercialForm 
    bookingId={commercialModal.booking?.id}
    onClose={closeCommercialModal}
    onSave={closeCommercialModal}
  />
)} */}

      {editModal.isOpen && (
        <BookingEditModal
          editModal={editModal}
          setEditModal={setEditModal}
          closeEditModal={closeEditModal}
          refreshBookings={fetchBookings}
        />
      )}
    </div>
  );
};

export default BookingManagement;