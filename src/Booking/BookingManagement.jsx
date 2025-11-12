import React, { useState, useEffect, useContext } from "react";
import BookingForm from "./BookingForm";
import BookingList from "./BookingList";
import BookingViewModal from "./BookingViewModal";
import BookingEditModal from "./BookingEditModal";
import CommercialForm from "./CommercialForm";
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
  const [commercialModal, setCommercialModal] = useState({ isOpen: false, booking: null });

  const isAdmin = userRole.toLowerCase() === "admin";

  const handleTabChange = (tab) => setActiveTab(tab);

  useEffect(() => {
    if (activeTab === "view") fetchBookings();
  }, [activeTab]);

  const fetchBookings = async () => {
    try {
      const data = await bookingApi.getBookings();
      
      const mappedBookings = data.map((b) => {
        const nights = Math.ceil((new Date(b.checkOut) - new Date(b.checkIn)) / (1000 * 60 * 60 * 24));
        
        return {
          ...b,
          nights: nights,
          specialRequest: b.specialRequest || ""
        };
      });
      
      setBookings(mappedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      alert("Failed to fetch bookings");
    }
  };

  const openViewModal = (booking) => {
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
    fetchBookings();
  };

  return (
    <div className="bms-page-content">
      <div className="bms-system-header">
        <div className="bms-header-content">
          <div className="bms-header-content-title">
            <h1 className="bms-header-title">Booking Management</h1>
            <p className="bms-header-subtitle">Manage bookings, hotels, agencies, and suppliers</p>
            <div className="bms-user-role-badge">
              Logged in as: <span className={`bms-role-${userRole.toLowerCase()}`}>{userRole}</span>
            </div>
          </div>

          <div className="bms-nav-buttons">
            <button
              className={`bms-nav-button ${activeTab === "add" ? "bms-active" : ""}`}
              onClick={() => handleTabChange("add")}
            >
              Quick Booking
            </button>
            <button
              className={`bms-nav-button ${activeTab === "view" ? "bms-active" : ""}`}
              onClick={() => handleTabChange("view")}
            >
              View Bookings ({bookings.length})
            </button>
            <button
              className={`bms-nav-button ${activeTab === "commercial" ? "bms-active" : ""}`}
              onClick={() => handleTabChange("commercial")}
            >
              Booking + Commercial
            </button>
          </div>
        </div>
      </div>

      <div className="bms-content">
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
          onEditCommercial={openCommercialModal}
        />
      )}

      {commercialModal.isOpen && (
        <CommercialForm 
          bookingId={commercialModal.booking?.id}
          onClose={closeCommercialModal}
          onSave={closeCommercialModal}
        />
      )}

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